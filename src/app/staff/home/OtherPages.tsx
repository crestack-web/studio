import React, { useState, useMemo, useEffect } from 'react';
import type { SaleRecord, SalesHistoryItem, PageId } from './types';
import { DAILY_TARGET } from './data';
import { LockedPage } from './components/shared';
import { useLiveClock } from './hooks';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, Timestamp, addDoc, updateDoc } from 'firebase/firestore';
import { fetchProducts, fetchRecentSales, getStaffBusinessId, fetchAttendance, clockInAttendance, clockOutAttendance } from './services/dataService';
import { getSupabase } from '@/lib/supabase';
import chatStyles from './TeamChat.module.css';

/* ═══════════════════════════════════════
   INVENTORY PAGE
═══════════════════════════════════════ */
interface InventoryPageProps {
  hasAccess: boolean;
  businessId: string;
  currency?: string;
  staffId?: string;
  staffName?: string;
}


function staffDb() {
  const { firestore } = initializeFirebase();
  return firestore;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  hasAccess,
  businessId,
  currency: currencyProp,
  staffId,
  staffName,
}) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessCurrency, setBusinessCurrency] = useState('₦');
  const [alerting, setAlerting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const alertOwnerAboutStock = async () => {
    const lowProducts = products.filter((p) => p.stock <= (p.lowStockThreshold || 10));
    if (!lowProducts.length) {
      setAlertMsg('No low-stock products to report.');
      return;
    }
    if (!businessId) {
      setAlertMsg('Business not found.');
      return;
    }
    setAlerting(true);
    setAlertMsg(null);
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setAlertMsg('Please sign in again to send an alert.');
        return;
      }
      const res = await fetch('/api/staff/stock-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          alertType: lowProducts.some((p) => p.stock === 0) ? 'lost_stock' : 'low_stock',
          products: lowProducts.map((p) => ({
            name: p.name,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold || 10,
            status: p.stock === 0 ? 'out' : 'low',
          })),
          note: staffName ? `Alert raised from staff inventory by ${staffName}` : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || json.details || 'Failed to alert owner');
      }
      if (!json.emailed && !json.messageId) {
        throw new Error('Email was not confirmed by the server. Try again.');
      }
      const dest = json.emailed ? ` to ${json.emailed}` : '';
      setAlertMsg(`Owner alert sent${dest}.`);
    } catch (e: any) {
      console.error(e);
      setAlertMsg(e?.message || 'Could not send alert. Try again.');
    } finally {
      setAlerting(false);
    }
  };

  useEffect(() => {
    if (currencyProp) setBusinessCurrency(currencyProp);
  }, [currencyProp]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadProducts() {
      try {
        const fetchedProducts = await fetchProducts(undefined, businessId);
        if (cancelled) return;
        setProducts(fetchedProducts);
        try {
          const { fetchDoc } = await import('@/lib/supabase-client-data');
          const businessData = await fetchDoc('businesses', businessId);
          if (cancelled) return;
          if (businessData) {
            const currency =
              (businessData as any).currency ||
              (businessData as any).businessCurrency ||
              (businessData as any).defaultCurrency ||
              currencyProp ||
              '₦';
            setBusinessCurrency(currency);
          }
        } catch {
          /* currency optional */
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProducts();
    return () => { cancelled = true; };
  }, [businessId, currencyProp]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search, products],
  );
  const totalUnits = products.reduce((s, p) => s + p.stock, 0);
  const estValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowCount = products.filter((p) => p.stock <= (p.lowStockThreshold || 10)).length;

  if (!hasAccess) return <LockedPage pageName="Inventory"/>;

  if (loading) {
    return (
      <div className="pg act full" id="pg-inventory">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg act full" id="pg-inventory">
      <div className="phd">
        <h2>Inventory</h2>
        <p>View stock levels. Contact your owner to make changes.</p>
      </div>

      <div className="mg" style={{ marginBottom: '14px' }}>
        <div className="mc"><div className="mlbl">Total Products</div><div className="mv">{products.length}</div></div>
        <div className="mc"><div className="mlbl">Low Stock</div><div className="mv neg">{lowCount}</div><span className="md dd">Action needed</span></div>
        <div className="mc"><div className="mlbl">Total Units</div><div className="mv">{totalUnits}</div></div>
        <div className="mc"><div className="mlbl">Est. Value</div><div className="mv">{businessCurrency}{(estValue / 1000).toFixed(0)}K</div></div>
      </div>

      {/* Low stock alerts */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--red-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            Low Stock Alerts
          </div>
          <button
            type="button"
            className="btn bxs bamb"
            disabled={alerting || products.filter((p) => p.stock <= (p.lowStockThreshold || 10)).length === 0}
            onClick={alertOwnerAboutStock}
          >
            {alerting ? 'Sending…' : 'Alert Owner'}
          </button>
          {alertMsg && (
            <p style={{ fontSize: '0.8rem', marginTop: 8, color: alertMsg.includes('emailed') ? '#15803d' : '#b91c1c' }}>
              {alertMsg}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {lowCount > 0 ? (
            products
              .filter((p) => p.stock <= (p.lowStockThreshold || 10))
              .sort((a, b) => a.stock - b.stock)
              .slice(0, 5)
              .map((p) => {
                const isOut = p.stock === 0;
                const isCritical = p.stock <= 5;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 11px',
                      background: isOut ? 'var(--red-bg)' : isCritical ? 'var(--red-bg)' : 'var(--amber-bg)',
                      border: `1px solid ${isOut ? 'var(--red)' : isCritical ? 'var(--red)' : 'var(--amber)'}`,
                      borderRadius: 'var(--rsm)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isOut || isCritical ? 'var(--red)' : 'var(--amber)'} strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      {isOut && <line x1="12" y1="17" x2="12.01" y2="17"/>}
                    </svg>
                    <span style={{ fontSize: '.77rem', fontWeight: 600, color: isOut || isCritical ? 'var(--red)' : 'var(--amber)', flex: 1 }}>
                      {p.emoji || '📦'} {p.name} — {isOut ? 'Out of stock' : `Only ${p.stock} units remaining`}
                    </span>
                    <span className={`pill ${isOut || isCritical ? 'r' : 'a'}`}>{isOut ? 'OUT' : isCritical ? 'CRITICAL' : 'LOW'}</span>
                  </div>
                );
              })
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)' }}>
              ✅ All stock levels healthy
            </div>
          )}
        </div>
      </div>

      <div className="srch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>

      <div className="inv-g">
        {filtered.map((p) => {
          const pct = Math.min(100, Math.round((p.stock / 50) * 100));
          const isLow = p.stock <= (p.lowStockThreshold || 10);
          const barCls = p.stock <= 5 ? 'low-b' : p.stock <= 15 ? 'med' : '';
          return (
            <div key={p.id} className="inv-card">
              <div className="inv-em">{p.emoji || '📦'}</div>
              <div className="inv-nm">{p.name}</div>
              <div className="inv-pr">{businessCurrency}{p.price.toLocaleString()}</div>
              <div className="inv-stock">
                <span className="inv-stk-lbl">Stock</span>
                <span className={`inv-stk-val${isLow ? ' low' : ''}`}>{p.stock} units{isLow ? ' ⚠️' : ''}</span>
              </div>
              <div className="stock-bar-w">
                <div className={`stock-bar ${barCls}`} style={{ width: `${pct}%` }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   HISTORY PAGE
═══════════════════════════════════════ */
interface HistoryPageProps {
  hasAccess: boolean;
  sessionSales: SaleRecord[];
  businessId: string;
  staffId?: string;
  currency?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ hasAccess, sessionSales, businessId, staffId, currency: currencyProp }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [allRecords, setAllRecords] = useState<SalesHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function loadSalesHistory() {
      try {
        const recentSales = await fetchRecentSales(undefined, businessId, 50);
        if (cancelled) return;
        let filtered = recentSales;
        if (staffId) {
          filtered = recentSales.filter((sale: any) => {
            const by = sale.soldBy || sale.recordedBy?.staffId || sale.recordedBy?.uid;
            return !by || by === staffId;
          });
        }
        const saleRecords: SalesHistoryItem[] = filtered.map((sale) => ({
          id: sale.id,
          time: sale.createdAt
            ? new Date(sale.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '',
          items: (sale.products || []).map((p: any) => `${p.name} ×${p.quantity}`).join(', '),
          amount: sale.total,
          payment: (sale.paymentMethod || 'cash').charAt(0).toUpperCase() + (sale.paymentMethod || 'cash').slice(1),
          soldByName: sale.soldByName,
        }));
        setAllRecords(saleRecords);
      } catch (error) {
        console.error('Error loading sales history:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSalesHistory();
    return () => { cancelled = true; };
  }, [businessId, staffId]);

  if (!hasAccess) return <LockedPage pageName="Sale History"/>;

  if (loading) {
    return (
      <div className="pg act full" id="pg-history">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const payPill = (pay: string) =>
    pay === 'Cash' ? 'g' : pay === 'Transfer' ? 'b' : 'a';

  // Calculate summary statistics from real data
  const totalRevenue = allRecords.reduce((sum, r) => sum + r.amount, 0);
  const transactionCount = allRecords.length;
  const avgPerSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  return (
    <div className="pg act full" id="pg-history">
      <div className="phd">
        <h2>Sale History</h2>
        <p>All sales recorded during your shifts.</p>
      </div>

      <div className="hist-filters">
        {(['all','today','week','month'] as const).map((f) => (
          <button
            key={f}
            className={`hf-chip${filter === f ? ' act' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="hist-sum">
        <div className="hs-tile">
          <div className="hs-val">{currencyProp || '₦'}{totalRevenue.toLocaleString()}</div>
          <div className="hs-lbl">Total Revenue</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">{transactionCount}</div>
          <div className="hs-lbl">Transactions</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">{currencyProp || '₦'}{Math.round(avgPerSale).toLocaleString()}</div>
          <div className="hs-lbl">Avg. per Sale</div>
        </div>
      </div>

      <div className="card">
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--blue-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            Transaction Log
          </div>
        </div>
        <div className="tbl-w">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((r, i) => (
                <tr key={i}>
                  <td>{r.time}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.items}
                  </td>
                  <td><strong>{currencyProp || '₦'}{r.amount.toLocaleString()}</strong></td>
                  <td><span className={`pill ${payPill(r.payment)}`}>{r.payment}</span></td>
                  <td><span className="pill g">Confirmed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   ATTENDANCE PAGE
═══════════════════════════════════════ */
interface AttendancePageProps {
  hasAccess: boolean;
  businessId: string;
  staffId: string;
  staffName?: string;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({
  hasAccess,
  businessId: businessIdProp,
  staffId: staffIdProp,
  staffName,
}) => {
  const clock = useLiveClock();
  const [clockedIn, setClockedIn] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [shiftLog, setShiftLog] = useState<
    Array<{ date: string; hours: string; clockIn: string; clockOut: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);


  async function authHeaders() {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Session expired. Please sign in again.');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  useEffect(() => {
    if (!businessIdProp || !staffIdProp) {
      setLoading(false);
      return;
    }
    setBusinessId(businessIdProp);
    let cancelled = false;

    async function loadAttendanceData() {
      try {
        let records: any[] = [];
        try {
          const headers = await authHeaders();
          const res = await fetch(
            `/api/staff/attendance?businessId=${encodeURIComponent(businessIdProp)}`,
            { headers }
          );
          const json = await res.json().catch(() => ({}));
          if (res.ok && Array.isArray(json.records)) {
            records = json.records.map((r: any) => ({
              id: r.id,
              clockIn: r.check_in || r.clockIn,
              clockOut: r.check_out || r.clockOut,
              status: r.check_out ? 'clocked_out' : 'clocked_in',
              note: r.note,
            }));
          } else {
            records = await fetchAttendance(undefined, businessIdProp, staffIdProp, 60);
          }
        } catch {
          records = await fetchAttendance(undefined, businessIdProp, staffIdProp, 60);
        }
        if (cancelled) return;
        setAttendanceData(records);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const openToday = records.find((record) => {
          if (!record.clockIn || record.clockOut) return false;
          const recordDate = new Date(record.clockIn);
          return recordDate >= today;
        });
        setClockedIn(!!openToday);

        const log = records
          .filter((record) => record.clockOut)
          .slice(0, 14)
          .map((record) => ({
            date: new Date(record.clockIn || '').toLocaleDateString(),
            hours: calculateShiftHours(record.clockIn, record.clockOut),
            clockIn: formatTime(record.clockIn),
            clockOut: formatTime(record.clockOut),
            status: record.clockOut ? 'complete' : 'incomplete',
          }));
        setShiftLog(log);
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAttendanceData();
    return () => {
      cancelled = true;
    };
  }, [businessIdProp, staffIdProp]);

  const handleClockIn = async () => {
    if (!businessId || !staffIdProp || busy) return;
    setBusy(true);
    try {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/staff/attendance', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'clock_in',
            businessId,
            staffId: staffIdProp,
            staffName,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Clock in failed');
      } catch (apiErr) {
        console.warn('[attendance] API clock in failed, client fallback', apiErr);
        await clockInAttendance(businessId, staffIdProp, staffName);
      }
      setClockedIn(true);
      const records = await fetchAttendance(undefined, businessId, staffIdProp, 60);
      setAttendanceData(records);
    } catch (error) {
      console.error('Error clocking in:', error);
      alert(
        (error as any)?.message ||
          'Could not clock in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleClockOut = async () => {
    if (!businessId || !staffIdProp || busy) return;
    setBusy(true);
    try {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/staff/attendance', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'clock_out',
            businessId,
            staffId: staffIdProp,
            staffName,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Clock out failed');
      } catch (apiErr: any) {
        console.warn('[attendance] API clock out failed, client fallback', apiErr);
        const ok = await clockOutAttendance(businessId, staffIdProp);
        if (!ok) {
          alert(apiErr?.message || 'No open shift found to clock out.');
          setBusy(false);
          return;
        }
      }
      setClockedIn(false);
      const records = await fetchAttendance(undefined, businessId, staffIdProp, 60);
      setAttendanceData(records);
      const log = records
        .filter((record) => record.clockOut)
        .slice(0, 14)
        .map((record) => ({
          date: new Date(record.clockIn || '').toLocaleDateString(),
          hours: calculateShiftHours(record.clockIn, record.clockOut),
          clockIn: formatTime(record.clockIn),
          clockOut: formatTime(record.clockOut),
          status: 'complete',
        }));
      setShiftLog(log);
    } catch (error) {
      console.error('Error clocking out:', error);
      alert(
        (error as any)?.message ||
          'Could not clock out. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const calculateShiftHours = (clockIn: any, clockOut: any) => {
    if (!clockIn || !clockOut) return '—';
    const inTime = new Date(clockIn);
    const outTime = new Date(clockOut);
    const diffMs = outTime.getTime() - inTime.getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return '—';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!hasAccess) return <LockedPage pageName="Attendance" />;

  if (loading) {
    return (
      <div className="pg act full" id="pg-attendance">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg act full" id="pg-attendance">
      <div className="shift-hero">
        <div className="shl">
          <h2>Shift & Attendance</h2>
          <p>Track your daily clock-ins, clock-outs and shift hours.</p>
        </div>
        <div className="shr">
          <div className="big-time">{clock}</div>
          <div className="shr-lbl">Current Time</div>
        </div>
      </div>

      <div className="shift-actions">
        <div
          className={`shift-act-btn in${clockedIn ? ' active' : ''}`}
          onClick={handleClockIn}
          role="button" tabIndex={0}
        >
          <div className="sa-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div className="sa-txt">
            <h4>Clock In</h4>
            <p>{clockedIn ? 'Clocked in at ' + formatTime(clockedIn ? new Date() : new Date()) : 'Tap to start your shift'}</p>
          </div>
        </div>
        <div
          className={`shift-act-btn out${!clockedIn ? ' active' : ''}`}
          onClick={handleClockOut}
          role="button" tabIndex={0}
        >
          <div className="sa-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div className="sa-txt">
            <h4>Clock Out</h4>
            <p>{!clockedIn ? 'Clocked out' : 'Tap to end your shift'}</p>
          </div>
        </div>
      </div>

      {/* Monthly attendance */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="chd" style={{ marginBottom: '12px' }}>
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--brand-lt)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            This Month's Attendance
          </div>
          <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>February 2026</span>
        </div>
        <div className="atd-g">
          {attendanceData.length > 0 ? (
            attendanceData.map((d: any) => {
              const day = d.clockIn
                ? new Date(d.clockIn).getDate()
                : d.day || '—';
              const status =
                d.clockOut || d.status === 'clocked_out' || d.status === 'complete'
                  ? 'present'
                  : d.clockIn
                    ? 'late'
                    : 'absent';
              return (
                <div key={d.id || day} className={`atd-day ${status}`} title={status}>
                  {day}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)' }}>
              No attendance data available yet
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            { cls: 'present', label: 'Present' },
            { cls: 'late',    label: 'Late'    },
            { cls: 'absent',  label: 'Absent'  },
            { cls: 'off',     label: 'Day off' },
          ].map(({ cls, label }) => (
            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.68rem', color: 'var(--t2)' }}>
              <div className={`atd-day ${cls}`} style={{ width: '14px', height: '14px', fontSize: '0', borderRadius: '4px' }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Shift log */}
      <div className="card">
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--blue-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            Shift Log
          </div>
        </div>
        <div className="shift-log">
          {shiftLog.length > 0 ? (
            shiftLog.map((entry, i) => (
              <div key={i} className="sl-row">
                <div className="sl-date">
                  <div className="sl-d">{entry.date}</div>
                  <div className="sl-h">{entry.hours}</div>
                </div>
                <div className="sl-times">
                  {entry.clockIn} → {entry.clockOut}
                </div>
                <span className={`pill ${entry.status === 'complete' ? 'g' : entry.status === 'late' ? 'a' : 'r'}`}>
                  {entry.status === 'complete' ? 'Complete' : entry.status === 'late' ? 'Late' : 'Absent'}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)' }}>
              No shift log data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MESSAGES PAGE
═══════════════════════════════════════ */
interface MessagesPageProps {
  hasAccess: boolean;
  businessId: string;
  staffId: string;
}

type ConvId = 'owner' | 'team';

interface ChatMessage {
  type: 'sent' | 'recv';
  text: string;
  timestamp: number;
  fromOwner?: boolean;
  senderName?: string;
}

interface Conversations {
  owner: ChatMessage[];
  team: ChatMessage[];
}

interface Conversation {
  id: string;
  participants: string[];
  messages: ChatMessage[];
  type: 'owner' | 'team';
  updatedAt: Date;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ hasAccess, businessId: businessIdProp, staffId: staffIdProp }) => {
  const [convId, setConvId] = useState<ConvId>('owner');
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [convos, setConvos] = useState<Conversations>({ owner: [], team: [] });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>('Business Owner');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!businessIdProp || !staffIdProp) {
      setLoading(false);
      return;
    }
    setBusinessId(businessIdProp);
    setStaffId(staffIdProp);
    let cancelled = false;
    async function loadConversations() {
      try {
        const { firestore } = initializeFirebase();
        if (!firestore) return;
        const ownerConvQuery = query(
          collection(firestore, 'businesses', businessIdProp, 'conversations'),
          where('type', '==', 'owner'),
          where('participants', 'array-contains', staffIdProp)
        );
        const ownerConvSnapshot = await getDocs(ownerConvQuery);
        let ownerMessages: ChatMessage[] = [];
        if (!ownerConvSnapshot.empty) {
          ownerMessages = ownerConvSnapshot.docs[0].data().messages || [];
        }
        const teamConvQuery = query(
          collection(firestore, 'businesses', businessIdProp, 'conversations'),
          where('type', '==', 'team')
        );
        const teamConvSnapshot = await getDocs(teamConvQuery);
        let teamMessages: ChatMessage[] = [];
        if (!teamConvSnapshot.empty) {
          teamMessages = teamConvSnapshot.docs[0].data().messages || [];
        }
        if (cancelled) return;
        setConvos({ owner: ownerMessages, team: teamMessages });
        const businessDoc = await getDoc(doc(firestore, 'businesses', businessIdProp));
        if (!cancelled && businessDoc.exists()) {
          const businessData = businessDoc.data();
          setOwnerName(businessData.ownerName || businessData.businessName || 'Business Owner');
        }
        const staffQuery = query(collection(firestore, 'businesses', businessIdProp, 'staff'));
        const staffSnapshot = await getDocs(staffQuery);
        if (!cancelled) {
          setTeamMembers(staffSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadConversations();
    const poll = setInterval(() => { if (!cancelled) loadConversations(); }, 6000);
    return () => {
      cancelled = true;
      clearInterval(poll); };
  }, [businessIdProp, staffIdProp]);

  const sendMsg = async () => {
    if (!draft.trim() || !businessId || !staffId) return;
    
    const newMessage: ChatMessage = {
      type: 'sent',
      text: draft.trim(),
      timestamp: Date.now(),
      senderName: 'You',
    };
    
    try {
      const { firestore } = initializeFirebase();
      
      if (convId === 'owner') {
        // Find or create owner conversation
        const ownerConvQuery = query(
          collection(firestore, 'businesses', businessId, 'conversations'),
          where('type', '==', 'owner'),
          where('participants', 'array-contains', staffId)
        );
        const ownerConvSnapshot = await getDocs(ownerConvQuery);
        
        const updatedMessages = [...convos.owner, newMessage];
        
        if (ownerConvSnapshot.empty) {
          // Create new conversation
          await addDoc(collection(firestore, 'businesses', businessId, 'conversations'), {
            type: 'owner',
            participants: [staffId],
            messages: updatedMessages,
            updatedAt: Timestamp.now(),
          });
        } else {
          // Update existing conversation
          await updateDoc(doc(firestore, 'businesses', businessId, 'conversations', ownerConvSnapshot.docs[0].id), {
            messages: updatedMessages,
            updatedAt: Timestamp.now(),
          });
        }
        
        setConvos(prev => ({ ...prev, owner: updatedMessages }));
      } else {
        // Team conversation
        const teamConvQuery = query(
          collection(firestore, 'businesses', businessId, 'conversations'),
          where('type', '==', 'team')
        );
        const teamConvSnapshot = await getDocs(teamConvQuery);
        
        const updatedMessages = [...convos.team, newMessage];
        
        if (teamConvSnapshot.empty) {
          // Create new team conversation
          await addDoc(collection(firestore, 'businesses', businessId, 'conversations'), {
            type: 'team',
            participants: teamMembers.map(m => m.id),
            messages: updatedMessages,
            updatedAt: Timestamp.now(),
          });
        } else {
          // Update existing conversation
          await updateDoc(doc(firestore, 'businesses', businessId, 'conversations', teamConvSnapshot.docs[0].id), {
            messages: updatedMessages,
            updatedAt: Timestamp.now(),
          });
        }
        
        setConvos(prev => ({ ...prev, team: updatedMessages }));
      }
      
      setDraft('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  React.useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [convos, convId]);

  if (!hasAccess) return <LockedPage pageName="Messages"/>;

  if (loading) {
    return (
      <div className="pg act full" id="pg-messages">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const msgs = convos[convId];
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const openConv = (id: ConvId) => {
    setConvId(id);
    setMobileThreadOpen(true);
  };

  const title = convId === 'owner' ? ownerName : 'Team chat';
  const subtitle = convId === 'owner' ? 'Direct with business owner' : 'Everyone on your team';

  return (
    <div className="pg act full" id="pg-messages">
      <div className="phd" style={{ marginBottom: 12 }}>
        <h2>Messages</h2>
        <p>Clean chat with the owner and your team.</p>
      </div>

      <div className={`${chatStyles.wrap} ${mobileThreadOpen ? chatStyles.openThread : ''}`}>
        <aside className={chatStyles.list}>
          <div className={chatStyles.listHead}>
            <h2>Conversations</h2>
            <p>Owner · Team</p>
          </div>
          <button
            type="button"
            className={`${chatStyles.convo} ${convId === 'owner' ? chatStyles.convoActive : ''}`}
            onClick={() => openConv('owner')}
          >
            <div className={`${chatStyles.av} ${chatStyles.avOwner}`}>BO</div>
            <div className={chatStyles.meta}>
              <div className={chatStyles.name}>{ownerName}</div>
              <div className={chatStyles.prev}>
                {convos.owner.length
                  ? convos.owner[convos.owner.length - 1].text
                  : 'Message the business owner'}
              </div>
            </div>
          </button>
          <button
            type="button"
            className={`${chatStyles.convo} ${convId === 'team' ? chatStyles.convoActive : ''}`}
            onClick={() => openConv('team')}
          >
            <div className={`${chatStyles.av} ${chatStyles.avTeam}`}>👥</div>
            <div className={chatStyles.meta}>
              <div className={chatStyles.name}>Team chat</div>
              <div className={chatStyles.prev}>
                {convos.team.length
                  ? convos.team[convos.team.length - 1].text
                  : 'Group conversation'}
              </div>
            </div>
          </button>
        </aside>

        <section className={chatStyles.thread}>
          <div className={chatStyles.threadHead}>
            <button
              type="button"
              className={chatStyles.back}
              onClick={() => setMobileThreadOpen(false)}
              aria-label="Back"
            >
              ←
            </button>
            <div className={`${chatStyles.av} ${convId === 'owner' ? chatStyles.avOwner : chatStyles.avTeam}`}>
              {convId === 'owner' ? 'BO' : '👥'}
            </div>
            <div>
              <h3>{title}</h3>
              <span>{subtitle}</span>
            </div>
          </div>

          <div className={chatStyles.body} ref={bodyRef}>
            {msgs.length === 0 ? (
              <div className={chatStyles.empty}>No messages yet. Say hello to start the conversation.</div>
            ) : (
              msgs.map((m, i) => {
                const mine = m.type === 'sent';
                return (
                  <div
                    key={i}
                    className={`${chatStyles.row} ${mine ? chatStyles.rowMine : chatStyles.rowTheirs}`}
                  >
                    <div
                      className={`${chatStyles.bubble} ${mine ? chatStyles.bubbleMine : chatStyles.bubbleTheirs}`}
                    >
                      {!mine && (
                        <span className={chatStyles.who}>
                          {m.senderName || (m.fromOwner ? ownerName : 'Team')}
                        </span>
                      )}
                      {m.text}
                      <span className={chatStyles.time}>
                        {mine ? 'You · ' : ''}
                        {formatTime(m.timestamp || Date.now())}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={chatStyles.composer}>
            <input
              type="text"
              className={chatStyles.input}
              placeholder={convId === 'owner' ? 'Message owner…' : 'Message team…'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button
              type="button"
              className={chatStyles.send}
              onClick={sendMsg}
              disabled={!draft.trim()}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};


/* ═══════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════ */
interface SettingsPageProps {
  staff: { initials: string; name: string; role: string };
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
  onLogout?: () => void;
  onToast: (msg: string) => void;
  businessName?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  staff, theme, onToggleTheme, onLogout, onToast, businessName,
}) => {
  const [sound, setSound] = useState(true);
  const [confirm, setConfirm] = useState(true);

  return (
    <div className="pg act full" id="pg-settings">
      <div className="phd">
        <h2>Settings</h2>
        <p>Personalise your staff portal experience.</p>
      </div>

      <div className="settings-grid">
        {/* Preferences */}
        <div className="card">
          <div className="chd" style={{ marginBottom: '12px' }}>
            <div className="cttl">
              <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </div>
              Preferences
            </div>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Dark Mode</div>
              <div className="tr-desc">Switch to dark interface</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme}/>
              <span className="tsl"/>
            </label>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Sound Alerts</div>
              <div className="tr-desc">Beep on successful sale</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)}/>
              <span className="tsl"/>
            </label>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Sale Confirmations</div>
              <div className="tr-desc">Ask before confirming</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)}/>
              <span className="tsl"/>
            </label>
          </div>
        </div>

        {/* Profile */}
        <div className="card">
          <div className="chd" style={{ marginBottom: '12px' }}>
            <div className="cttl">
              <div className="cic" style={{ background: 'var(--purple-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              My Profile
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="profile-av-lg">{staff.initials}</div>
            <div style={{ fontFamily: 'var(--fD)', fontSize: '.9rem', fontWeight: 700, color: 'var(--t1)' }}>
              {staff.name}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--brand)', fontWeight: 600, marginBottom: '12px' }}>
              {staff.role}
            </div>
            <button
              className="btn bsm bfull bgh"
              onClick={() => onToast('Change PIN feature coming soon!')}
            >
              Change PIN
            </button>
            {onLogout && (
              <button className="btn bsm bfull bdn" style={{ marginTop: '7px' }} onClick={onLogout}>
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

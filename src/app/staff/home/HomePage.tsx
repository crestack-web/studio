import React, { useCallback, useEffect, useState } from 'react';
import { fetchTodaysSales, fetchRecentSales, fetchProducts } from './services/dataService';
import type { Permissions, PageId } from './types';
import { DAILY_TARGET } from './data';
import { formatCurrency } from '@/lib/currency';
import {
  ShoppingCart,
  Package,
  History,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface HomePageProps {
  greeting: string;
  salesTotal: number;
  transactions: number;
  itemsSold: number;
  permissions: Permissions;
  shiftElapsed: string;
  onNav: (p: PageId) => void;
  onToast: (msg: string) => void;
  staffId?: string;
  /** Required — scopes all data to the owner business that added this staff */
  businessId: string;
  currency?: string;
}

const avgSale = (total: number, txns: number, currency: string) =>
  txns > 0
    ? formatCurrency(Math.round(total / txns), currency)
    : formatCurrency(0, currency);

interface QuickAction {
  permKey: keyof Permissions | null;
  page: PageId;
  label: string;
  prime?: boolean;
  bg: string;
  stroke: string;
  icon: React.ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    permKey: 'sale',
    page: 'sale',
    label: 'Record Sale',
    prime: true,
    bg: 'var(--brand-lt)',
    stroke: 'var(--brand)',
    icon: <ShoppingCart size={24} />,
  },
  {
    permKey: 'inv',
    page: 'inv',
    label: 'Check Stock',
    bg: 'var(--amber-bg)',
    stroke: 'var(--amber)',
    icon: <Package size={24} />,
  },
  {
    permKey: 'hist',
    page: 'hist',
    label: 'Sale History',
    bg: 'var(--blue-bg)',
    stroke: 'var(--blue)',
    icon: <History size={24} />,
  },
  {
    permKey: 'atd',
    page: 'atd',
    label: 'Clock In/Out',
    bg: 'var(--teal-bg)',
    stroke: 'var(--teal)',
    icon: <Calendar size={24} />,
  },
  {
    permKey: 'msg',
    page: 'msg',
    label: 'Message Owner',
    bg: 'var(--purple-bg)',
    stroke: 'var(--purple)',
    icon: <MessageSquare size={24} />,
  },
];

const PERM_LABELS: Array<{ key: keyof Permissions; label: string; color: string }> = [
  { key: 'sale', label: 'Record Sales', color: 'var(--brand)' },
  { key: 'inv', label: 'View Inventory', color: 'var(--amber)' },
  { key: 'hist', label: 'Sale History', color: 'var(--blue)' },
  { key: 'atd', label: 'Attendance', color: 'var(--teal)' },
  { key: 'msg', label: 'Messages', color: 'var(--purple)' },
];

export const HomePage: React.FC<HomePageProps> = ({
  greeting,
  salesTotal: propSalesTotal,
  transactions: propTransactions,
  itemsSold: propItemsSold,
  permissions,
  shiftElapsed,
  onNav,
  onToast,
  staffId,
  businessId,
  currency: currencyProp,
}) => {
  const [salesTotal, setSalesTotal] = useState(propSalesTotal);
  const [transactions, setTransactions] = useState(propTransactions);
  const [itemsSold, setItemsSold] = useState(propItemsSold);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessCurrency, setBusinessCurrency] = useState(currencyProp || '₦');
  const [cashInCounter, setCashInCounter] = useState(0);
  const [bankPayments, setBankPayments] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (currencyProp) setBusinessCurrency(currencyProp);
  }, [currencyProp]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      onToast('⚠️ No business linked to this staff account');
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        if (!businessId) return;

        // Supabase-only — same pipeline as owner (no Firestore cross-account reads)
        const todayData = await fetchTodaysSales(undefined, businessId, staffId);
        if (cancelled) return;
        setSalesTotal(todayData.sales);
        setTransactions(todayData.transactions);

        const products = await fetchProducts(undefined, businessId);
        if (cancelled) return;
        const lowStock = products.filter(
          (p) => p.stock <= (p.lowStockThreshold || 10)
        ).length;
        setLowStockCount(lowStock);

        const recent = await fetchRecentSales(undefined, businessId, 80);
        if (cancelled) return;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startMs = startOfDay.getTime();

        let cashTotal = 0;
        let bankTotal = 0;
        let units = 0;

        for (const sale of recent) {
          const created = sale.createdAt ? new Date(sale.createdAt).getTime() : 0;
          if (created && created < startMs) continue;

          const recordedUid =
            (sale as any).soldBy ||
            (sale as any).recordedBy?.uid ||
            (sale as any).recordedBy?.staffId;
          if (staffId && recordedUid && recordedUid !== staffId) continue;

          const total = Number(sale.total) || 0;
          const method = String(sale.paymentMethod || 'cash').toLowerCase();
          if (method === 'cash') cashTotal += total;
          else if (method === 'transfer' || method === 'pos' || method === 'card')
            bankTotal += total;
          else cashTotal += total;

          const prods = sale.products || [];
          for (const p of prods) {
            units += Number((p as any).quantity) || 0;
          }
        }

        setCashInCounter(cashTotal);
        setBankPayments(bankTotal);
        setItemsSold(units);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        onToast('⚠️ Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [businessId, staffId, onToast]);

  const pct = Math.min(100, Math.round((salesTotal / DAILY_TARGET) * 100));

  const handleAction = useCallback(
    (action: QuickAction) => {
      if (action.permKey && !permissions[action.permKey]) {
        onToast('🔒 Access blocked by owner');
        return;
      }
      onNav(action.page);
    },
    [permissions, onNav, onToast]
  );

  if (!isMounted) {
    return (
      <div className="pg act full" id="pg-home">
        <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="pg act full" id="pg-home">
      <div className="staff-hero">
        <div className="sh-l">
          <h2>{greeting}</h2>
          <p>You're clocked in. Here's your shift summary so far.</p>
        </div>
        <div className="sh-r">
          {loading ? (
            <div className="sh-val">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto" />
            </div>
          ) : (
            <>
              <div className="sh-val">
                {formatCurrency(salesTotal, businessCurrency)}
              </div>
              <div className="sh-lbl">Your Sales Today</div>
              <div className="sh-sub">
                {transactions} transaction{transactions !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="home-body">
        <div className="home-main">
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                My Performance Today
              </div>
              <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>
                Shift: {shiftElapsed}
              </span>
            </div>
            <div className="mg">
              <div className="mc">
                <div className="mlbl">Sales Made</div>
                <div className="mv pos">
                  {formatCurrency(salesTotal, businessCurrency)}
                </div>
                <span className="md du">Today</span>
              </div>
              <div className="mc">
                <div className="mlbl">Transactions</div>
                <div className="mv">{transactions}</div>
                <span className="md dn">This shift</span>
              </div>
              <div className="mc">
                <div className="mlbl">Items Sold</div>
                <div className="mv">{itemsSold}</div>
                <span className="md dn">Units</span>
              </div>
              <div className="mc">
                <div className="mlbl">Low Stock Items</div>
                <div
                  className="mv"
                  style={{
                    color: lowStockCount > 0 ? 'var(--amber)' : 'var(--t3)',
                  }}
                >
                  {lowStockCount}
                </div>
                <span className={`md ${lowStockCount > 0 ? 'da' : 'dn'}`}>
                  {lowStockCount > 0 ? '⚠️ Need attention' : 'All good'}
                </span>
              </div>
              <div className="mc">
                <div className="mlbl">Avg. Sale</div>
                <div className="mv">
                  {avgSale(salesTotal, transactions, businessCurrency)}
                </div>
                <span className="md dn">Per txn</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--amber-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                Daily Target
              </div>
              <span
                className={`pill ${pct >= 100 ? 'g' : pct >= 50 ? 'a' : 'r'}`}
              >
                {pct}%
              </span>
            </div>
            <div className="target-row">
              <span className="tgt-lbl">Progress</span>
              <span className="tgt-val">
                {formatCurrency(salesTotal, businessCurrency)} /{' '}
                {formatCurrency(DAILY_TARGET, businessCurrency)}
              </span>
            </div>
            <div className="pbar-w">
              <div
                className={`pbar${pct < 30 ? ' r' : pct < 70 ? ' a' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              style={{
                fontSize: '.71rem',
                color: 'var(--t3)',
                marginTop: '8px',
              }}
            >
              {pct >= 100
                ? '🎉 Target achieved! Great work today.'
                : `Keep going! You need ${formatCurrency(
                    Math.max(0, DAILY_TARGET - salesTotal),
                    businessCurrency
                  )} more to hit target.`}
            </div>
          </div>

          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--teal-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                Payment Accountability
              </div>
              <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>Today</span>
            </div>
            <div className="mg">
              <div className="mc">
                <div className="mlbl">💵 Cash in Counter</div>
                <div className="mv pos">
                  {formatCurrency(cashInCounter, businessCurrency)}
                </div>
                <span className="md dn">You're accountable for this</span>
              </div>
              <div className="mc">
                <div className="mlbl">📱 Bank/POS Payments</div>
                <div className="mv">
                  {formatCurrency(bankPayments, businessCurrency)}
                </div>
                <span className="md dn">Transferred to bank</span>
              </div>
              <div className="mc">
                <div className="mlbl">Total Collected</div>
                <div className="mv">
                  {formatCurrency(cashInCounter + bankPayments, businessCurrency)}
                </div>
                <span className="md dn">All payments today</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                Quick Actions
              </div>
            </div>
            <div className="qa-g">
              {QUICK_ACTIONS.map((action) => {
                const isLocked = !!(
                  action.permKey && !permissions[action.permKey]
                );
                return (
                  <div
                    key={action.label}
                    className={`qa-tile${action.prime ? ' prime' : ''}${
                      isLocked ? ' locked-tile' : ''
                    }`}
                    onClick={() => handleAction(action)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction(action)}
                  >
                    <div
                      className="qa-ic"
                      style={action.prime ? undefined : { background: action.bg }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {action.icon}
                      </div>
                    </div>
                    <div className="qa-lbl">
                      {action.label}
                      {isLocked ? ' 🔒' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="home-aside">
          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                My Score
              </div>
            </div>
            <div className="score-ring-w">
              <div className="score-ring">
                <svg viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke="var(--bdrS)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="26"
                    cy="26"
                    r="22"
                    fill="none"
                    stroke="var(--brand)"
                    strokeWidth="5"
                    strokeDasharray="138"
                    strokeDashoffset={138 - (138 * Math.min(100, pct)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="score-ring-val">{loading ? '--' : `${pct}`}</div>
              </div>
              <div className="score-info">
                <h4>{loading ? 'Loading...' : pct >= 70 ? 'On track' : 'Keep pushing'}</h4>
                <p>
                  {loading
                    ? 'Fetching performance data...'
                    : `${transactions} sales · ${formatCurrency(salesTotal, businessCurrency)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--amber-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <path d="M22 17H2a3 3 0 003-3V9a7 7 0 0114 0v5a3 3 0 003 3zm-8.27 4a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                Owner Notices
              </div>
            </div>
            <div className="info-list">
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--t3)',
                  fontSize: '.8rem',
                }}
              >
                No new notices from owner
              </div>
            </div>
          </div>

          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--blue-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                My Access
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {PERM_LABELS.map(({ key, label, color }) => (
                <div key={key} className="perm-access-row">
                  <div
                    className="perm-access-dot"
                    style={{
                      background: permissions[key] ? color : 'var(--t3)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '.74rem',
                      color: permissions[key] ? 'var(--t1)' : 'var(--t3)',
                      fontWeight: permissions[key] ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                  {!permissions[key] && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '.62rem',
                        color: 'var(--t3)',
                      }}
                    >
                      🔒
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

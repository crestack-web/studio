import React, { useState, useMemo, useEffect } from 'react';
import type { SaleRecord, PageId } from './types';
import { DAILY_TARGET } from './data';
import { LockedPage } from './shared';
import { useLiveClock } from './hooks';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, collection, getDocs, query, where, Timestamp, addDoc, updateDoc } from 'firebase/firestore';
import { fetchProducts, fetchRecentSales, getStaffBusinessId } from './services/dataService';

/* ═══════════════════════════════════════
   INVENTORY PAGE
═══════════════════════════════════════ */
interface InventoryPageProps { hasAccess: boolean; }

export const InventoryPage: React.FC<InventoryPageProps> = ({ hasAccess }) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessCurrency, setBusinessCurrency] = useState('₦');

  // Fetch real products and business currency from Firestore
  useEffect(() => {
    async function loadProducts() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const businessId = await getStaffBusinessId(getFirestore(), user.uid);
        if (businessId) {
          const fetchedProducts = await fetchProducts(getFirestore(), businessId);
          setProducts(fetchedProducts);

          // Fetch business profile to get currency
          const businessDoc = await getDoc(doc(getFirestore(), 'businesses', businessId));
          if (businessDoc.exists()) {
            const businessData = businessDoc.data();
            const currency = businessData.currency || businessData.businessCurrency || businessData.defaultCurrency || '₦';
            setBusinessCurrency(currency);
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

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
        <div className="mc"><div className="mlbl">Est. Value</div><div className="mv">₦{(estValue / 1000).toFixed(0)}K</div></div>
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
          <button className="btn bxs bamb">Alert Owner</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:'var(--rsm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize:'.77rem', fontWeight:600, color:'var(--red)', flex:1 }}>Bottled Water — Only 4 units remaining</span>
            <span className="pill r">CRITICAL</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:'var(--amber-bg)', border:'1px solid var(--amber)', borderRadius:'var(--rsm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <span style={{ fontSize:'.77rem', fontWeight:600, color:'var(--amber)', flex:1 }}>Sabuni — 7 units left, running low</span>
            <span className="pill a">LOW</span>
          </div>
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
              <div className="inv-pr">₦{p.price.toLocaleString()}</div>
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
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ hasAccess, sessionSales }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [allRecords, setAllRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real sales history from Firestore
  useEffect(() => {
    async function loadSalesHistory() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const businessId = await getStaffBusinessId(getFirestore(), user.uid);
        if (businessId) {
          const recentSales = await fetchRecentSales(getFirestore(), businessId, 50);
          
          // Convert to SaleRecord format
          const saleRecords: SaleRecord[] = recentSales.map(sale => ({
            id: sale.id,
            time: new Date(sale.createdAt.toDate()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            items: sale.products.map(p => `${p.name} ×${p.quantity}`).join(', '),
            amount: sale.total,
            payment: sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1),
          }));
          
          setAllRecords(saleRecords);
        }
      } catch (error) {
        console.error('Error loading sales history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSalesHistory();
  }, []);

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
          <div className="hs-val">₦{totalRevenue.toLocaleString()}</div>
          <div className="hs-lbl">Total Revenue</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">{transactionCount}</div>
          <div className="hs-lbl">Transactions</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">₦{Math.round(avgPerSale).toLocaleString()}</div>
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
                  <td><strong>₦{r.amount.toLocaleString()}</strong></td>
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
interface AttendancePageProps { hasAccess: boolean; }

export const AttendancePage: React.FC<AttendancePageProps> = ({ hasAccess }) => {
  const clock = useLiveClock();
  const [clockedIn, setClockedIn] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [shiftLog, setShiftLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Fetch real attendance data from Firestore
  useEffect(() => {
    async function loadAttendanceData() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const { firestore } = initializeFirebase();
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.businessId) {
            setBusinessId(userData.businessId);
            
            // Fetch attendance records from Firestore
            const attendanceQuery = query(
              collection(firestore, 'businesses', userData.businessId, 'attendance'),
              where('staffId', '==', user.uid)
            );
            const attendanceSnapshot = await getDocs(attendanceQuery);
            const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
            setAttendanceData(attendanceRecords);
            
            // Check if currently clocked in
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayAttendance = attendanceRecords.find((record: any) => {
              const recordDate = record.clockIn?.toDate ? record.clockIn.toDate() : new Date(record.clockIn);
              return recordDate >= today && !record.clockOut;
            });
            setClockedIn(!!todayAttendance);
            
            // Build shift log from attendance records
            const log = attendanceRecords
              .filter((record: any) => record.clockOut)
              .map((record: any) => ({
                date: new Date(record.clockIn?.toDate ? record.clockIn.toDate() : record.clockIn).toLocaleDateString(),
                hours: calculateShiftHours(record.clockIn, record.clockOut),
                clockIn: formatTime(record.clockIn),
                clockOut: formatTime(record.clockOut),
                status: record.clockOut ? 'complete' : 'incomplete'
              }));
            setShiftLog(log);
          }
        }
      } catch (error) {
        console.error('Error loading attendance data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceData();
  }, []);

  const handleClockIn = async () => {
    if (!businessId) return;
    
    try {
      const { auth, firestore } = initializeFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();

      await addDoc(collection(firestore, 'businesses', businessId, 'attendance'), {
        staffId: user.uid,
        staffName: userData.name || 'Unknown Staff',
        businessId,
        clockIn: Timestamp.now(),
        clockOut: null,
        date: new Date().toISOString().split('T')[0],
        status: 'clocked_in'
      });

      setClockedIn(true);
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    if (!businessId) return;
    
    try {
      const { auth, firestore } = initializeFirebase();
      const user = auth.currentUser;
      if (!user) return;

      // Find today's clock-in record
      const attendanceQuery = query(
        collection(firestore, 'businesses', businessId, 'attendance'),
        where('staffId', '==', user.uid),
        where('clockOut', '==', null)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      if (!attendanceSnapshot.empty) {
        const docRef = doc(firestore, 'businesses', businessId, 'attendance', attendanceSnapshot.docs[0].id);
        await updateDoc(docRef, {
          clockOut: Timestamp.now(),
          status: 'clocked_out'
        });
      }

      setClockedIn(false);
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  const calculateShiftHours = (clockIn: any, clockOut: any) => {
    const inTime = clockIn?.toDate ? clockIn.toDate() : new Date(clockIn);
    const outTime = clockOut?.toDate ? clockOut.toDate() : new Date(clockOut);
    const diffMs = outTime.getTime() - inTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!hasAccess) return <LockedPage pageName="Attendance"/>;

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
            attendanceData.map((d) => (
              <div key={d.day} className={`atd-day ${d.status}`} title={d.status}>
                {d.day}
              </div>
            ))
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
interface MessagesPageProps { hasAccess: boolean; }

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

export const MessagesPage: React.FC<MessagesPageProps> = ({ hasAccess }) => {
  const [convId, setConvId] = useState<ConvId>('owner');
  const [convos, setConvos] = useState<Conversations>({ owner: [], team: [] });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string>('Business Owner');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // Load conversations from Firestore
  useEffect(() => {
    async function loadConversations() {
      try {
        const { auth, firestore } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        setStaffId(user.uid);

        // Get business ID from user document
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.businessId) {
            setBusinessId(userData.businessId);

            // Load owner conversation
            const ownerConvQuery = query(
              collection(firestore, 'businesses', userData.businessId, 'conversations'),
              where('type', '==', 'owner'),
              where('participants', 'array-contains', user.uid)
            );
            const ownerConvSnapshot = await getDocs(ownerConvQuery);
            
            let ownerMessages: ChatMessage[] = [];
            if (!ownerConvSnapshot.empty) {
              const ownerConv = ownerConvSnapshot.docs[0];
              const convData = ownerConv.data();
              ownerMessages = convData.messages || [];
            }

            // Load team conversation
            const teamConvQuery = query(
              collection(firestore, 'businesses', userData.businessId, 'conversations'),
              where('type', '==', 'team')
            );
            const teamConvSnapshot = await getDocs(teamConvQuery);
            
            let teamMessages: ChatMessage[] = [];
            if (!teamConvSnapshot.empty) {
              const teamConv = teamConvSnapshot.docs[0];
              const convData = teamConv.data();
              teamMessages = convData.messages || [];
            }

            setConvos({
              owner: ownerMessages,
              team: teamMessages,
            });

            // Load owner name
            const businessDoc = await getDoc(doc(firestore, 'businesses', userData.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              setOwnerName(businessData.ownerName || businessData.businessName || 'Business Owner');
            }

            // Load team members
            const staffQuery = query(
              collection(firestore, 'businesses', userData.businessId, 'staff')
            );
            const staffSnapshot = await getDocs(staffQuery);
            const members = staffSnapshot.docs.map(doc => doc.data());
            setTeamMembers(members);
          }
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConversations();
  }, []);

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

  return (
    <div className="pg act full" id="pg-messages">
      <div className="phd">
        <h2>Messages</h2>
        <p>Communicate directly with the business owner and your team.</p>
      </div>
      <div className="msg-lay">
        {/* Sidebar */}
        <div className="msg-sidebar">
          <div className="msg-sb-hd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Conversations
          </div>
          <div className="conv-list">
            <div className={`conv-item${convId === 'owner' ? ' act' : ''}`} onClick={() => setConvId('owner')}>
              <div className="conv-av" style={{ background: 'var(--purple)' }}>
                {ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="conv-info">
                <div className="conv-nm">{ownerName}</div>
                <div className="conv-prev">{convos.owner.length > 0 ? convos.owner[convos.owner.length - 1].text.substring(0, 30) + '...' : 'No messages yet'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div className="conv-time">{convos.owner.length > 0 ? formatTime(convos.owner[convos.owner.length - 1].timestamp) : ''}</div>
                {convos.owner.length > 0 && <div className="conv-dot"/>}
              </div>
            </div>
            <div className={`conv-item${convId === 'team' ? ' act' : ''}`} onClick={() => setConvId('team')}>
              <div className="conv-av" style={{ background: 'var(--teal)' }}>TM</div>
              <div className="conv-info">
                <div className="conv-nm">Team Chat</div>
                <div className="conv-prev">{convos.team.length > 0 ? convos.team[convos.team.length - 1].text.substring(0, 30) + '...' : 'No messages yet'}</div>
              </div>
              <div className="conv-time">{convos.team.length > 0 ? formatTime(convos.team[convos.team.length - 1].timestamp) : ''}</div>
            </div>
          </div>
        </div>

        {/* Main chat */}
        <div className="msg-main">
          <div className="msg-hd">
            <div
              className="conv-av"
              style={{ width:28, height:28, borderRadius:'50%', background: convId === 'owner' ? 'var(--purple)' : 'var(--teal)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:700, flexShrink:0 }}
            >
              {convId === 'owner' ? ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TM'}
            </div>
            <div>
              <div className="msg-hd-nm">{convId === 'owner' ? ownerName : 'Team Chat'}</div>
              <div className="msg-hd-sub">{convId === 'owner' ? 'Business Owner' : `${teamMembers.length} members`}</div>
            </div>
          </div>

          <div className="msg-body" ref={bodyRef}>
            {msgs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '40px 20px' }}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              msgs.map((m, i) => (
                <div key={i} className={`bubble ${m.type}`}>
                  <div className="bub">{m.text}</div>
                  <div className="bub-time">{m.type === 'recv' ? (m.senderName || 'Today') : 'You · Today'}</div>
                </div>
              ))
            )}
          </div>

          <div className="msg-inp-row">
            <input
              type="text"
              className="msg-inp"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button className="msg-send" onClick={sendMsg} aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════ */
interface SettingsPageProps {
  staff: { initials: string; name: string; role: string };
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
  onToast: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  staff, theme, onToggleTheme, onLogout, onToast,
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

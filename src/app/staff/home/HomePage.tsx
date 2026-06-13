import React, { useCallback, useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { fetchTodaysSales, fetchProducts } from './services/dataService';
import type { Permissions, PageId } from './types';
import { DAILY_TARGET } from './data';
import { formatCurrency } from '@/lib/currency';

interface HomePageProps {
  greeting: string;
  salesTotal: number;
  transactions: number;
  itemsSold: number;
  permissions: Permissions;
  shiftElapsed: string;
  onNav: (p: PageId) => void;
  onToast: (msg: string) => void;
}

const avgSale = (total: number, txns: number, currency: string) =>
  txns > 0 ? formatCurrency(Math.round(total / txns), currency) : formatCurrency(0, currency);

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
    permKey: 'sale', page: 'sale', label: 'Record Sale', prime: true,
    bg: 'var(--brand-lt)', stroke: 'var(--brand)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>,
  },
  {
    permKey: 'inv', page: 'inv', label: 'Check Stock',
    bg: 'var(--amber-bg)', stroke: 'var(--amber)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  },
  {
    permKey: 'hist', page: 'hist', label: 'Sale History',
    bg: 'var(--blue-bg)', stroke: 'var(--blue)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    permKey: 'atd', page: 'atd', label: 'Clock In/Out',
    bg: 'var(--teal-bg)', stroke: 'var(--teal)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    permKey: 'msg', page: 'msg', label: 'Message Owner',
    bg: 'var(--purple-bg)', stroke: 'var(--purple)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  {
    permKey: 'earn', page: 'hist', label: 'My Earnings',
    bg: 'var(--brand-lt)', stroke: 'var(--brand)',
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
];

const PERM_LABELS: Array<{ key: keyof Permissions; label: string; color: string }> = [
  { key: 'sale',  label: 'Record Sales',       color: 'var(--brand)'  },
  { key: 'inv',   label: 'View Inventory',      color: 'var(--amber)'  },
  { key: 'hist',  label: 'Sale History',        color: 'var(--blue)'   },
  { key: 'atd',   label: 'Attendance',          color: 'var(--teal)'   },
  { key: 'msg',   label: 'Messages',            color: 'var(--purple)' },
  { key: 'earn',  label: 'See Own Earnings',    color: 'var(--brand)'  },
];

export const HomePage: React.FC<HomePageProps> = ({
  greeting, salesTotal: propSalesTotal, transactions: propTransactions, itemsSold,
  permissions, shiftElapsed, onNav, onToast,
}) => {
  const [salesTotal, setSalesTotal] = useState(propSalesTotal);
  const [transactions, setTransactions] = useState(propTransactions);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [businessCurrency, setBusinessCurrency] = useState('₦');
  const [cashInCounter, setCashInCounter] = useState(0);
  const [bankPayments, setBankPayments] = useState(0);

  // Fetch real data from Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data:', userData);
          
          if (userData.businessId) {
            console.log('Business ID:', userData.businessId);
            
            // Fetch business profile to get currency
            try {
              const businessDoc = await getDoc(doc(getFirestore(), 'businesses', userData.businessId));
              if (businessDoc.exists()) {
                const businessData = businessDoc.data();
                console.log('Business data:', businessData);
                // Try multiple possible field names for currency
                const currency = businessData.currency || businessData.businessCurrency || businessData.defaultCurrency || '₦';
                setBusinessCurrency(currency);
                console.log('Business currency set to:', currency);
              } else {
                console.warn('Business document not found, using default currency');
                setBusinessCurrency('₦');
              }
            } catch (error) {
              console.error('Error fetching business document:', error);
              setBusinessCurrency('₦');
            }

            // Fetch today's sales
            const todayData = await fetchTodaysSales(getFirestore(), userData.businessId);
            setSalesTotal(todayData.sales);
            setTransactions(todayData.transactions);

            // Fetch products to check low stock
            const products = await fetchProducts(getFirestore(), userData.businessId);
            const lowStock = products.filter(p => p.stock <= (p.lowStockThreshold || 10)).length;
            setLowStockCount(lowStock);

            // Calculate cash and bank payments for accountability
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const salesQuery = query(
              collection(getFirestore(), 'businesses', userData.businessId, 'sales'),
              where('createdAt', '>=', Timestamp.fromDate(today))
            );
            const salesSnapshot = await getDocs(salesQuery);
            let cashTotal = 0;
            let bankTotal = 0;
            
            salesSnapshot.forEach(doc => {
              const data = doc.data();
              if (data.paymentMethods) {
                if (data.paymentMethods.cash) {
                  cashTotal += data.paymentMethods.cash;
                }
                if (data.paymentMethods.transfer || data.paymentMethods.pos) {
                  bankTotal += (data.paymentMethods.transfer || 0) + (data.paymentMethods.pos || 0);
                }
              } else if (data.paymentMethod === 'cash') {
                cashTotal += data.total;
              } else if (data.paymentMethod === 'transfer' || data.paymentMethod === 'pos') {
                bankTotal += data.total;
              }
            });

            setCashInCounter(cashTotal);
            setBankPayments(bankTotal);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        onToast('⚠️ Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [onToast]);

  const pct = Math.min(100, Math.round((salesTotal / DAILY_TARGET) * 100));

  const handleAction = useCallback((action: QuickAction) => {
    if (action.permKey && !permissions[action.permKey]) {
      onToast('🔒 Access blocked by owner');
      return;
    }
    onNav(action.page);
  }, [permissions, onNav, onToast]);

  return (
    <div className="pg act full" id="pg-home">
      {/* Hero */}
      <div className="staff-hero">
        <div className="sh-l">
          <h2>{greeting}</h2>
          <p>You're clocked in. Here's your shift summary so far.</p>
        </div>
        <div className="sh-r">
          {loading ? (
            <div className="sh-val">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="sh-val">{formatCurrency(salesTotal, businessCurrency)}</div>
              <div className="sh-lbl">Your Sales Today</div>
              <div className="sh-sub">{transactions} transaction{transactions !== 1 ? 's' : ''}</div>
            </>
          )}
        </div>
      </div>

      {/* Body — responsive two-column */}
      <div className="home-body">
        <div className="home-main">

          {/* Performance metrics */}
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                My Performance Today
              </div>
              <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>Shift: {shiftElapsed}</span>
            </div>
            <div className="mg">
              <div className="mc">
                <div className="mlbl">Sales Made</div>
                <div className="mv pos">{formatCurrency(salesTotal, businessCurrency)}</div>
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
                <div className="mv" style={{ color: lowStockCount > 0 ? 'var(--amber)' : 'var(--t3)' }}>
                  {lowStockCount}
                </div>
                <span className={`md ${lowStockCount > 0 ? 'da' : 'dn'}`}>
                  {lowStockCount > 0 ? '⚠️ Need attention' : 'All good'}
                </span>
              </div>
              <div className="mc">
                <div className="mlbl">Avg. Sale</div>
                <div className="mv">{avgSale(salesTotal, transactions, businessCurrency)}</div>
                <span className="md dn">Per txn</span>
              </div>
            </div>
          </div>

          {/* Daily target */}
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--amber-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                Daily Target
              </div>
              <span className={`pill ${pct >= 100 ? 'g' : pct >= 50 ? 'a' : 'r'}`}>{pct}%</span>
            </div>
            <div className="target-row">
              <span className="tgt-lbl">Progress</span>
              <span className="tgt-val">{formatCurrency(salesTotal, businessCurrency)} / {formatCurrency(DAILY_TARGET, businessCurrency)}</span>
            </div>
            <div className="pbar-w">
              <div className={`pbar${pct < 30 ? ' r' : pct < 70 ? ' a' : ''}`} style={{ width: `${pct}%` }}/>
            </div>
            <div style={{ fontSize: '.71rem', color: 'var(--t3)', marginTop: '8px' }}>
              {pct >= 100
                ? '🎉 Target achieved! Great work today.'
                : `Keep going! You need ${formatCurrency(DAILY_TARGET - salesTotal, businessCurrency)} more to hit target.`}
            </div>
          </div>

          {/* Payment Accountability */}
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--teal-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                </div>
                Payment Accountability
              </div>
              <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>Today</span>
            </div>
            <div className="mg">
              <div className="mc">
                <div className="mlbl">💵 Cash in Counter</div>
                <div className="mv pos">{formatCurrency(cashInCounter, businessCurrency)}</div>
                <span className="md dn">You're accountable for this</span>
              </div>
              <div className="mc">
                <div className="mlbl">📱 Bank/POS Payments</div>
                <div className="mv">{formatCurrency(bankPayments, businessCurrency)}</div>
                <span className="md dn">Transferred to bank</span>
              </div>
              <div className="mc">
                <div className="mlbl">Total Collected</div>
                <div className="mv">{formatCurrency(cashInCounter + bankPayments, businessCurrency)}</div>
                <span className="md dn">All payments today</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="chd">
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                Quick Actions
              </div>
            </div>
            <div className="qa-g">
              {QUICK_ACTIONS.map((action) => {
                const isLocked = !!(action.permKey && !permissions[action.permKey]);
                return (
                  <div
                    key={action.label}
                    className={`qa-tile${action.prime ? ' prime' : ''}${isLocked ? ' locked-tile' : ''}`}
                    onClick={() => handleAction(action)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleAction(action)}
                  >
                    <div
                      className="qa-ic"
                      style={action.prime ? undefined : { background: action.bg }}
                    >
                      <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {action.icon}
                      </div>
                    </div>
                    <div className="qa-lbl">
                      {action.label}{isLocked ? ' 🔒' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aside — score, notices, access */}
        <div className="home-aside">
          {/* Performance score */}
          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                My Score
              </div>
            </div>
            <div className="score-ring-w">
              <div className="score-ring">
                <svg viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bdrS)" strokeWidth="5"/>
                  <circle cx="26" cy="26" r="22" fill="none" stroke="var(--brand)" strokeWidth="5"
                    strokeDasharray="138" strokeDashoffset="138" strokeLinecap="round"/>
                </svg>
                <div className="score-ring-val">--</div>
              </div>
              <div className="score-info">
                <h4>Loading...</h4>
                <p>Fetching performance data...</p>
              </div>
            </div>
          </div>

          {/* Owner notices */}
          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--amber-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
                    <path d="M22 17H2a3 3 0 003-3V9a7 7 0 0114 0v5a3 3 0 003 3zm-8.27 4a2 2 0 01-3.46 0"/>
                  </svg>
                </div>
                Owner Notices
              </div>
            </div>
            <div className="info-list">
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)' }}>
                  Loading notices...
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--t3)' }}>
                  No new notices from owner
                </div>
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="card">
            <div className="chd" style={{ marginBottom: '10px' }}>
              <div className="cttl">
                <div className="cic" style={{ background: 'var(--blue-bg)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
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
                    style={{ background: permissions[key] ? color : 'var(--t3)' }}
                  />
                  <span style={{
                    fontSize: '.74rem',
                    color: permissions[key] ? 'var(--t1)' : 'var(--t3)',
                    fontWeight: permissions[key] ? 600 : 400,
                  }}>
                    {label}
                  </span>
                  {!permissions[key] && (
                    <span style={{ marginLeft: 'auto', fontSize: '.62rem', color: 'var(--t3)' }}>🔒</span>
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

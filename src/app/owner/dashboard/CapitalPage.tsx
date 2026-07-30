'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { formatCurrency } from '@/lib/currency';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import styles from './CapitalPage.module.css';
import { Button } from './Button';
import { MOLoadingSpinner } from '@/components/MOLoadingSpinner';

interface ReadinessStats {
  dataHistory: number;
  cashBalance: number;
  avgMargin: number;
  requirementsMet: number;
  totalRequirements: number;
  platformDedicationScore: number;
  activeDays: number;
  recordingConsistency: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  status: string;
  action?: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export default function CapitalPage() {
  const { navigateTo, showToast, user } = useApp();
  const { firestore } = initializeFirebase();
  
  const [loading, setLoading] = useState(true);
  const [fundabilityScore, setFundabilityScore] = useState(0);
  const [scoreStatus, setScoreStatus] = useState<'Growing' | 'Strong' | 'Needs Work'>('Needs Work');
  const [stats, setStats] = useState<ReadinessStats>({
    dataHistory: 0,
    cashBalance: 0,
    avgMargin: 0,
    requirementsMet: 0,
    totalRequirements: 10,
    platformDedicationScore: 0,
    activeDays: 0,
    recordingConsistency: 0,
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [currency, setCurrency] = useState('NGN');

  useEffect(() => {
    async function loadCapitalData() {
      try {
        setLoading(true);
        
        // Get current user
        if (!user.id) {
          showToast('❌ Please log in to view funding options');
          navigateTo('home');
          return;
        }

        // Get user's business ID
        const userDoc = await getDoc(doc(firestore, 'users', user.id));
        if (!userDoc.exists()) {
          showToast('❌ User profile not found');
          return;
        }

        const userData = userDoc.data();
        const businessId = userData.businessId || user.id;

        // Fetch business config to get currency
        const businessConfigDoc = await getDoc(doc(firestore, 'businesses', businessId, 'store', 'config'));
        if (businessConfigDoc.exists()) {
          const businessConfig = businessConfigDoc.data();
          setCurrency(businessConfig.currency || 'NGN');
        }

        // Fetch business data
        const [salesSnapshot, expensesSnapshot] = await Promise.all([
          getDocs(collection(firestore, 'businesses', businessId, 'sales')),
          getDocs(collection(firestore, 'businesses', businessId, 'expenses')),
        ]);

        // Calculate metrics
        const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        // Calculate data history (days since first sale)
        let dataHistory = 0;
        if (sales.length > 0) {
          const firstSale = sales.reduce((min, s) => 
            s.createdAt?.toDate() < min ? s.createdAt?.toDate() : min, 
            new Date()
          );
          dataHistory = Math.floor((new Date().getTime() - firstSale.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Calculate total revenue and profit
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || s.totalRevenue || 0), 0);
        
        // Calculate profit from products, subtracting discounts
        const totalProfit = sales.reduce((sum, s) => {
          const grossProfit = s.products && Array.isArray(s.products)
            ? s.products.reduce((productSum: number, p: any) => {
                const price = p.price || 0;
                const costPrice = p.costPrice || p.cost || 0;
                const quantity = p.quantity || 1;
                return productSum + ((price - costPrice) * quantity);
              }, 0)
            : 0;
          const discount = s.discount || 0;
          return sum + (grossProfit - discount);
        }, 0);
        
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        
        // Calculate average margin
        const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        // Calculate cash balance (simplified net income)
        const cashBalance = totalProfit - totalExpenses;

        // Calculate platform dedication metrics
        // Get unique days with activity (sales or expenses)
        const activityDays = new Set([
          ...sales.map((s: any) => s.createdAt?.toDate()?.toDateString()),
          ...expenses.map((e: any) => e.date?.toDate?.() ? e.date.toDate().toDateString() : null)
        ].filter(Boolean));
        const activeDays = activityDays.size;

        // Calculate recording consistency (activity days / data history)
        const recordingConsistency = dataHistory > 0 ? Math.round((activeDays / dataHistory) * 100) : 0;

        // Calculate platform dedication score (0-100)
        // Factors: active days, recording consistency, data diversity, account age
        let dedicationScore = 0;
        dedicationScore += Math.min(activeDays / 60, 1) * 30;        // Max 30 points for active days
        dedicationScore += (recordingConsistency / 100) * 25;       // Max 25 points for consistency
        dedicationScore += Math.min(dataHistory / 90, 1) * 25;      // Max 25 points for data history
        dedicationScore += (sales.length > 0 && expenses.length > 0) ? 20 : 0; // Max 20 points for data diversity

        // Check requirements - more stringent for fair dedication
        const requirements = [
          sales.length >= 30,                      // At least 30 sales (increased from 10)
          dataHistory >= 60,                       // 60+ days of data (increased from 30)
          avgMargin >= 20,                         // 20%+ profit margin (increased from 15)
          cashBalance > 0,                         // Positive cash flow
          activeDays >= 45,                        // 45+ active days (new)
          recordingConsistency >= 60,              // 60%+ recording consistency (new)
          expenses.length >= 15,                   // At least 15 expenses (increased from 10)
          sales.length >= 50,                      // Consistent sales volume (new)
          avgMargin >= 25,                         // Healthy margin (kept)
          dedicationScore >= 70,                   // 70%+ platform dedication score (new)
        ];

        const requirementsMet = requirements.filter(Boolean).length;

        // Calculate fundability score (0-100) - More stringent calculation
        // SCORING BREAKDOWN:
        // Data History: (days / 180) * 20 = max 20 points (need 180 days for full points)
        // Cash Balance: (balance / 1,000,000) * 20 = max 20 points (need 1M for full points)
        // Profit Margin: (margin% / 50) * 20 = max 20 points (need 50% for full points)
        // Platform Dedication: (dedicationScore / 100) * 25 = max 25 points (weighted higher)
        // Requirements Met: (met / 10) * 15 = max 15 points (weighted lower)
        // TOTAL MAX: 100 points
        let score = 0;
        score += Math.min(dataHistory / 180, 1) * 20;      // Max 20 points for history (need 180 days for max)
        score += Math.min(cashBalance / 1000000, 1) * 20;  // Max 20 points for cash (need 1M for max)
        score += Math.min(avgMargin / 50, 1) * 20;        // Max 20 points for margin (need 50% for max)
        score += (dedicationScore / 100) * 25;           // Max 25 points for dedication (increased weight)
        score += (requirementsMet / 10) * 15;             // Max 15 points for requirements (decreased weight)

        setFundabilityScore(Math.round(score));

        // Determine score status
        if (score >= 70) setScoreStatus('Strong');
        else if (score >= 40) setScoreStatus('Growing');
        else setScoreStatus('Needs Work');

        // Update stats
        setStats({
          dataHistory,
          cashBalance,
          avgMargin: Math.round(avgMargin),
          requirementsMet,
          totalRequirements: 10,
          platformDedicationScore: Math.round(dedicationScore),
          activeDays,
          recordingConsistency,
        });

        // Generate checklist items
        const items: ChecklistItem[] = [
          {
            id: 'sales',
            label: 'Sales History',
            detail: `${sales.length} sales recorded (need 30+)`,
            status: sales.length >= 30 ? 'done' : sales.length >= 15 ? 'pending' : 'todo',
          } as ChecklistItem,
          {
            id: 'salesVolume',
            label: 'Sales Volume',
            detail: `${sales.length} total sales (need 50+)`,
            status: sales.length >= 50 ? 'done' : sales.length >= 30 ? 'pending' : 'todo',
          } as ChecklistItem,
          {
            id: 'profit',
            label: 'Profit Margin',
            detail: `${Math.round(avgMargin)}% average margin (need 20%+)`,
            status: avgMargin >= 25 ? 'done' : avgMargin >= 20 ? 'pending' : 'todo',
          } as ChecklistItem,
          {
            id: 'cashflow',
            label: 'Positive Cash Flow',
            detail: formatCurrency(cashBalance, currency),
            status: cashBalance > 0 ? 'done' : 'todo',
          },
          {
            id: 'consistency',
            label: 'Consistent Activity',
            detail: `${dataHistory} days of data (need 60+)`,
            status: dataHistory >= 60 ? 'done' : dataHistory >= 45 ? 'pending' : 'todo',
          },
          {
            id: 'activeDays',
            label: 'Platform Activity',
            detail: `${activeDays} active days (need 45+)`,
            status: activeDays >= 45 ? 'done' : activeDays >= 30 ? 'pending' : 'todo',
          },
          {
            id: 'recordingConsistency',
            label: 'Recording Consistency',
            detail: `${recordingConsistency}% consistency (need 60%+)`,
            status: recordingConsistency >= 60 ? 'done' : recordingConsistency >= 40 ? 'pending' : 'todo',
          },
          {
            id: 'dedication',
            label: 'Platform Dedication',
            detail: `${Math.round(dedicationScore)}% dedication score (need 70%+)`,
            status: dedicationScore >= 70 ? 'done' : dedicationScore >= 50 ? 'pending' : 'todo',
          },
          {
            id: 'inventory',
            label: 'Inventory Tracking',
            detail: 'Track your stock levels',
            status: 'pending',
            action: () => navigateTo('inventory'),
            actionLabel: 'Go to Inventory',
          },
          {
            id: 'expenses',
            label: 'Expense Records',
            detail: `${expenses.length} expenses logged (need 15+)`,
            status: expenses.length >= 15 ? 'done' : expenses.length >= 8 ? 'pending' : 'todo',
          },
        ];

        setChecklistItems(items);

      } catch (error) {
        console.error('Error loading capital data:', error);
        showToast('❌ Failed to load funding data');
      } finally {
        setLoading(false);
      }
    }

    loadCapitalData();
  }, [navigateTo, showToast, formatCurrency, user.id, firestore]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Access Capital</h2>
            <p className={styles.pageDesc}>Analyzing your business data...</p>
          </div>
          <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <MOLoadingSpinner size={120} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Access Capital</h2>
            <p className={styles.pageDesc}>Your business data unlocks real funding opportunities.</p>
          </div>
          <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.fundingIcon} style={{ marginBottom: 18 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="58" />
                <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(244,165,53,.12)" strokeWidth="1.5" strokeDasharray="6,4" />
                <path d="M36 56 Q36 40 60 40 Q84 40 84 56 L84 84 Q84 90 78 90 L42 90 Q36 90 36 84 Z" fill="rgba(244,165,53,.08)" stroke="rgba(244,165,53,.25)" strokeWidth="2" />
                <path d="M44 56 Q44 46 60 46 Q76 46 76 56" fill="none" stroke="rgba(244,165,53,.2)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="60" cy="70" r="7" fill="rgba(244,165,53,.2)" stroke="#F4A535" strokeWidth="1.5" />
                <rect x="57" y="70" width="6" height="9" rx="3" fill="#F4A535" opacity=".4" />
                <circle cx="60" cy="100" r="12" fill="#F5C9A0" />
                <path d="M48 96 C48 88 72 88 72 96 L72 93 C72 85 48 85 48 93 Z" fill="#2C1A0E" />
                <circle cx="55" cy="98" r="4" fill="white" />
                <circle cx="65" cy="98" r="4" fill="white" />
                <circle cx="55" cy="97" r="2.5" fill="#1A2B3C" />
                <circle cx="65" cy="97" r="2.5" fill="#1A2B3C" />
                <circle cx="55.8" cy="96.3" r="1" fill="white" />
                <circle cx="65.8" cy="96.3" r="1" fill="white" />
                <path d="M54 104 Q60 108 66 104" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <rect x="14" y="32" width="16" height="10" rx="2.5" fill="rgba(29,185,84,.2)" stroke="rgba(29,185,84,.3)" strokeWidth="1" transform="rotate(-15 14 32)" />
                <text x="17" y="40" fontSize="5" fill="rgba(255,255,255,.5)" fontFamily="sans-serif" fontWeight="bold" transform="rotate(-15 17 40)">₦500</text>
                <rect x="90" y="28" width="16" height="10" rx="2.5" fill="rgba(29,185,84,.2)" stroke="rgba(29,185,84,.3)" strokeWidth="1" transform="rotate(12 90 28)" />
                <text x="93" y="36" fontSize="5" fill="rgba(255,255,255,.5)" fontFamily="sans-serif" fontWeight="bold" transform="rotate(12 93 36)">₦200</text>
              </svg>
            </div>
            <div className={styles.heroBadge}>🔒 Data-Verified Funding</div>
            <h2 className={styles.heroTitle}>Turn Your Business Activity Into Capital</h2>
            <p className={styles.heroDesc}>
              Consistent sales, profit, and inventory data unlock loans, profit-sharing, and equity
              from investors who trust your numbers.
            </p>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.scoreLabel}>Fundability Score</div>
            <div className={styles.score}>{fundabilityScore}</div>
            <div className={styles.scoreStatus}>
              {scoreStatus === 'Strong' ? '💪 Strong' : scoreStatus === 'Growing' ? '📈 Growing' : '🌱 Needs Work'}
            </div>
          </div>
        </div>

        {/* Readiness stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={18} height={18}>
                <path d="M18 20v-10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.dataHistory} days</div>
            <div className={styles.statLabel}>Data History</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={18} height={18}>
                <path d="M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <div className={styles.statValue}>{formatCurrency(stats.cashBalance, currency)}</div>
            <div className={styles.statLabel}>Cash Balance</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={18} height={18}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.avgMargin}%</div>
            <div className={styles.statLabel}>Avg Margin</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={18} height={18}>
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.requirementsMet} of {stats.totalRequirements}</div>
            <div className={styles.statLabel}>Requirements</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F4A535" strokeWidth={2} width={18} height={18}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.platformDedicationScore}%</div>
            <div className={styles.statLabel}>Platform Dedication</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F4A535" strokeWidth={2} width={18} height={18}>
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.activeDays} days</div>
            <div className={styles.statLabel}>Active Days</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F4A535" strokeWidth={2} width={18} height={18}>
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div className={styles.statValue}>{stats.recordingConsistency}%</div>
            <div className={styles.statLabel}>Recording Consistency</div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Platform Dedication Requirements</h3>
        <div className={styles.dedicationNotice}>
          <div className={styles.dedicationIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#F4A535" strokeWidth={2} width={24} height={24}>
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div className={styles.dedicationContent}>
            <h4>Fair Platform Dedication Required</h4>
            <p>
              To ensure fair access to capital for businesses genuinely committed to using Busmo, 
              we require consistent platform dedication. This includes regular recording of sales and expenses, 
              maintaining data consistency over time, and demonstrating sustained business activity.
            </p>
            <ul>
              <li><strong>45+ active days</strong> — Regular engagement with the platform</li>
              <li><strong>60%+ recording consistency</strong> — Consistent data recording habits</li>
              <li><strong>70%+ dedication score</strong> — Overall platform commitment</li>
              <li><strong>60+ days of data history</strong> — Sufficient business track record</li>
              <li><strong>30+ sales, 15+ expenses</strong> — Comprehensive business data</li>
            </ul>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Available Funding Options</h3>
        <div className={styles.fundingGrid}>
          <div className={styles.fundingCard}>
            <div className={styles.fundingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                <path d="M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <div className={styles.fundingName}>Microloan</div>
            <div className={styles.fundingDesc}>Quick cash flow support</div>
            <div className={styles.fundingRange}>
              <div>
                <div className={styles.rangeLabel}>Amount</div>
                <div className={styles.rangeValue}>₦50K-₦500K</div>
              </div>
              <div>
                <div className={styles.rangeLabel}>Rate</div>
                <div className={styles.rangeValue}>3-5%/mo</div>
              </div>
            </div>
            <span className={`${styles.tag} ${fundabilityScore >= 50 ? styles.tagGreen : styles.tagAmber}`}>
              {fundabilityScore >= 50 ? 'Pre-Qualified' : 'Build Score (Need 50+)'}
            </span>
          </div>

          <div className={styles.fundingCard}>
            <div className={styles.fundingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                <path d="M17 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div className={styles.fundingName}>Revenue Share</div>
            <div className={styles.fundingDesc}>Investment for % of revenue</div>
            <div className={styles.fundingRange}>
              <div>
                <div className={styles.rangeLabel}>Amount</div>
                <div className={styles.rangeValue}>₦500K-₦5M</div>
              </div>
              <div>
                <div className={styles.rangeLabel}>Share</div>
                <div className={styles.rangeValue}>5-15%</div>
              </div>
            </div>
            <span className={`${styles.tag} ${fundabilityScore >= 70 ? styles.tagGreen : styles.tagBlue}`}>
              {fundabilityScore >= 70 ? 'Available' : 'Requires 70+ Score'}
            </span>
          </div>

          <div className={styles.fundingCard}>
            <div className={styles.fundingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div className={styles.fundingName}>Equity Investment</div>
            <div className={styles.fundingDesc}>Long-term growth capital</div>
            <div className={styles.fundingRange}>
              <div>
                <div className={styles.rangeLabel}>Amount</div>
                <div className={styles.rangeValue}>₦2M-₦20M</div>
              </div>
              <div>
                <div className={styles.rangeLabel}>Equity</div>
                <div className={styles.rangeValue}>10-30%</div>
              </div>
            </div>
            <span className={`${styles.tag} ${fundabilityScore >= 85 ? styles.tagGreen : styles.tagBlue}`}>
              {fundabilityScore >= 85 ? 'Eligible' : 'Requires 85+ Score'}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className={styles.checklist}>
          <h3 className={styles.checklistTitle}>Readiness Checklist</h3>
          {checklistItems.map(item => (
            <div key={item.id} className={styles.checkItem}>
              <div
                className={[
                  styles.checkIcon,
                  item.status === 'done'    ? styles.checkDone    :
                  item.status === 'pending' ? styles.checkPending : styles.checkTodo,
                ].join(' ')}
              >
                {item.status === 'done' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} width={12} height={12}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : item.status === 'pending' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={12} height={12}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : (
                  '○'
                )}
              </div>
              <div className={styles.checkText}>
                <strong>{item.label}</strong> — {item.detail}
              </div>
              {item.action && (
                <button className={styles.checkAction} onClick={item.action}>
                  {item.actionLabel || 'Go'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* CTA card */}
        <div className={styles.ctaCard}>
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} style={{ margin: '0 auto 9px' }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <h3 className={styles.ctaTitle}>Keep Recording to Unlock More</h3>
          <p className={styles.ctaDesc}>
            The more consistently you use Busmo, the higher your Fundability Score.
          </p>
          <Button
            variant="primary"
            size="lg"
            style={{ background: '#fff', color: 'var(--purple)', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,.14)' }}
            onClick={() => navigateTo('home')}
          >
            + Record a Sale Now
          </Button>
        </div>
      </div>
    </main>
  );
}


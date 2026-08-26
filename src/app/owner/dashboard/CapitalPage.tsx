'use client';

import { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { formatCurrency } from '@/lib/currency';
import { fetchDocs, fetchDoc } from '@/lib/supabase-client-data';
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
        
        if (!user.id) {
          showToast('Please log in to view funding options');
          navigateTo('home');
          return;
        }

        const userData = await fetchDoc('users', user.id);
        if (!userData) {
          showToast('User profile not found');
          return;
        }

        const { resolveOwnerScopeBusinessId } = await import('@/lib/resolve-business-scope');
        const businessId =
          (await resolveOwnerScopeBusinessId(user.id, userData.businessId || userData.business_id)) ||
          '';
        if (!businessId) {
          showToast('No business found for this account');
          return;
        }

        const businessConfig = await fetchDoc(`businesses/${businessId}/store`, 'config');
        if (businessConfig) {
          setCurrency(businessConfig.currency || 'NGN');
        }

        const [sales, expenses] = await Promise.all([
          fetchDocs(`businesses/${businessId}/sales`),
          fetchDocs(`businesses/${businessId}/expenses`),
        ]) as any[][];

        let dataHistory = 0;
        if (sales.length > 0) {
          const firstSale = sales.reduce((min, s) => {
            const d = new Date(s.createdAt);
            return d < min ? d : min;
          }, new Date());
          dataHistory = Math.floor((new Date().getTime() - firstSale.getTime()) / (1000 * 60 * 60 * 24));
        }

        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || s.totalRevenue || 0), 0);
        
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
        const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const cashBalance = totalProfit - totalExpenses;

        const activityDays = new Set([
          ...sales.map((s: any) => new Date(s.createdAt).toDateString()),
          ...expenses.map((e: any) => e.date ? new Date(e.date).toDateString() : null)
        ].filter(Boolean));
        const activeDays = activityDays.size;

        const recordingConsistency = dataHistory > 0 ? Math.round((activeDays / dataHistory) * 100) : 0;

        let dedicationScore = 0;
        dedicationScore += Math.min(activeDays / 60, 1) * 30;
        dedicationScore += (recordingConsistency / 100) * 25;
        dedicationScore += Math.min(dataHistory / 90, 1) * 25;
        dedicationScore += (sales.length > 0 && expenses.length > 0) ? 20 : 0;

        const requirements = [
          sales.length >= 30,
          dataHistory >= 60,
          avgMargin >= 20,
          cashBalance > 0,
          activeDays >= 45,
          recordingConsistency >= 60,
          expenses.length >= 15,
          sales.length >= 50,
          avgMargin >= 25,
          dedicationScore >= 70,
        ];

        const requirementsMet = requirements.filter(Boolean).length;

        let score = 0;
        score += Math.min(dataHistory / 180, 1) * 20;
        score += Math.min(cashBalance / 1000000, 1) * 20;
        score += Math.min(avgMargin / 50, 1) * 20;
        score += (dedicationScore / 100) * 25;
        score += (requirementsMet / 10) * 15;

        setFundabilityScore(Math.round(score));

        if (score >= 70) setScoreStatus('Strong');
        else if (score >= 40) setScoreStatus('Growing');
        else setScoreStatus('Needs Work');

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
        showToast('Failed to load funding data');
      } finally {
        setLoading(false);
      }
    }

    loadCapitalData();
  }, [navigateTo, showToast, user.id]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Access Capital</h1>
          <p className={styles.subtitle}>Analyzing your business data...</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <MOLoadingSpinner size={120} />
        </div>
      </div>
    );
  }

  const statusEmoji = scoreStatus === 'Strong' ? '💪' : scoreStatus === 'Growing' ? '📈' : '🌱';
  const scoreCircumference = 2 * Math.PI * 52;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Access Capital</h1>
          <p className={styles.subtitle}>Your business data unlocks real funding opportunities.</p>
        </div>
        <button className={styles.backBtn} onClick={() => navigateTo('home')}>Back</button>
      </div>

      <div className={styles.scoreCard}>
        <div className={styles.scoreInfo}>
          <span className={styles.badge}>Data-Verified Funding</span>
          <h2 className={styles.scoreHeading}>Turn Your Business Activity Into Capital</h2>
          <p className={styles.scoreDesc}>
            Consistent sales, profit, and inventory data unlock loans, profit-sharing, and equity
            from investors who trust your numbers.
          </p>
        </div>
        <div className={styles.scoreGauge}>
          <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={
              scoreStatus === 'Strong' ? 'var(--green)' : scoreStatus === 'Growing' ? 'var(--amber)' : 'var(--orange)'
            } strokeWidth="6" strokeLinecap="round" strokeDasharray={scoreCircumference}
              strokeDashoffset={scoreCircumference - (fundabilityScore / 100) * scoreCircumference}
              transform="rotate(-90 60 60)" />
            <text x="60" y="55" textAnchor="middle" fill="var(--text-1)" fontSize="28" fontWeight="800" fontFamily="var(--font-display)">
              {fundabilityScore}
            </text>
            <text x="60" y="72" textAnchor="middle" fill="var(--text-3)" fontSize="10" fontWeight="600">
              / 100
            </text>
          </svg>
          <span className={styles.scoreLabel}>{statusEmoji} {scoreStatus}</span>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M18 20v-10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>{stats.dataHistory} days</span>
            <span className={styles.metricLabel}>Data History</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>{formatCurrency(stats.cashBalance, currency)}</span>
            <span className={styles.metricLabel}>Cash Balance</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>{stats.avgMargin}%</span>
            <span className={styles.metricLabel}>Avg Margin</span>
          </div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="16" height="16">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className={styles.metricBody}>
            <span className={styles.metricValue}>{stats.platformDedicationScore}%</span>
            <span className={styles.metricLabel}>Dedication</span>
          </div>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Available Funding Options</h3>
      <div className={styles.fundingGrid}>
        <div className={styles.fundingCard}>
          <div className={styles.fundingIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20">
              <path d="M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
          </div>
          <h4 className={styles.fundingName}>Microloan</h4>
          <p className={styles.fundingDesc}>Quick cash flow support</p>
          <div className={styles.fundingMeta}>
            <span>₦50K–₦500K</span>
            <span>3–5%/mo</span>
          </div>
          <span className={`${styles.tag} ${fundabilityScore >= 50 ? styles.tagGreen : styles.tagAmber}`}>
            {fundabilityScore >= 50 ? 'Pre-Qualified' : 'Need 50+ Score'}
          </span>
        </div>

        <div className={styles.fundingCard}>
          <div className={styles.fundingIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20">
              <path d="M17 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h4 className={styles.fundingName}>Revenue Share</h4>
          <p className={styles.fundingDesc}>Investment for % of revenue</p>
          <div className={styles.fundingMeta}>
            <span>₦500K–₦5M</span>
            <span>5–15% share</span>
          </div>
          <span className={`${styles.tag} ${fundabilityScore >= 70 ? styles.tagGreen : styles.tagBlue}`}>
            {fundabilityScore >= 70 ? 'Available' : 'Need 70+ Score'}
          </span>
        </div>

        <div className={styles.fundingCard}>
          <div className={styles.fundingIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="20" height="20">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h4 className={styles.fundingName}>Equity Investment</h4>
          <p className={styles.fundingDesc}>Long-term growth capital</p>
          <div className={styles.fundingMeta}>
            <span>₦2M–₦20M</span>
            <span>10–30% equity</span>
          </div>
          <span className={`${styles.tag} ${fundabilityScore >= 85 ? styles.tagGreen : styles.tagBlue}`}>
            {fundabilityScore >= 85 ? 'Eligible' : 'Need 85+ Score'}
          </span>
        </div>
      </div>

      <div className={styles.checklist}>
        <div className={styles.checklistHeader}>
          <div>
            <h3 className={styles.checklistTitle}>Readiness Checklist</h3>
            <p className={styles.checklistProgress}>
              {stats.requirementsMet} of {stats.totalRequirements} requirements met
            </p>
          </div>
          <div className={styles.progressRing}>
            <svg width="40" height="40" viewBox="0 0 36 36">
              <path d="M18 2.08a15.92 15.92 0 110 31.84 15.92 15.92 0 010-31.84" fill="none" stroke="var(--border)" strokeWidth="3" />
              <path d="M18 2.08a15.92 15.92 0 110 31.84 15.92 15.92 0 010-31.84" fill="none"
                stroke={stats.requirementsMet >= 7 ? 'var(--green)' : stats.requirementsMet >= 4 ? 'var(--amber)' : 'var(--orange)'}
                strokeWidth="3" strokeLinecap="round" strokeDasharray="100"
                strokeDashoffset={100 - (stats.requirementsMet / stats.totalRequirements) * 100} />
              <text x="18" y="21" textAnchor="middle" fill="var(--text-1)" fontSize="9" fontWeight="700">
                {Math.round((stats.requirementsMet / stats.totalRequirements) * 100)}%
              </text>
            </svg>
          </div>
        </div>

        <div className={styles.checklistBody}>
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} width="10" height="10">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : item.status === 'pending' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width="10" height="10">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                ) : null}
              </div>
              <div className={styles.checkText}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </div>
              {item.action && (
                <button className={styles.checkAction} onClick={item.action}>
                  {item.actionLabel || 'Go'}
                </button>
              )}
            </div>
          ))}
        </div>

        <details className={styles.reqDetails}>
          <summary className={styles.reqSummary}>Platform dedication requirements</summary>
          <ul className={styles.reqList}>
            <li><strong>45+ active days</strong> — Regular engagement with the platform</li>
            <li><strong>60%+ recording consistency</strong> — Consistent data recording habits</li>
            <li><strong>70%+ dedication score</strong> — Overall platform commitment</li>
            <li><strong>60+ days of data history</strong> — Sufficient business track record</li>
            <li><strong>30+ sales, 15+ expenses</strong> — Comprehensive business data</li>
          </ul>
        </details>
      </div>

      <div className={styles.ctaCard}>
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
  );
}

import React from 'react';
import { useApp } from './AppContext'; // Make sure this path is correct and the file exists at src/app/owner/dashboard/AppContext.tsx

// If the file does not exist, create src/AppContext.tsx with at least the following:
// import { Button } from '../../shared/Button';
import { Button } from './Button';
import { FUNDING_OPTIONS, CHECKLIST_ITEMS } from './mockData';
import styles from './CapitalPage.module.css';

// ═══════════════════════════════════════════
//  CapitalPage — Access Capital
// ═══════════════════════════════════════════

export function CapitalPage() {
  const { navigateTo, showToast } = useApp();

  return (
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
          <div className={styles.score}>62</div>
          <div className={styles.scoreStatus}>📈 Growing</div>
        </div>
      </div>

      {/* Readiness stats */}
      <div className={styles.statsGrid}>
        {READINESS_STATS.map(s => (
          <div key={s.label} className={styles.statBox}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2} width={18} height={18}>
                <path d={s.icon}/>
              </svg>
            </div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Available Funding Options</h3>
      <div className={styles.fundingGrid}>
        {FUNDING_OPTIONS.map(opt => (
          <div key={opt.id} className={styles.fundingCard}>
            <div className={styles.fundingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
                <path d={FUNDING_ICONS[opt.icon] ?? ''} />
              </svg>
            </div>
            <div className={styles.fundingName}>{opt.name}</div>
            <div className={styles.fundingDesc}>{opt.description}</div>
            <div className={styles.fundingRange}>
              <div>
                <div className={styles.rangeLabel}>{opt.rangeLabel}</div>
                <div className={styles.rangeValue}>{opt.rangeValue}</div>
              </div>
              <div>
                <div className={styles.rangeLabel}>{opt.secondLabel}</div>
                <div className={styles.rangeValue}>{opt.secondValue}</div>
              </div>
            </div>
            <span
              className={[
                styles.tag,
                opt.tagType === 'qualify' ? styles.tagGreen :
                opt.tagType === 'pending' ? styles.tagAmber : styles.tagBlue,
              ].join(' ')}
            >
              {opt.tag}
            </span>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className={styles.checklist}>
        <h3 className={styles.checklistTitle}>Readiness Checklist</h3>
        {CHECKLIST_ITEMS.map(item => (
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
              <button className={styles.checkAction} onClick={() => showToast(item.action!)}>
                {item.action}
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
  );
}

const READINESS_STATS = [
  { label: 'Data History',  value: '45 days', icon: 'M18 20v-10M12 20V4M6 20v-6' },
  { label: 'Cash Balance',  value: '₦150K',   icon: 'M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16' },
  { label: 'Avg Margin',    value: '29%',      icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { label: 'Requirements',  value: '3 of 6',   icon: 'M20 6L9 17l-5-5' },
];

const FUNDING_ICONS: Record<string, string> = {
  cash:  'M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  trend: 'M22 12h-4l-3 9L9 3l-3 9H2',
};

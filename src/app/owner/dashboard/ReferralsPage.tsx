import React from 'react';
import { useApp } from './AppContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import styles from './ReferralsPage.module.css';

// ═══════════════════════════════════════════
//  ReferralsPage
// ═══════════════════════════════════════════

const REFERRAL_LINK = 'https://busmo.io/signup?ref=abdullahi';

const STATS = [
  { label: 'Total Referrals', value: '0' },
  { label: 'Active Subs',     value: '0' },
  { label: 'Total Earned',    value: '₦0' },
];

export function ReferralsPage() {
  const { navigateTo, showToast } = useApp();

  function copyLink() {
    navigator.clipboard.writeText(REFERRAL_LINK).then(() =>
      showToast('📋 Referral link copied!')
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Referral Programme</h2>
          <p className={styles.pageDesc}>Share Busmo and earn recurring commission.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h2 className={styles.heroTitle}>Earn While You Share 🎁</h2>
          <p className={styles.heroDesc}>
            Every time someone signs up with your link and subscribes, you earn a recurring
            commission — month after month.
          </p>
          <Button
            variant="primary"
            size="lg"
            style={{ background: '#fff', color: 'var(--purple)', border: 'none', marginTop: 14 }}
            onClick={copyLink}
          >
            Share Your Link Now
          </Button>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroBalanceLabel}>Your Balance</div>
          <div className={styles.heroBalance}>₦0</div>
          <div className={styles.heroMinWithdraw}>Withdraw when ≥₦5,000</div>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        {STATS.map(s => (
          <div key={s.label} className={styles.statBox}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link box */}
      <Card>
        <div className={styles.linkLabel}>Your unique referral link</div>
        <div className={styles.linkRow}>
          <input
            className={styles.linkInput}
            value={REFERRAL_LINK}
            readOnly
            aria-label="Referral link"
          />
          <Button variant="primary" onClick={copyLink}>Copy</Button>
        </div>
        <div className={styles.shareButtons}>
          {SHARE_BUTTONS.map(btn => (
            <button
              key={btn.label}
              className={styles.shareBtn}
              onClick={() => showToast(`Opening ${btn.label}…`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                <path d={btn.icon}/>
              </svg>
              {btn.label}
            </button>
          ))}
        </div>
      </Card>

      {/* History */}
      <Card style={{ marginTop: 12 }}>
        <CardHeader>
          <CardIcon bg="var(--amber-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </CardIcon>
          Referral History
        </CardHeader>
        <div className={styles.emptyState}>
          No referrals yet. Share your link to get started! 🚀
        </div>
      </Card>
    </div>
  );
}

const SHARE_BUTTONS = [
  { label: 'WhatsApp', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { label: 'Email',    icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7-10-7' },
  { label: 'SMS',      icon: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .09h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z' },
];

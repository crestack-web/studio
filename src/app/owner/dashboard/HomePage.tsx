import React, { useState } from 'react';
import { useApp } from '../../../contexts/AppContext';
import { Card, CardHeader, CardIcon } from '../../shared/Card';
import { MetricCard } from '../../shared/Badge';
import { Button, ActionLink } from '../../shared/Button';
import { MoIcon } from '../../layout/NavIcons';
import {
  HOME_METRICS,
  INSIGHTS,
  FORECASTS,
  MO_ASK_CHIPS,
} from '../../../constants/mockData';
import styles from './HomePage.module.css';

// ═══════════════════════════════════════════
//  HomePage
// ═══════════════════════════════════════════

export function HomePage() {
  const { navigateTo, showToast } = useApp();
  const [moResponse, setMoResponse] = useState<string | null>(null);

  function handleChip(reply: string) {
    setMoResponse(reply);
  }

  return (
    <div className={styles.layout}>
      {/* ── Left column ── */}
      <div className={styles.left}>

        {/* Ask MO quick card */}
        <Card>
          <div className={styles.askHeader}>
            <div className={styles.moAvatarSm}>
              <MoIcon size={13} />
            </div>
            <span className={styles.askTitle}>Ask MO</span>
            <button
              className={styles.expandBtn}
              onClick={() => navigateTo('mo')}
              title="Open MO full page"
              aria-label="Open Ask MO"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          </div>
          <p className={styles.askSub}>Your AI business analyst. Get instant answers about your numbers.</p>
          <div className={styles.chips}>
            {MO_ASK_CHIPS.map(chip => (
              <button
                key={chip.label}
                className={styles.chip}
                onClick={() => handleChip(chip.reply)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {moResponse && (
            <div className={styles.askResp}>
              {moResponse}
            </div>
          )}
        </Card>

        {/* Business Health */}
        <Card>
          <CardHeader
            action={<ActionLink>Full Statement →</ActionLink>}
          >
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </CardIcon>
            Business Health
          </CardHeader>
          <div className={styles.metricsGrid}>
            {HOME_METRICS.map(m => (
              <MetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                trend={m.trend}
                trendType={m.trendType}
                valueColor={m.label.includes('Profit') ? 'green' : 'default'}
              />
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </CardIcon>
            Quick Actions
          </CardHeader>
          <div className={styles.quickActions}>
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.label}
                className={[styles.qaBtn, qa.primary ? styles.qaPrimary : ''].join(' ')}
                onClick={() => qa.page ? navigateTo(qa.page as any) : showToast(`${qa.label}…`)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d={qa.icon}/>
                </svg>
                {qa.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Services Preview */}
        <Card>
          <CardHeader action={<ActionLink onClick={() => navigateTo('services')}>View all →</ActionLink>}>
            <CardIcon bg="var(--teal-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth={2}>
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </CardIcon>
            Business Services
          </CardHeader>
          <p className={styles.svcSubtext}>Expert help for setup, listings & advertising.</p>
          <div className={styles.svcPreviewGrid}>
            {SERVICE_PREVIEWS.map(svc => (
              <div key={svc.label} className={styles.svcPreviewItem}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={svc.stroke} strokeWidth={2}>
                  <path d={svc.icon}/>
                </svg>
                <div>
                  <div className={styles.svcPreviewName}>{svc.label}</div>
                  <div className={styles.svcPreviewDesc}>{svc.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Right column ── */}
      <div className={styles.right}>

        {/* Top Insight */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </CardIcon>
            Top Insight
          </CardHeader>
          <div className={styles.insightList}>
            {INSIGHTS.map((ins, i) => (
              <div key={i} className={styles.insightItem}>
                <div className={styles.insightDot} style={{ background: ins.color }} />
                <div className={styles.insightText}>
                  {ins.text}<strong>{ins.strong}</strong>{ins.suffix ?? ''}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Forecasts */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </CardIcon>
            Forecasts
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-3)' }}>30 days</span>
          </CardHeader>
          <div className={styles.forecastGrid}>
            {FORECASTS.map(f => (
              <div key={f.label} className={styles.forecastItem}>
                <div className={styles.forecastLabel}>{f.label}</div>
                <div className={[styles.forecastValue, f.alert ? styles.forecastAlert : ''].join(' ')}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sell Online CTA */}
        <div className={styles.miniCard}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth={2} width={14} height={14}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            Sell Online
          </div>
          <div className={styles.miniDesc}>Your free store on Busmo Market is ready.</div>
          <button className={styles.miniBtn}>Set Up Your Store →</button>
        </div>

        <div className={styles.miniCard} onClick={() => navigateTo('referrals')} style={{ cursor: 'pointer' }}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={14} height={14}>
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            Referrals
          </div>
          <div className={styles.miniBalance}>₦0</div>
          <div className={styles.miniDesc}>Earn commission on referred subscriptions.</div>
          <button className={styles.miniBtn}>Start Referring →</button>
        </div>

        <div className={styles.miniCard} onClick={() => navigateTo('capital')} style={{ cursor: 'pointer' }}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={14} height={14}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Access Capital
          </div>
          <div className={styles.miniDesc}>Turn business data into real funding.</div>
          <button className={styles.miniBtn}>Explore Financing →</button>
        </div>
      </div>
    </div>
  );
}

// ── Local data ────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Record Sale', page: 'sale', primary: true,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'Add Product', page: null, primary: false,
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  { label: 'Add Stock', page: null, primary: false,
    icon: 'M23 6L13.5 15.5 8.5 10.5 1 18M17 6L23 6 23 12' },
  { label: 'Add Expense', page: null, primary: false,
    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { label: 'Ask MO', page: 'mo', primary: false,
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { label: 'Referrals', page: 'referrals', primary: false,
    icon: 'M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z' },
];

const SERVICE_PREVIEWS = [
  { label: 'Store Setup',     desc: 'Professional config', stroke: 'var(--purple)', icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0' },
  { label: 'Product Photos',  desc: 'Pro photography',     stroke: 'var(--green)',  icon: 'M3 3h18v18H3zM3 9h18M9 21V9' },
  { label: 'Advertising',     desc: 'Reach customers',     stroke: 'var(--orange)', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { label: 'Business Audit',  desc: 'Expert review',       stroke: 'var(--blue)',   icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
];

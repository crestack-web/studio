'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';

const SECTION_ORDER = ['main', 'operations', 'finance', 'settings'] as const;
const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  operations: 'Operations',
  finance: 'Finance',
  settings: 'Settings',
};

type SessionState = {
  businessId: string | null;
  businessName: string | null;
  productEdition: string;
  needsOnboarding: boolean;
  onboarded: boolean;
};

export function IndustryDashboardClient({
  config,
  section,
}: {
  config: IndustryConfig;
  section?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState(config.productName);
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!data.session?.user) {
          router.replace(config.loginPath);
          return;
        }
        const res = await fetch('/api/industries/session', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setGateError(json.error || 'Could not verify your organization.');
            setAuthChecked(true);
          }
          return;
        }
        const s = json.session as SessionState;
        if (cancelled) return;
        if (s.needsOnboarding || !s.onboarded) {
          router.replace(`${config.signupPath}?recover=1`);
          return;
        }
        if (s.productEdition !== config.id) {
          if (s.productEdition === 'hospitality') router.replace('/industries/hospitality/dashboard');
          else if (s.productEdition === 'professional') router.replace('/industries/professional/dashboard');
          else router.replace('/owner/dashboard');
          return;
        }
        setSession(s);
        setDisplayName(s.businessName || config.productName);
        setAuthChecked(true);
      } catch {
        router.replace(config.loginPath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.id, config.loginPath, config.productName, config.signupPath, router]);

  const activeId = useMemo(() => (!section || section === 'overview' ? 'overview' : section), [section]);
  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f4f8' }}>
        <p style={{ color: '#6b7280', fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  if (gateError) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f4f8', padding: 24 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <p style={{ color: '#991b1b', fontWeight: 600 }}>{gateError}</p>
          <Link href={config.loginPath} style={{ color: '#6b3fe7', fontWeight: 600 }}>Sign in again</Link>
        </div>
      </div>
    );
  }

  const isOverview = !section || section === 'overview';

  return (
    <div className={styles.shell}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden />}
      <aside className={[styles.sidebar, sidebarOpen ? styles.sidebarOpen : ''].join(' ')}>
        <div className={styles.sidebarTop}>
          <img src="/email-logo.png" alt="" width={32} height={32} />
          <span className={styles.logoText}>{config.shortName}</span>
        </div>
        <nav className={styles.navScroll} aria-label={`${config.shortName} navigation`}>
          {SECTION_ORDER.map((sec) => {
            const items = config.nav.filter((n) => (n.section || 'main') === sec);
            if (!items.length) return null;
            return (
              <div key={sec}>
                <span className={styles.sectionLabel}>{SECTION_LABELS[sec]}</span>
                {items.map((item) => {
                  const active =
                    item.id === activeId ||
                    (item.id === 'overview' && isOverview && pathname === config.dashboardPath);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={[styles.navLink, active ? styles.navLinkActive : ''].join(' ')}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button type="button" className={styles.menuBtn} aria-label="Open menu" onClick={() => setSidebarOpen(true)}>☰</button>
            <div style={{ minWidth: 0 }}>
              <div className={styles.topbarTitle}>{config.productName}</div>
              <div className={styles.topbarMeta}>{dateLabel}</div>
            </div>
          </div>
          <button
            type="button"
            className={styles.topbarMeta}
            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            onClick={async () => {
              await getSupabase().auth.signOut();
              window.location.href = config.loginPath;
            }}
          >
            Sign out
          </button>
        </header>
        <div className={styles.pageArea}>
          {isOverview ? (
            <>
              <div className={styles.greeting}>
                <h1>Welcome back, {displayName}.</h1>
                <p>
                  Your {config.shortName.toLowerCase()} workspace
                  {session?.businessId ? ' · org linked' : ''} · metrics show real data when available, otherwise honest empty states.
                </p>
              </div>
              <div className={styles.metricsGrid}>
                {config.metrics.map((m) => (
                  <div key={m.id} className={styles.metricCard}>
                    <div className={styles.metricLabel}>{m.label}</div>
                    <div className={styles.metricValue}>{m.emptyValue}</div>
                    {m.hint && <div className={styles.metricHint}>{m.hint}</div>}
                  </div>
                ))}
              </div>
              <div className={styles.sectionTitle}>Quick actions</div>
              <div className={styles.actionsGrid}>
                {config.quickActions.map((a) => (
                  <Link key={a.id} href={a.href} className={styles.actionBtn}>{a.label}</Link>
                ))}
              </div>
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>{config.id === 'hospitality' ? 'Operations snapshot' : 'Work snapshot'}</h3>
                <p className={styles.empty}>
                  {config.id === 'hospitality'
                    ? 'Check-ins, check-outs, pending reservations, unpaid balances and rooms needing housekeeping will appear here as you add hotel data.'
                    : 'Tasks due today, overdue work, upcoming deadlines and recent project activity will appear here as you add professional services data.'}
                </p>
              </div>
              <div className={styles.panel}>
                <h3 className={styles.panelTitle}>Recent activity</h3>
                <p className={styles.empty}>No activity yet. Use a quick action above to get started.</p>
              </div>
            </>
          ) : (
            <div className={styles.placeholderPage}>
              <h2>{config.nav.find((n) => n.id === activeId)?.label || activeId}</h2>
              <p>
                This {config.shortName.toLowerCase()} area is ready in the navigation. Core workflows will connect here next.
              </p>
              <p style={{ marginTop: 16 }}>
                <Link href={config.dashboardPath} className={styles.btnPrimary} style={{ display: 'inline-flex' }}>Back to overview</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

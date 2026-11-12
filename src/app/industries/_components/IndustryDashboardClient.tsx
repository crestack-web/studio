'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import { getSuiteFamily } from '@/lib/industries/suite-catalog';
import styles from './IndustryShell.module.css';
import { IndustryMO } from './IndustryMO';
import { IndustryModuleView } from './IndustryModuleView';

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

function deskPathFor(config: IndustryConfig) {
  if (config.id === 'hospitality') return '/industries/hospitality/front-desk';
  if (config.id === 'healthcare') return '/industries/healthcare/front-desk';
  if (config.id === 'education') return '/industries/education/front-desk';
  if (config.id === 'professional') return '/industries/professional/front-desk';
  return config.dashboardPath;
}

function deskLabel(config: IndustryConfig) {
  if (config.id === 'hospitality') return 'Front desk';
  if (config.id === 'healthcare') return 'Reception';
  if (config.id === 'education') return 'Front office';
  if (config.id === 'professional') return 'Staff workspace';
  return 'Staff desk';
}

export function IndustryDashboardClient({
  config,
  section,
}: {
  config: IndustryConfig;
  section?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const family = getSuiteFamily(config.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState(config.productName);
  const [userEmail, setUserEmail] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [liveMetrics, setLiveMetrics] = useState<Record<string, string | number>>({});


  // Real session gate — required for live metrics and module data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const session = data.session;
        if (!session?.access_token) {
          if (!cancelled) {
            setGateError('Sign in required');
            setAuthChecked(true);
            router.replace(config.loginPath);
          }
          return;
        }
        setUserEmail(session.user.email || '');
        const name =
          (session.user.user_metadata as any)?.full_name ||
          (session.user.user_metadata as any)?.name ||
          session.user.email?.split('@')[0] ||
          config.productName;
        if (!cancelled) setDisplayName(String(name));

        const res = await fetch('/api/industries/session', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setGateError(json.error || 'Could not load your workspace');
            setAuthChecked(true);
          }
          return;
        }
        const s = json.session || {};
        if (!cancelled) {
          setSession({
            businessId: s.businessId || s.business_id || null,
            businessName: s.businessName || s.business_name || config.productName,
            productEdition: s.productEdition || s.product_edition || config.id,
            needsOnboarding: Boolean(s.needsOnboarding ?? s.needs_onboarding),
            onboarded: Boolean(s.onboarded ?? true),
          });
          if (s.businessName || s.business_name) {
            setDisplayName(s.businessName || s.business_name);
          }
          setAuthChecked(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          setGateError(e?.message || 'Session error');
          setAuthChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [config.id, config.productName, config.loginPath, router]);

  useEffect(() => {
    if (!authChecked) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = {};
        if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
        const desk =
          config.id === 'hospitality'
            ? '/api/industries/hospitality/front-desk'
            : config.id === 'healthcare'
              ? '/api/industries/healthcare/desk'
              : config.id === 'education'
                ? '/api/industries/education/desk'
                : '/api/industries/professional/desk';
        const res = await fetch(desk, { headers });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const m = json.metrics || {};
        if (config.id === 'hospitality') {
          setLiveMetrics({
            occupancy: m.occupancyRate != null ? `${m.occupancyRate}%` : '0%',
            available: m.availableRooms ?? 0,
            reservations_today: m.checkInsToday ?? 0,
            revenue_today:
              m.totalRevenue != null ? `₦${Number(m.totalRevenue).toLocaleString()}` : '₦0',
          });
        } else if (config.id === 'healthcare') {
          setLiveMetrics({
            patients_today: m.appointmentsToday ?? 0,
            appointments: m.waiting ?? 0,
            open_visits: m.completed ?? 0,
            revenue: m.patients ?? 0,
          });
        } else if (config.id === 'education') {
          setLiveMetrics({
            students: m.students ?? 0,
            classes: m.classes ?? m.classCount ?? 0,
            attendance_today: m.attendanceToday ?? m.attendance_rate ?? '—',
            fees_outstanding:
              m.feesOutstanding != null
                ? `₦${Number(m.feesOutstanding).toLocaleString()}`
                : m.pending != null
                  ? `₦${Number(m.pending).toLocaleString()}`
                  : '₦0',
          });
        } else {
          setLiveMetrics({
            active_projects: m.activeProjects ?? m.projects ?? m.openTasks ?? 0,
            active_clients: m.clients ?? m.activeClients ?? 0,
            outstanding:
              m.outstanding != null
                ? `₦${Number(m.outstanding).toLocaleString()}`
                : '₦0',
            monthly_revenue:
              m.monthlyRevenue != null
                ? `₦${Number(m.monthlyRevenue).toLocaleString()}`
                : '₦0',
          });
        }
      } catch {
        /* keep empty metric defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authChecked, config.id]);


  const activeId = useMemo(() => (!section || section === 'overview' ? 'overview' : section), [section]);
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  const filteredNav = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return config.nav.filter((n) => n.id !== 'front-desk' && n.id !== 'checkin');
    return config.nav.filter((n) => n.id !== 'front-desk' && n.id !== 'checkin' && n.label.toLowerCase().includes(q));
  }, [config.nav, search]);

  if (!authChecked) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootCard}>
          <div className={styles.bootPulse} />
          <p>Opening {config.productName}…</p>
        </div>
      </div>
    );
  }

  if (gateError) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootCard}>
          <p className={styles.bootError}>{gateError}</p>
          <Link href={config.loginPath} className={styles.btnPrimary}>
            Sign in again
          </Link>
        </div>
      </div>
    );
  }

  const isOverview = !section || section === 'overview';
  const deskHref = deskPathFor(config);
  const apps = family?.products || [];

  return (
    <div className={styles.shell}>
      {sidebarOpen ? (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden />
      ) : null}

      <aside className={[styles.sidebar, sidebarOpen ? styles.sidebarOpen : ''].join(' ')}>
        <div className={styles.sidebarTop}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {config.logoSrc ? (
            <img
              src={config.logoSrc}
              alt={config.productName}
              className={styles.sidebarProductLogo}
            />
          ) : (
            <>
              <img src="/email-logo.png" alt={config.productName} className={styles.productLogo} width={34} height={34} />
              <div className={styles.productMeta}>
                <div className={styles.logoText}>{config.shortName}</div>
                <div className={styles.productEdition}>Busmo suite</div>
              </div>
            </>
          )}
        </div>

        <div className={styles.sidebarSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules"
            aria-label="Search modules"
          />
        </div>

        <nav className={styles.navScroll} aria-label={`${config.shortName} navigation`}>
          <div className={styles.deskLaunch}>
            <span className={styles.deskLaunchIcon}>▦</span>
            <span>
              <strong>Owner console</strong>
              <small>{config.shortName} · setup & reports</small>
            </span>
          </div>

          {SECTION_ORDER.map((sec) => {
            const items = filteredNav.filter((n) => (n.section || 'main') === sec);
            if (!items.length) return null;
            return (
              <div key={sec} className={styles.navSection}>
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
                      <span className={styles.navDot} aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <div className={styles.userChip}>
            <span className={styles.userAvatar}>{(displayName || 'O').slice(0, 1).toUpperCase()}</span>
            <div className={styles.userText}>
              <strong>{displayName}</strong>
              <small>{userEmail || 'Owner'}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Open menu"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className={styles.topbarTitles}>
              {config.logoSrc ? (
                <img
                  src={config.logoSrc}
                  alt={config.productName}
                  className={styles.topbarLogo}
                />
              ) : (
                <div className={styles.topbarTitle}>{config.productName}</div>
              )}
              <div className={styles.topbarMeta}>
                Owner console · {dateLabel}
              </div>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <button
              type="button"
              className={styles.signOut}
              onClick={() => {
                window.location.href = config.loginPath;
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <div className={styles.pageArea}>
          {isOverview ? (
            <>
              <div className={styles.greetingRow}>
                <div>
                  <p className={styles.eyebrow}>Overview</p>
                  <h1 className={styles.greetingTitle}>
                    Welcome back{displayName ? `, ${displayName.split(' ')[0]}` : ''}.
                  </h1>
                  <p className={styles.greetingSub}>
                    Manage {config.shortName.toLowerCase()} operations from one place — the same suite
                    model as Zoho, purpose-built for African businesses.
                  </p>
                </div>
                <a href="#modules" className={styles.btnPrimary}>
                  View modules below →
                </a>
              </div>

              <div className={styles.metricsGrid}>
                {config.metrics.map((m) => {
                  const live = liveMetrics[m.id];
                  return (
                    <div key={m.id} className={styles.metricCard}>
                      <div className={styles.metricLabel}>{m.label}</div>
                      <div className={styles.metricValue}>{live != null && live !== '' ? live : m.emptyValue}</div>
                      {m.hint ? <div className={styles.metricHint}>{m.hint}</div> : null}
                    </div>
                  );
                })}
              </div>

              <div className={styles.split}>
                <section className={styles.panel}>
                  <div className={styles.panelHead}>
                    <h3 className={styles.panelTitle}>Apps in this suite</h3>
                    <span className={styles.panelMeta}>{apps.length || config.nav.length} modules</span>
                  </div>
                  <div className={styles.appGrid}>
                    {(apps.length ? apps : config.nav.slice(0, 8).map((n) => ({
                      id: n.id,
                      name: n.label,
                      blurb: `Open ${n.label}`,
                      href: n.href,
                    }))).map((app: any) => (
                      <Link key={app.id} href={app.href || deskHref} className={styles.appCard}>
                        <span className={styles.appIcon}>{String(app.name || 'A').slice(0, 1)}</span>
                        <span className={styles.appBody}>
                          <strong>{app.name}</strong>
                          <small>{app.blurb || 'Module'}</small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHead}>
                    <h3 className={styles.panelTitle}>Quick actions</h3>
                  </div>
                  <div className={styles.actionsStack}>
                    {config.quickActions.map((a) => (
                      <Link key={a.id} href={a.href} className={styles.actionRow}>
                        <span>{a.label}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    ))}
                  </div>
                  <div className={styles.panelHint}>
                    Staff use the separate <strong>staff portal</strong> ({deskLabel(config)}). This
                    console is for owners: setup, modules, reports, and control.
                  </div>
                </section>
              </div>

              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h3 className={styles.panelTitle}>Getting started</h3>
                </div>
                <ol className={styles.checklist}>
                  <li>
                    <Link href={`${config.dashboardPath}/settings`}>Set branding</Link> — logo and
                    display name for the staff desk
                  </li>
                  <li>
                    Open <Link href={deskHref}>{deskLabel(config)}</Link> and walk through a sample day
                  </li>
                  <li>Invite staff with the same organization account (roles expand next)</li>
                  <li>Review finance & reports modules as your data grows</li>
                </ol>
              </section>
            </>
          ) : (
            <IndustryModuleView config={config} section={activeId} />
          )}
        </div>
      </div>
      <IndustryMO config={config} businessName={displayName} />
    </div>
  );
}

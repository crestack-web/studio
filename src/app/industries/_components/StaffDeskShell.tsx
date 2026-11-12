'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './FrontDesk.module.css';
import { IndustryMO } from './IndustryMO';

const BUSMO_LOGO = '/email-logo.png';

export function StaffDeskShell({
  config,
  title,
  subtitle,
  brandName,
  logoUrl,
  ownerHref,
  nav,
  actions,
  metrics,
  children,
  warning,
  error,
}: {
  config: IndustryConfig;
  title: string;
  subtitle: string;
  brandName: string;
  logoUrl?: string | null;
  ownerHref: string;
  nav: { label: string; href: string; active?: boolean }[];
  actions?: React.ReactNode;
  metrics: { label: string; value: string | number; hint?: string }[];
  children: React.ReactNode;
  warning?: string | null;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Property logo if set; otherwise product mark; else Busmo mark
  const logo = logoUrl || config.logoSrc || BUSMO_LOGO;

  return (
    <div className={styles.page}>
      {open ? (
        <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden />
      ) : null}

      <aside className={[styles.sidebar, open ? styles.sidebarOpen : ''].join(' ')}>
        <div className={styles.busmoMark}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BUSMO_LOGO} alt="Busmo" />
          <span>BUSMO</span>
        </div>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className={styles.logo} />
          <div>
            <div className={styles.brandName}>{brandName}</div>
            <div className={styles.brandSub}> {config.shortName}</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {nav.map((n) =>
            n.active ? (
              <span key={n.href} className={styles.navActive}>
                {n.label}
              </span>
            ) : (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            )
          )}
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href={ownerHref} className={styles.linkQuiet} onClick={() => setOpen(false)}>
            Owner console →
          </Link>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af', lineHeight: 1.35 }}>
            Staff portal is separate from the owner dashboard — same as Busmo Business staff vs owner.
          </p>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitleRow}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              ☰
            </button>
            <div>
              <div className={styles.busmoMark} style={{ marginBottom: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={BUSMO_LOGO} alt="Busmo" />
                <span>BUSMO</span>
              </div>
              <h1>{title}</h1>
              <p className={styles.topHint}>{subtitle}</p>
            </div>
          </div>
          {actions ? <div className={styles.topbarActions}>{actions}</div> : null}
        </header>

        {error ? <div className={styles.error}>{error}</div> : null}
        {warning ? <div className={styles.warn}>{warning}</div> : null}

        <div className={styles.metrics}>
          {metrics.map((m) => (
            <div key={m.label} className={styles.metric}>
              <div className={styles.metricLabel}>{m.label}</div>
              <div className={styles.metricValue}>{m.value}</div>
              {m.hint ? <div className={styles.metricHint}>{m.hint}</div> : null}
            </div>
          ))}
        </div>
        {children}
      </div>
      <IndustryMO config={config} businessName={brandName} />
    </div>
  );
}

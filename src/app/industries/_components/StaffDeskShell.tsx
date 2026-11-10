'use client';

import React from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './FrontDesk.module.css';

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
  const logo = logoUrl || '/email-logo.png';
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className={styles.logo} />
          <div>
            <div className={styles.brandName}>{brandName}</div>
            <div className={styles.brandSub}>{config.shortName} staff</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {nav.map((n) =>
            n.active ? (
              <span key={n.href} className={styles.navActive}>
                {n.label}
              </span>
            ) : (
              <Link key={n.href} href={n.href}>
                {n.label}
              </Link>
            )
          )}
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href={ownerHref} className={styles.linkQuiet}>
            Owner overview →
          </Link>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1>{title}</h1>
            <p className={styles.topHint}>{subtitle}</p>
          </div>
          {actions}
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
    </div>
  );
}

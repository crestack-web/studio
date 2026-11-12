'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from '../FrontDesk.module.css';
import { HospitalityStaffBottomNav } from '../IndustryBottomNav';
import { IndustryMO } from '../IndustryMO';
import { getSupabase } from '@/lib/supabase';

const NAV = [
  { label: 'Dashboard', href: '/industries/hospitality/front-desk', exact: true },
  { label: 'Bookings', href: '/industries/hospitality/front-desk/bookings' },
  { label: 'Rooms', href: '/industries/hospitality/front-desk/rooms' },
  { label: 'Guests', href: '/industries/hospitality/front-desk/guests' },
  { label: 'Check-in', href: '/industries/hospitality/front-desk/checkin' },
];

export function FrontDeskShell({
  config,
  children,
}: {
  config: IndustryConfig;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState(config.productName);
  const [logoUrl, setLogoUrl] = useState(config.logoSrc || '/email-logo.png');

  const close = useCallback(() => setOpen(false), []);

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Light branding fetch (non-blocking)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch('/api/industries/hospitality/front-desk', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        if (json.settings?.property_name) setBrandName(json.settings.property_name);
        if (json.settings?.logo_url) setLogoUrl(json.settings.logo_url);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function isActive(item: (typeof NAV)[0]) {
    if (item.exact) {
      return (
        pathname === item.href ||
        pathname === item.href + '/'
      );
    }
    return pathname.startsWith(item.href);
  }

  return (
    <div className={styles.page}>
      {open ? (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close menu"
          onClick={close}
        />
      ) : null}

      <aside className={[styles.sidebar, open ? styles.sidebarOpen : ''].join(' ')}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl || config.logoSrc || '/email-logo.png'} alt="" className={styles.logo} />
          <div>
            <div className={styles.brandName}>{brandName}</div>
            <div className={styles.brandSub}>Front desk</div>
          </div>
        </div>
        <nav className={styles.nav} onClick={close}>
          {NAV.map((n) =>
            isActive(n) ? (
              <span key={n.href} className={styles.navActive}>
                {n.label}
              </span>
            ) : (
              <Link key={n.href} href={n.href} prefetch>
                {n.label}
              </Link>
            )
          )}
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href="/industries/hospitality/login" className={styles.signOut} onClick={close}>
            Sign out
          </Link>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.staffTopbar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            ☰
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl || config.logoSrc || '/email-logo.png'}
            alt={brandName}
            className={styles.topLogo}
          />
          <div className={styles.staffTopbarTitles}>
            <div className={styles.staffTopbarName}>{brandName}</div>
            <div className={styles.staffTopbarSub}>Front desk</div>
          </div>
        </div>
        <div className={styles.staffSectionBody}>{children}</div>
      </div>

      <HospitalityStaffBottomNav />
      <IndustryMO config={config} businessName={brandName} />
    </div>
  );
}

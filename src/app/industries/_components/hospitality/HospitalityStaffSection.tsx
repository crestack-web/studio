'use client';

import React from 'react';
import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from '../FrontDesk.module.css';
import {
  HospitalityReservationsPage,
  HospitalityRoomsPage,
  HospitalityGuestsPage,
  HospitalityCheckinPage,
} from './HospitalityModules';
import { IndustryMO } from '../IndustryMO';

const NAV = [
  { label: 'Dashboard', href: '/industries/hospitality/front-desk' },
  { label: 'Bookings', href: '/industries/hospitality/front-desk/bookings' },
  { label: 'Rooms', href: '/industries/hospitality/front-desk/rooms' },
  { label: 'Guests', href: '/industries/hospitality/front-desk/guests' },
  { label: 'Check-in', href: '/industries/hospitality/front-desk/checkin' },
];

export function HospitalityStaffSection({
  config,
  section,
}: {
  config: IndustryConfig;
  section: 'bookings' | 'rooms' | 'guests' | 'checkin';
}) {
  const [open, setOpen] = React.useState(false);

  let body: React.ReactNode = null;
  if (section === 'bookings') body = <HospitalityReservationsPage config={config} />;
  else if (section === 'rooms') body = <HospitalityRoomsPage config={config} />;
  else if (section === 'guests') body = <HospitalityGuestsPage config={config} />;
  else body = <HospitalityCheckinPage config={config} />;

  return (
    <div className={styles.page}>
      {open ? <div className={styles.backdrop} onClick={() => setOpen(false)} aria-hidden /> : null}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.logoSrc || '/email-logo.png'}
            alt={config.productName}
            className={styles.logo}
          />
          <div>
            <div className={styles.brandName}>{config.productName}</div>
            <div className={styles.brandSub}>Front desk</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV.map((n) => {
            const active =
              n.href.endsWith(section) ||
              (section === 'bookings' && n.label === 'Bookings');
            const isActive =
              (section === 'bookings' && n.href.includes('/bookings')) ||
              (section === 'rooms' && n.href.includes('/rooms')) ||
              (section === 'guests' && n.href.includes('/guests')) ||
              (section === 'checkin' && n.href.includes('/checkin'));
            return isActive ? (
              <span key={n.href} className={styles.navActive}>
                {n.label}
              </span>
            ) : (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href="/industries/hospitality/login" className={styles.signOut}>
            Sign out
          </Link>
        </div>
      </aside>
      <div className={styles.main}>
        <div className={styles.topbarMobile}>
          <button type="button" className={styles.menuBtn} onClick={() => setOpen(true)} aria-label="Menu">
            ☰
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.logoSrc || '/email-logo.png'}
            alt=""
            className={styles.topLogo}
          />
        </div>
        <div className={styles.staffSectionBody}>{body}</div>
      </div>
      <IndustryMO config={config} businessName={config.productName} />
    </div>
  );
}

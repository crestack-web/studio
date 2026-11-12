'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryBottomNav.module.css';

type Item = { href: string; label: string; match?: string };

function Icon({ name, active }: { name: string; active?: boolean }) {
  const stroke = active ? '#5b21b6' : '#6b7280';
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'rooms':
    case 'bed':
      return (
        <svg {...common}>
          <path d="M3 7v11" />
          <path d="M21 18H3" />
          <path d="M21 14V9a2 2 0 0 0-2-2H5" />
          <path d="M3 14h18" />
          <path d="M7 7V5a1 1 0 0 1 1-1h3v3" />
          <path d="M21 18v2" />
          <path d="M3 18v2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M9 11l3 3 7-7" />
          <path d="M5 20h14a2 2 0 0 0 2-2V8" />
        </svg>
      );
    case 'guests':
    case 'people':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M21 19c0-2.2-1.5-3.8-3.5-4.4" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...common}>
          <path d="M9 11l3 3 7-7" />
          <path d="M4 6h4M4 12h4M4 18h16" />
        </svg>
      );
    case 'more':
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.5" fill={stroke} />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
          <circle cx="18" cy="12" r="1.5" fill={stroke} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function isActive(pathname: string, item: Item) {
  if (item.match) return pathname === item.match || pathname.startsWith(item.match + '/');
  if (pathname === item.href) return true;
  if (item.href.endsWith('/dashboard') && pathname === item.href) return true;
  return pathname.startsWith(item.href) && !item.href.endsWith('/dashboard');
}

function bottomItems(config: IndustryConfig): (Item & { icon: string })[] {
  const base = config.dashboardPath;
  if (config.id === 'hospitality') {
    return [
      { href: base, label: 'Home', icon: 'home', match: base },
      { href: `${base}/reservations`, label: 'Bookings', icon: 'book' },
      { href: `${base}/rooms`, label: 'Rooms', icon: 'bed' },
      { href: `${base}/checkin`, label: 'Check-in', icon: 'check' },
      { href: `${base}/guests`, label: 'Guests', icon: 'guests' },
    ];
  }
  if (config.id === 'professional') {
    return [
      { href: base, label: 'Home', icon: 'home', match: base },
      { href: `${base}/projects`, label: 'Projects', icon: 'briefcase' },
      { href: `${base}/clients`, label: 'Clients', icon: 'people' },
      { href: `${base}/tasks`, label: 'Tasks', icon: 'tasks' },
      { href: `${base}/settings`, label: 'Settings', icon: 'more' },
    ];
  }
  if (config.id === 'healthcare') {
    return [
      { href: base, label: 'Home', icon: 'home', match: base },
      { href: `${base}/patients`, label: 'Patients', icon: 'people' },
      { href: `${base}/appointments`, label: 'Appts', icon: 'calendar' },
      { href: `${base}/visits`, label: 'Visits', icon: 'check' },
      { href: `${base}/settings`, label: 'Settings', icon: 'more' },
    ];
  }
  if (config.id === 'education') {
    return [
      { href: base, label: 'Home', icon: 'home', match: base },
      { href: `${base}/students`, label: 'Students', icon: 'people' },
      { href: `${base}/classes`, label: 'Classes', icon: 'book' },
      { href: `${base}/attendance`, label: 'Attend', icon: 'check' },
      { href: `${base}/settings`, label: 'Settings', icon: 'more' },
    ];
  }
  return [
    { href: base, label: 'Home', icon: 'home', match: base },
    { href: `${base}/staff`, label: 'Staff', icon: 'people' },
    { href: `${base}/reports`, label: 'Reports', icon: 'book' },
    { href: `${base}/settings`, label: 'Settings', icon: 'more' },
  ];
}

export function IndustryOwnerBottomNav({ config }: { config: IndustryConfig }) {
  const pathname = usePathname() || '';
  const base = config.dashboardPath;
  const items = bottomItems(config);

  return (
    <nav className={styles.nav} aria-label="Primary">
      {items.map((item) => {
        let active = false;
        if (item.match === base) {
          active = pathname === base || pathname === base + '/';
        } else {
          active = isActive(pathname, item);
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? styles.itemActive : styles.item}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} active={active} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function HospitalityStaffBottomNav() {
  const pathname = usePathname() || '';
  const items: (Item & { icon: string })[] = [
    {
      href: '/industries/hospitality/front-desk',
      label: 'Home',
      icon: 'home',
      match: '/industries/hospitality/front-desk',
    },
    { href: '/industries/hospitality/front-desk/bookings', label: 'Bookings', icon: 'book' },
    { href: '/industries/hospitality/front-desk/rooms', label: 'Rooms', icon: 'bed' },
    { href: '/industries/hospitality/front-desk/guests', label: 'Guests', icon: 'guests' },
    { href: '/industries/hospitality/front-desk/checkin', label: 'Check-in', icon: 'check' },
  ];

  return (
    <nav className={styles.nav} aria-label="Front desk">
      {items.map((item) => {
        let active = false;
        if (item.href === '/industries/hospitality/front-desk') {
          active =
            pathname === '/industries/hospitality/front-desk' ||
            pathname === '/industries/hospitality/front-desk/';
        } else {
          active = pathname.startsWith(item.href);
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? styles.itemActive : styles.item}
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} active={active} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

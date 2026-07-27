'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSell } from '../context/SellContext';
import type { SellPageId } from '../context/SellContext';
import styles from './SellSidebar.module.css';

// ─── Nav Config ───────────────────────────────────────────────────────────────

interface NavItem {
  id: SellPageId;
  label: string;
  icon: React.ReactNode;
}

const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
  {
    section: 'Store',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        ),
      },
      {
        id: 'products',
        label: 'Products',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
        ),
      },
      {
        id: 'collections',
        label: 'Collections',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        ),
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        ),
      },
      {
        id: 'shipping',
        label: 'Shipping',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        ),
      },
      {
        id: 'theme-editor' as SellPageId,
        label: 'Customize',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L3 14.67V21h6.33l10.06-10.06a5.5 5.5 0 000-6.33z"/>
            <line x1="16" y1="5" x2="19" y2="8"/>
          </svg>
        ),
      },
      {
        id: 'ask-mo' as SellPageId,
        label: 'Ask Mo',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            <circle cx="9" cy="10" r="1" fill="currentColor"/>
            <circle cx="12" cy="10" r="1" fill="currentColor"/>
            <circle cx="15" cy="10" r="1" fill="currentColor"/>
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Insights',
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
      {
        id: 'earnings' as SellPageId,
        label: 'Earnings',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        ),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
];

const ICON_CLASS: Record<SellPageId, string> = {
  overview:       styles.iconOverview,
  products:       styles.iconProducts,
  collections:    styles.iconCollect,
  orders:         styles.iconOrders,
  shipping:       styles.iconShipping,
  analytics:      styles.iconAnalytics,
  earnings:       styles.iconEarnings,
  settings:       styles.iconSettings,
  'theme-editor': styles.iconTheme,
  'setup-wizard': styles.iconOverview,
  'ask-mo':       styles.iconOverview,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SellSidebar() {
  const router = useRouter();
  const {
    sidebarOpen, closeSidebar,
    activePage, navigateTo, user, storeConfig, quickStats,
  } = useSell();

  const statusDotClass =
    storeConfig?.status === 'active' ? styles.dotActive :
    storeConfig?.status === 'draft'  ? styles.dotDraft  :
    storeConfig?.status === 'paused' ? styles.dotPaused : styles.dotNone;

  const statusLabel =
    storeConfig?.status === 'active' ? 'Live' :
    storeConfig?.status === 'draft'  ? 'Draft' :
    storeConfig?.status === 'paused' ? 'Paused' : 'Not set up';

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      <aside
        className={[styles.sidebar, sidebarOpen ? styles.open : ''].join(' ')}
        aria-label="MO Sell navigation"
      >
        {/* ── Logo row ── */}
        <div className={styles.top}>
          <div className={styles.logoWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
              alt="Mo-sell"
              className={styles.logoImg}
            />
            <span className={styles.appName}>MO-SELL</span>
          </div>
        </div>

        {/* ── Store status pill ── */}
        <div className={styles.storePill}>
          <div className={[styles.storeDot, statusDotClass].join(' ')} />
          <div className={styles.storeInfo}>
            <div className={styles.storeName}>
              {storeConfig?.storeName || 'My Store'}
            </div>
            <div className={styles.storeStatus}>{statusLabel}</div>
          </div>
        </div>

        {/* ── Nav sections ── */}
        <div className={styles.scroll}>
          {NAV_SECTIONS.map(section => (
            <div key={section.section}>
              <div className={styles.sectionWrap}>
                <span className={styles.sectionLabel}>{section.section}</span>
              </div>
              <ul className={styles.navList} role="list">
                {section.items.map(item => {
                  const isActive = activePage === item.id;
                  // Inject pending-orders badge
                  const badge: number | undefined =
                    item.id === 'orders' && quickStats.pendingOrders > 0
                      ? quickStats.pendingOrders
                      : undefined;

                  return (
                    <li key={item.id} className={styles.navItem}>
                      <button
                        className={[styles.navLink, isActive ? styles.active : ''].join(' ')}
                        data-tip={item.label}
                        onClick={() => navigateTo(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className={[styles.navIcon, ICON_CLASS[item.id] || ''].join(' ')}>
                          {item.icon}
                        </span>
                        <span className={styles.navLabel}>{item.label}</span>
                        {badge != null && (
                          <span className={styles.badge + ' ' + styles.badgeCount}>{badge}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        {/* ── Back to Busmo ── */}
        <button className={styles.backBtn} onClick={() => router.push('/owner/dashboard')}>
          <div className={styles.backIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
          <span className={styles.backLabel}>Back to Busmo</span>
        </button>

        {/* ── User footer ── */}
        {user && (
          <div className={styles.userArea}>
            <div className={styles.userInner}>
              <div
                className={styles.avatar}
                style={{
                  background: user.photoURL
                    ? `url(${user.photoURL}) center/cover`
                    : user.avatarStyle.background,
                  color: user.photoURL ? 'transparent' : user.avatarStyle.color,
                }}
              >
                {!user.photoURL && user.avatarContent}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.shortName}</div>
                <div className={styles.userRole}>{user.plan}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

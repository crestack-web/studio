'use client';

import React from 'react';
import { useSell } from '../context/SellContext';
import styles from './SellTopbar.module.css';

const PAGE_LABELS: Record<string, string> = {
  overview:    'Overview',
  products:    'Products',
  collections: 'Collections',
  orders:      'Orders',
  shipping:    'Shipping & Delivery',
  analytics:   'Analytics',
  settings:    'Store Settings',
  'setup-wizard': 'Store Setup',
  'ask-mo':    'Ask Mo',
};

export function SellTopbar() {
  const {
    activePage, openSidebar, toggleTheme, theme,
    user, storeConfig, quickStats, navigateTo,
  } = useSell();

  const pageTitle   = PAGE_LABELS[activePage] ?? 'MO Sell';
  const storeSlug   = storeConfig?.storeSlug;
  const storeStatus = storeConfig?.status ?? null;

  const badgeClass =
    storeStatus === 'active' ? styles.badgeActive :
    storeStatus === 'draft'  ? styles.badgeDraft  :
    storeStatus === 'paused' ? styles.badgePaused : styles.badgeNone;

  const dotClass =
    storeStatus === 'active' ? styles.dotActive :
    storeStatus === 'draft'  ? styles.dotDraft  :
    storeStatus === 'paused' ? styles.dotPaused : styles.dotNone;

  const statusLabel =
    storeStatus === 'active' ? 'Live' :
    storeStatus === 'draft'  ? 'Draft' :
    storeStatus === 'paused' ? 'Paused' : 'Not configured';

  return (
    <header className={styles.topbar}>
      {/* Hamburger */}
      <button className={styles.hamburger} onClick={openSidebar} aria-label="Open navigation">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Title */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{pageTitle}</h1>
        {storeConfig?.storeName && (
          <p className={styles.subtitle}>{storeConfig.storeName}</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>

        {/* Store status badge */}
        {storeConfig && (
          <button
            className={[styles.statusBadge, badgeClass].join(' ')}
            onClick={() => navigateTo('settings')}
            title="Store status — click to manage"
          >
            <span className={[styles.statusDot, dotClass].join(' ')} />
            {statusLabel}
          </button>
        )}

        {/* View live store */}
        {storeStatus === 'active' && storeSlug && (
          <a
            href={`/store/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewStoreBtn}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            <span>View Store</span>
          </a>
        )}

        {/* Pending orders indicator */}
        {quickStats.pendingOrders > 0 && (
          <button
            className={styles.iconBtn}
            onClick={() => navigateTo('orders')}
            title={`${quickStats.pendingOrders} orders need attention`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className={styles.notifDot} />
          </button>
        )}

        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <div className={styles.divider} />

        {/* User chip */}
        {user && (
          <button className={styles.userChip}>
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
            <span className={styles.userName}>{user.shortName}</span>
          </button>
        )}
      </div>
    </header>
  );
}

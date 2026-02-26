'use client';

import React, { useMemo } from 'react';
import { useApp } from './AppContext';
import { NAV_SECTIONS } from './navItems';
import styles from './Topbar.module.css';

export function Topbar() {
  const { activePage, openSidebar, toggleTheme, theme, user, openAvatarModal } = useApp();

  const currentNav = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      const found = section.items.find(i => i.id === activePage);
      if (found) return found;
    }
    return { label: 'Dashboard', tip: '' };
  }, [activePage]);

  const greeting = activePage === 'home' ? `Welcome back, ${user.shortName} 👋` : currentNav.label;

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  []);

  return (
    <header className={styles.topbar}>
      <button className={styles.hamburger} onClick={openSidebar} aria-label="Open navigation">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{greeting}</h1>
        <p className={styles.subtitle}>{activePage === 'home' ? today : ''}</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            </svg>
          )}
        </button>

        <button className={styles.iconBtn} title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span className={styles.notifDot} />
        </button>

        <div className={styles.divider} />

        <button className={styles.userBtn} onClick={openAvatarModal}>
          <div className={styles.avatar} style={user.avatarStyle}>
            <span>{user.avatarContent}</span>
          </div>
          <div className={styles.userText}>
            <div className={styles.userName}>{user.shortName}</div>
            <div className={styles.userRole}>{user.role}</div>
          </div>
        </button>
      </div>
    </header>
  );
}

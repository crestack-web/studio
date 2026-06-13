'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NAV_SECTIONS } from './navItems';
import { MoIcon } from './NavIcons';
import { BranchSwitcher } from '@/components/BranchSwitcher';
import { useTrialInfo } from './TrialGuard';
import styles from './Topbar.module.css';

export function Topbar() {
  const { activePage, openSidebar, toggleTheme, theme, user, openAvatarModal, toggleNotifications, toggleAIPanel } = useApp();
  const { t } = useTranslation();
  const trialInfo = useTrialInfo();
  const [timeLeft, setTimeLeft] = useState(trialInfo);

  // Update trial countdown every minute
  useEffect(() => {
    if (!trialInfo) return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeDiff = trialInfo.trialEndDate.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        window.location.reload();
        return;
      }

      setTimeLeft({
        daysRemaining: Math.floor(timeDiff / (1000 * 60 * 60 * 24)),
        hoursRemaining: Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutesRemaining: Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)),
        isExpired: false,
        trialEndDate: trialInfo.trialEndDate,
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [trialInfo]);

  const currentNav = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      const found = section.items.find(i => i.id === activePage);
      if (found) return found;
    }
    return { label: t('nav.home'), tip: '' };
  }, [activePage, t]);

  const greeting = activePage === 'home' ? `${t('topbar.greeting')}, ${user.shortName} 👋` : currentNav.label;

  const today = useMemo(() =>
    new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  []);

  const getUrgencyColor = () => {
    if (!timeLeft) return 'var(--purple)';
    if (timeLeft.daysRemaining === 0 && timeLeft.hoursRemaining < 24) {
      return 'var(--red)';
    } else if (timeLeft.daysRemaining <= 1) {
      return 'var(--amber)';
    }
    return 'var(--purple)';
  };

  const getUrgencyText = () => {
    if (!timeLeft) return '';
    if (timeLeft.daysRemaining === 0) {
      return `<24h`;
    } else if (timeLeft.daysRemaining === 1) {
      return `1d`;
    } else {
      return `${timeLeft.daysRemaining}d`;
    }
  };

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
        {timeLeft && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            background: `${getUrgencyColor()}15`,
            border: `1px solid ${getUrgencyColor()}30`,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: getUrgencyColor(),
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>{getUrgencyText()}</span>
            <span style={{
              background: getUrgencyColor(),
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
            }}>
              {String(timeLeft.daysRemaining).padStart(2, '0')}:{String(timeLeft.hoursRemaining).padStart(2, '0')}
            </span>
          </div>
        )}

        <BranchSwitcher />

        <button className={styles.iconBtn} onClick={toggleAIPanel} title="Ask MO AI Assistant">
          <MoIcon size={40} />
        </button>

        <button className={styles.iconBtn} onClick={toggleTheme} title={t('topbar.toggleTheme')}>
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <button className={styles.iconBtn} onClick={toggleNotifications} title={t('topbar.notifications')}>
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

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { BranchSwitcher } from '@/components/BranchSwitcher';
import { useTrialInfo } from './TrialGuard';
import styles from './Topbar.module.css';

export function Topbar() {
  const {
    openSidebar,
    toggleTheme,
    theme,
    user,
    openAvatarModal,
    toggleNotifications,
    toggleAIPanel,
    unreadNotificationCount,
    notificationsPanelOpen,
    activePage,
  } = useApp();
  const { t } = useTranslation();
  const trialInfo = useTrialInfo();
  const [timeLeft, setTimeLeft] = useState(trialInfo);

  useEffect(() => {
    if (!trialInfo) return;

    const tick = () => {
      const now = new Date();
      const timeDiff = trialInfo.trialEndDate.getTime() - now.getTime();

      if (timeDiff <= 0) {
        window.location.reload();
        return;
      }

      setTimeLeft({
        daysRemaining: Math.floor(timeDiff / (1000 * 60 * 60 * 24)),
        hoursRemaining: Math.floor(
          (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutesRemaining: Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)),
        isExpired: false,
        trialEndDate: trialInfo.trialEndDate,
      });
    };

    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [trialInfo]);

  const urgency =
    !timeLeft
      ? 'normal'
      : timeLeft.daysRemaining === 0 && timeLeft.hoursRemaining < 24
        ? 'critical'
        : timeLeft.daysRemaining <= 1
          ? 'warn'
          : 'normal';

  const shortLabel = !timeLeft
    ? ''
    : timeLeft.daysRemaining === 0
      ? `${timeLeft.hoursRemaining}h`
      : timeLeft.daysRemaining === 1
        ? '1d'
        : `${timeLeft.daysRemaining}d`;

  const fullLabel = !timeLeft
    ? ''
    : timeLeft.daysRemaining === 0
      ? `${timeLeft.hoursRemaining}h ${timeLeft.minutesRemaining}m left`
      : `${timeLeft.daysRemaining}d ${timeLeft.hoursRemaining}h left`;

  return (
    <header className={`${styles.topbar} ${timeLeft ? styles.topbarWithTrial : ''}`}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={openSidebar}
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={styles.brand} aria-label="Busmo">
        <img
          src="/email-logo.png"
          alt="Busmo Logo"
          className={styles.brandLogo}
        />
        <span className={styles.brandName}>Busmo</span>
      </div>

      {activePage === 'home' && (
        <div className={styles.titleBlock}>
          <div className={styles.title}>
            {t('topbar.greeting')}, {user.shortName || 'there'} 👋
          </div>
          <div className={styles.subtitle}>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      )}

      <div className={styles.spacer} aria-hidden />

      <div className={styles.actions}>
        {timeLeft && (
          <div
            className={`${styles.trialChip} ${styles[`trial_${urgency}`]}`}
            title={`Trial ends in ${fullLabel}`}
            aria-label={`Trial ends in ${fullLabel}`}
          >
            <svg
              className={styles.trialIcon}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className={styles.trialShort}>{shortLabel}</span>
            <span className={styles.trialFull}>Trial · {fullLabel}</span>
          </div>
        )}

        {user.plan === 'pro' && (
          <div className={styles.branchWrap}>
            <BranchSwitcher />
          </div>
        )}

        <button
          type="button"
          className={`${styles.iconBtn} ${styles.aiBtn}`}
          onClick={toggleAIPanel}
          title="Ask MO AI Assistant"
        >
          <MoIcon size={18} />
          <span>Ask MO</span>
        </button>

        <button
          type="button"
          className={`${styles.iconBtn} ${styles.themeBtn}`}
          onClick={toggleTheme}
          title={t('topbar.toggleTheme')}
        >
          {theme === 'light' ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className={`${styles.iconBtn} ${notificationsPanelOpen ? styles.iconBtnActive : ''}`}
          onClick={toggleNotifications}
          title={t('topbar.notifications')}
          aria-label={
            unreadNotificationCount > 0
              ? `Notifications, ${unreadNotificationCount} unread`
              : 'Notifications'
          }
          aria-expanded={notificationsPanelOpen}
          data-notif-bell
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {unreadNotificationCount > 0 && (
            <span className={styles.notifBadge} aria-hidden>
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </button>

        <div className={styles.divider} />

        <button type="button" className={styles.userBtn} onClick={openAvatarModal}>
          <div
            className={styles.avatar}
            style={{
              background: user.photoURL
                ? `url(${user.photoURL}) center/cover`
                : user.avatarStyle?.background,
              color: user.photoURL ? 'transparent' : user.avatarStyle?.color,
            }}
          >
            {!user.photoURL && <span>{user.avatarContent}</span>}
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

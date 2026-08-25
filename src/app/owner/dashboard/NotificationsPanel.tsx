'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import styles from './NotificationsPanel.module.css';
import type { AppNotification } from './notificationTypes';

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

const typeIcon: Record<AppNotification['type'], string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  alert: '🔴',
};

export function NotificationsPanel() {
  const {
    notificationsPanelOpen,
    closeNotificationsPanel,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    clearNotifications,
    navigateTo,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationsPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNotificationsPanel();
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        // ignore clicks on the bell button (data attribute)
        const el = e.target as HTMLElement | null;
        if (el?.closest?.('[data-notif-bell]')) return;
        closeNotificationsPanel();
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [notificationsPanelOpen, closeNotificationsPanel]);

  if (!notificationsPanelOpen) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-label="Notifications"
        aria-modal="false"
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Notifications</h2>
            <p className={styles.subtitle}>
              {unread > 0 ? `${unread} unread` : 'You\'re all caught up'}
            </p>
          </div>
          <div className={styles.headerActions}>
            {unread > 0 && (
              <button type="button" className={styles.textBtn} onClick={markAllNotificationsRead}>
                Mark all read
              </button>
            )}
            <button
              type="button"
              className={styles.iconClose}
              onClick={closeNotificationsPanel}
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon} aria-hidden>
                🔔
              </div>
              <p className={styles.emptyTitle}>No notifications yet</p>
              <p className={styles.emptyHint}>
                Sales, stock alerts, and tips will show up here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <article
                key={n.id}
                className={`${styles.item} ${n.read ? styles.itemRead : styles.itemUnread}`}
              >
                <button
                  type="button"
                  className={styles.itemMain}
                  onClick={() => {
                    markNotificationRead(n.id);
                    if (n.href) {
                      navigateTo(n.href);
                      closeNotificationsPanel();
                    }
                  }}
                >
                  <span className={`${styles.badge} ${styles[`badge_${n.type}`]}`} aria-hidden>
                    {typeIcon[n.type]}
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemText}>{n.body}</span>
                    <span className={styles.itemMeta}>
                      <time dateTime={new Date(n.createdAt).toISOString()}>{timeAgo(n.createdAt)}</time>
                      {n.href && <span className={styles.itemLink}>Open →</span>}
                    </span>
                  </span>
                  {!n.read && <span className={styles.unreadDot} aria-label="Unread" />}
                </button>
                <button
                  type="button"
                  className={styles.dismissItem}
                  onClick={() => dismissNotification(n.id)}
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </article>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className={styles.footer}>
            <button type="button" className={styles.textBtn} onClick={clearNotifications}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useApp } from './AppContext';

/** Optional promo strip — disabled by default; inbox lives in NotificationsPanel */
export const NotificationBar: React.FC = () => {
  const { notificationsVisible, dismissNotifications, navigateTo } = useApp();

  if (!notificationsVisible) return null;

  return (
    <div className="owner-notification-bar" role="status">
      <div className="owner-notification-content">
        <span className="owner-notification-icon" aria-hidden>📢</span>
        <span className="owner-notification-text">
          <strong>Tip:</strong> Record daily expenses for accurate profit insights.
          <button
            type="button"
            className="owner-notification-action"
            onClick={() => {
              navigateTo('add-expense');
              dismissNotifications();
            }}
          >
            Add Expense →
          </button>
        </span>
      </div>
      <button type="button" className="owner-notification-dismiss" onClick={dismissNotifications} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
};

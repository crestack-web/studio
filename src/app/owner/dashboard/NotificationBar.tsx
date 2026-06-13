'use client';

import React from 'react';
import { useApp } from './AppContext';

export const NotificationBar: React.FC = () => {
  const { notificationsVisible, dismissNotifications } = useApp();

  if (!notificationsVisible) return null;

  return (
    <div className="owner-notification-bar">
      <div className="owner-notification-content">
        <span className="owner-notification-icon">📢</span>
        <span className="owner-notification-text">
          <strong>Tip of the day:</strong> Record your daily expenses to get accurate profit insights. 
          <button className="owner-notification-action" onClick={() => {}}>
            Add Expense →
          </button>
        </span>
      </div>
      <button className="owner-notification-dismiss" onClick={dismissNotifications}>
        ✕
      </button>
    </div>
  );
};

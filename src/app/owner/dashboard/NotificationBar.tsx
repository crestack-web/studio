'use client';

import React, { useState } from 'react';

export const NotificationBar: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

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
      <button className="owner-notification-dismiss" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
};

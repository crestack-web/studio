'use client';

import React, { useState } from 'react';

export const AnnouncementBar: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-icon">🎉</span>
        <span className="announcement-text">
          <strong>New:</strong> MO AI now records sales by text! Just type what you sold and MO handles the rest.{' '}
          <a href="/welcome" className="announcement-link">Try it now →</a>
        </span>
      </div>
      <button className="announcement-dismiss" onClick={() => setDismissed(true)}>
        ✕
      </button>
    </div>
  );
};

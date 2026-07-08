import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-icon">✨</span>
        <span className="announcement-text">
          <strong>New:</strong> Record expenses, sales & products by text. Try it now!
        </span>
      </div>
      <a href="/welcome/signup" className="announcement-cta">
        Get Started
      </a>
    </div>
  );
};

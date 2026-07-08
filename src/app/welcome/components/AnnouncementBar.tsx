import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-icon">✨</span>
        <span className="announcement-text">
          <strong>Limited Time Offer:</strong> Get 50% off your first 3 months! Use code{' '}
          <code className="promo-code">BUSMO2024</code> at checkout.
        </span>
      </div>
      <a href="/welcome/signup" className="announcement-cta">
        Claim Offer
      </a>
    </div>
  );
};
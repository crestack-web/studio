import React from 'react';
import { BUSMO_ONE_CONFIG, formatNgn } from '@/lib/busmo-one/config';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-icon">📟</span>
        <span className="announcement-text">
          <strong>Pre-order Busmo One</strong>
          {' — '}
          {formatNgn(BUSMO_ONE_CONFIG.launchPriceNgn)} + {BUSMO_ONE_CONFIG.promotionLabel}
        </span>
      </div>
      <a href="/welcome#busmo-one" className="announcement-cta">
        Pre-Order
      </a>
    </div>
  );
};

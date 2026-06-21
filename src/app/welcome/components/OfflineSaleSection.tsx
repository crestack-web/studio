"use client";

import React from 'react';

export const OfflineSaleSection: React.FC = () => (
  <section className="offline-sale-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Works Offline</div>
        <h2 className="section-title">
          Record Sales.<em style={{ color: 'var(--purple-mid)' }}>Anytime, Anywhere.</em>
        </h2>
        <p className="section-sub">
          No internet? No problem. Busmo works offline and syncs when you reconnect.
        </p>
      </div>

      <div className="offline-sale-image-container">
        <img
          src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1782083471/4_000_sale_recorded_-_2_agm4fh.png"
          alt="Recording sale offline on mobile"
          className="offline-sale-image"
        />
      </div>
    </div>
  </section>
);

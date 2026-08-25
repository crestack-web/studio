"use client";

import React from 'react';

export const OfflineSaleSection: React.FC = () => (
  <section className="offline-sale-section">
    <div className="offline-sale-content">
      <div className="section-head center">
        <div className="section-label">Works Offline</div>
        <h2 className="section-title">
          Your business doesn&apos;t stop when the internet does.
        </h2>
        <p className="section-sub">
          Record sales and keep working without connectivity. Busmo syncs when you&apos;re back online — so a network drop doesn&apos;t stop your day.
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

"use client";

import React from 'react';

export const DashboardMockup: React.FC = () => (
  <section className="dashboard-mockup-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">See Busmo in Action</div>
        <h2 className="section-title">
          Your Business.<em style={{ color: 'var(--purple-mid)' }}>At a Glance.</em>
        </h2>
        <p className="section-sub">
          A clean, intuitive dashboard designed for African business owners.
        </p>
      </div>

      <img
        src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1782083392/4_000_sale_recorded_-_1_opqytc.png"
        alt="Busmo Dashboard Mockup"
        className="dashboard-mockup-image"
      />
    </div>
  </section>
);

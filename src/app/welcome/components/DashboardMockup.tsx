"use client";

import React from 'react';

export const DashboardMockup: React.FC = () => (
  <section className="dashboard-mockup-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">See Busmo in Action</div>
        <h2 className="section-title">
          Watch how Busmo transforms your business
        </h2>
        <p className="section-sub">
          See how easy it is to record sales, track inventory, and get AI-powered insights.
        </p>
      </div>

      <div className="video-container">
        <video
          src="https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783273004/busmo_demo_gwytnk.mp4"
          controls
          poster="https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783273004/busmo_demo_gwytnk.jpg"
          className="demo-video"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  </section>
);

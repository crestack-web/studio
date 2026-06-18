"use client";

import React from 'react';

const MOBILE_FEATURES = [
  {
    title: "Dashboard on Mobile",
    description: "See your profit, sales, and inventory at a glance from anywhere",
    icon: "📊"
  },
  {
    title: "Inventory on Mobile",
    description: "Track stock levels and get restock alerts on the go",
    icon: "📦"
  },
  {
    title: "Ask MO on Mobile",
    description: "Get instant answers about your business with AI-powered insights",
    icon: "🤖"
  }
];

export const MobileAppShowcase: React.FC = () => (
  <section className="mobile-showcase-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Mobile Experience</div>
        <h2 className="section-title">
          Your Business. <em style={{ color: 'var(--purple-mid)' }}>In Your Pocket.</em>
        </h2>
        <p className="section-sub">
          Busmo works perfectly on phones. Manage your business from anywhere, anytime.
        </p>
      </div>

      <div className="mobile-showcase-grid">
        <div className="mobile-features">
          {MOBILE_FEATURES.map((feature, index) => (
            <div key={index} className="mobile-feature-card">
              <div className="mobile-feature-icon">{feature.icon}</div>
              <h3 className="mobile-feature-title">{feature.title}</h3>
              <p className="mobile-feature-desc">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mobile-mockup-container">
          <div className="mobile-device">
            <div className="mobile-notch" />
            <div className="mobile-screen">
              <div className="mobile-header">
                <span className="mobile-time">9:41</span>
                <div className="mobile-status-icons">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              <div className="mobile-content">
                <div className="mobile-app-bar">
                  <span className="mobile-app-name">Busmo</span>
                  <span className="mobile-menu">☰</span>
                </div>

                <div className="mobile-dashboard">
                  <div className="mobile-stat-card primary">
                    <span className="mobile-stat-label">Today's Profit</span>
                    <span className="mobile-stat-value">₦47,200</span>
                    <span className="mobile-stat-change">↑ 12%</span>
                  </div>

                  <div className="mobile-stat-card">
                    <span className="mobile-stat-label">Sales</span>
                    <span className="mobile-stat-value">₦118,500</span>
                  </div>

                  <div className="mobile-stat-card">
                    <span className="mobile-stat-label">Inventory</span>
                    <span className="mobile-stat-value">234 items</span>
                  </div>

                  <div className="mobile-ask-mo">
                    <span className="mobile-ask-icon">🤖</span>
                    <span className="mobile-ask-text">Ask MO anything...</span>
                  </div>
                </div>
              </div>

              <div className="mobile-home-indicator" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

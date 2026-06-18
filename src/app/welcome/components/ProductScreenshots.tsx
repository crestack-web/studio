"use client";

import React from 'react';

const SCREENSHOTS = [
  {
    title: "Dashboard",
    description: "See your profit, sales, and inventory at a glance",
    icon: "📊"
  },
  {
    title: "Inventory",
    description: "Track stock levels and get restock alerts",
    icon: "📦"
  },
  {
    title: "Profit Analytics",
    description: "Understand your business performance with detailed insights",
    icon: "📈"
  },
  {
    title: "Ask MO",
    description: "Get instant answers about your business with AI",
    icon: "🤖"
  }
];

export const ProductScreenshots: React.FC = () => (
  <section className="product-screenshots-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">See Busmo in Action</div>
        <h2 className="section-title">
          Simple. Powerful. <em style={{ color: 'var(--purple-mid)' }}>Built for You.</em>
        </h2>
        <p className="section-sub">
          Explore the Busmo interface designed for African business owners.
        </p>
      </div>

      <div className="screenshots-grid">
        {SCREENSHOTS.map((screenshot, index) => (
          <div key={index} className="screenshot-card">
            <div className="screenshot-placeholder">
              <div className="screenshot-icon">{screenshot.icon}</div>
              <div className="screenshot-placeholder-text">
                {screenshot.title} Screenshot
              </div>
              <div className="screenshot-placeholder-sub">
                Add your screenshot here
              </div>
            </div>
            <div className="screenshot-info">
              <h3 className="screenshot-title">{screenshot.title}</h3>
              <p className="screenshot-desc">{screenshot.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

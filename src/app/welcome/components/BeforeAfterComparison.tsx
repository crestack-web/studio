"use client";

import React from 'react';

const BEFORE_ITEMS = [
  "Notebook records",
  "Guessing profits",
  "Manual calculations",
  "Stock shortages",
  "No business insights",
  "Time-consuming reports",
  "Lost receipts",
  "Unclear cash flow"
];

const AFTER_ITEMS = [
  "Digital records",
  "Real-time profit tracking",
  "Automatic calculations",
  "Inventory management",
  "Ask MO business intelligence",
  "Instant insights",
  "Everything tracked",
  "Clear cash visibility"
];

export const BeforeAfterComparison: React.FC = () => (
  <section className="before-after-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Before vs After</div>
        <h2 className="section-title">
          The Difference <em style={{ color: 'var(--purple-mid)' }}>is Clear</em>
        </h2>
        <p className="section-sub">
          See how Busmo transforms the way you run your business.
        </p>
      </div>

      <div className="comparison-table">
        <div className="comparison-column before">
          <div className="comparison-header">
            <span className="comparison-icon">📓</span>
            <h3 className="comparison-title">Before Busmo</h3>
          </div>
          <ul className="comparison-list">
            {BEFORE_ITEMS.map((item, index) => (
              <li key={index} className="comparison-item before-item">
                <span className="comparison-bullet">✗</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="comparison-divider">
          <div className="divider-arrow">→</div>
        </div>

        <div className="comparison-column after">
          <div className="comparison-header">
            <span className="comparison-icon">🚀</span>
            <h3 className="comparison-title">After Busmo</h3>
          </div>
          <ul className="comparison-list">
            {AFTER_ITEMS.map((item, index) => (
              <li key={index} className="comparison-item after-item">
                <span className="comparison-bullet">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

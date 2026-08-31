"use client";

import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

const iconProps = { size: 22, strokeWidth: 1.75, 'aria-hidden': true as const };

const BEFORE_ITEMS = [
  "Sales don't match cash",
  "Stock disappears without explanation",
  "Staff handle money you can't verify",
  "Credit sales get forgotten",
  "Suppliers are owed money",
  "You don't know real profit",
  "You call staff just to understand the day",
  "Multiple tools, no clear picture"
];

const AFTER_ITEMS = [
  "Sales linked to cash collections",
  "Stock levels you can trust",
  "Staff activity you can see",
  "Credit tracked and followed up",
  "Supplier balances in one place",
  "Profit from real numbers",
  "Visibility without being on site",
  "One system for control"
];

export const BeforeAfterComparison: React.FC = () => (
  <section className="before-after-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">The Problem</div>
        <h2 className="section-title">
          Your business can be making money and still be{' '}
          <em style={{ color: 'var(--purple-mid)' }}>out of control.</em>
        </h2>
        <p className="section-sub">
          Many owners make sales every day — but still cannot see what is really happening inside the business.
        </p>
      </div>

      <div className="comparison-table">
        <div className="comparison-column before">
          <div className="comparison-header">
            <span className="comparison-icon"><BookOpen {...iconProps} /></span>
            <h3 className="comparison-title">Without control</h3>
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
            <span className="comparison-icon"><CheckCircle2 {...iconProps} /></span>
            <h3 className="comparison-title">With Busmo</h3>
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

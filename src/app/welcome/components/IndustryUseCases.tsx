"use client";

import React from 'react';

const INDUSTRIES = [
  {
    name: "Pharmacy",
    icon: "💊",
    challenge: "Tracking expiry dates and managing stock across multiple suppliers",
    solution: "Automatic expiry alerts, supplier tracking, and real-time inventory levels"
  },
  {
    name: "Supermarket",
    icon: "🛒",
    challenge: "Managing thousands of SKUs and preventing stock shortages",
    solution: "Bulk product management, low stock alerts, and sales analytics"
  },
  {
    name: "Boutique",
    icon: "👗",
    challenge: "Understanding which styles sell best and when to reorder",
    solution: "Product performance tracking, seasonal insights, and smart reordering"
  },
  {
    name: "Electronics Store",
    icon: "📱",
    challenge: "Tracking high-value items and warranty information",
    solution: "Serial number tracking, warranty management, and profit per item"
  },
  {
    name: "Restaurant",
    icon: "🍽️",
    challenge: "Managing food costs and tracking daily profit margins",
    solution: "Recipe costing, daily profit tracking, and expense categorization"
  },
  {
    name: "Wholesale Distributor",
    icon: "📦",
    challenge: "Managing bulk orders and tracking customer credit",
    solution: "Bulk order management, credit tracking, and customer payment reminders"
  },
  {
    name: "Manufacturer",
    icon: "🏭",
    challenge: "Tracking production costs and raw material inventory",
    solution: "Production tracking, cost of goods manufactured, and material forecasting"
  }
];

export const IndustryUseCases: React.FC = () => (
  <section className="industry-use-cases-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Industry Solutions</div>
        <h2 className="section-title">
          Built for <em style={{ color: 'var(--purple-mid)' }}>Your Business</em>
        </h2>
        <p className="section-sub">
          Whether you run a small shop or a growing enterprise, Busmo adapts to your needs.
        </p>
      </div>

      <div className="industries-grid">
        {INDUSTRIES.map((industry, index) => (
          <div key={index} className="industry-card">
            <div className="industry-icon">{industry.icon}</div>
            <h3 className="industry-name">{industry.name}</h3>
            <div className="industry-challenge">
              <span className="industry-label">Challenge:</span>
              <span>{industry.challenge}</span>
            </div>
            <div className="industry-solution">
              <span className="industry-label solution-label">Busmo Solution:</span>
              <span>{industry.solution}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

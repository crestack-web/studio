"use client";

import React from 'react';
import {
  ShoppingCart,
  Package,
  Shirt,
  UtensilsCrossed,
  Building2,
  Users,
} from 'lucide-react';

const iconProps = { size: 24, strokeWidth: 1.75, 'aria-hidden': true as const };

const INDUSTRIES = [
  {
    name: "Retail & shops",
    icon: <ShoppingCart {...iconProps} />,
    challenge: "Sales, stock and cash handled by staff while the owner is away",
    solution: "Visibility into sales, inventory and money movement from one place"
  },
  {
    name: "Wholesale & distribution",
    icon: <Package {...iconProps} />,
    challenge: "Bulk stock, credit and multiple customers hard to track by hand",
    solution: "Inventory, credit and sales linked so balances stay clear"
  },
  {
    name: "Fashion & product brands",
    icon: <Shirt {...iconProps} />,
    challenge: "Stock value and true profit unclear after costs and returns",
    solution: "Stock levels, costs and profit in plain view"
  },
  {
    name: "Restaurants & food",
    icon: <UtensilsCrossed {...iconProps} />,
    challenge: "Daily sales, ingredients and expenses hard to reconcile",
    solution: "Sales, expenses and profit tracking built for busy operations"
  },
  {
    name: "Multi-location businesses",
    icon: <Building2 {...iconProps} />,
    challenge: "Cannot stand in every branch to know what happened",
    solution: "Central visibility across locations where supported"
  },
  {
    name: "Teams with staff",
    icon: <Users {...iconProps} />,
    challenge: "Staff handle money and stock without owner oversight",
    solution: "Permissions, activity and accountability tools"
  }
];

export const IndustryUseCases: React.FC = () => (
  <section className="industry-use-cases-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Who Busmo is for</div>
        <h2 className="section-title">
          Built for businesses that have grown beyond{' '}
          <em style={{ color: 'var(--purple-mid)' }}>notebooks and spreadsheets.</em>
        </h2>
        <p className="section-sub">
          Especially useful when you have staff, inventory, cash handling, credit or more than one location.
        </p>
      </div>

      <div className="industries-grid">
        {INDUSTRIES.map((industry, index) => (
          <div key={index} className="industry-card">
            <div className="industry-icon">{industry.icon}</div>
            <h3 className="industry-name">{industry.name}</h3>
            <div className="industry-challenge">
              <span className="industry-label">Common situation:</span>
              <span>{industry.challenge}</span>
            </div>
            <div className="industry-solution">
              <span className="industry-label solution-label">With Busmo:</span>
              <span>{industry.solution}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

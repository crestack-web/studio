"use client";

import React from 'react';

const STEPS = [
  {
    number: 1,
    title: "Record Sales",
    description: "Add sales in seconds — even offline. Track what you sold, quantity, and profit per product.",
    icon: "🛒"
  },
  {
    number: 2,
    title: "Record Expenses",
    description: "Log daily expenses and inventory costs. See how they affect your profit in real time.",
    icon: "💸"
  },
  {
    number: 3,
    title: "Track Inventory",
    description: "Add products with cost and quantity. Get alerts before you run out of your best sellers.",
    icon: "📦"
  },
  {
    number: 4,
    title: "See Profit Automatically",
    description: "Your profit is calculated automatically. No more guessing or manual calculations.",
    icon: "📈"
  },
  {
    number: 5,
    title: "Ask MO Anything",
    description: "Ask questions like 'How much profit did I make today?' and get instant answers.",
    icon: "🤖"
  }
];

export const HowBusmoWorks: React.FC = () => (
  <section className="how-busmo-works-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">How Busmo Works</div>
        <h2 className="section-title">
          5 Simple Steps to <em style={{ color: 'var(--purple-mid)' }}>Business Clarity</em>
        </h2>
        <p className="section-sub">
          Get started in minutes. No accounting degree required.
        </p>
      </div>

      <div className="steps-container">
        {STEPS.map((step, index) => (
          <div key={index} className="step-item">
            <div className="step-number">{step.number}</div>
            <div className="step-icon">{step.icon}</div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
            {index < STEPS.length - 1 && <div className="step-connector">→</div>}
          </div>
        ))}
      </div>
    </div>
  </section>
);

"use client";

import React from 'react';

const AREAS = [
  {
    number: 1,
    title: "Sales",
    description: "Know what is being sold and when — by who, and for how much.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2411_zblrqq.png"
  },
  {
    number: 2,
    title: "Stock",
    description: "Know what you have, what is moving, and what it is worth.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009549/IMG_2412_gixq0q.png"
  },
  {
    number: 3,
    title: "Cash",
    description: "Track where money comes from and where it goes.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2414_ggelsf.png"
  },
  {
    number: 4,
    title: "Staff",
    description: "Know who is handling sales, cash and business activity.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2413_esqkdh.png"
  },
  {
    number: 5,
    title: "Profit",
    description: "Understand what your business is actually making.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009549/IMG_2410_uos5yq.png"
  }
];

export const HowBusmoWorks: React.FC = () => (
  <section className="how-busmo-works-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">The Busmo System</div>
        <h2 className="section-title">
          One system. <em style={{ color: 'var(--purple-mid)' }}>Complete business visibility.</em>
        </h2>
        <p className="section-sub">
          Busmo connects sales, stock, cash, staff and profit so you always know what is happening inside your business.
        </p>
      </div>

      <div className="steps-container">
        {AREAS.map((step, index) => (
          <div key={index} className="step-item">
            <div className="step-number">{step.number}</div>
            <div className="step-icon">
              <img src={step.icon} alt={step.title} className="step-icon-image" />
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
            {index < AREAS.length - 1 && <div className="step-connector">→</div>}
          </div>
        ))}
      </div>
    </div>
  </section>
);

"use client";

import React from 'react';
import type { Page } from '../types';
import { BUSMO_PLANS, POSITIONING, formatNaira } from '@/lib/pricing';

interface PricingPreviewProps {
  onNavigate: (page: Page | string) => void;
}

export function PricingPreview({ onNavigate }: PricingPreviewProps) {
  const plans = BUSMO_PLANS.map((p) => ({
    name: p.name,
    price: formatNaira(p.monthlyPrice),
    period: '/month',
    tagline: p.tagline,
    popular: !!p.popular,
    features: p.features.slice(0, 5),
    cta: p.cta,
  }));

  return (
    <section className="pricing-preview-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">
            Plans built for <em>business control</em>
          </h2>
          <p className="section-sub">
            {POSITIONING.subhead} 3-day free trial on all plans.
          </p>
        </div>

        <div className="pricing-preview-grid">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-preview-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="pricing-preview-badge">Recommended</div>}

              <div className="pricing-preview-header">
                <div className="pricing-preview-name">{plan.name}</div>
                <div className="pricing-preview-tagline">{plan.tagline}</div>
              </div>

              <div className="pricing-preview-price">
                <span className="pricing-preview-amount">{plan.price}</span>
                <span className="pricing-preview-period">{plan.period}</span>
              </div>

              <ul className="pricing-preview-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="pricing-preview-feature">
                    <span className="pricing-preview-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`pricing-preview-cta ${plan.popular ? 'primary' : ''}`}
                onClick={() => onNavigate('signup')}
              >
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-preview-footer">
          <p>
            Enterprise or complex operations?{' '}
            <button
              className="pricing-preview-link"
              onClick={() => onNavigate('signup')}
            >
              Talk to us
            </button>
          </p>
          <button
            className="pricing-preview-all"
            onClick={() => { window.location.href = '/pricing'; }}
          >
            View all plans &amp; details →
          </button>
        </div>
      </div>
    </section>
  );
}

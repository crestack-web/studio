"use client";

import React from 'react';
import type { Page } from '../types';

interface PricingPreviewProps {
  onNavigate: (page: Page | string) => void;
}

export function PricingPreview({ onNavigate }: PricingPreviewProps) {
  const plans = [
    {
      name: 'Starter',
      price: '₦5,000',
      period: '/month',
      tagline: 'For small retailers',
      features: ['Sales & Inventory', 'Basic Reports', 'Ask MO AI', 'Up to 50 Products'],
      cta: 'Start Trial',
    },
    {
      name: 'Standard',
      price: '₦10,000',
      period: '/month',
      tagline: 'For growing businesses',
      popular: true,
      features: ['Everything in Starter', 'Cash Flow & Credit', 'Ask MO AI (50 msgs)', 'Up to 500 Products', 'Multi-branch (3)'],
      cta: 'Start Trial',
    },
    {
      name: 'Pro',
      price: '₦25,000',
      period: '/month',
      tagline: 'For chains',
      features: ['Everything in Standard', 'Unlimited Products', 'Unlimited Branches', 'Bank Reconciliation', 'Priority Support'],
      cta: 'Contact Sales',
    },
  ];

  return (
    <section className="pricing-preview-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Simple, transparent <em>pricing</em></h2>
          <p className="section-sub">All plans include a 3-day free trial. No credit card required.</p>
        </div>

        <div className="pricing-preview-grid">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-preview-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="pricing-preview-badge">Most Popular</div>}
              
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
            Need a custom plan?{' '}
            <button 
              className="pricing-preview-link"
              onClick={() => onNavigate('signup')}
            >
              Contact us
            </button>
          </p>
          <button 
            className="pricing-preview-all"
            onClick={() => window.location.href = '/pricing'}
          >
            View All Plans & Details →
          </button>
        </div>
      </div>
    </section>
  );
}

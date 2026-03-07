"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';
import { convertFromUsd, formatCurrency, getUserCountryCode } from '@/lib/currency';

type Page = 'home' | 'pricing' | 'login' | 'signup' | 'seller' | 'invest';

export default function PricingPage() {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [userCountry, setUserCountry] = useState<string>('NG');

  useEffect(() => {
    // Detect user's country on mount
    const country = getUserCountryCode();
    setUserCountry(country);
  }, []);

  const handleNavigate = (page: Page) => {
    if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/Seller';
    else if (page === 'invest' || page === 'invest-signup' || page === 'invest-login' || page === 'investor')
      window.location.href = '/invest';
    else window.location.href = '/welcome';
  };

  // Base prices in USD
  const plans = [
    {
      name: 'Starter',
      tagline: 'For small retailers & startups',
      monthlyPriceUsd: 15,
      yearlyPriceUsd: 150,
      features: [
        { text: 'Record Sales, Expenses & Inventory', included: true },
        { text: 'Basic AI Insights (MO)', included: true },
        { text: 'Basic Online Storefront', included: true },
        { text: 'BusmoPay Payment Integration', included: true },
        { text: 'Manage up to 3 Staff', included: true },
        { text: 'Basic Sales Analytics', included: true },
        { text: 'Advanced Forecasting', included: false },
        { text: 'Multiple Branches', included: false },
        { text: 'Production Tracking', included: false },
        { text: 'Access to Equity Investment', included: false },
        { text: 'Custom Domain', included: false },
        { text: 'Advanced Store Analytics', included: false },
        { text: 'Unlimited MO Use', included: false },
        { text: 'CAC Compliance Support', included: false },
        { text: 'Integrated POS & Printer', included: false },
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Standard',
      tagline: 'For growing businesses',
      monthlyPriceUsd: 40,
      yearlyPriceUsd: 400,
      features: [
        { text: 'Everything in Starter', included: true },
        { text: 'Advanced AI Insights & Forecasts', included: true },
        { text: 'Professional Storefront Themes', included: true },
        { text: 'Priority Store Placement', included: true },
        { text: 'Manage up to 10 Staff', included: true },
        { text: 'Advanced Sales Analytics', included: true },
        { text: 'Advanced Forecasting', included: true },
        { text: 'Up to 3 Branches', included: true },
        { text: 'Production Tracking', included: false },
        { text: 'Access to Equity Investment', included: false },
        { text: 'Custom Domain', included: true },
        { text: 'SEO Optimization Tools', included: true },
        { text: 'Unlimited MO Use (3 months)', included: true },
        { text: 'Custom Support', included: true },
        { text: 'CAC Compliance Support', included: false },
        { text: 'Integrated POS & Printer', included: false },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Pro',
      tagline: 'For established businesses & chains',
      monthlyPriceUsd: 80,
      yearlyPriceUsd: 800,
      features: [
        { text: 'Everything in Standard', included: true },
        { text: 'Premium AI Insights & Consulting', included: true },
        { text: 'Custom Storefront Design', included: true },
        { text: 'Featured Store Placement', included: true },
        { text: 'Unlimited Staff', included: true },
        { text: 'Custom Reports & Analytics', included: true },
        { text: 'Advanced Forecasting', included: true },
        { text: 'Unlimited Branches', included: true },
        { text: 'Production Tracking', included: true },
        { text: 'Access to Equity Investment', included: true },
        { text: 'CAC Compliance (if needed)', included: true },
        { text: 'Integrated POS & Printer', included: true },
        { text: 'Access to Busmo ELITE Team', included: true },
        { text: 'Unlimited MO Use (Forever)', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const getPriceInLocalCurrency = (usdAmount: number) => {
    return convertFromUsd(usdAmount, userCountry);
  };

  const formatMoney = (amount: number) => {
    return formatCurrency(amount, userCountry);
  };

  return (
    <div className="pricing-page">
      <LangProvider>
        <Navbar currentPage="pricing" onNavigate={handleNavigate} />
      </LangProvider>
      
      <main className="pricing-main">
        <div className="max-w">
          {/* Hero */}
          <div className="section-head center">
            <div className="section-label">Simple, Transparent Pricing</div>
            <h1 className="section-title">Find the Perfect Plan<br /><em>for Your Business</em></h1>
            <p className="section-sub">
              All plans include a 3-day free trial. No credit card required. Cancel anytime.
            </p>
            <div className="no-free-plan-note">
              <span className="no-free-plan-emoji">😅</span>
              <span className="no-free-plan-text">
                Why no free plan? Well, our servers eat electricity, our developers eat food, and MO the AI? He demands the finest digital snacks. A free plan would leave everyone hungry!
              </span>
            </div>
          </div>

          {/* Toggle */}
          <div className="pricing-toggle">
            <div className="toggle-switch">
              <button
                className={`toggle-btn ${mode === 'monthly' ? 'active' : ''}`}
                onClick={() => setMode('monthly')}
              >
                Monthly
              </button>
              <button
                className={`toggle-btn ${mode === 'yearly' ? 'active' : ''}`}
                onClick={() => setMode('yearly')}
              >
                Yearly
              </button>
            </div>
            {mode === 'yearly' && (
              <span className="save-badge">Save 17%</span>
            )}
          </div>

          {/* Plans Grid */}
          <div className="plans-grid">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && (
                  <div className="popular-badge">Most Popular</div>
                )}
                <div className="plan-header">
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-tagline">{plan.tagline}</div>
                </div>
                <div className="plan-price">
                  <span className="price-amount">
                    {formatMoney(getPriceInLocalCurrency(mode === 'monthly' ? plan.monthlyPriceUsd : plan.yearlyPriceUsd))}
                  </span>
                  <span className="price-period">
                    / {mode === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {mode === 'yearly' && (
                  <div className="yearly-savings">
                    Billed {formatMoney(getPriceInLocalCurrency(plan.yearlyPriceUsd))}/yr — save {formatMoney(getPriceInLocalCurrency(plan.monthlyPriceUsd * 12 - plan.yearlyPriceUsd))}
                  </div>
                )}
                <hr className="plan-divider" />
                <div className="plan-features-title">What's included</div>
                <ul className="plan-features">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className={`feature-item ${!feature.included ? 'inactive' : ''}`}
                    >
                      <span className="feature-icon">
                        {feature.included ? '✓' : '✗'}
                      </span>
                      <span className="feature-text">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`plan-cta ${plan.popular ? 'primary' : ''}`}
                  onClick={() => handleNavigate('signup')}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ Link */}
          <div className="pricing-faq">
            <p>Have questions about which plan is right for you?</p>
            <button className="faq-link" onClick={() => handleNavigate('home')}>
              View FAQ →
            </button>
          </div>

          {/* Trust Badges */}
          <div className="pricing-trust">
            <div className="trust-item">
              <div className="trust-icon">🔒</div>
              <div className="trust-text">
                <strong>Secure Payments</strong>
                <span>Bank-level encryption</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">✅</div>
              <div className="trust-text">
                <strong>3-Day Free Trial</strong>
                <span>Full access, no card needed</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">💳</div>
              <div className="trust-text">
                <strong>Cancel Anytime</strong>
                <span>No hidden fees or contracts</span>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon">🎧</div>
              <div className="trust-text">
                <strong>24/7 Support</strong>
                <span>We're here to help</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LangProvider>
        <Footer onNavigate={handleNavigate} />
      </LangProvider>
    </div>
  );
}

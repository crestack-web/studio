"use client";

import React, { useState, useEffect } from 'react';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';
import { convertFromUsd, formatCurrency, getUserCountryCode, getCurrencyName } from '@/lib/currency';
import { initializePayment, getPaymentGatewayName } from '@/lib/paymentService';
import type { Page } from '../welcome/types';

export default function PricingPage() {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [userCountry, setUserCountry] = useState<string>('NG');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Detect user's country on mount
    const country = getUserCountryCode();
    setUserCountry(country);
  }, []);

  const handleNavigate = (page: Page) => {
    if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login' || page === 'login-form') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/seller';
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
        { text: '2,500 MO Credits/month (~25 AI responses)', included: true },
        { text: 'Basic Sales Analytics', included: true },
        { text: 'Manage up to 3 Staff', included: true },
        { text: 'Offline-first recording', included: true },
        { text: 'Basic Forecasts', included: true },
        { text: 'Online Store (Waitlist)', included: true },
        { text: 'BusmoPay Integration', included: false },
        { text: 'Advanced AI Insights', included: false },
        { text: 'Multiple Branches', included: false },
        { text: 'Production Tracking', included: false },
        { text: 'Access to Investment', included: false },
        { text: 'Custom Domain', included: false },
        { text: 'POS Integration', included: false },
        { text: 'Unlimited MO Use', included: false },
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
        { text: '10,000 MO Credits/month (~100 AI responses)', included: true },
        { text: 'Advanced AI Insights & Forecasts', included: true },
        { text: 'Manage up to 10 Staff', included: true },
        { text: 'Advanced Sales Analytics', included: true },
        { text: 'Up to 3 Branches', included: true },
        { text: 'Online Store (Early Access)', included: true },
        { text: 'BusmoPay Integration', included: true },
        { text: 'Custom Domain', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Production Tracking', included: false },
        { text: 'Access to Investment', included: false },
        { text: 'POS Integration', included: false },
        { text: 'Unlimited MO Use', included: false },
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
        { text: 'Unlimited MO Credits', included: true },
        { text: 'Premium AI Consulting', included: true },
        { text: 'Unlimited Staff', included: true },
        { text: 'Unlimited Branches', included: true },
        { text: 'Production Tracking', included: true },
        { text: 'Online Store (Full Access)', included: true },
        { text: 'Access to Investment', included: true },
        { text: 'POS Integration', included: true },
        { text: 'Custom Reports', included: true },
        { text: 'Dedicated Account Manager', included: true },
        { text: 'API Access', included: true },
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

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    const price = mode === 'monthly' ? selectedPlan.monthlyPriceUsd : selectedPlan.yearlyPriceUsd;
    const localPrice = getPriceInLocalCurrency(price);
    const currency = getCurrencyName(userCountry);

    try {
      await initializePayment({
        amount: localPrice,
        currency: currency,
        email: userEmail,
        metadata: {
          plan: selectedPlan.name,
          billing: mode,
          country: userCountry,
        },
        onSuccess: (reference) => {
          alert(`Payment successful! Reference: ${reference}`);
          setShowPaymentModal(false);
          // Redirect to signup or dashboard
          window.location.href = '/welcome/signup';
        },
        onClose: () => {
          console.log('Payment modal closed');
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
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
                  onClick={() => handlePlanSelect(plan)}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Complete Your Purchase</h3>
              <button className="close-modal" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="payment-modal-body">
              <div className="selected-plan-info">
                <div className="plan-name">{selectedPlan.name} Plan</div>
                <div className="plan-price">
                  {formatMoney(getPriceInLocalCurrency(mode === 'monthly' ? selectedPlan.monthlyPriceUsd : selectedPlan.yearlyPriceUsd))} / {mode === 'monthly' ? 'month' : 'year'}
                </div>
                <div className="payment-gateway">
                  Paying with {getPaymentGatewayName()}
                </div>
              </div>
              <div className="email-input-group">
                <label htmlFor="payment-email">Email Address</label>
                <input
                  id="payment-email"
                  type="email"
                  placeholder="Enter your email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="payment-modal-footer">
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handlePayment}>
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

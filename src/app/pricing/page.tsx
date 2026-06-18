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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'ussd'>('card');

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

  // Fixed prices in Naira
  const plans = [
    {
      name: 'Starter',
      tagline: 'For small retailers & startups',
      monthlyPrice: 5000,
      yearlyPrice: 50000,
      features: [
        { text: 'Sales & Inventory Tracking', included: true },
        { text: 'Expense Management', included: true },
        { text: 'Basic AI Insights (MO)', included: true },
        { text: 'Up to 50 Products', included: true },
        { text: 'Basic Reports', included: true },
        { text: '1 Staff Member', included: true },
      ],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Standard',
      tagline: 'For growing businesses',
      monthlyPrice: 10000,
      yearlyPrice: 100000,
      features: [
        { text: 'Everything in Starter', included: true },
        { text: 'Up to 500 Products', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Staff Management (up to 10)', included: true },
        { text: 'Cash Flow Tracking', included: true },
        { text: 'Multi-branch Support (up to 3)', included: true },
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Pro',
      tagline: 'For established businesses & chains',
      monthlyPrice: 25000,
      yearlyPrice: 250000,
      features: [
        { text: 'Everything in Standard', included: true },
        { text: 'Unlimited Products', included: true },
        { text: 'Unlimited Staff', included: true },
        { text: 'Unlimited Branches', included: true },
        { text: 'Bank Accounts Integration', included: true },
        { text: 'Audit Trail', included: true },
        { text: 'Staff Activity Tracking', included: true },
        { text: 'Priority Support', included: true },
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const formatMoney = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleStartFreeTrial = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      // Store trial information in localStorage for use during signup
      const trialInfo = {
        plan: selectedPlan.name,
        billing: mode,
        country: 'NG',
        trialStart: new Date().toISOString(),
        trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        email: userEmail,
      };
      localStorage.setItem('busmo_trial_info', JSON.stringify(trialInfo));
      
      // Redirect to signup to complete registration with trial
      window.location.href = '/welcome/signup?trial=true';
    } catch (error) {
      console.error('Error starting free trial:', error);
      alert('Failed to start free trial. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    const price = mode === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;

    try {
      const response = await fetch('/api/payments/initialize-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amount: price,
          plan: selectedPlan.name,
          billing: mode,
          metadata: {
            plan: selectedPlan.name,
            billing: mode,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      if (data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('No checkout URL returned');
      }
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
                    {formatMoney(mode === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice)}
                  </span>
                  <span className="price-period">
                    / {mode === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {mode === 'yearly' && (
                  <div className="yearly-savings">
                    Billed {formatMoney(plan.yearlyPrice)}/yr — save {formatMoney(plan.monthlyPrice * 12 - plan.yearlyPrice)}
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
                  onClick={() => {
                    if (plan.cta === 'Start Free Trial') {
                      // Store trial information in localStorage for use during signup
                      const trialInfo = {
                        plan: plan.name,
                        billing: mode,
                        country: 'NG',
                        trialStart: new Date().toISOString(),
                        trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
                      };
                      localStorage.setItem('busmo_trial_info', JSON.stringify(trialInfo));
                      window.location.href = '/welcome/signup?trial=true';
                    } else {
                      handlePlanSelect(plan);
                    }
                  }}
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
                  {formatMoney(mode === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice)} / {mode === 'monthly' ? 'month' : 'year'}
                </div>
                <div className="payment-gateway">
                  Paying with Paystack
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
              <div className="payment-method-group">
                <label>Payment Method</label>
                <div className="payment-method-options">
                  <button
                    className={`payment-method-option ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <span className="payment-method-icon">💳</span>
                    <span className="payment-method-label">Card</span>
                  </button>
                  <button
                    className={`payment-method-option ${paymentMethod === 'bank_transfer' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('bank_transfer')}
                  >
                    <span className="payment-method-icon">🏦</span>
                    <span className="payment-method-label">Bank Transfer</span>
                  </button>
                  <button
                    className={`payment-method-option ${paymentMethod === 'ussd' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('ussd')}
                  >
                    <span className="payment-method-icon">📱</span>
                    <span className="payment-method-label">USSD</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="payment-modal-footer">
              <button className="btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button className="btn-trial" onClick={handleStartFreeTrial}>
                🎁 Start 3-Day Free Trial
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

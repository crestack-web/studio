"use client";

import { useState, useEffect } from 'react';
import { LangProvider } from '../owner/dashboard/LangContext';
import { AskMOSupportAgent } from '../welcome/components/AskMOSupportAgent';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import {
  BUSMO_PLANS,
  ENTERPRISE,
  ONBOARDING,
  POSITIONING,
  formatNaira,
  type BusmoPlan,
  type PlanId,
} from '@/lib/pricing';

export default function PricingPage() {
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<BusmoPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // After Paystack redirect: verify and record revenue
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    (async () => {
      try {
        await fetch('/api/payments/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
      } catch (e) {
        console.error('Payment verify failed', e);
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('reference');
      url.searchParams.delete('trxref');
      url.searchParams.delete('paid');
      window.history.replaceState({}, '', url.pathname + url.search);
    })();
  }, []);


  useEffect(() => {
    // Nigeria default; geo can be added later
  }, []);

  const handleNavigate = (page: string) => {
    if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login' || page === 'login-form') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/sell-welcome';
    else if (
      page === 'invest' ||
      page === 'invest-signup' ||
      page === 'invest-login' ||
      page === 'investor'
    )
      window.location.href = '/invest';
    else window.location.href = '/welcome';
  };

  const formatMoney = (amount: number) => formatNaira(amount);

  const startTrialForPlan = (plan: BusmoPlan) => {
    const trialInfo = {
      plan: plan.name, // Busmo Start | Busmo Control | Busmo Scale
      planId: plan.id as PlanId, // internal id for billing/gating only
      billing: mode,
      country: 'NG',
      trialStart: new Date().toISOString(),
      trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem('busmo_trial_info', JSON.stringify(trialInfo));
    window.location.href = '/welcome/signup?trial=true';
  };

  const handlePlanSelect = (plan: BusmoPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleStartFreeTrial = async () => {
    if (!selectedPlan) return;
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    try {
      const trialInfo = {
        plan: selectedPlan.name,
        planId: selectedPlan.id,
        billing: mode,
        country: 'NG',
        trialStart: new Date().toISOString(),
        trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        email: userEmail,
      };
      localStorage.setItem('busmo_trial_info', JSON.stringify(trialInfo));
      window.location.href = '/welcome/signup?trial=true';
    } catch (error) {
      console.error('Error starting free trial:', error);
      alert('Failed to start free trial. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    const price =
      mode === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;

    setIsPaying(true);
    try {
      const response = await fetch('/api/payments/initialize-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          planId: selectedPlan.id,
          billing: mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      if (data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen">
      <LangProvider>
        <Navbar currentPage="pricing" onNavigate={handleNavigate} />
      </LangProvider>

      <main className="pricing-main">
        <div className="max-w">
          <div className="section-head center">
            <h1 className="section-title">
              Control over sales, stock,
              <br />
              <em>cash and staff</em>
            </h1>
            <p className="section-sub">
              {POSITIONING.headline}
              <br />
              Choose <strong>Busmo Start</strong>, <strong>Busmo Control</strong>, or{' '}
              <strong>Busmo Scale</strong>. 3-day free trial. Cancel anytime.
            </p>
          </div>

          <div className="pricing-toggle">
            <div className="toggle-switch">
              <button
                type="button"
                className={`toggle-btn ${mode === 'monthly' ? 'active' : ''}`}
                onClick={() => setMode('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === 'yearly' ? 'active' : ''}`}
                onClick={() => setMode('yearly')}
              >
                Yearly
              </button>
            </div>
            {mode === 'yearly' && (
              <span className="save-badge">2 months free</span>
            )}
          </div>

          <div className="plans-grid">
            {BUSMO_PLANS.map((plan) => (
              <div
                key={plan.id}
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
                    {formatMoney(
                      mode === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
                    )}
                  </span>
                  <span className="price-period">
                    / {mode === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {mode === 'yearly' && (
                  <div className="yearly-savings">
                    Billed {formatMoney(plan.yearlyPrice)}/yr — save{' '}
                    {formatMoney(plan.monthlyPrice * 12 - plan.yearlyPrice)}
                  </div>
                )}
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-3, #6b7280)',
                    margin: '8px 0 0',
                  }}
                >
                  {plan.description}
                </p>
                <hr className="plan-divider" />
                <div className="plan-features-title">What&apos;s included</div>
                <ul className="plan-features">
                  {plan.features.map((text, idx) => (
                    <li key={idx} className="feature-item">
                      <span className="feature-icon">✓</span>
                      <span className="feature-text">{text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`plan-cta ${plan.popular ? 'primary' : ''}`}
                  onClick={() => startTrialForPlan(plan)}
                >
                  {plan.cta}
                </button>
                <button
                  type="button"
                  className="plan-cta"
                  style={{
                    marginTop: 8,
                    background: 'transparent',
                    color: 'var(--purple, #6B3FE7)',
                    border: '1.5px solid var(--purple, #6B3FE7)',
                    boxShadow: 'none',
                  }}
                  onClick={() => handlePlanSelect(plan)}
                >
                  Pay now — {plan.name}
                </button>
              </div>
            ))}

            {/* Enterprise */}
            <div className="plan-card">
              <div className="plan-header">
                <div className="plan-name">{ENTERPRISE.name}</div>
                <div className="plan-tagline">{ENTERPRISE.tagline}</div>
              </div>
              <div className="plan-price">
                <span className="price-amount">{ENTERPRISE.priceLabel}</span>
              </div>
              <hr className="plan-divider" />
              <div className="plan-features-title">Best for</div>
              <ul className="plan-features">
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Complex multi-location ops</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Custom workflows &amp; integrations</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Dedicated support</span>
                </li>
              </ul>
              <button
                type="button"
                className="plan-cta"
                onClick={() => {
                  window.location.href =
                    'mailto:hello@busmo.app?subject=Enterprise%20inquiry';
                }}
              >
                {ENTERPRISE.cta}
              </button>
            </div>
          </div>

          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: '0.875rem',
              color: 'var(--text-3, #6b7280)',
            }}
          >
            {ONBOARDING.label}. {ONBOARDING.note}
          </p>
        </div>
      </main>

      <LangProvider>
        <Footer onNavigate={handleNavigate} />
      </LangProvider>

      


      {showPaymentModal && selectedPlan && (
        <div
          className="pay-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
          onClick={() => !isPaying && setShowPaymentModal(false)}
        >
          <div className="pay-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pay-sheet-top">
              <h3 id="pay-modal-title">Subscribe</h3>
              <button
                type="button"
                className="pay-close"
                aria-label="Close"
                disabled={isPaying}
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className="pay-sheet-body">
              <div className="pay-plan-chip">
                <span className="pay-plan-name">{selectedPlan.name}</span>
                <span className="pay-plan-price">
                  {formatMoney(
                    mode === 'monthly'
                      ? selectedPlan.monthlyPrice
                      : selectedPlan.yearlyPrice
                  )}
                  <span className="pay-plan-period">
                    /{mode === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </span>
              </div>

              <label className="pay-label" htmlFor="payment-email">
                Email
              </label>
              <input
                id="payment-email"
                type="email"
                className="pay-input"
                placeholder="you@email.com"
                autoComplete="email"
                inputMode="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                disabled={isPaying}
              />
              <p className="pay-hint">Secure checkout with Paystack</p>
            </div>

            <div className="pay-sheet-actions">
              <button
                type="button"
                className="pay-btn-primary"
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? 'Redirecting…' : 'Pay with Paystack'}
              </button>
              <button
                type="button"
                className="pay-btn-ghost"
                onClick={handleStartFreeTrial}
                disabled={isPaying}
              >
                Start 3-day free trial
              </button>
            </div>
          </div>
        </div>
      )}

      <AskMOSupportAgent />
    </main>
  );
}

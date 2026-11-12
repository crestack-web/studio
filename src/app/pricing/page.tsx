'use client';

import { useState, useEffect } from 'react';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackClickButton } from '@/lib/tiktok/pixel';
import { LangProvider } from '../owner/dashboard/LangContext';
import { AskMOSupportAgent } from '../welcome/components/AskMOSupportAgent';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import {
  BUSMO_PLANS,
  ENTERPRISE,
  formatNaira,
  type BusmoPlan,
} from '@/lib/pricing';

export default function PricingPage() {
  useEffect(() => {
    try {
      trackViewContent('Pricing');
    } catch (_) {}
  }, []);

  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<BusmoPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isPaying, setIsPaying] = useState(false);

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
    else window.location.href = '/';
  };

  const formatMoney = (amount: number) => formatNaira(amount);

  const handleSelectPlan = (plan: BusmoPlan) => {
    try {
      trackAddToCart(plan.id, plan.name, plan.monthlyPrice);
      trackClickButton(`select_plan_${plan.id}`);
    } catch (_) {}
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleEnterprise = () => {
    try {
      trackClickButton('enterprise');
    } catch (_) {}
    window.location.href = 'mailto:hello@busmo.io?subject=Busmo%20Enterprise';
  };

  const handleStartFreeTrial = () => {
    try {
      trackClickButton(`start_trial_${selectedPlan?.id || 'pricing'}`);
    } catch (_) {}
    window.location.href = '/welcome/signup';
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    if (!userEmail || !userEmail.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsPaying(true);
    try {
      try {
        trackInitiateCheckout(
          selectedPlan.id || 'plan',
          selectedPlan.name || 'Subscription',
          selectedPlan.monthlyPrice
        );
      } catch (_) {}

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
              Find the right Busmo for your business — one platform, industry-specific pricing.
              <br />
              14-day free trial on paid plans. Annual billing saves ~2 months.
            </p>
          </div>

          <div className="billing-toggle">
            <button
              type="button"
              className={mode === 'monthly' ? 'active' : ''}
              onClick={() => setMode('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={mode === 'yearly' ? 'active' : ''}
              onClick={() => setMode('yearly')}
            >
              Yearly
            </button>
          </div>

          <div className="plan-grid">
            {BUSMO_PLANS.map((plan) => {
              const price =
                mode === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              return (
                <div
                  key={plan.id}
                  className={`plan-card${plan.popular ? ' popular' : ''}`}
                >
                  {plan.popular && (
                    <div className="plan-badge">Most popular</div>
                  )}
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-tagline">{plan.tagline}</p>
                  <div className="plan-price">
                    {formatMoney(price)}
                    <span>/{mode === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="plan-cta"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.cta || 'Get started'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="enterprise-block">
            <h3>{ENTERPRISE.name}</h3>
            <p>{ENTERPRISE.tagline}</p>
            <p className="plan-price">{ENTERPRISE.priceLabel}</p>
            <button
              type="button"
              className="plan-cta"
              onClick={handleEnterprise}
            >
              {ENTERPRISE.cta}
            </button>
          </div>
        </div>
      </main>

      <Footer />

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
                Start 14-day free trial
              </button>
            </div>
          </div>
        </div>
      )}

      <AskMOSupportAgent />
    </main>
  );
}

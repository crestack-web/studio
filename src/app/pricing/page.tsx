'use client';

import { useState, useEffect } from 'react';
import {
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackClickButton,
} from '@/lib/tiktok/pixel';
import { LangProvider } from '../owner/dashboard/LangContext';
import { AskMOSupportAgent } from '../welcome/components/AskMOSupportAgent';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import {
  BUSMO_PLANS,
  ENTERPRISE,
  formatNaira,
  BLACK_FRIDAY,
  isBlackFridayActive,
  getPlanChargePrice,
  type BusmoPlan,
} from '@/lib/pricing';
import styles from './pricing.module.css';

/** Show a tight feature list on cards — full detail lives in product. */
const FEATURE_LIMIT = 6;

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
  const bfActive = isBlackFridayActive();

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
    else if (page === 'download') window.location.href = '/welcome';
    else if (page === 'help') window.location.href = '/welcome/help';
    else if (
      page === 'invest' ||
      page === 'invest-signup' ||
      page === 'invest-login' ||
      page === 'investor'
    )
      window.location.href = '/invest';
    else window.location.href = '/';
  };

  const handleSelectPlan = (plan: BusmoPlan) => {
    try {
      const charge = getPlanChargePrice(plan, mode).charge;
      trackAddToCart(plan.id, plan.name, charge);
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
      const charge = getPlanChargePrice(selectedPlan, mode).charge;
      try {
        trackInitiateCheckout(
          selectedPlan.id || 'plan',
          selectedPlan.name || 'Subscription',
          charge
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
    <div className={styles.page}>
      <LangProvider>
        <Navbar currentPage="pricing" onNavigate={handleNavigate} />
      </LangProvider>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1>
            Control sales, stock, <em>cash and staff</em>
          </h1>
          <p>One platform. Clear pricing. 14-day trial on paid plans.</p>
        </header>

        {bfActive ? (
          <div className={styles.bfBanner}>
            <strong>{BLACK_FRIDAY.badge}</strong>
            {BLACK_FRIDAY.headline}
          </div>
        ) : null}

        <div className={styles.toggle}>
          <div className={styles.toggleInner} role="group" aria-label="Billing period">
            <button
              type="button"
              className={`${styles.toggleBtn}${mode === 'monthly' ? ` ${styles.toggleBtnActive}` : ''}`}
              onClick={() => setMode('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn}${mode === 'yearly' ? ` ${styles.toggleBtnActive}` : ''}`}
              onClick={() => setMode('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {BUSMO_PLANS.map((plan) => {
            const pricing = getPlanChargePrice(plan, mode);
            const features = plan.features.slice(0, FEATURE_LIMIT);
            const more = plan.features.length - features.length;
            return (
              <article
                key={plan.id}
                className={`${styles.card}${plan.popular ? ` ${styles.cardPopular}` : ''}`}
              >
                {pricing.saleActive ? (
                  <span className={`${styles.badge} ${styles.badgeDark}`}>{BLACK_FRIDAY.badge}</span>
                ) : plan.popular ? (
                  <span className={styles.badge}>Most popular</span>
                ) : null}

                <h2 className={styles.name}>{plan.name}</h2>
                <p className={styles.tagline}>{plan.tagline}</p>

                <div className={styles.priceRow}>
                  <span className={styles.price}>{formatNaira(pricing.charge)}</span>
                  <span className={styles.period}>/{mode === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {pricing.saleActive ? (
                  <div className={styles.listPrice}>
                    <s>{formatNaira(pricing.list)}</s>
                    <span className={styles.salePct}>{pricing.percentOff}% off</span>
                  </div>
                ) : (
                  <div className={styles.listPrice} style={{ visibility: 'hidden' }}>
                    &
bsp;
                  </div>
                )}

                <ul className={styles.features}>
                  {features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                  {more > 0 ? <li key="more">+{more} more in product</li> : null}
                </ul>

                <button
                  type="button"
                  className={`${styles.cta}${plan.popular ? ` ${styles.ctaPrimary}` : ''}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.cta || 'Get started'}
                </button>
              </article>
            );
          })}
        </div>

        <div className={styles.enterprise}>
          <div>
            <h3>{ENTERPRISE.name}</h3>
            <p>{ENTERPRISE.tagline}</p>
          </div>
          <div className={styles.enterpriseMeta}>
            <span className={styles.enterprisePrice}>{ENTERPRISE.priceLabel}</span>
            <button type="button" className={styles.enterpriseBtn} onClick={handleEnterprise}>
              {ENTERPRISE.cta}
            </button>
          </div>
        </div>
      </main>

      <Footer onNavigate={handleNavigate} />

      {showPaymentModal && selectedPlan && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
          onClick={() => !isPaying && setShowPaymentModal(false)}
        >
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetTop}>
              <h3 id="pay-modal-title">Subscribe</h3>
              <button
                type="button"
                className={styles.close}
                aria-label="Close"
                disabled={isPaying}
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.chip}>
              <span className={styles.chipName}>{selectedPlan.name}</span>
              <span className={styles.chipPrice}>
                {formatNaira(getPlanChargePrice(selectedPlan, mode).charge)}
                <span style={{ fontWeight: 500, color: '#6b7f74', fontSize: '0.8rem' }}>
                  /{mode === 'monthly' ? 'mo' : 'yr'}
                </span>
              </span>
            </div>

            <label className={styles.label} htmlFor="payment-email">
              Email
            </label>
            <input
              id="payment-email"
              type="email"
              className={styles.input}
              placeholder="you@email.com"
              autoComplete="email"
              inputMode="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={isPaying}
            />
            <p className={styles.hint}>
              Secure checkout with Paystack
              {bfActive ? ' · Black Friday price applied' : ''}
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.payPrimary}
                onClick={handlePayment}
                disabled={isPaying}
              >
                {isPaying ? 'Redirecting…' : 'Pay with Paystack'}
              </button>
              <button
                type="button"
                className={styles.payGhost}
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
    </div>
  );
}

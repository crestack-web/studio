'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import posthog from 'posthog-js';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', primaryDk: '#0369A1', accent: '#6366F1',
  bg: '#F0F9FF', surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  green: '#16A34A', greenBg: '#DCFCE7', red: '#DC2626', redBg: '#FEE2E2',
  purple: '#6B3FE7', purpleBg: '#F3EFFE',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── MO Sell plans ─────────────────────────────────────────────────────────────
const SELL_PLANS = [
  {
    id: 'sell-starter',
    name: 'MO Sell Starter',
    monthlyPrice: 1500, // ₦1,500 (~$1 USD)
    yearlyPrice: 12000, // ₦12,000 (~$8 USD)
    trialPrice: 150,    // ₦150 (~$0.10 USD) — $1 for 3 months = ₦150/month equivalent
    trialMonths: 3,
    features: [
      'AI-powered store builder',
      'Unlimited products',
      'Paystack payments (built-in)',
      '10 premium themes',
      'Custom domain',
      'Digital + physical products',
      'Real-time analytics',
      'Mobile-first design',
    ],
    tag: 'Start for $1',
    tagBg: C.green,
    activeBg: C.greenBg,
    activeBorder: C.green,
    priceColor: C.green,
  },
];

// ── SellSubscribePage ─────────────────────────────────────────────────────────
export default function SellSubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan] = useState('sell-starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/sell-login');
        return;
      }
      setUserEmail(user.email || '');
      setUserId(user.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError('');
    try {
      const { auth, firestore } = initializeFirebase();
      const user = auth.currentUser;
      if (!user) {
        router.replace('/sell-login');
        return;
      }

      const planData = SELL_PLANS.find(p => p.id === selectedPlan);
      if (!planData) {
        setError('Plan not found. Please try again.');
        return;
      }

      // Use trial pricing for first 3 months
      const amount = billingCycle === 'monthly' ? planData.trialPrice : planData.yearlyPrice;

      posthog.capture('sell_subscription_started', {
        plan: selectedPlan,
        billing_cycle: billingCycle,
        amount,
      });

      // Initialize payment via Firebase Cloud Function (same as owner subscribe)
      const response = await fetch('https://us-central1-bizassistant2-62305643-adad7.cloudfunctions.net/initializePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.uid,
          email: user.email,
          amount: amount,
          currency: 'NGN',
          billing: billingCycle,
          callback_url: `${window.location.origin}/sell-subscribe/success`,
          metadata: {
            plan: selectedPlan,
            billing: billingCycle,
            userId: user.uid,
            product: 'mo-sell',
          },
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
    } catch (err: any) {
      console.error('MO Sell subscription error:', err);
      setError(err.message || 'Payment initialization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg, fontFamily: FONT_BODY }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto mb-6" style={{ borderColor: C.primary }} />
          <h2 className="text-xl font-semibold mb-2" style={{ color: C.text1 }}>Loading...</h2>
          <p style={{ color: C.text2 }}>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #E0E7FF 100%)`,
      fontFamily: FONT_BODY,
    }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/email-logo.png" alt="MO Sell" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
            Start Selling with MO
          </h1>
          <p style={{ color: C.text2, maxWidth: 400, margin: '0 auto' }}>
            Get full access to MO Sell for just $1 for 3 months. Then $10/month.
          </p>
        </div>

        {/* Trial Card */}
        <div className="rounded-2xl p-6 mb-6" style={{
          background: C.surface,
          border: `2px solid ${C.green}`,
          boxShadow: '0 8px 32px rgba(22,163,74,0.12)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: C.green }}>
                🎉 LIMITED OFFER
              </span>
              <h2 className="text-xl font-bold mt-2" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
                $1 for 3 Months
              </h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: C.green, fontFamily: FONT_DISPLAY }}>$1</div>
              <div className="text-xs" style={{ color: C.text3 }}>total for 3 months</div>
            </div>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ background: C.greenBg }}>
            <div className="grid grid-cols-2 gap-3">
              {SELL_PLANS[0].features.slice(0, 6).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: C.text2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-xs" style={{ color: C.text3 }}>
            Then $10/month · Cancel anytime · No lock-in
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setBillingCycle('monthly')}
            className="px-6 py-2 rounded-lg font-semibold transition"
            style={{
              background: billingCycle === 'monthly' ? C.primary : C.surface,
              color: billingCycle === 'monthly' ? 'white' : C.text2,
              border: `1px solid ${billingCycle === 'monthly' ? C.primary : C.border}`,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className="px-6 py-2 rounded-lg font-semibold transition"
            style={{
              background: billingCycle === 'yearly' ? C.primary : C.surface,
              color: billingCycle === 'yearly' ? 'white' : C.text2,
              border: `1px solid ${billingCycle === 'yearly' ? C.primary : C.border}`,
            }}
          >
            Yearly
            <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{ background: C.greenBg, color: C.green }}>
              Save 33%
            </span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl text-sm" style={{ background: C.redBg, color: C.red }}>
            {error}
          </div>
        )}

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full py-4 rounded-xl text-white font-bold text-lg transition"
          style={{
            background: isProcessing ? C.text3 : `linear-gradient(135deg, ${C.green} 0%, #15803D 100%)`,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            boxShadow: isProcessing ? 'none' : '0 6px 24px rgba(22,163,74,0.30)',
            fontFamily: FONT_DISPLAY,
          }}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Redirecting to Paystack...
            </span>
          ) : (
            `Start for $1 →`
          )}
        </button>

        {/* Trust */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-xs" style={{ color: C.text3 }}>Secure Payment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✓</div>
            <div className="text-xs" style={{ color: C.text3 }}>Cancel Anytime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-xs" style={{ color: C.text3 }}>Instant Access</div>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { formatCurrency, getUserCountryCode, convertFromUsd, getCurrencyName } from '@/lib/currency';
import posthog from 'posthog-js';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    features: [
      'Sales, Expenses & Inventory',
      'Basic AI Insights (MO)',
      'Manage up to 3 Staff',
      'Basic Analytics',
      'Online Store (Waitlist)',
    ],
    moUsage: '2,500 credits',
    activeBg: '#F4F4F8',
    activeBorder: '#C4C4D4',
    priceColor: '#0A0A0F',
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    tag: 'Most Popular',
    features: [
      'Everything in Starter',
      'Advanced AI & Forecasts',
      'Manage up to 10 Staff',
      'Up to 3 Branches',
      'BusmoPay Integration',
      'Custom Domain',
    ],
    moUsage: '10,000 credits',
    activeBg: '#F3EFFE',
    activeBorder: '#6B3FE7',
    priceColor: '#6B3FE7',
    tagBg: '#6B3FE7',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 25000,
    yearlyPrice: 250000,
    tag: 'Best Value',
    features: [
      'Everything in Standard',
      'Unlimited Staff & Branches',
      'Production Tracking',
      'Access to Investment',
      'POS Integration',
      'Dedicated Account Manager',
    ],
    moUsage: 'Unlimited',
    activeBg: '#FEF3C7',
    activeBorder: '#D97706',
    priceColor: '#D97706',
    tagBg: '#D97706',
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [userPlan, setUserPlan] = useState<string>('starter');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState<string>('NG');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPlan(userData.plan || 'starter');
          setSelectedPlan(userData.plan || 'starter');
        }
      } catch (error) {
        console.error('Error loading user plan:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Detect user country code on mount
  useEffect(() => {
    const countryCode = getUserCountryCode();
    setUserCountryCode(countryCode);
  }, []);

  const handleContinue = async () => {
    console.log('Payment button clicked');
    setIsProcessing(true);
    try {
      const { auth, firestore } = initializeFirebase();
      const user = auth.currentUser;

      console.log('User:', user?.uid);

      if (!user) {
        console.error('No user found');
        router.replace('/login');
        return;
      }

      const selectedPlanData = PLANS.find(p => p.id === selectedPlan);
      if (!selectedPlanData) {
        console.error('No plan data found for:', selectedPlan);
        alert('Unable to process payment. Please try again.');
        return;
      }

      console.log('Selected plan:', selectedPlanData);

      // Get user email
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      const userData = userDoc.data();
      const userEmail = userData?.email || user.email;

      console.log('User email:', userEmail);

      // Get amount based on billing cycle
      const amount = billingCycle === 'monthly' ? selectedPlanData.monthlyPrice : selectedPlanData.yearlyPrice;

      console.log('Amount:', amount, 'Billing cycle:', billingCycle);
      posthog.capture('subscription_checkout_started', {
        plan: selectedPlan,
        billing_cycle: billingCycle,
        amount,
      });

      // Call Firebase Function to initialize subscription payment
      // Use production URL for callback to avoid localhost redirects
      const callbackUrl = 'https://busmo.web.app/subscribe/success';
      console.log('🔗 [Subscribe] Callback URL:', callbackUrl);
      
      const response = await fetch('https://initializepayment-6kxikgkcjq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.uid,
          email: userEmail,
          amount: amount, // Send amount in Naira
          currency: 'NGN',
          billing: billingCycle,
          callback_url: callbackUrl, // Explicitly set callback URL
          metadata: {
            plan: selectedPlan,
            billing: billingCycle,
            userId: user.uid,
          },
        }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        console.error('Payment initialization failed:', data);
        throw new Error(data.error || 'Failed to initialize payment');
      }

      // Redirect to Paystack checkout
      if (data.data && data.data.authorization_url) {
        console.log('Redirecting to Paystack:', data.data.authorization_url);
        window.location.href = data.data.authorization_url;
      } else {
        console.error('No authorization URL in response');
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      console.error('Subscription error:', error);
      alert('We are having issues connecting with payment processors. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-[#0A0A0F] mb-2">Loading Subscription</h2>
          <p className="text-[#555568]">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/email-logo.png" alt="Busmo Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          </div>
          <h1 className="text-3xl font-bold font-headline text-[#0A0A0F] mb-3">
            Choose Your Plan
          </h1>
          <p className="text-[#555568] max-w-2xl mx-auto">
            Your free trial has ended. Select a plan to continue using Busmo and keep access to all your business data.
          </p>
          
          {/* Billing Cycle Toggle */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-[#6B3FE7] text-white'
                  : 'bg-white text-[#555568] hover:bg-gray-50'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === 'yearly'
                  ? 'bg-[#6B3FE7] text-white'
                  : 'bg-white text-[#555568] hover:bg-gray-50'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 17%</span>
            </button>
          </div>
          
          {userPlan !== selectedPlan && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>You selected <strong>{userPlan}</strong> during signup. You can change it now.</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '24px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  background: active ? plan.activeBg : 'white',
                  border: `2px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                  boxShadow: active ? `0 0 0 1px ${plan.activeBorder}30` : '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {plan.tag && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: plan.tagBg,
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '100px',
                  }}>
                    {plan.tag}
                  </span>
                )}

                <div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#0A0A0F',
                    marginBottom: '4px',
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px',
                  }}>
                    <span style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: plan.priceColor,
                    }}>
                      ₦{(billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice).toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#8888A0',
                    }}>
                      / {billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                </div>

                <div style={{
                  width: '100%',
                  height: '1px',
                  background: active ? plan.activeBorder : '#E8E8F0',
                }}/>

                <ul style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}>
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '0.875rem',
                      color: '#555568',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? plan.activeBorder : '#16A34A'} strokeWidth="3" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: `1px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                  fontSize: '0.75rem',
                  color: '#8888A0',
                  textAlign: 'center',
                }}>
                  <span style={{ fontWeight: 600 }}>Ask MO Usage:</span> {plan.moUsage}
                </div>

                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `2px solid ${active ? plan.activeBorder : '#E8E8F0'}`,
                  background: active ? plan.activeBorder : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                }}>
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.back()}
            className="px-8 py-3 text-[#555568] font-semibold hover:bg-white rounded-xl transition"
          >
            ← Back to Dashboard
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Button clicked directly');
              handleContinue();
            }}
            disabled={isProcessing}
            className="px-12 py-4 bg-[#6B3FE7] text-white font-semibold rounded-xl text-base transition hover:bg-[#4B27B0] disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px] relative z-10"
          >
            {isProcessing ? 'Processing...' : `Continue with ${PLANS.find(p => p.id === selectedPlan)?.name} - ₦${(billingCycle === 'monthly' ? PLANS.find(p => p.id === selectedPlan)?.monthlyPrice : PLANS.find(p => p.id === selectedPlan)?.yearlyPrice)?.toLocaleString()}/${billingCycle === 'monthly' ? 'mo' : 'yr'}`}
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <div className="text-xs text-[#8888A0]">Secure Payment</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">✓</div>
            <div className="text-xs text-[#8888A0]">Cancel Anytime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">💾</div>
            <div className="text-xs text-[#8888A0]">Data Preserved</div>
          </div>
        </div>
      </div>
    </div>
  );
}

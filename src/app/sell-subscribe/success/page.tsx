'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const C = {
  primary: '#0EA5E9', bg: '#F0F9FF', surface: '#FFFFFF',
  text1: '#0C1A2E', text2: '#3D5A7A', green: '#16A34A', red: '#DC2626',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

function SellSubscribeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('error');
        setErrorMessage('No payment reference found. Please contact support.');
        return;
      }

      try {
        // Verify payment using the same endpoint as owner subscriptions
        const response = await fetch('/api/payments/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        // Update user's MO Sell subscription status
        const { auth, firestore } = initializeFirebase();
        const user = auth.currentUser;

        if (user) {
          await updateDoc(doc(firestore, 'users', user.uid), {
            moSellSubscription: {
              status: 'active',
              plan: 'sell-starter',
              startDate: new Date(),
              endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
              reference,
            },
            updatedAt: new Date(),
          });
        }

        setStatus('success');

        // Redirect to MO Sell dashboard after 2 seconds
        setTimeout(() => {
          router.push('/sell/dashboard');
        }, 2000);
      } catch (err: any) {
        console.error('MO Sell subscription verification error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Payment verification failed. Please try again.');
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{
      background: `linear-gradient(135deg, ${C.bg} 0%, #E0E7FF 100%)`,
      fontFamily: FONT_BODY,
    }}>
      <div className="max-w-md w-full rounded-2xl shadow-lg p-8 text-center" style={{ background: C.surface }}>
        {status === 'verifying' && (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 mx-auto" style={{ borderColor: C.primary }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
              Verifying Payment
            </h2>
            <p style={{ color: C.text2 }}>Please wait while we confirm your subscription...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: C.green + '20' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
              Welcome to MO Sell! 🎉
            </h2>
            <p className="mb-6" style={{ color: C.text2 }}>
              Your subscription is active. You now have full access to build and manage your online store.
            </p>
            <p className="text-sm" style={{ color: C.text2 }}>Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: C.red + '20' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: C.text1, fontFamily: FONT_DISPLAY }}>
              Verification Failed
            </h2>
            <p className="mb-6" style={{ color: C.text2 }}>{errorMessage}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/sell-subscribe')}
                className="w-full py-3 rounded-xl text-white font-semibold transition"
                style={{ background: C.primary }}
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/sell/dashboard')}
                className="w-full py-3 rounded-xl font-semibold transition"
                style={{ background: C.bg, color: C.text2, border: `1px solid ${C.bg}` }}
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SellSubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="animate-spin rounded-full h-16 w-16 border-b-4" style={{ borderColor: C.primary }} />
      </div>
    }>
      <SellSubscribeSuccessContent />
    </Suspense>
  );
}

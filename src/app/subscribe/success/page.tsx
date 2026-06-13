'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setError('No payment reference found');
        setIsVerifying(false);
        return;
      }

      try {
        // Call the verification endpoint
        const response = await fetch('/api/payments/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        // Payment verified successfully - redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Payment verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
        <div className="text-center">
          <BusmoLogoLoadingSpinner size={120} />
          <h2 className="text-xl font-semibold text-[#0A0A0F] mb-2 mt-4">Verifying Payment</h2>
          <p className="text-[#555568]">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="#FEE2E2"/>
              <circle cx="40" cy="40" r="36" fill="none" stroke="#DC2626" strokeWidth="2"/>
              <path d="M25 25L55 55M55 25L25 55" stroke="#DC2626" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-headline text-[#0A0A0F] mb-3">
            Payment Verification Failed
          </h2>
          <p className="text-[#555568] mb-6">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/subscribe')}
              className="w-full bg-[#6B3FE7] text-white font-semibold rounded-xl h-12 flex items-center justify-center text-base transition hover:bg-[#4B27B0]"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-100 text-[#555568] font-semibold rounded-xl h-12 flex items-center justify-center text-base transition hover:bg-gray-200"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#D1FAE5"/>
            <circle cx="40" cy="40" r="36" fill="none" stroke="#059669" strokeWidth="2"/>
            <path d="M25 40L35 50L55 30" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-headline text-[#0A0A0F] mb-3">
          Payment Successful!
        </h2>
        <p className="text-[#555568] mb-6">
          Your subscription has been activated. Redirecting you to the dashboard...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-purple-600 mx-auto"></div>
      </div>
    </div>
  );
}

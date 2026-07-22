'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

/**
 * /store/[storeSlug]/order/pending
 *
 * Paystack redirects here after payment with ?reference=...
 * We poll /api/store/orders/confirm until the order is confirmed,
 * then redirect to /order/[orderId].
 */

type PollStatus = 'polling' | 'success' | 'failed' | 'expired';

export default function OrderPendingPage() {
  const params       = useParams<{ storeSlug: string }>();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const storeSlug = params.storeSlug;
  const reference = searchParams.get('reference') ?? searchParams.get('trxref') ?? '';

  const [status,  setStatus]  = useState<PollStatus>('polling');
  const [message, setMessage] = useState('Confirming your payment…');
  const attempts = useRef(0);
  const MAX_ATTEMPTS = 12; // 12 × 5s = 60s total

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found. Please contact support.');
      return;
    }

    const businessId = sessionStorage.getItem(`mo_checkout_${storeSlug}_businessId`) ?? '';
    const sessionId  = sessionStorage.getItem(`mo_checkout_${storeSlug}`) ?? '';

    // Retrieve businessId from config if not cached
    async function resolveBusinessId(): Promise<string> {
      if (businessId) return businessId;
      try {
        const res = await fetch(`/api/store/config/${storeSlug}`);
        if (res.ok) {
          const cfg = await res.json();
          sessionStorage.setItem(`mo_checkout_${storeSlug}_businessId`, cfg.businessId);
          return cfg.businessId;
        }
      } catch { /* ignore */ }
      return '';
    }

    async function poll() {
      if (attempts.current >= MAX_ATTEMPTS) {
        setStatus('failed');
        setMessage('Payment confirmation timed out. If you were charged, your order will be processed shortly. Please check your email.');
        return;
      }
      attempts.current += 1;

      try {
        const bId = await resolveBusinessId();
        const res = await fetch('/api/store/orders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paystackReference: reference,
            sessionId,
            businessId: bId,
          }),
        });

        const data = await res.json() as {
          orderId?: string;
          error?: string;
        };

        if (res.ok && data.orderId) {
          setStatus('success');
          setMessage('Payment confirmed! Redirecting…');
          // Clean up session storage
          sessionStorage.removeItem(`mo_checkout_${storeSlug}`);
          sessionStorage.removeItem(`mo_checkout_${storeSlug}_businessId`);
          // Fire order_completed analytics
          fetch('/api/store/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType: 'order_completed', storeSlug, businessId: bId, pageType: 'order_pending' }),
          }).catch(() => {});
          router.replace(`/store/${storeSlug}/order/${data.orderId}`);
          return;
        }

        if (res.status === 402) {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
          return;
        }

        if (res.status === 410) {
          setStatus('expired');
          setMessage('This checkout session has expired. Please start a new order.');
          return;
        }

        // Still processing — retry after delay
        setTimeout(poll, 5000);
      } catch {
        // Network error — retry
        setTimeout(poll, 5000);
      }
    }

    // Initial small delay then start polling
    setTimeout(poll, 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, storeSlug]);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      textAlign: 'center', padding: '32px 24px',
    }}>
      {status === 'polling' && (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            border: '4px solid var(--sf-border)',
            borderTopColor: 'var(--sf-primary)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>
            Confirming your order
          </h2>
          <p style={{ color: 'var(--sf-text-3)', maxWidth: 340 }}>
            Please wait while we verify your payment. This usually takes a few seconds.
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#D1FAE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>
            {message}
          </h2>
        </>
      )}

      {(status === 'failed' || status === 'expired') && (
        <>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#FEE2E2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>
            {status === 'expired' ? '⏰' : '✕'}
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>
            {status === 'expired' ? 'Session expired' : 'Payment not confirmed'}
          </h2>
          <p style={{ color: 'var(--sf-text-3)', maxWidth: 380, lineHeight: 1.6 }}>
            {message}
          </p>
          <button
            onClick={() => router.push(`/store/${storeSlug}`)}
            style={{
              padding: '10px 24px', background: 'var(--sf-primary)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Return to store
          </button>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ConfirmEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing confirmation token. Please use the link from your email.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/auth/confirm-email?token=${encodeURIComponent(token)}`,
          { method: 'GET' }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Confirmation failed. The link may be invalid or expired.');
          return;
        }
        setStatus('success');
        setMessage('Your email is confirmed. You can log in to Busmo.');
      } catch {
        if (cancelled) return;
        setStatus('error');
        setMessage('Something went wrong. Please try again or request a new link.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background:
          'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,63,231,0.08) 0%, transparent 65%), #F4F4F8',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#fff',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          border: '1px solid #E8E8F0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0A0A0F',
            margin: '0 0 12px',
            fontFamily: "'Sora', sans-serif",
          }}
        >
          {status === 'loading'
            ? 'Confirming email'
            : status === 'success'
              ? 'Email confirmed'
              : 'Confirmation failed'}
        </h1>
        <p style={{ fontSize: 15, color: '#555568', lineHeight: 1.55, margin: '0 0 24px' }}>
          {message}
        </p>

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              href="/login"
              style={{
                display: 'block',
                padding: '13px 20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg,#6B3FE7,#8B5CF6)',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Owner login
            </Link>
            <Link
              href="/login/staff"
              style={{
                display: 'block',
                padding: '13px 20px',
                borderRadius: 12,
                background: '#16A34A',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Staff login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <Link
            href="/login"
            style={{ color: '#6B3FE7', fontWeight: 600, fontSize: 14 }}
          >
            Back to login
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
          }}
        >
          Loading…
        </div>
      }
    >
      <ConfirmEmailInner />
    </Suspense>
  );
}

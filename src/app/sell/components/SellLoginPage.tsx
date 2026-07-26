'use client';

import React, { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

// ── MO Sell logo mark ──────────────────────────────────────────────────────
function SellMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="url(#sellGrad)" />
      <defs>
        <linearGradient id="sellGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {/* shopping bag */}
      <path
        d="M11 14h18l-2 14H13L11 14z"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M16 14v-2a4 4 0 018 0v2"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Google mark ────────────────────────────────────────────────────────────
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── BusMo Busmo mini-logo ─────────────────────────────────────────────────
function BusmoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="#0A1E1E" />
      <circle cx="40" cy="40" r="36" fill="none" stroke="#2ABFBF" strokeWidth="1.5" />
      <circle cx="40" cy="36" r="20" fill="#F5C9A0" />
      <path d="M20 32 C20 18 60 18 60 32 L60 25 C60 13 20 13 20 25 Z" fill="#2C1A0E" />
      <circle cx="31" cy="35" r="4" fill="white" />
      <circle cx="49" cy="35" r="4" fill="white" />
      <circle cx="31" cy="35.5" r="2.5" fill="#1A2B3C" />
      <circle cx="49" cy="35.5" r="2.5" fill="#1A2B3C" />
      <path d="M30 43 Q40 49 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="40" cy="66" rx="15" ry="6" fill="#1A8F8F" opacity="0.9" />
      <rect x="32" y="56" width="16" height="10" rx="5" fill="#F5C9A0" />
    </svg>
  );
}

// ── Input field ────────────────────────────────────────────────────────────
function Field({
  label, id, type = 'text', value, onChange, placeholder, autoComplete, disabled,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--sell-text-2, #3D5A7A)',
          letterSpacing: '0.02em',
          fontFamily: 'var(--sell-font-body)',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--sell-surface-2, #F8FBFF)',
          border: `1.5px solid ${focused ? 'var(--sell-primary, #0EA5E9)' : 'var(--sell-border, #E0EFFA)'}`,
          boxShadow: focused ? '0 0 0 3px var(--sell-primary-glow, rgba(14,165,233,0.15))' : 'none',
          transition: 'all 0.18s ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '12px 14px',
            fontSize: 14,
            color: 'var(--sell-text-1, #0C1A2E)',
            fontFamily: 'var(--sell-font-body, "Plus Jakarta Sans", sans-serif)',
          }}
        />
      </div>
    </div>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--sell-border, #E0EFFA)' }} />
      <span style={{ fontSize: 12, color: 'var(--sell-text-3, #8AAABF)', fontWeight: 500 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--sell-border, #E0EFFA)' }} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export function SellLoginPage() {
  const [tab, setTab] = useState<'email' | 'busmo'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const emailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  // ── Shared: redirect to sell dashboard ──────────────────────────────────
  async function handlePostAuth() {
    window.location.href = '/sell';
  }

  // ── Email + password login ────────────────────────────────────────────────
  async function handleEmailLogin() {
    setLoading(true);
    setError('');
    try {
      const { auth } = initializeFirebase();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handlePostAuth();
    } catch (err: any) {
      const code = err?.code ?? '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password. Please try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact support.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── BusMo Google sign-in ──────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      const { auth } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      await handlePostAuth();
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed — no error needed
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Password reset ────────────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address above first, then click "Forgot password".');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { auth } = initializeFirebase();
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch {
      setError('Could not send reset email. Make sure the email address is correct.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div
      data-sell-theme="light"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background:
          'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(14,165,233,0.08) 0%, transparent 65%), #F0F9FF',
        fontFamily: 'var(--sell-font-body, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.5,
          backgroundImage:
            'radial-gradient(circle, rgba(14,165,233,0.13) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: '28px 28px 32px',
            border: '1px solid #E0EFFA',
            boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 56px rgba(14,165,233,0.10)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="Mo-sell" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0C1A2E',
                fontFamily: 'var(--sell-font-display, "Plus Jakarta Sans", sans-serif)',
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              Sign in to your store
            </h1>
            <p style={{ fontSize: 14, color: '#3D5A7A', margin: 0, lineHeight: 1.5 }}>
              Manage products, orders, and analytics for your online store.
            </p>
          </div>

          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              background: '#F0F9FF',
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}
            role="tablist"
          >
            {(
              [
                { key: 'email', label: 'Email & Password' },
                { key: 'busmo', label: 'BusMo Account' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => {
                  setTab(key);
                  setError('');
                  setResetSent(false);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 9,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--sell-font-body)',
                  transition: 'all 0.18s ease',
                  background: tab === key ? 'white' : 'transparent',
                  color: tab === key ? '#0EA5E9' : '#3D5A7A',
                  boxShadow: tab === key ? '0 1px 4px rgba(14,165,233,0.15)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Email tab ── */}
          {tab === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field
                label="Email address"
                id="sell-email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
              <Field
                label="Password"
                id="sell-password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Your password"
                autoComplete="current-password"
                disabled={loading}
              />

              {/* Forgot password */}
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: resetLoading || loading ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    color: '#0EA5E9',
                    fontWeight: 600,
                    fontFamily: 'var(--sell-font-body)',
                    padding: 0,
                    opacity: resetLoading ? 0.6 : 1,
                  }}
                >
                  {resetLoading ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>

              {resetSent && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#16A34A',
                    background: '#DCFCE7',
                    padding: '10px 14px',
                    borderRadius: 9,
                    margin: 0,
                  }}
                >
                  ✓ Reset link sent — check your inbox.
                </p>
              )}

              {error && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#DC2626',
                    background: '#FEE2E2',
                    padding: '10px 14px',
                    borderRadius: 9,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              {/* Login button */}
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={!emailValid || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: !emailValid || loading ? 'not-allowed' : 'pointer',
                  background:
                    !emailValid || loading
                      ? '#BAE6FD'
                      : 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                  color: 'white',
                  fontFamily: 'var(--sell-font-display, "Plus Jakarta Sans", sans-serif)',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  transition: 'all 0.18s ease',
                  boxShadow:
                    !emailValid || loading
                      ? 'none'
                      : '0 4px 14px rgba(14,165,233,0.30)',
                }}
                onMouseEnter={(e) => {
                  if (emailValid && !loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.38)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (emailValid && !loading) {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(14,165,233,0.30)';
                  }
                }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* ── BusMo Account tab ── */}
          {tab === 'busmo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: 14, color: '#3D5A7A', margin: 0, lineHeight: 1.55 }}>
                Sign in with your existing BusMo account — no separate password needed.
              </p>

              {error && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#DC2626',
                    background: '#FEE2E2',
                    padding: '10px 14px',
                    borderRadius: 9,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              {/* BusMo → Google button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  padding: '13px 24px',
                  borderRadius: 12,
                  border: '1.5px solid #E0EFFA',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#F8FBFF' : 'white',
                  color: '#0C1A2E',
                  fontFamily: 'var(--sell-font-body, "Plus Jakarta Sans", sans-serif)',
                  fontSize: 14,
                  fontWeight: 700,
                  transition: 'all 0.18s ease',
                  boxShadow: '0 1px 4px rgba(14,88,140,0.07)',
                  opacity: loading ? 0.65 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#0EA5E9';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(14,165,233,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#E0EFFA';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(14,88,140,0.07)';
                  }
                }}
              >
                <GoogleMark />
                {loading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <Divider label="or sign in with BusMo email" />

              {/* Inline email+password re-use for BusMo */}
              <Field
                label="BusMo email"
                id="busmo-email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
              <Field
                label="BusMo password"
                id="busmo-password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Your BusMo password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={!emailValid || loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '13px 24px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: !emailValid || loading ? 'not-allowed' : 'pointer',
                  background:
                    !emailValid || loading
                      ? '#E0F2FE'
                      : 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                  color: !emailValid || loading ? '#7AABCC' : 'white',
                  fontFamily: 'var(--sell-font-display, "Plus Jakarta Sans", sans-serif)',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  transition: 'all 0.18s ease',
                  boxShadow:
                    !emailValid || loading
                      ? 'none'
                      : '0 4px 14px rgba(14,165,233,0.30)',
                }}
              >
                <BusmoMark size={18} />
                {loading ? 'Signing in…' : 'Sign in with BusMo'}
              </button>

              {/* Forgot password for this tab */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: resetLoading || loading ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    color: '#0EA5E9',
                    fontWeight: 600,
                    fontFamily: 'var(--sell-font-body)',
                    padding: 0,
                    opacity: resetLoading ? 0.6 : 1,
                  }}
                >
                  {resetLoading ? 'Sending…' : 'Forgot password?'}
                </button>
              </div>

              {resetSent && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#16A34A',
                    background: '#DCFCE7',
                    padding: '10px 14px',
                    borderRadius: 9,
                    margin: 0,
                  }}
                >
                  ✓ Reset link sent — check your inbox.
                </p>
              )}
            </div>
          )}

          {/* Footer nav */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 4,
              borderTop: '1px solid #E0EFFA',
              fontSize: 13,
              color: '#3D5A7A',
            }}
          >
            <a
              href="/login"
              style={{ color: '#3D5A7A', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#0EA5E9')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = '#3D5A7A')}
            >
              ← Back to main login
            </a>
            <a
              href="/welcome/signup"
              style={{ color: '#0EA5E9', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}
            >
              Create account →
            </a>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#8AAABF' }}>
          © {new Date().getFullYear()} Busmo · MO Sell · Built for African commerce
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { initializeFirebase } from '@/firebase';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', accent: '#6366F1', bg: '#F0F9FF',
  surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  red: '#DC2626', redBg: '#FEE2E2', green: '#16A34A', greenBg: '#DCFCE7',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── Logo mark ─────────────────────────────────────────────────────────────────
function SellMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="url(#slg)" />
      <defs>
        <linearGradient id="slg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" /><stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <path d="M11 14h18l-2 14H13L11 14z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 14v-2a4 4 0 018 0v2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── Google mark ───────────────────────────────────────────────────────────────
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, autoComplete, disabled }: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  autoComplete?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: C.text2, fontFamily: FONT_BODY }}>
        {label}
      </label>
      <input
        id={id} type={type} value={value} autoComplete={autoComplete}
        disabled={disabled} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: '12px 14px', borderRadius: 10, fontSize: 14,
          fontFamily: FONT_BODY, color: C.text1, background: '#F8FBFF',
          outline: 'none', transition: 'all 0.18s ease',
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SellLoginPage() {
  const [tab, setTab]           = useState<'email' | 'google'>('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resetSent, setResetSent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  function goToDashboard() {
    window.location.href = '/sell/dashboard';
  }

  async function handleEmailLogin() {
    setLoading(true); setError('');
    try {
      const { auth } = initializeFirebase();
      await signInWithEmailAndPassword(auth, email, password);
      goToDashboard();
    } catch (err: any) {
      const code = err?.code ?? '';
      if (['auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(code)) {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally { setLoading(false); }
  }

  async function handleGoogleLogin() {
    setLoading(true); setError('');
    try {
      const { auth } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      goToDashboard();
    } catch (err: any) {
      const code = err?.code ?? '';
      if (!['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(code)) {
        setError('Google sign-in failed. Please try again.');
      }
    } finally { setLoading(false); }
  }

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email first, then click forgot password.'); return; }
    try {
      const { auth } = initializeFirebase();
      await sendPasswordResetEmail(auth, email);
      setResetSent(true); setError('');
    } catch {
      setError('Could not send reset email. Check the address and try again.');
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${FONT_BODY}; background: ${C.bg}; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', background: C.bg, fontFamily: FONT_BODY,
        backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.10) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}>
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Card */}
          <div style={{
            background: C.surface, borderRadius: 24, padding: '28px 28px 32px',
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 56px rgba(14,165,233,0.10)',
            display: 'flex', flexDirection: 'column', gap: 22,
          }}>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784635544/mo_sell_2_li0pby.png" alt="Mo-sell" style={{ height: 108, width: 'auto', objectFit: 'contain' }} />
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.text1, letterSpacing: '-0.025em', lineHeight: 1.2, margin: 0 }}>
                Sign in to your store
              </h1>
              <p style={{ fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.5 }}>
                Manage products, orders and analytics.
              </p>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', background: '#F0F9FF', borderRadius: 12, padding: 4, gap: 4 }}>
              {(['email', 'google'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(''); setResetSent(false); }} style={{
                  flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: FONT_BODY, transition: 'all 0.18s ease',
                  background: tab === t ? 'white' : 'transparent',
                  color: tab === t ? C.primary : C.text2,
                  boxShadow: tab === t ? '0 1px 4px rgba(14,165,233,0.15)' : 'none',
                }}>
                  {t === 'email' ? 'Email & Password' : 'Continue with Google'}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <p style={{ fontSize: 13, color: C.red, background: C.redBg, padding: '10px 14px', borderRadius: 9, margin: 0 }}>
                {error}
              </p>
            )}

            {/* Reset sent */}
            {resetSent && (
              <p style={{ fontSize: 13, color: C.green, background: C.greenBg, padding: '10px 14px', borderRadius: 9, margin: 0 }}>
                ✓ Reset link sent — check your inbox.
              </p>
            )}

            {/* Email tab */}
            {tab === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Email address" id="sl-email" type="email" value={email}
                  onChange={setEmail} placeholder="you@example.com" autoComplete="email" disabled={loading} />
                <Field label="Password" id="sl-password" type="password" value={password}
                  onChange={setPassword} placeholder="Your password" autoComplete="current-password" disabled={loading} />

                <div style={{ textAlign: 'right', marginTop: -6 }}>
                  <button onClick={handleForgotPassword} disabled={loading} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: C.primary, fontWeight: 600, fontFamily: FONT_BODY, padding: 0,
                  }}>
                    Forgot password?
                  </button>
                </div>

                <button onClick={handleEmailLogin} disabled={!emailValid || loading} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 12, border: 'none', fontFamily: FONT_DISPLAY,
                  fontSize: 15, fontWeight: 700, cursor: !emailValid || loading ? 'not-allowed' : 'pointer',
                  background: !emailValid || loading
                    ? '#BAE6FD'
                    : `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  color: !emailValid || loading ? '#7AABCC' : 'white',
                  boxShadow: !emailValid || loading ? 'none' : '0 4px 14px rgba(14,165,233,0.30)',
                  transition: 'all 0.18s ease',
                }}>
                  {loading ? 'Signing in…' : 'Sign in to MO Sell'}
                  {!loading && <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
              </div>
            )}

            {/* Google tab */}
            {tab === 'google' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 14, color: C.text2, margin: 0, lineHeight: 1.55 }}>
                  Sign in with your Google account linked to Busmo — no separate password needed.
                </p>
                <button onClick={handleGoogleLogin} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '13px 24px', borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 700, color: C.text1,
                  boxShadow: '0 1px 4px rgba(14,88,140,0.07)',
                  opacity: loading ? 0.65 : 1, transition: 'all 0.18s ease',
                }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.primary; } }}
                  onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; } }}
                >
                  <GoogleMark />
                  {loading ? 'Signing in…' : 'Continue with Google'}
                </button>
              </div>
            )}

            {/* Footer nav */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 4, borderTop: `1px solid ${C.border}`,
              fontSize: 13, color: C.text2,
            }}>
              <a href="/sell-welcome" style={{ color: C.text2, textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.primary)}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = C.text2)}>
                ← About MO Sell
              </a>
              <a href="/welcome/signup" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline')}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none')}>
                Create account →
              </a>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: C.text3 }}>
            © {new Date().getFullYear()} Busmo · MO Sell · Built for African commerce
          </p>
        </div>
      </div>
    </>
  );
}

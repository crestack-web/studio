'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';

type Mode = 'login' | 'signup';

async function bearerHeaders() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function IndustryAuthForm({ config, mode }: { config: IndustryConfig; mode: Mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  async function resolveAndRedirect(fallbackEdition: string) {
    const headers = await bearerHeaders();
    const res = await fetch('/api/industries/session', { headers });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.session) {
      if (json.session.needsOnboarding) {
        setRecovery(
          'Your account exists but organization setup is incomplete. Enter your business name and continue.'
        );
        return false;
      }
      const edition = json.session.productEdition as string;
      if (edition === 'hospitality') window.location.href = '/industries/hospitality/dashboard';
      else if (edition === 'professional') window.location.href = '/industries/professional/dashboard';
      else if (edition === 'healthcare') window.location.href = '/industries/healthcare/dashboard';
      else if (edition === 'education') window.location.href = '/industries/education/dashboard';
      else window.location.href = '/owner/dashboard';
      return true;
    }
    if (fallbackEdition === 'hospitality') window.location.href = '/industries/hospitality/dashboard';
    else if (fallbackEdition === 'professional') window.location.href = '/industries/professional/dashboard';
    else if (fallbackEdition === 'healthcare') window.location.href = '/industries/healthcare/dashboard';
    else if (fallbackEdition === 'education') window.location.href = '/industries/education/dashboard';
    else window.location.href = '/owner/dashboard';
    return true;
  }

  async function completeOnboarding(name: string) {
    const headers = await bearerHeaders();
    const res = await fetch('/api/industries/onboard', {
      method: 'POST',
      headers,
      body: JSON.stringify({ businessName: name, productEdition: config.id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Organization setup failed. Please try again.');
    window.location.href = json.dashboardPath || config.dashboardPath;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setRecovery(null);
    setNeedsEmailConfirm(false);
    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured.');
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabase();

      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        const ok = await resolveAndRedirect(config.id);
        if (!ok) setLoading(false);
        return;
      }

      // Signup — same path as Busmo Business (/api/auth/signup model)
      const name = businessName.trim() || `${config.shortName} business`;
      const signupRes = await fetch('/api/industries/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          businessName: name,
          productEdition: config.id,
        }),
      });
      const signupJson = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok) {
        if (signupJson?.code === 'email_exists') {
          throw new Error(signupJson.error || 'An account with this email already exists. Please log in instead.');
        }
        throw new Error(signupJson.error || 'Failed to create account. Please try again.');
      }

      // Custom confirmation email (same as business signup)
      if (signupJson.userId && email.trim()) {
        try {
          await fetch('/api/auth/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              userId: signupJson.userId,
              name,
            }),
          });
        } catch {
          /* non-blocking */
        }
      }

      setNeedsEmailConfirm(true);
      setInfo(
        'Account created. Check your email to confirm, then sign in to open your workspace.'
      );
      setLoading(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setLoading(false);
    }
  }

  async function onRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeOnboarding(businessName.trim() || `${config.shortName} business`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Recovery failed');
      setLoading(false);
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/email-logo.png" alt="" width={36} height={36} />
            <span style={{ fontWeight: 700, color: '#6b3fe7' }}>{config.productName}</span>
          </div>
          <h1>Confirm your email</h1>
          <p className={styles.sub}>
            We created your {config.shortName.toLowerCase()} workspace. Open the link we sent to{' '}
            <strong>{email.trim()}</strong>, then sign in.
          </p>
          {info && (
            <div
              className={styles.authError}
              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            >
              {info}
            </div>
          )}
          <Link href={config.loginPath} className={styles.authSubmit} style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to sign in
          </Link>
          <p className={styles.authAlt}>
            <Link href={config.welcomePath}>← Back to {config.productName}</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/email-logo.png" alt="" width={36} height={36} />
          <span style={{ fontWeight: 700, color: '#6b3fe7' }}>{config.productName}</span>
        </div>
        <h1>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        <p className={styles.sub}>
          {mode === 'login'
            ? `Access your ${config.shortName.toLowerCase()} workspace`
            : `Start ${config.productName} for your ${config.greetingNoun}`}
        </p>
        {error && <div className={styles.authError}>{error}</div>}
        {recovery && (
          <div className={styles.authError} style={{ background: '#fff7ed', color: '#9a3412' }}>
            {recovery}
          </div>
        )}
        <form onSubmit={recovery ? onRecover : onSubmit}>
          {(mode === 'signup' || recovery) && (
            <div className={styles.field}>
              <label htmlFor="biz">{config.id === 'hospitality' ? 'Hotel name' : config.id === 'healthcare' ? 'Clinic name' : config.id === 'education' ? 'School name' : 'Business name'}</label>
              <input
                id="biz"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={config.id === 'hospitality' ? 'e.g. Palm Court Hotel' : config.id === 'healthcare' ? 'e.g. Greenfield Clinic' : config.id === 'education' ? 'e.g. Horizon Academy' : 'e.g. Northstar Consulting'}
                autoComplete="organization"
                required={mode === 'signup' || !!recovery}
              />
            </div>
          )}
          {!recovery && (
            <>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </>
          )}
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? 'Please wait…' : recovery ? 'Complete setup' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className={styles.authAlt}>
          {mode === 'login' ? (
            <>
              New here? <Link href={config.signupPath}>Get started</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href={config.loginPath}>Sign in</Link>
            </>
          )}
        </p>
        <p className={styles.authAlt}>
          <Link href={config.welcomePath}>← Back to {config.productName}</Link>
          {' · '}
          <Link href="/login">Busmo Business login</Link>
        </p>
      </div>
    </div>
  );
}

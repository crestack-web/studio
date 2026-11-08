'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryShell.module.css';

type Mode = 'login' | 'signup';

export function IndustryAuthForm({
  config,
  mode,
}: {
  config: IndustryConfig;
  mode: Mode;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured.');
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        const meta = data.user?.user_metadata || {};
        const edition =
          meta.product_edition || meta.industry || meta.category || config.id;
        if (edition === 'hospitality') {
          window.location.href = '/industries/hospitality/dashboard';
        } else if (edition === 'professional') {
          window.location.href = '/industries/professional/dashboard';
        } else {
          window.location.href = config.dashboardPath;
        }
        return;
      }

      const name = businessName.trim() || `${config.shortName} business`;
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: 'Owner',
            product_edition: config.id,
            industry: config.id,
            category: config.id,
            businessName: name,
          },
        },
      });
      if (err) throw err;

      try {
        const uid = data.user?.id;
        if (uid) {
          await supabase.from('businesses').insert({
            name,
            category: config.id,
            industry: config.id,
            owner_id: uid,
            metadata: { product_edition: config.id },
          } as any);
        }
      } catch {
        /* schema variants may differ; dashboard still loads */
      }

      window.location.href = config.dashboardPath;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
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

        <form onSubmit={onSubmit}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label htmlFor="biz">{config.id === 'hospitality' ? 'Hotel name' : 'Business name'}</label>
              <input
                id="biz"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={config.id === 'hospitality' ? 'e.g. Palm Court Hotel' : 'e.g. Northstar Consulting'}
                autoComplete="organization"
              />
            </div>
          )}
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
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
          <button type="submit" className={styles.authSubmit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
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

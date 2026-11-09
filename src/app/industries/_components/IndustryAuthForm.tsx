'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import {
  getIndustryIntake,
  validateIndustryDetails,
} from '@/lib/industries/solution-intake';
import styles from './IndustryShell.module.css';

type Mode = 'login' | 'signup';
type SignupStep = 'account' | 'details';

async function bearerHeaders() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function IndustryAuthForm({ config, mode }: { config: IndustryConfig; mode: Mode }) {
  const intake = useMemo(() => getIndustryIntake(config.id), [config.id]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [solutionDetails, setSolutionDetails] = useState<Record<string, string | string[]>>({});
  const [signupStep, setSignupStep] = useState<SignupStep>('account');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  function setDetail(fieldId: string, value: string | string[]) {
    setSolutionDetails((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function resolveAndRedirect(fallbackEdition: string) {
    const headers = await bearerHeaders();
    const res = await fetch('/api/industries/session', { headers });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.session) {
      if (json.session.needsOnboarding) {
        setRecovery(
          'Your account exists but organization setup is incomplete. Complete the details below to finish.'
        );
        setSignupStep('details');
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
      body: JSON.stringify({
        businessName: name,
        productEdition: config.id,
        solutionDetails,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Organization setup failed. Please try again.');
    window.location.href = json.dashboardPath || config.dashboardPath;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setNeedsEmailConfirm(false);

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured.');
      return;
    }

    // Login stays single-step
    if (mode === 'login' && !recovery) {
      setLoading(true);
      try {
        const supabase = getSupabase();
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        const ok = await resolveAndRedirect(config.id);
        if (!ok) setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Sign in failed');
        setLoading(false);
      }
      return;
    }

    // Signup / recovery — step 1: account fields only
    if (mode === 'signup' && signupStep === 'account' && !recovery) {
      if (!businessName.trim()) {
        setError(`Enter your ${intake.orgLabel.toLowerCase()}.`);
        return;
      }
      if (!email.trim() || !password || password.length < 6) {
        setError('Use a valid email and a password of at least 6 characters.');
        return;
      }
      setSignupStep('details');
      return;
    }

    // Step 2: solution details (signup or recovery)
    const detailErr = validateIndustryDetails(config.id, solutionDetails);
    if (detailErr) {
      setError(detailErr);
      return;
    }
    if (!(businessName.trim() || recovery)) {
      setError(`Enter your ${intake.orgLabel.toLowerCase()}.`);
      setSignupStep('account');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const name = businessName.trim() || `${config.shortName} business`;

      if (recovery) {
        await completeOnboarding(name);
        return;
      }

      // Create account then onboard with full solution profile
      const signupRes = await fetch('/api/industries/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          businessName: name,
          productEdition: config.id,
          solutionDetails,
        }),
      });
      const signupJson = await signupRes.json().catch(() => ({}));

      if (!signupRes.ok) {
        // Fallback: auth signup + onboard (legacy path)
        if (signupRes.status === 404 || signupJson.error === 'Not found') {
          const { data: signData, error: signErr } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                businessName: name,
                product_edition: config.id,
                industry: config.id,
                solutionDetails,
              },
            },
          });
          if (signErr) throw signErr;
          if (!signData.session) {
            setNeedsEmailConfirm(true);
            setInfo('Check your email to confirm your account, then sign in to finish setup.');
            setLoading(false);
            return;
          }
          await completeOnboarding(name);
          return;
        }
        throw new Error(signupJson.error || 'Could not create account');
      }

      // If API created user but no session, sign in then onboard
      if (!signupJson.session) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginErr) {
          setNeedsEmailConfirm(true);
          setInfo(signupJson.message || 'Account created. Confirm email if required, then sign in.');
          setLoading(false);
          return;
        }
      }

      // Prefer server onboard if signup API already finished; else complete here
      if (signupJson.dashboardPath && signupJson.onboarded) {
        window.location.href = signupJson.dashboardPath;
        return;
      }

      await completeOnboarding(name);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const showDetails =
    mode === 'signup' && (signupStep === 'details' || !!recovery);

  return (
    <div className={styles.authCard}>
      <div className={styles.authBrand}>
        <span className={styles.authLogo} aria-hidden>
          $
        </span>
        <span>{config.productName}</span>
      </div>

      <h1>
        {mode === 'login' && !recovery
          ? 'Sign in'
          : showDetails
            ? 'Tell us about your operations'
            : 'Create your account'}
      </h1>
      <p className={styles.authLead}>
        {mode === 'login' && !recovery
          ? `Sign in to ${config.productName}`
          : showDetails
            ? intake.sub
            : `Start ${config.productName} for your ${config.greetingNoun}`}
      </p>

      {mode === 'signup' && !recovery && (
        <div className={styles.stepRow} aria-label={`Step ${showDetails ? 2 : 1} of 2`}>
          <span className={!showDetails ? styles.stepActive : styles.stepDone}>1. Account</span>
          <span className={styles.stepSep} />
          <span className={showDetails ? styles.stepActive : styles.stepIdle}>2. Operations</span>
        </div>
      )}

      {error && <div className={styles.authError}>{error}</div>}
      {info && <div className={styles.authInfo}>{info}</div>}
      {recovery && <div className={styles.authInfo}>{recovery}</div>}
      {needsEmailConfirm && (
        <div className={styles.authInfo}>
          Confirm your email if prompted, then return here to sign in.
        </div>
      )}

      <form onSubmit={onSubmit} className={styles.authForm}>
        {(mode === 'login' || (mode === 'signup' && !showDetails) || recovery) && (
          <>
            {(mode === 'signup' || recovery) && (
              <div className={styles.field}>
                <label htmlFor="biz">{intake.orgLabel}</label>
                <input
                  id="biz"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={intake.orgPlaceholder}
                  required={mode === 'signup' || !!recovery}
                  autoComplete="organization"
                />
              </div>
            )}
            {!recovery && (
              <>
                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </>
            )}
          </>
        )}

        {showDetails && (
          <div className={styles.intakeBlock}>
            <div className={styles.intakeHead}>
              <strong>{intake.headline}</strong>
              <div className={styles.outcomeRow}>
                {intake.outcomes.map((o) => (
                  <span key={o} className={styles.outcomeChip}>
                    {o}
                  </span>
                ))}
              </div>
            </div>
            {intake.fields.map((field) => {
              const value = solutionDetails[field.id];
              return (
                <div key={field.id} className={styles.field}>
                  <label>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </label>
                  {field.type === 'text' || field.type === 'number' ? (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={typeof value === 'string' ? value : ''}
                      placeholder={field.placeholder || ''}
                      onChange={(e) => setDetail(field.id, e.target.value)}
                    />
                  ) : (
                    <div className={styles.chipRow}>
                      {(field.options || []).map((opt) => {
                        const active =
                          field.type === 'multi'
                            ? Array.isArray(value) && value.includes(opt.id)
                            : value === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={active ? styles.chipActive : styles.chip}
                            aria-pressed={active}
                            onClick={() => {
                              if (field.type === 'multi') {
                                const arr = Array.isArray(value) ? [...value] : [];
                                setDetail(
                                  field.id,
                                  arr.includes(opt.id)
                                    ? arr.filter((x) => x !== opt.id)
                                    : [...arr, opt.id]
                                );
                              } else {
                                setDetail(field.id, opt.id);
                              }
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {field.help ? <span className={styles.fieldHelp}>{field.help}</span> : null}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.authActions}>
          {showDetails && mode === 'signup' && !recovery && (
            <button
              type="button"
              className={styles.btnGhost}
              disabled={loading}
              onClick={() => {
                setError(null);
                setSignupStep('account');
              }}
            >
              Back
            </button>
          )}
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'login' && !recovery
                ? 'Sign in'
                : showDetails
                  ? 'Finish setup'
                  : 'Continue'}
          </button>
        </div>
      </form>

      <p className={styles.authSwitch}>
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
      <p className={styles.authFooterLinks}>
        <Link href={config.welcomePath}>← Back to {config.productName}</Link>
        {' · '}
        <Link href="/welcome/login">Busmo Business login</Link>
      </p>
    </div>
  );
}

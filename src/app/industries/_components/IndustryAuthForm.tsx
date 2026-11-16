'use client';

import { trackSignupSuccess, trackViewContent, trackClickButton } from '@/lib/tiktok/pixel';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOAuthCallbackUrl } from '@/lib/site-url';
import type { IndustryConfig } from '@/lib/industries/types';
import {
  getIndustryIntake,
  validateIndustryDetails,
} from '@/lib/industries/solution-intake';
import { Icon } from '../_design/icons';
import '../_design/solutions.css';
import styles from './IndustryAuth.module.css';

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
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleSession, setIsGoogleSession] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const taglineMatch = config.tagline.match(/^([^.!?]+[.!?])\s*(.+)$/);
  const taglineLead = taglineMatch ? taglineMatch[1] : config.tagline;
  const taglineRest = taglineMatch ? taglineMatch[2] : '';

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
        setIsGoogleSession(true);
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

      if (isGoogleSession) {
        try {
          const { data: sess } = await supabase.auth.getSession();
          const uid = sess.session?.user?.id;
          if (uid) {
            await trackSignupSuccess({
              userId: uid,
              email: sess.session?.user?.email || email.trim() || null,
            });
          }
        } catch (_) {}
        await completeOnboarding(name);
        return;
      }

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
          if (signData?.user?.id) {
            try {
              await trackSignupSuccess({ userId: signData.user.id, email: email.trim() });
            } catch (_) {}
          }
          if (!signData.session) {
            const { error: loginErr } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (loginErr) {
              throw new Error(
                loginErr.message ||
                  'Account created. Please sign in with your email and password.'
              );
            }
          }
          await completeOnboarding(name);
          return;
        }
        throw new Error(signupJson.error || 'Could not create account');
      }

      if (signupJson.userId || signupJson.ok) {
        if (signupJson.userId) {
          try {
            await trackSignupSuccess({ userId: String(signupJson.userId), email: email.trim() });
          } catch (_) {}
        }
        try {
          const { error: loginErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (loginErr) {
            setInfo(
              signupJson.message ||
                'Account created. Use the login form with the same email and password.'
            );
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('post-signup sign-in', e);
        }
        const dest = signupJson.dashboardPath || config.dashboardPath;
        window.location.href = dest;
        return;
      }

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') !== 'callback' || mode !== 'signup') return;
    (async () => {
      try {
        const { data } = await getSupabase().auth.getSession();
        const u = data.session?.user;
        if (!u) return;
        const meta = (u.user_metadata || {}) as Record<string, unknown>;
        setEmail(u.email || '');
        const display = String(meta.full_name || meta.name || u.email?.split('@')[0] || '');
        if (display && !businessName) setBusinessName(display);
        setIsGoogleSession(true);
        setSignupStep('details');
        setInfo('Signed in with Google. Complete a few details about your operations.');
      } catch {
        /* ignore */
      }
    })();
  }, [mode]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('busmo-solutions-theme');
      if (stored === 'dark' || stored === 'light') setTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  async function handleGoogleAuth() {
    setError(null);
    setGoogleLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication is not configured');
      }
      const nextPath =
        mode === 'login'
          ? config.dashboardPath
          : `${config.signupPath}?google=callback`;
      const redirectTo = getOAuthCallbackUrl(nextPath);
      if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(redirectTo)) {
        throw new Error(
          'Google sign-in is misconfigured (redirect points to localhost). Set NEXT_PUBLIC_APP_URL to your live domain.'
        );
      }
      const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: { prompt: 'select_account', access_type: 'online' },
          scopes: 'openid email profile',
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  const showDetails =
    mode === 'signup' && (signupStep === 'details' || !!recovery);

  return (
    <div className={`solutions ${styles.page}`} data-suite={config.id} data-theme={theme}>
      <div className={styles.shell}>
        <aside className={styles.showcase}>
          <div className={styles.showcaseTop}>
            <Link href={config.welcomePath} className={styles.brandRow}>
              {config.logoSrc ? (
                <span className={styles.brandPlate}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.logoSrc} alt="" className={styles.brandLogo} />
                </span>
              ) : (
                <span className={styles.brandMark} aria-hidden>
                  {config.shortName.slice(0, 1)}
                </span>
              )}
              <span className={styles.brandText}>
                <span className={styles.brandName}>{config.productName}</span>
                <span className={styles.brandSub}>
                  by Busmo · {config.shortName} suite
                </span>
              </span>
            </Link>
            <Link href="/solutions" className={styles.allSuites}>
              All suites <ArrowRight size={12} aria-hidden />
            </Link>
          </div>

          <div className={styles.showcaseBody}>
            <span className={styles.eyebrow}>
              <Icon name="sparkles" size={12} />
              {config.shortName} workspace
            </span>
            <h2 className={styles.showcaseTitle}>
              {taglineLead}
              {taglineRest ? (
                <>
                  {' '}
                  <em>{taglineRest}</em>
                </>
              ) : null}
            </h2>
            <p className={styles.showcaseDesc}>{config.description}</p>
            <ul className={styles.featureList}>
              {config.features.slice(0, 4).map((feature) => (
                <li key={feature}>
                  <span className={styles.featureCheck}>
                    <Icon name="check" size={11} strokeWidth={2.6} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.showcaseFoot}>
            <span className={styles.moMark}>
              <Icon name="mo" size={16} />
            </span>
            <div>
              <span className={styles.moTitle}>MO, your AI chief of staff</span>
              <span className={styles.moSub}>
                Ask your workspace anything — {config.greetingNoun} performance, cash, and what
                needs attention today.
              </span>
            </div>
          </div>
        </aside>

        <main className={styles.formSide}>
          <div className={styles.formInner}>
            <div className={styles.topBar}>
              <Link href={config.welcomePath} className={styles.backLink}>
                <ArrowLeft size={14} aria-hidden />
                {config.shortName} overview
              </Link>
              <Link href="/solutions" className={styles.allSuitesLight}>
                All suites
              </Link>
            </div>

            <div className={styles.card}>
              <div className={styles.mobileBrand}>
                {config.logoSrc ? (
                  <span className={styles.mobilePlate}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={config.logoSrc} alt="" className={styles.mobileLogo} />
                  </span>
                ) : (
                  <span className={styles.mobileMark} aria-hidden>
                    {config.shortName.slice(0, 1)}
                  </span>
                )}
                <span className={styles.mobileBrandText}>
                  <strong>{config.productName}</strong>
                  <small>{config.shortName} suite · by Busmo</small>
                </span>
              </div>

              <div>
                <span className={styles.kicker}>
                  <span className={styles.kickerDot} aria-hidden />
                  {mode === 'login' && !recovery
                    ? 'Welcome back'
                    : showDetails
                      ? 'Final step'
                      : 'Get started'}
                </span>
                <h1 className={styles.title}>
                  {mode === 'login' && !recovery
                    ? 'Sign in'
                    : showDetails
                      ? 'Tell us about your operations'
                      : 'Create your account'}
                </h1>
                <p className={styles.lead}>
                  {mode === 'login' && !recovery
                    ? `Sign in to ${config.productName}`
                    : showDetails
                      ? intake.sub
                      : `Two quick steps — account, then how your ${config.greetingNoun} operates.`}
                </p>
              </div>

              {mode === 'signup' && !recovery && (
                <div className={styles.steps} role="group" aria-label={`Step ${showDetails ? 2 : 1} of 2`}>
                  <span
                    className={`${styles.step} ${showDetails ? styles.stepDone : styles.stepOn}`}
                  >
                    <span className={styles.stepNum}>
                      {showDetails ? <Check size={11} strokeWidth={3} aria-hidden /> : '1'}
                    </span>
                    Account
                  </span>
                  <span
                    className={`${styles.stepLine} ${showDetails ? styles.stepLineOn : ''}`}
                  />
                  <span
                    className={`${styles.step} ${showDetails ? styles.stepOn : ''}`}
                  >
                    <span className={styles.stepNum}>2</span>
                    Operations
                  </span>
                </div>
              )}

              {mode === 'signup' && !showDetails && !recovery && (
                <div className={styles.preview}>
                  <div className={styles.previewHead}>
                    <Icon name="sparkles" size={12} />
                    After account, we&apos;ll ask about
                  </div>
                  <div className={styles.chipRow}>
                    {intake.outcomes.map((o) => (
                      <span key={o} className={`${styles.chip} ${styles.chipStatic}`}>
                        {o}
                      </span>
                    ))}
                  </div>
                  <p className={styles.previewSub}>{intake.headline}</p>
                </div>
              )}

              {!showDetails && !recovery && !awaitingConfirm && (
                <>
                  <button
                    type="button"
                    className={styles.googleBtn}
                    onClick={handleGoogleAuth}
                    disabled={loading || googleLoading}
                  >
                    <span className={styles.googleIcon} aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l.1.1 6.3 5.3C39.2 37.1 44 31.5 44 24c0-1.3-.1-2.5-.4-3.5z"/>
                      </svg>
                    </span>
                    {googleLoading
                      ? 'Connecting…'
                      : mode === 'login'
                        ? 'Continue with Google'
                        : 'Sign up with Google'}
                  </button>
                  <div className={styles.divider}>
                    <span>or use email</span>
                  </div>
                </>
              )}

              {error && (
                <div className={styles.alertError} role="alert">
                  {error}
                </div>
              )}
              {info && (
                <div className={styles.alertInfo} role="status">
                  {info}
                </div>
              )}
              {recovery && (
                <div className={styles.alertInfo} role="status">
                  {recovery}
                </div>
              )}
              {needsEmailConfirm && (
                <div className={styles.alertInfo} role="status">
                  Confirm your email if prompted, then return here to sign in.
                </div>
              )}

              {awaitingConfirm ? (
                <div className={styles.preview}>
                  <div className={styles.previewHead}>Check your email</div>
                  <p className={styles.previewSub}>
                    We sent a confirmation link to <strong>{email.trim()}</strong>. Confirm your
                    address, then sign in to open {config.productName}. A welcome message is on its
                    way as well.
                  </p>
                  <Link
                    href={config.loginPath}
                    className={`${styles.primary} ${styles.primaryLink}`}
                  >
                    Go to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className={styles.form}>
                  {(mode === 'login' || (mode === 'signup' && !showDetails) || recovery) && (
                    <>
                      {(mode === 'signup' || recovery) && (
                        <div className={styles.field}>
                          <label htmlFor="biz" className={styles.label}>
                            {intake.orgLabel}
                          </label>
                          <input
                            id="biz"
                            className={styles.input}
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
                            <label htmlFor="email" className={styles.label}>
                              Email
                            </label>
                            <input
                              id="email"
                              type="email"
                              className={styles.input}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@company.com"
                              required
                              autoComplete="email"
                            />
                          </div>
                          <div className={styles.field}>
                            <label htmlFor="password" className={styles.label}>
                              Password
                            </label>
                            <input
                              id="password"
                              type="password"
                              className={styles.input}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              minLength={6}
                              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                            {mode === 'signup' && (
                              <span className={styles.fieldHelp}>At least 6 characters.</span>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {showDetails && (
                    <div className={styles.intake}>
                      <div className={styles.intakeHead}>
                        <strong>{intake.headline}</strong>
                        <div className={styles.chipRow}>
                          {intake.outcomes.map((o) => (
                            <span key={o} className={`${styles.chip} ${styles.chipStatic}`}>
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                      {intake.fields.map((field) => {
                        const value = solutionDetails[field.id];
                        return (
                          <div key={field.id} className={styles.field}>
                            <label htmlFor={`detail-${field.id}`} className={styles.label}>
                              {field.label}
                              {field.required ? ' *' : ''}
                            </label>
                            {field.type === 'text' || field.type === 'number' ? (
                              <input
                                id={`detail-${field.id}`}
                                type={field.type === 'number' ? 'number' : 'text'}
                                className={styles.input}
                                value={typeof value === 'string' ? value : ''}
                                placeholder={field.placeholder || ''}
                                aria-required={field.required || undefined}
                                onChange={(e) => setDetail(field.id, e.target.value)}
                              />
                            ) : (
                              <div
                                className={styles.chipRow}
                                role="group"
                                aria-label={field.label}
                              >
                                {(field.options || []).map((opt) => {
                                  const optId = typeof opt === 'string' ? opt : opt.id;
                                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                                  const selected =
                                    field.type === 'multi'
                                      ? Array.isArray(value) && value.includes(optId)
                                      : value === optId;
                                  return (
                                    <button
                                      key={optId}
                                      type="button"
                                      className={
                                        selected
                                          ? `${styles.chip} ${styles.chipOn}`
                                          : styles.chip
                                      }
                                      aria-pressed={selected}
                                      onClick={() => {
                                        if (field.type === 'multi') {
                                          const cur = Array.isArray(value) ? [...value] : [];
                                          setDetail(
                                            field.id,
                                            cur.includes(optId)
                                              ? cur.filter((x) => x !== optId)
                                              : [...cur, optId]
                                          );
                                        } else {
                                          setDetail(field.id, optId);
                                        }
                                      }}
                                    >
                                      {optLabel}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={styles.actions}>
                    {showDetails && mode === 'signup' && !recovery && (
                      <button
                        type="button"
                        className={styles.ghost}
                        onClick={() => setSignupStep('account')}
                        disabled={loading}
                      >
                        Back
                      </button>
                    )}
                    <button type="submit" className={styles.primary} disabled={loading}>
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
              )}

              <p className={styles.switch}>
                {mode === 'login' ? (
                  <>
                    New here? <Link href={config.signupPath}>Create an account</Link>
                  </>
                ) : (
                  <>
                    Already have an account? <Link href={config.loginPath}>Sign in</Link>
                  </>
                )}
              </p>
            </div>

            <div className={styles.legalLinks}>
              <Link href="/solutions/business">Busmo Business</Link>
              <span className={styles.dotSep}>·</span>
              <Link href="/login">Business login</Link>
              <span className={styles.dotSep}>·</span>
              <Link href={config.welcomePath}>{config.shortName} overview</Link>
            </div>
            <p className={styles.legalNote}>
              Secure email &amp; Google sign-in. Your workspace data stays private.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

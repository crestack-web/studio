'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { isCompedLifetimeEmail } from '@/lib/subscription/comped-emails';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

/** Days of free access after trial ends before dashboard is gated */
export const GRACE_PERIOD_DAYS = 3;
/** Original trial length in days */
export const TRIAL_DAYS = 14;

interface TrialGuardProps {
  children: React.ReactNode;
}

export interface TrialInfo {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isExpired: boolean;
  /** True when user is in the post-trial free extension (grace) window */
  isGrace: boolean;
  trialEndDate: Date;
  graceEndDate?: Date;
}

const TrialContext = createContext<TrialInfo | null>(null);

export const useTrialInfo = () => useContext(TrialContext);

function remainingFrom(end: Date, now: Date) {
  const timeDiff = end.getTime() - now.getTime();
  return {
    daysRemaining: Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24))),
    hoursRemaining: Math.max(
      0,
      Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    ),
    minutesRemaining: Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))),
  };
}

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Fire-and-forget: mark user as active for inactivity email cron */
async function touchLastLogin(accessToken: string) {
  try {
    await fetch('/api/user/heartbeat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    // non-blocking
  }
}

async function markExpired(supabase: ReturnType<typeof getSupabase>, userId: string) {
  try {
    await supabase
      .from('users')
      .update({ subscription_status: 'expired' })
      .eq('id', userId);
  } catch {
    /* best-effort */
  }
}

/**
 * Ensure a public.users row exists with an active 14-day trial.
 * Onboarding historically wrote trial only to Firestore; dashboard reads Supabase.
 * Missing rows previously failed closed ("Trial Ended") for brand-new users.
 */
async function ensureTrialUserRow(
  supabase: ReturnType<typeof getSupabase>,
  userId: string,
  sessionEmail?: string | null
): Promise<{
  trialEndDate: Date;
  trialStartDate: Date;
}> {
  const now = new Date();
  const trialStart = now;
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const trialEndIso = trialEnd.toISOString();

  const payload: Record<string, unknown> = {
    id: userId,
    email: sessionEmail || null,
    role: 'Owner',
    plan: 'standard',
    subscription_status: 'trial',
    trial_start_date: nowIso,
    trial_end_date: trialEndIso,
    business_id: userId,
    updated_at: nowIso,
    metadata: {
      plan: 'standard',
      subscriptionStatus: 'trial',
      trialStartDate: nowIso,
      trialEndDate: trialEndIso,
      source: 'trial_guard_bootstrap',
    },
  };

  // Prefer upsert so concurrent first visits don't race
  const { error: upsertErr } = await supabase.from('users').upsert(
    {
      ...payload,
      created_at: nowIso,
    },
    { onConflict: 'id' }
  );

  if (upsertErr) {
    console.warn('[TrialGuard] upsert bootstrap failed, trying insert/update:', upsertErr.message);
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('users')
        .update({
          subscription_status: 'trial',
          trial_start_date: nowIso,
          trial_end_date: trialEndIso,
          plan: 'standard',
          updated_at: nowIso,
          metadata: payload.metadata,
        })
        .eq('id', userId);
    } else {
      const { error: insErr } = await supabase.from('users').insert({
        ...payload,
        created_at: nowIso,
      });
      if (insErr) {
        console.error('[TrialGuard] insert bootstrap failed:', insErr.message);
      }
    }
  }

  return { trialEndDate: trialEnd, trialStartDate: trialStart };
}

export const TrialGuard: React.FC<TrialGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    const loadTrial = async (userId: string, sessionEmail?: string | null) => {
      if (isCompedLifetimeEmail(sessionEmail)) {
        setIsExpired(false);
        setIsLoading(false);
        return;
      }
      try {
        let { data: userData, error } = await supabase
          .from('users')
          .select(
            'id, role, subscription_status, trial_start_date, trial_end_date, grace_end_date, subscription_end_date, lifetime_access, metadata'
          )
          .eq('id', userId)
          .maybeSingle();

        // No row yet (common after Firestore-only onboarding) → bootstrap 14-day trial
        if (!error && !userData) {
          console.info('[TrialGuard] no users row — bootstrapping 14-day trial for', userId);
          const boot = await ensureTrialUserRow(supabase, userId, sessionEmail);
          const rem = remainingFrom(boot.trialEndDate, new Date());
          setTrialInfo({
            ...rem,
            isExpired: false,
            isGrace: false,
            trialEndDate: boot.trialEndDate,
          });
          setIsExpired(false);
          setIsLoading(false);
          return;
        }

        if (error) {
          console.error('[TrialGuard] user load error:', error.message);
          // Soft-open with client-side trial window so a transient RLS/network blip
          // does not lock a brand-new owner out of the dashboard.
          const fallbackEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
          const rem = remainingFrom(fallbackEnd, new Date());
          setTrialInfo({
            ...rem,
            isExpired: false,
            isGrace: false,
            trialEndDate: fallbackEnd,
          });
          setIsExpired(false);
          setIsLoading(false);
          // Best-effort bootstrap in background
          void ensureTrialUserRow(supabase, userId, sessionEmail);
          return;
        }

        if (!userData) {
          // Should not reach here after bootstrap branch, but keep safe
          const boot = await ensureTrialUserRow(supabase, userId, sessionEmail);
          const rem = remainingFrom(boot.trialEndDate, new Date());
          setTrialInfo({
            ...rem,
            isExpired: false,
            isGrace: false,
            trialEndDate: boot.trialEndDate,
          });
          setIsExpired(false);
          setIsLoading(false);
          return;
        }

        const meta = (userData.metadata as Record<string, unknown>) || {};
        let trialEndDate =
          asDate(userData.trial_end_date) ||
          asDate(meta.trialEndDate) ||
          asDate(meta.trial_end_date);
        const trialStartDate =
          asDate(userData.trial_start_date) ||
          asDate(meta.trialStartDate) ||
          asDate(meta.trial_start_date);
        let subscriptionStatus = String(
          userData.subscription_status ||
            meta.subscriptionStatus ||
            meta.subscription_status ||
            ''
        )
          .toLowerCase()
          .trim();
        const subscriptionEndDate =
          asDate(userData.subscription_end_date) ||
          asDate(meta.subscriptionEndDate) ||
          asDate(meta.subscription_end_date);
        let graceEndDate =
          asDate(userData.grace_end_date) ||
          asDate(meta.graceEndDate) ||
          asDate(meta.grace_end_date);
        const userRole = userData.role as string | undefined;
        const lifetimeAccess =
          (userData as any).lifetime_access === true || meta.lifetimeAccess === true;
        const now = new Date();

        if (lifetimeAccess) {
          setIsLoading(false);
          return;
        }

        // Staff inherits owner business entitlement — do not gate them here
        if (userRole === 'Staff' || userRole === 'staff') {
          setIsLoading(false);
          return;
        }

        // ── Paid active ────────────────────────────────────────────
        if (subscriptionStatus === 'active') {
          if (subscriptionEndDate && subscriptionEndDate < now) {
            setIsExpired(true);
            await markExpired(supabase, userId);
            setIsLoading(false);
            return;
          }
          setIsLoading(false);
          return;
        }

        // ── Explicitly expired / pending payment ───────────────────
        if (subscriptionStatus === 'expired' || subscriptionStatus === 'pending_payment') {
          if (graceEndDate && graceEndDate > now) {
            const rem = remainingFrom(graceEndDate, now);
            setTrialInfo({
              ...rem,
              isExpired: false,
              isGrace: true,
              trialEndDate: trialEndDate ?? graceEndDate,
              graceEndDate,
            });
            setIsLoading(false);
            return;
          }
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        // ── Grace status ───────────────────────────────────────────
        if (subscriptionStatus === 'grace') {
          if (!graceEndDate && trialEndDate) {
            graceEndDate = new Date(
              trialEndDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
            );
            await supabase
              .from('users')
              .update({ grace_end_date: graceEndDate.toISOString() })
              .eq('id', userId);
          }
          if (graceEndDate && graceEndDate > now) {
            const rem = remainingFrom(graceEndDate, now);
            setTrialInfo({
              ...rem,
              isExpired: false,
              isGrace: true,
              trialEndDate: trialEndDate ?? graceEndDate,
              graceEndDate,
            });
            setIsLoading(false);
            return;
          }
          setIsExpired(true);
          await markExpired(supabase, userId);
          setIsLoading(false);
          return;
        }

        // ── Trial / trialing / unset (new owners) ──────────────────
        const isTrialLike =
          subscriptionStatus === 'trial' ||
          subscriptionStatus === 'trialing' ||
          subscriptionStatus === '' ||
          !subscriptionStatus;

        if (isTrialLike) {
          // Bootstrap trial dates if missing (first dashboard visit)
          if (!trialEndDate) {
            const start = trialStartDate || now;
            const defaultTrialEnd = new Date(
              start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
            );
            trialEndDate = defaultTrialEnd;
            await supabase
              .from('users')
              .update({
                trial_end_date: trialEndDate.toISOString(),
                trial_start_date: start.toISOString(),
                subscription_status: 'trial',
                plan: 'standard',
              })
              .eq('id', userId);
          }

          if (trialEndDate > now) {
            const rem = remainingFrom(trialEndDate, now);
            setTrialInfo({
              ...rem,
              isExpired: false,
              isGrace: false,
              trialEndDate,
            });
            setIsLoading(false);
            return;
          }

          // Trial ended → enter or check grace
          graceEndDate =
            graceEndDate ??
            new Date(trialEndDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

          if (graceEndDate > now) {
            await supabase
              .from('users')
              .update({
                subscription_status: 'grace',
                grace_end_date: graceEndDate.toISOString(),
              })
              .eq('id', userId);
            const rem = remainingFrom(graceEndDate, now);
            setTrialInfo({
              ...rem,
              isExpired: false,
              isGrace: true,
              trialEndDate,
              graceEndDate,
            });
            setIsLoading(false);
            return;
          }

          // Trial + grace both over → hard stop
          setIsExpired(true);
          await markExpired(supabase, userId);
          setIsLoading(false);
          return;
        }

        // Unknown status → deny (fail closed)
        console.warn('[TrialGuard] unknown subscription_status:', subscriptionStatus);
        setIsExpired(true);
        setIsLoading(false);
      } catch (error) {
        console.error('[TrialGuard] failed:', error);
        // Soft-open: do not lock new owners out on unexpected errors
        const fallbackEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
        const rem = remainingFrom(fallbackEnd, new Date());
        setTrialInfo({
          ...rem,
          isExpired: false,
          isGrace: false,
          trialEndDate: fallbackEnd,
        });
        setIsExpired(false);
        setIsLoading(false);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!session?.user) {
          router.replace('/login');
          return;
        }
        if (session.access_token) {
          void touchLastLogin(session.access_token);
        }
        loadTrial(session.user.id, session.user.email);
      })
      .catch(() => {
        router.replace('/login');
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0]">
        <BusmoLogoLoadingSpinner size={200} />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="#FEF3C7" />
              <circle cx="40" cy="40" r="36" fill="none" stroke="#D97706" strokeWidth="2" />
              <path d="M40 20v20M40 50v10" stroke="#D97706" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-headline text-[#0A0A0F] mb-3">
            Trial Ended
          </h2>
          <p className="text-[#555568] mb-6">
            Your free trial has ended. Subscribe now to keep full access to your dashboard,
            sales, cashflow, and all your business data.
          </p>
          <button
            onClick={() => router.push('/subscribe')}
            className="w-full bg-[#6B3FE7] text-white font-semibold rounded-xl h-12 flex items-center justify-center text-base transition hover:bg-[#4B27B0]"
          >
            Subscribe to continue →
          </button>
          <p className="text-xs text-center text-[#8888A0] mt-4">
            Your data is safe and will be available right after payment
          </p>
        </div>
      </div>
    );
  }

  return <TrialContext.Provider value={trialInfo}>{children}</TrialContext.Provider>;
};

export default TrialGuard;

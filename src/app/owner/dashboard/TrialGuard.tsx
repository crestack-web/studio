'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

/** Days of free access after trial ends before dashboard is gated */
export const GRACE_PERIOD_DAYS = 3;
/** Original trial length in days */
export const TRIAL_DAYS = 3;

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
    daysRemaining: Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24))),
    hoursRemaining: Math.max(
      0,
      Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    ),
    minutesRemaining: Math.max(0, Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))),
  };
}

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const TrialGuard: React.FC<TrialGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();

    const loadTrial = async (userId: string) => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select(
            'role, plan, subscription_status, trial_end_date, grace_end_date, subscription_end_date, lifetime_access, metadata'
          )
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('Trial guard Supabase read failed, allowing access:', error.message);
          setIsLoading(false);
          return;
        }

        if (!userData) {
          setIsLoading(false);
          return;
        }

        const meta = (userData.metadata as Record<string, unknown>) || {};
        const trialEndDate =
          asDate(userData.trial_end_date) ||
          asDate(meta.trialEndDate) ||
          asDate(meta.trial_end_date);
        let subscriptionStatus =
          (userData.subscription_status as string) ||
          (meta.subscriptionStatus as string) ||
          (meta.subscription_status as string);
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

        if (userRole === 'Staff' || userRole === 'staff') {
          setIsLoading(false);
          return;
        }

        if (subscriptionStatus === 'active') {
          if (subscriptionEndDate && subscriptionEndDate < now) {
            setIsExpired(true);
            await supabase
              .from('users')
              .update({ subscription_status: 'expired' })
              .eq('id', userId);
            return;
          }
          setIsLoading(false);
          return;
        }

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
          await supabase.from('users').update({ subscription_status: 'expired' }).eq('id', userId);
          return;
        }

        const isTrialLike =
          subscriptionStatus === 'trial' ||
          (!subscriptionStatus && !!trialEndDate) ||
          (!subscriptionStatus && !trialEndDate);

        if (isTrialLike) {
          if (!trialEndDate) {
            const defaultTrialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
            await supabase
              .from('users')
              .update({
                trial_end_date: defaultTrialEnd.toISOString(),
                trial_start_date: now.toISOString(),
                subscription_status: 'trial',
              })
              .eq('id', userId);
            setIsLoading(false);
            return;
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

          setIsExpired(true);
          await supabase.from('users').update({ subscription_status: 'expired' }).eq('id', userId);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.warn('Trial guard failed, allowing access:', error);
        setIsLoading(false);
      } finally {
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
        loadTrial(session.user.id);
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
            Trial & Extension Ended
          </h2>
          <p className="text-[#555568] mb-6">
            Your 3-day free trial and the extra 3-day extension have ended. Subscribe to keep
            access to your dashboard and all your business data.
          </p>
          <button
            onClick={() => router.push('/subscribe')}
            className="w-full bg-[#6B3FE7] text-white font-semibold rounded-xl h-12 flex items-center justify-center text-base transition hover:bg-[#4B27B0]"
          >
            Choose Your Plan →
          </button>
          <p className="text-xs text-center text-[#8888A0] mt-4">
            Your data is safe and will be available after subscription
          </p>
        </div>
      </div>
    );
  }

  return <TrialContext.Provider value={trialInfo}>{children}</TrialContext.Provider>;
};

export default TrialGuard;

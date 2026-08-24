'use client';

/**
 * Supabase Auth Provider
 * Replaces Firebase Auth for all client-side authentication.
 * Provides the same hook API as the old Firebase provider so existing
 * component code can migrate incrementally.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

// ── Public types ──────────────────────────────

export interface SupabaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface UserHookResult {
  user: SupabaseAuthUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface SupabaseAuthContextState {
  user: SupabaseAuthUser | null;
  session: Session | null;
  isUserLoading: boolean;
  userError: Error | null;
  supabase: ReturnType<typeof getSupabase>;
}

// ── Context ─────────────────────────────────────────────

const SupabaseAuthContext = createContext<SupabaseAuthContextState | undefined>(undefined);

function mapUser(supabaseUser: SupabaseUser | null): SupabaseAuthUser | null {
  if (!supabaseUser) return null;
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null,
    photoURL: supabaseUser.user_metadata?.avatar_url ?? null,
    emailVerified: supabaseUser.email_confirmed_at != null,
    phoneNumber: supabaseUser.phone ?? null,
  };
}

// ── Provider ─────────────────────────────────────────────

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const supabase = useMemo(() => {
    try {
      return getSupabase();
    } catch {
      // Return a minimal stub so the provider can still mount; real calls will fail clearly.
      return null as unknown as ReturnType<typeof getSupabase>;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setUserError(new Error('Supabase not configured'));
      setIsUserLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(mapUser(s?.user ?? null));
      setIsUserLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      setUserError(err instanceof Error ? err : new Error(String(err)));
      setIsUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(mapUser(s?.user ?? null));
      setIsUserLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<SupabaseAuthContextState>(
    () => ({ user, session, isUserLoading, userError, supabase }),
    [user, session, isUserLoading, userError, supabase],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

// ── Hooks ───────────────────────────────────────────────

export function useSupabaseAuth(): SupabaseAuthContextState {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) throw new Error('useSupabaseAuth must be used within <SupabaseAuthProvider>');
  return ctx;
}

/** Drop-in replacement for the old useUser() hook. */
export function useUser(): UserHookResult {
  const { user, isUserLoading, userError } = useSupabaseAuth();
  return { user, isUserLoading, userError };
}

/** Get the raw Supabase auth instance for signIn/signOut/etc. */
export function useSupabaseClient() {
  return useSupabaseAuth().supabase;
}

/** Convenience: current user (null if not logged in). */
export function useCurrentUser(): SupabaseAuthUser | null {
  return useSupabaseAuth().user;
}

/** Convenience: is loading. */
export function useAuthLoading(): boolean {
  return useSupabaseAuth().isUserLoading;
}

/**
 * Synchronous helper to get the current Supabase user from localStorage.
 * Drop-in replacement for Firebase's getAuth().currentUser pattern.
 */
export function getCurrentSupabaseUser(): { uid: string; email: string | null; displayName: string | null } | null {
  try {
    if (typeof window === 'undefined') return null;

    // Supabase JS v2 stores the session under `sb-<ref>-auth-token` as a JSON
    // object that may use several shapes depending on client version.
    const keys = Object.keys(localStorage);
    const sessionKey = keys.find(
      (k) => k.startsWith('sb-') && k.includes('auth-token')
    );
    if (!sessionKey) return null;

    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const user =
      parsed?.user ||
      parsed?.currentSession?.user ||
      parsed?.current_session?.user ||
      parsed?.session?.user ||
      null;
    if (!user?.id) return null;

    return {
      uid: user.id,
      email: user.email ?? null,
      displayName:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        null,
    };
  } catch {
    return null;
  }
}

/**
 * Drop-in replacement for getAuth().currentUser pattern.
 * Returns a Firebase-compatible { uid, email, displayName } object or null.
 */
export function getAuthCurrentUser(): { uid: string; email: string | null; displayName: string | null } | null {
  return getCurrentSupabaseUser();
}

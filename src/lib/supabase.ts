/**
 * Supabase Browser Client
 * For client-side components and hooks.
 * Uses the anon key + RLS for authorization.
 * Server-only code should import from '@/lib/supabase-server' instead.
 *
 * CRITICAL: Never throw during module evaluation or during SSR.
 * Auth pages import this module; a throw breaks client rendering.
 *
 * NEXT_PUBLIC_* vars are inlined at BUILD time by Next.js.
 * After adding/changing them in Vercel, you must Redeploy.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initError: Error | null = null;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

/** Diagnostic: which public Supabase env keys are present (no values). */
export function getSupabasePublicEnvStatus(): {
  hasUrl: boolean;
  hasAnonKey: boolean;
} {
  return {
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
  };
}

export function getSupabaseConfigErrorMessage(): string {
  const { hasUrl, hasAnonKey } = getSupabasePublicEnvStatus();
  if (hasUrl && hasAnonKey) return '';
  const missing: string[] = [];
  if (!hasUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!hasAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return (
    `Authentication is not configured (missing ${missing.join(' and ')}). ` +
    'Set these in Vercel → Project → Settings → Environment Variables for Production, then Redeploy.'
  );
}

function createBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(getSupabaseConfigErrorMessage());
  }

  return createClient(normalizeUrl(supabaseUrl), supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Lazy browser singleton.
 * - Safe to import anywhere (including SSR) — does not throw at import time.
 * - On the server returns a no-op stub so render can complete.
 * - Throws only when called in the browser without env vars.
 */
export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createSsrStub();
  }

  if (client) return client;
  if (initError) throw initError;

  try {
    client = createBrowserClient();
    return client;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    throw initError;
  }
}

/** True when browser env is present. Safe during SSR. */
export function isSupabaseConfigured(): boolean {
  const { hasUrl, hasAnonKey } = getSupabasePublicEnvStatus();
  return hasUrl && hasAnonKey;
}

export function getSupabaseBrowser() {
  return getSupabase();
}

function createSsrStub(): SupabaseClient {
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      if (prop === 'auth') {
        return new Proxy(
          {},
          {
            get(_a, authProp) {
              if (authProp === 'getSession') {
                return async () => ({ data: { session: null }, error: null });
              }
              if (authProp === 'onAuthStateChange') {
                return () => ({ data: { subscription: { unsubscribe() {} } } });
              }
              if (authProp === 'signOut') {
                return async () => ({ error: null });
              }
              return async () => ({
                data: null,
                error: new Error('Supabase browser client is not available on the server'),
              });
            },
          }
        );
      }
      if (prop === 'from') {
        return () => ({
          select: () => ({ data: null, error: null }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ data: null, error: null }),
          delete: () => ({ data: null, error: null }),
        });
      }
      return undefined;
    },
  };
  return new Proxy({}, handler) as SupabaseClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getSupabase();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

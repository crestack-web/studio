/**
 * Supabase Browser Client
 * For client-side components and hooks.
 * Uses the anon key + RLS for authorization.
 * Server-only code should import from '@/lib/supabase-server' instead.
 *
 * CRITICAL: Never throw during module evaluation or during SSR.
 * Auth pages import this module; a throw breaks client rendering.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let initError: Error | null = null;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

function createBrowserClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
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
 * - Returns null on the server (SSR) so render can complete.
 * - Throws only when called in the browser without env vars.
 */
export function getSupabase(): SupabaseClient {
  // During SSR / RSC, never create a browser client and never throw.
  if (typeof window === 'undefined') {
    // Callers on the server should use @/lib/supabase-server.
    // Returning a proxy that no-ops prevents render crashes if something
    // accidentally calls this during SSR.
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

/** True when browser env is present. Safe during SSR (returns false). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseBrowser() {
  return getSupabase();
}

// Minimal stub so accidental SSR access does not crash the tree.
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

/**
 * Lazy accessor for components that prefer a property-style API.
 * Does not initialize until first property access in the browser.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getSupabase();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

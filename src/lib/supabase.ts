/**
 * Supabase Browser Client
 * For client-side components and hooks.
 * Uses the anon key + RLS for authorization.
 * Server-only code should import from '@/lib/supabase-server' instead.
 *
 * IMPORTANT: Do not eagerly initialize the client at module load.
 * Auth pages import this module; a throw during evaluation breaks rendering.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getBrowserSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
  }

  // Ensure URL has a protocol (common misconfig in .env)
  const url = supabaseUrl.startsWith('http')
    ? supabaseUrl
    : `https://${supabaseUrl}`;

  return createClient(url, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Lazy singleton. Safe to import; only throws when first called without env.
 */
export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Avoid creating a browser client during SSR; callers should use supabase-server on the server.
    throw new Error(
      'getSupabase() is for browser use only. On the server, import from @/lib/supabase-server.'
    );
  }
  if (!client) {
    client = getBrowserSupabase();
  }
  return client;
}

export function getSupabaseBrowser() {
  return getSupabase();
}

/**
 * Lazy accessor for components that prefer a property-style API.
 * Does not initialize until first property access / call.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getSupabase();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

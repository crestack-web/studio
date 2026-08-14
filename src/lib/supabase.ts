/**
 * Supabase Browser Client
 * For client-side components and hooks.
 * Uses the anon key + RLS for authorization.
 * Server-only code should import from '@/lib/supabase-server' instead.
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

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = getBrowserSupabase();
  }
  return client;
}

export function getSupabaseBrowser() {
  return getSupabase();
}

// Convenience singleton for components that only need the DB
export const supabase = typeof window !== 'undefined' ? getSupabase() : (null as unknown as SupabaseClient);

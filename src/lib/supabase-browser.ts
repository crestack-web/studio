import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Browser client with cookie storage for PKCE OAuth. */
export function createSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  const normalized = (url.startsWith('http') ? url : `https://${url}`).replace(
    /\/$/,
    ''
  );
  // Keep options minimal — cookie PKCE is the default for createBrowserClient.
  return createBrowserClient(normalized, anon);
}

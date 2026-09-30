/**
 * Cookie-based Supabase clients for OAuth PKCE (Next.js App Router).
 * Browser + server must share the same cookie storage so exchangeCodeForSession
 * can read the code_verifier written at signInWithOAuth time.
 */
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  const normalized = url.startsWith('http') ? url : `https://${url}`;
  return { url: normalized.replace(/\/$/, ''), anon };
}

/** Browser client — use for signInWithOAuth (stores PKCE verifier in cookies). */
export function createSupabaseBrowserClient(): SupabaseClient {
  const { url, anon } = publicEnv();
  return createBrowserClient(url, anon, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/** Server client — use in Route Handlers to exchange OAuth code. */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, anon } = publicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without mutable cookies — ignore.
        }
      },
    },
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

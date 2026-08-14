/**
 * Supabase Server Client (service role)
 * For server-only code: API routes, services, cron jobs.
 * Uses the service_role key which bypasses RLS - NEVER import this into
 * client components or expose the key to the browser.
 */

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

function getServerSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase server client not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!serverClient) {
    serverClient = getServerSupabase();
  }
  return serverClient;
}

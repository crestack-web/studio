/**
 * Service-role client for the Mo-sell Supabase project.
 * Busmo is the parent company — admin APIs use this to read Mo-sell activity.
 * Never import into client components.
 */
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let moSellClient: SupabaseClient | null = null;

export function isMoSellAdminConfigured(): boolean {
  const url = process.env.MO_SELL_SUPABASE_URL || process.env.NEXT_PUBLIC_MO_SELL_SUPABASE_URL;
  const key = process.env.MO_SELL_SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

export function getMoSellAdmin(): SupabaseClient {
  if (moSellClient) return moSellClient;
  const url = process.env.MO_SELL_SUPABASE_URL || process.env.NEXT_PUBLIC_MO_SELL_SUPABASE_URL;
  const key = process.env.MO_SELL_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Mo-sell admin client not configured. Set MO_SELL_SUPABASE_URL and MO_SELL_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  moSellClient = createClient(url.replace(/\/$/, ''), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return moSellClient;
}

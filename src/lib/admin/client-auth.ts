'use client';

import { getSupabase } from '@/lib/supabase';

/** Headers for admin API calls (Bearer if signed in, else whitelist email from localStorage). */
export async function adminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const sb = getSupabase();
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore */
  }
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) headers['x-admin-email'] = String(parsed.email).toLowerCase();
    }
  } catch {
    /* ignore */
  }
  return headers;
}

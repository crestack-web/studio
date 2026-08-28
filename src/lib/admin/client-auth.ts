'use client';

import { getSupabase } from '@/lib/supabase';

/** Headers for admin API calls (Bearer / OTP token / whitelist email). */
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
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        headers['x-admin-token'] = adminToken;
        // Prefer admin OTP token as Bearer when no Supabase session
        if (!headers.Authorization) {
          headers.Authorization = `Bearer ${adminToken}`;
        }
      }
      const raw = localStorage.getItem('admin_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          headers['x-admin-email'] = String(parsed.email).toLowerCase();
        }
      }
    }
  } catch {
    /* ignore */
  }

  return headers;
}

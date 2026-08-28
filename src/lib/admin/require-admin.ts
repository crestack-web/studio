import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { ADMIN_EMAIL_ROLES, isAdminEmail } from '@/lib/adminEmails';

export type AdminActor = {
  id: string | null;
  email: string;
  source: 'supabase' | 'header' | 'token';
};

export async function requireAdminUser(req: NextRequest): Promise<AdminActor | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // 1) Supabase session bearer
  if (token && token.length > 40 && !token.startsWith('eyJ') === false) {
    // JWT-ish
  }
  if (token && token.includes('.')) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      try {
        const client = createClient(url, anon, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await client.auth.getUser(token);
        if (!error && data.user) {
          const email = (data.user.email || '').toLowerCase();
          if (email && isAdminEmail(email)) {
            return { id: data.user.id, email, source: 'supabase' };
          }
          const admin = getSupabaseAdmin();
          const { data: profile } = await admin
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          const role = String((profile as any)?.role || '').toLowerCase();
          if (['admin', 'superadmin'].includes(role)) {
            return { id: data.user.id, email: email || data.user.id, source: 'supabase' };
          }
        }
      } catch {
        /* fall through */
      }
    }
  }

  // 2) Admin OTP session token (base64 JSON from /api/admin/auth/otp)
  const adminToken =
    token ||
    req.headers.get('x-admin-token') ||
    '';
  if (adminToken) {
    try {
      const raw = Buffer.from(adminToken, 'base64').toString('utf8');
      const parsed = JSON.parse(raw);
      const email = String(parsed?.email || '').toLowerCase().trim();
      if (email && isAdminEmail(email)) {
        return { id: null, email, source: 'token' };
      }
    } catch {
      /* not our OTP token */
    }
  }

  // 3) Whitelist email header (admin panel localStorage)
  const headerEmail = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  if (headerEmail && isAdminEmail(headerEmail)) {
    return { id: null, email: headerEmail, source: 'header' };
  }

  return null;
}

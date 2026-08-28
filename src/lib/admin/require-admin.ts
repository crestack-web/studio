import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { ADMIN_EMAIL_ROLES } from '@/lib/adminEmails';

export async function requireAdminUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // Prefer Bearer token (Supabase session)
  if (token) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      const client = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.getUser(token);
      if (!error && data.user) {
        const email = (data.user.email || '').toLowerCase();
        if (email && email in ADMIN_EMAIL_ROLES) return data.user;

        const admin = getSupabaseAdmin();
        const { data: profile } = await admin
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        const role = String((profile as any)?.role || '').toLowerCase();
        if (['admin', 'superadmin'].includes(role)) return data.user;
      }
    }
  }

  // Dev/admin panel fallback: x-admin-email header (whitelist only)
  const headerEmail = (req.headers.get('x-admin-email') || '').toLowerCase().trim();
  if (headerEmail && headerEmail in ADMIN_EMAIL_ROLES) {
    return { id: 'admin-header', email: headerEmail } as any;
  }

  return null;
}

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { ADMIN_EMAIL_ROLES } from '@/lib/adminEmails';

export async function requireAdminUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;

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
  return null;
}

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (!error && data.user) return data.user;
  return null;
}

export async function assertBusinessAccess(
  userId: string,
  businessId: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!businessId) return { ok: false, reason: 'businessId required' };
  const admin = getSupabaseAdmin();

  if (businessId === userId) return { ok: true };

  const { data: biz } = await admin
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .maybeSingle();

  if (biz && String((biz as any).owner_id) === String(userId)) return { ok: true };

  const { data: profile } = await admin
    .from('users')
    .select('business_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (profile && String((profile as any).business_id) === String(businessId)) {
    return { ok: true };
  }
  const role = String((profile as any)?.role || '').toLowerCase();
  if (['admin', 'superadmin'].includes(role)) return { ok: true };

  return { ok: false, reason: 'Not allowed for this business' };
}

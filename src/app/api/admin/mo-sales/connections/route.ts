import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { ADMIN_EMAIL_ROLES } from '@/lib/adminEmails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminUser(req: NextRequest) {
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

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: connections, error } = await admin
      .from('whatsapp_connections')
      .select('id, business_id, provider, whatsapp_sender, status, metadata, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[admin/mo-sales/connections GET]', error.message);
      return NextResponse.json({ error: 'Failed to load connections' }, { status: 500 });
    }

    const bizIds = Array.from(
      new Set((connections || []).map((c: any) => c.business_id).filter(Boolean))
    );
    const names: Record<string, string> = {};
    if (bizIds.length) {
      const { data: businesses } = await admin.from('businesses').select('id, name').in('id', bizIds);
      for (const b of businesses || []) {
        names[(b as any).id] = (b as any).name || (b as any).id;
      }
    }

    const rows = (connections || []).map((c: any) => {
      const meta = (c.metadata || {}) as Record<string, unknown>;
      return {
        id: c.id,
        businessId: c.business_id,
        businessName: names[c.business_id] || c.business_id,
        provider: c.provider,
        whatsappNumber: c.whatsapp_sender,
        status: c.status,
        moEnabled: meta.mo_enabled !== false,
        onboardingError: meta.onboarding_error || meta.last_error || null,
        activatedAt: meta.activated_at || null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });

    return NextResponse.json({ connections: rows });
  } catch (e: any) {
    console.error('[admin/mo-sales/connections GET]', e?.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '').trim();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data: existing } = await admin
      .from('whatsapp_connections')
      .select('id, metadata, status')
      .eq('id', id)
      .maybeSingle();

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const meta = { ...((existing.metadata as object) || {}) } as Record<string, unknown>;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.status) {
      const status = String(body.status);
      if (!['pending', 'active', 'failed', 'paused'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      if (status === 'paused') {
        patch.status = 'active';
        meta.mo_enabled = false;
      } else {
        patch.status = status;
        if (status === 'active') {
          meta.activated_at = new Date().toISOString();
          meta.onboarding_error = null;
          if (typeof body.moEnabled === 'boolean') meta.mo_enabled = body.moEnabled;
          else if (meta.mo_enabled === undefined) meta.mo_enabled = true;
        }
        if (status === 'failed' && body.error) {
          meta.onboarding_error = String(body.error).slice(0, 500);
          meta.last_error = meta.onboarding_error;
        }
      }
    }

    if (typeof body.moEnabled === 'boolean' && body.status !== 'paused') {
      meta.mo_enabled = body.moEnabled;
    }

    if (body.whatsappNumber) {
      const digits = String(body.whatsappNumber).replace(/\D/g, '');
      if (digits.length >= 8) patch.whatsapp_sender = digits;
    }

    meta.last_operator = user.id;
    meta.last_operator_at = new Date().toISOString();
    patch.metadata = meta;

    const { error } = await admin.from('whatsapp_connections').update(patch).eq('id', id);
    if (error) {
      console.error('[admin/mo-sales/connections PATCH]', error.message);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    console.log(
      JSON.stringify({
        event: 'admin_connection_updated',
        connectionId: id,
        status: patch.status || existing.status,
        operator: user.id,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[admin/mo-sales/connections PATCH]', e?.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

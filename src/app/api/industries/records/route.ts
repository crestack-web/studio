import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import {
  resolveIndustryAccess,
  canMutateOwnerData,
  canAccessOwnerConsole,
} from '@/lib/industries/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveContext(req: NextRequest, editionHint?: string) {
  const user = await getAuthUser(req);
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const meta = { ...((user.user_metadata || {}) as Record<string, unknown>) };
  if (editionHint) meta.product_edition = editionHint;
  const session = await loadIndustrySession(user.id, meta);
  if (!session.businessId) {
    return { error: 'No business membership', status: 403 as const };
  }

  const access = await resolveIndustryAccess(user.id, session.businessId as string);
  if (!access || !canAccessOwnerConsole(access.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }

  return {
    userId: user.id,
    businessId: access.businessId,
    role: access.role,
    edition: (session.productEdition || editionHint || 'business') as string,
  };
}

export async function GET(req: NextRequest) {
  const edition = req.nextUrl.searchParams.get('edition') || undefined;
  const moduleName = req.nextUrl.searchParams.get('module') || '';
  const ctx = await resolveContext(req, edition);
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const admin = getSupabaseAdmin();
  let q = admin
    .from('industry_records')
    .select('*')
    .eq('business_id', ctx.businessId)
    .eq('product_edition', ctx.edition)
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (moduleName) q = q.eq('module', moduleName);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const open = rows.filter(
    (r: any) =>
      !['done', 'completed', 'paid', 'closed', 'checked_out', 'cancelled'].includes(String(r.status))
  ).length;
  const amount = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    records: rows,
    metrics: { count: rows.length, open, amount },
    role: ctx.role,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const edition = String(body.edition || body.productEdition || '');
  const ctx = await resolveContext(req, edition || undefined);
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  if (!canMutateOwnerData(ctx.role)) {
    return NextResponse.json({ error: 'Owner role required' }, { status: 403 });
  }

  const moduleName = String(body.module || '').trim();
  const title = String(body.title || '').trim();
  if (!moduleName || !title) {
    return NextResponse.json({ error: 'module and title required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('industry_records')
    .insert({
      business_id: ctx.businessId,
      product_edition: ctx.edition,
      module: moduleName,
      title,
      status: String(body.status || 'open'),
      amount: Number(body.amount || 0),
      notes: body.notes || null,
      meta: body.meta || {},
      occurred_at: body.occurredAt || new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: data });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const edition = String(body.edition || '');
  const ctx = await resolveContext(req, edition || undefined);
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  if (!canMutateOwnerData(ctx.role)) {
    return NextResponse.json({ error: 'Owner role required' }, { status: 403 });
  }

  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status != null) patch.status = String(body.status);
  if (body.title != null) patch.title = String(body.title);
  if (body.amount != null) patch.amount = Number(body.amount);
  if (body.notes != null) patch.notes = body.notes;
  if (body.meta != null) patch.meta = body.meta;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('industry_records')
    .update(patch)
    .eq('id', id)
    .eq('business_id', ctx.businessId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, record: data });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveBusiness(req: NextRequest, editionHint?: string) {
  const user = await getAuthUser(req);
  if (!user) {
    // QA mode: allow preview business when no auth (temp)
    const preview = req.headers.get('x-preview-business');
    if (preview) return { businessId: preview, edition: editionHint || 'hospitality' };
    return null;
  }
  const meta = { ...((user.user_metadata || {}) as Record<string, unknown>) };
  if (editionHint) meta.product_edition = editionHint;
  const session = await loadIndustrySession(user.id, meta);
  if (!session.businessId) return null;
  return {
    businessId: session.businessId as string,
    edition: (session.productEdition || editionHint || 'business') as string,
  };
}

export async function GET(req: NextRequest) {
  const edition = req.nextUrl.searchParams.get('edition') || undefined;
  const moduleName = req.nextUrl.searchParams.get('module') || '';
  const ctx = await resolveBusiness(req, edition);
  if (!ctx) {
    // Return empty for unauthenticated QA rather than hard fail
    return NextResponse.json({
      ok: true,
      records: [],
      metrics: { count: 0, open: 0, amount: 0 },
      preview: true,
    });
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
    return NextResponse.json({
      ok: true,
      records: [],
      metrics: { count: 0, open: 0, amount: 0 },
      warning: error.message,
    });
  }

  const rows = data || [];
  const open = rows.filter((r: any) => !['done', 'completed', 'paid', 'closed', 'checked_out', 'cancelled'].includes(String(r.status))).length;
  const amount = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    records: rows,
    metrics: { count: rows.length, open, amount },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const edition = String(body.edition || body.productEdition || '');
  const ctx = await resolveBusiness(req, edition || undefined);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  const ctx = await resolveBusiness(req, edition || undefined);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

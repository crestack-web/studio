import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ctx(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!s.businessId) return null;
  return { businessId: s.businessId };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

function mapRecord(r: any) {
  return {
    id: r.id,
    patient_id: r.metadata?.patient_id || null,
    patient_name: r.title,
    visit_id: r.metadata?.visit_id || null,
    description: r.notes || r.metadata?.description || null,
    amount: Number(r.amount || 0),
    status: r.status,
    created_at: r.created_at,
    paid_at: r.metadata?.paid_at || null,
    source: 'records',
  };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const status = String(url.searchParams.get('status') || 'all');
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();

  // Prefer native table if present
  const native = await admin
    .from('healthcare_billing')
    .select('*')
    .eq('business_id', c.businessId)
    .order('created_at', { ascending: false })
    .limit(150);

  let rows: any[] = [];
  let warning: string | null = null;

  if (!native.error && native.data) {
    rows = asRows(native.data);
  } else {
    const rec = await admin
      .from('industry_records')
      .select('*')
      .eq('business_id', c.businessId)
      .eq('product_edition', 'healthcare')
      .eq('module', 'billing')
      .order('created_at', { ascending: false })
      .limit(150);
    if (rec.error) warning = native.error?.message || rec.error.message;
    rows = asRows(rec.data).map(mapRecord);
  }

  if (status && status !== 'all') {
    rows = rows.filter((r) => String(r.status) === status);
  }
  if (q) {
    rows = rows.filter((r) =>
      `${r.patient_name || r.title || ''} ${r.description || r.notes || ''}`
        .toLowerCase()
        .includes(q)
    );
  }

  const outstanding = rows
    .filter((r) => ['draft', 'sent', 'open', 'pending'].includes(String(r.status)))
    .reduce((s, r) => s + Number(r.amount || 0), 0);
  const collected = rows
    .filter((r) => String(r.status) === 'paid')
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    bills: rows,
    metrics: {
      total: rows.length,
      outstanding,
      collected,
      unpaid: rows.filter((r) => ['draft', 'sent', 'open', 'pending'].includes(String(r.status))).length,
      paid: rows.filter((r) => String(r.status) === 'paid').length,
    },
    warning,
  });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'bill_create').trim();

  if (action === 'bill_create') {
    const patientName = String(body.patientName || body.patient_name || '').trim();
    if (!patientName) return NextResponse.json({ error: 'Patient name required' }, { status: 400 });
    const amount = Number(body.amount || 0);
    if (!(amount > 0)) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });

    const payload = {
      business_id: c.businessId,
      patient_id: body.patientId || body.patient_id || null,
      patient_name: patientName,
      visit_id: body.visitId || body.visit_id || null,
      description: body.description || body.notes || null,
      amount,
      status: body.status || 'sent',
    };

    const native = await admin.from('healthcare_billing').insert(payload).select('*').single();
    if (!native.error && native.data) {
      return NextResponse.json({ ok: true, bill: native.data, source: 'native' });
    }

    const rec = await admin
      .from('industry_records')
      .insert({
        business_id: c.businessId,
        product_edition: 'healthcare',
        module: 'billing',
        title: patientName,
        status: payload.status,
        amount,
        notes: payload.description,
        occurred_at: new Date().toISOString(),
        metadata: {
          patient_id: payload.patient_id,
          visit_id: payload.visit_id,
          description: payload.description,
        },
      })
      .select('*')
      .single();

    if (rec.error) {
      return NextResponse.json(
        { error: native.error?.message || rec.error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, bill: mapRecord(rec.data), source: 'records' });
  }

  if (action === 'bill_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.description != null) patch.description = body.description;

    const native = await admin
      .from('healthcare_billing')
      .update(patch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();

    if (!native.error && native.data) {
      return NextResponse.json({ ok: true, bill: native.data });
    }

    const recPatch: Record<string, unknown> = {};
    if (body.status != null) recPatch.status = body.status;
    if (body.amount != null) recPatch.amount = Number(body.amount);
    if (body.description != null) recPatch.notes = body.description;

    // stamp paid_at in metadata when marking paid
    if (body.status === 'paid') {
      const existing = await admin
        .from('industry_records')
        .select('metadata')
        .eq('id', id)
        .eq('business_id', c.businessId)
        .maybeSingle();
      recPatch.metadata = {
        ...(existing.data?.metadata || {}),
        paid_at: new Date().toISOString(),
      };
    }

    const rec = await admin
      .from('industry_records')
      .update(recPatch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();

    if (rec.error) {
      return NextResponse.json(
        { error: native.error?.message || rec.error.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, bill: mapRecord(rec.data) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

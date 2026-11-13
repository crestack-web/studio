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

/** Prefer native healthcare_visits; fall back to industry_records. */
async function listNative(admin: ReturnType<typeof getSupabaseAdmin>, businessId: string, limit: number) {
  const { data, error } = await admin
    .from('healthcare_visits')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [] as any[], error: error.message, native: false };
  return { rows: asRows(data), error: null as string | null, native: true };
}

async function listRecords(admin: ReturnType<typeof getSupabaseAdmin>, businessId: string, limit: number) {
  const { data, error } = await admin
    .from('industry_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('product_edition', 'healthcare')
    .eq('module', 'visits')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [] as any[], error: error.message };
  return {
    rows: asRows(data).map((r) => ({
      id: r.id,
      patient_id: r.metadata?.patient_id || null,
      patient_name: r.title,
      appointment_id: r.metadata?.appointment_id || null,
      chief_complaint: r.notes,
      status: r.status,
      amount: r.amount,
      created_at: r.created_at,
      source: 'records',
    })),
    error: null as string | null,
  };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const status = String(url.searchParams.get('status') || 'all');
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 200);

  let native = await listNative(admin, c.businessId, limit);
  let rows = native.rows;
  let warning = native.error;

  if (!native.native || (!rows.length && native.error)) {
    const rec = await listRecords(admin, c.businessId, limit);
    if (rec.rows.length || !rows.length) {
      rows = rec.rows;
      warning = rec.error || warning;
    }
  }

  if (status && status !== 'all') {
    rows = rows.filter((r) => String(r.status) === status);
  }
  if (q) {
    rows = rows.filter((r) => {
      const hay = `${r.patient_name || ''} ${r.chief_complaint || r.notes || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const all = rows;
  const metrics = {
    total: all.length,
    open: all.filter((r) => ['open', 'in_progress', 'active'].includes(String(r.status))).length,
    completed: all.filter((r) => String(r.status) === 'completed').length,
  };

  return NextResponse.json({ ok: true, visits: rows, metrics, warning });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'visit_create').trim();

  if (action === 'visit_create') {
    const patientName = String(body.patientName || body.patient_name || '').trim();
    if (!patientName) return NextResponse.json({ error: 'Patient name required' }, { status: 400 });

    const payload = {
      business_id: c.businessId,
      patient_id: body.patientId || body.patient_id || null,
      patient_name: patientName,
      appointment_id: body.appointmentId || body.appointment_id || null,
      chief_complaint: body.chiefComplaint || body.chief_complaint || body.reason || null,
      notes: body.notes || null,
      status: body.status || 'open',
      amount: Number(body.amount || 0),
    };

    const native = await admin.from('healthcare_visits').insert(payload).select('*').single();
    if (!native.error && native.data) {
      // optionally mark appointment completed
      if (payload.appointment_id) {
        await admin
          .from('healthcare_appointments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', payload.appointment_id)
          .eq('business_id', c.businessId);
      }
      return NextResponse.json({ ok: true, visit: native.data, source: 'native' });
    }

    // fallback industry_records
    const rec = await admin
      .from('industry_records')
      .insert({
        business_id: c.businessId,
        product_edition: 'healthcare',
        module: 'visits',
        title: patientName,
        status: payload.status,
        amount: payload.amount,
        notes: payload.chief_complaint || payload.notes,
        occurred_at: new Date().toISOString(),
        metadata: {
          patient_id: payload.patient_id,
          appointment_id: payload.appointment_id,
          notes: payload.notes,
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

    if (payload.appointment_id) {
      await admin
        .from('healthcare_appointments')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', payload.appointment_id)
        .eq('business_id', c.businessId);
    }

    return NextResponse.json({
      ok: true,
      visit: {
        id: rec.data.id,
        patient_name: rec.data.title,
        status: rec.data.status,
        chief_complaint: rec.data.notes,
        source: 'records',
      },
    });
  }

  if (action === 'visit_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.notes != null) patch.notes = body.notes;
    if (body.chiefComplaint != null || body.chief_complaint != null) {
      patch.chief_complaint = body.chiefComplaint || body.chief_complaint;
    }
    if (body.amount != null) patch.amount = Number(body.amount);

    const native = await admin
      .from('healthcare_visits')
      .update(patch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();

    if (!native.error && native.data) {
      return NextResponse.json({ ok: true, visit: native.data });
    }

    const recPatch: Record<string, unknown> = {};
    if (body.status != null) recPatch.status = body.status;
    if (body.chiefComplaint != null || body.notes != null) {
      recPatch.notes = body.chiefComplaint || body.chief_complaint || body.notes;
    }
    if (body.amount != null) recPatch.amount = Number(body.amount);

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
    return NextResponse.json({ ok: true, visit: rec.data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

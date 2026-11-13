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

function dayBounds(dateStr?: string | null) {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(d.getTime())) {
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    const e = new Date(n);
    e.setHours(23, 59, 59, 999);
    return { start: n, end: e };
  }
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function ensurePatient(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  if (body.patientId) {
    return {
      patientId: String(body.patientId),
      patientName: String(body.patientName || body.fullName || '').trim() || 'Patient',
    };
  }
  const name = String(body.patientName || body.fullName || '').trim();
  if (!name) return null;

  // try match by phone
  const phone = body.phone ? String(body.phone).trim() : '';
  if (phone) {
    const { data: found } = await admin
      .from('healthcare_patients')
      .select('id, full_name, name')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .limit(1)
      .maybeSingle();
    if (found?.id) {
      return {
        patientId: found.id,
        patientName: String(found.full_name || found.name || name),
      };
    }
  }

  const insertRich = await admin
    .from('healthcare_patients')
    .insert({
      business_id: businessId,
      full_name: name,
      phone: phone || null,
      status: 'active',
    })
    .select('id, full_name')
    .single();

  if (!insertRich.error && insertRich.data) {
    return { patientId: insertRich.data.id, patientName: insertRich.data.full_name || name };
  }

  const insertMin = await admin
    .from('healthcare_patients')
    .insert({ business_id: businessId, name, phone: phone || null })
    .select('id, name, full_name')
    .single();

  if (insertMin.error || !insertMin.data) {
    return { patientId: null as string | null, patientName: name };
  }
  return {
    patientId: insertMin.data.id,
    patientName: String(insertMin.data.full_name || insertMin.data.name || name),
  };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  const status = String(url.searchParams.get('status') || 'all');
  const range = String(url.searchParams.get('range') || 'day'); // day | upcoming
  const { start, end } = dayBounds(date);

  let query = admin
    .from('healthcare_appointments')
    .select('*')
    .eq('business_id', c.businessId)
    .order('scheduled_at', { ascending: true })
    .limit(150);

  if (range === 'upcoming') {
    query = query.gte('scheduled_at', new Date().toISOString());
  } else {
    query = query.gte('scheduled_at', start.toISOString()).lte('scheduled_at', end.toISOString());
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({
      ok: true,
      appointments: [],
      metrics: { total: 0, scheduled: 0, checked_in: 0, completed: 0, cancelled: 0 },
      warning: error.message,
    });
  }

  const rows = data || [];
  const metrics = {
    total: rows.length,
    scheduled: rows.filter((a) => a.status === 'scheduled').length,
    checked_in: rows.filter((a) => a.status === 'checked_in' || a.status === 'in_progress').length,
    completed: rows.filter((a) => a.status === 'completed').length,
    cancelled: rows.filter((a) => a.status === 'cancelled').length,
  };

  return NextResponse.json({
    ok: true,
    appointments: rows,
    metrics,
    date: start.toISOString().slice(0, 10),
  });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'appointment_create').trim();

  if (action === 'appointment_create') {
    const resolved = await ensurePatient(admin, c.businessId, body);
    if (!resolved?.patientName) {
      return NextResponse.json({ error: 'Patient name required' }, { status: 400 });
    }

    let scheduledAt = body.scheduledAt || body.scheduled_at;
    if (!scheduledAt && body.date) {
      const time = body.time || '09:00';
      scheduledAt = new Date(`${body.date}T${time}:00`).toISOString();
    }
    if (!scheduledAt) scheduledAt = new Date().toISOString();

    const { data, error } = await admin
      .from('healthcare_appointments')
      .insert({
        business_id: c.businessId,
        patient_id: resolved.patientId,
        patient_name: resolved.patientName,
        scheduled_at: scheduledAt,
        status: body.status || 'scheduled',
        reason: body.reason || null,
        amount: Number(body.amount || 0),
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, appointment: data, patientId: resolved.patientId });
  }

  if (action === 'appointment_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.reason != null) patch.reason = body.reason;
    if (body.scheduledAt != null || body.scheduled_at != null) {
      patch.scheduled_at = body.scheduledAt || body.scheduled_at;
    }
    if (body.amount != null) patch.amount = Number(body.amount);

    const { data, error } = await admin
      .from('healthcare_appointments')
      .update(patch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, appointment: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

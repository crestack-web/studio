import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { resolveIndustryAccess, canAccessDesk, canMutateDesk } from '@/lib/industries/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return s.businessId || null;
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [branding, patients, appts] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    admin.from('healthcare_patients').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),
    admin
      .from('healthcare_appointments')
      .select('*')
      .eq('business_id', businessId)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true }),
  ]);

  const today = appts.data || [];
  const waiting = today.filter((a: any) => a.status === 'checked_in' || a.status === 'scheduled').length;
  const completed = today.filter((a: any) => a.status === 'completed').length;
  const revenue = today.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    branding: branding.data || { display_name: null, logo_url: null, currency: 'NGN' },
    metrics: {
      appointmentsToday: today.length,
      waiting,
      completed,
      patients: (patients.data || []).length,
      revenueToday: revenue,
    },
    patients: patients.data || [],
    appointmentsToday: today,
    warnings: [branding.error?.message, patients.error?.message, appts.error?.message].filter(Boolean),
  });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'appointment');

  if (action === 'patient') {
    const full_name = String(body.fullName || '').trim();
    if (!full_name) return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    const { data, error } = await admin
      .from('healthcare_patients')
      .insert({ business_id: businessId, full_name, phone: body.phone || null })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, patient: data });
  }

  if (action === 'appointment') {
    const patient_name = String(body.patientName || '').trim();
    if (!patient_name) return NextResponse.json({ error: 'patientName required' }, { status: 400 });
    const { data, error } = await admin
      .from('healthcare_appointments')
      .insert({
        business_id: businessId,
        patient_id: body.patientId || null,
        patient_name,
        scheduled_at: body.scheduledAt || new Date().toISOString(),
        status: body.status || 'scheduled',
        reason: body.reason || null,
        amount: Number(body.amount || 0),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, appointment: data });
  }

  if (action === 'update_appointment') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { data, error } = await admin
      .from('healthcare_appointments')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, appointment: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

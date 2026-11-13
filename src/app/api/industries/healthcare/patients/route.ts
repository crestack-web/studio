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

function normPhone(p: string) {
  return String(p || '').replace(/\D/g, '');
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const url = new URL(req.url);
  const q = String(url.searchParams.get('q') || '').trim().toLowerCase();
  const status = String(url.searchParams.get('status') || 'all').trim();
  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 200);

  let query = admin
    .from('healthcare_patients')
    .select('*')
    .eq('business_id', c.businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({
      ok: true,
      patients: [],
      metrics: { total: 0, active: 0, inactive: 0 },
      warning: error.message,
    });
  }

  let rows = data || [];
  if (q) {
    const digits = normPhone(q);
    rows = rows.filter((p: any) => {
      const name = String(p.full_name || p.name || '').toLowerCase();
      const phone = String(p.phone || '');
      const code = String(p.patient_code || '').toLowerCase();
      const email = String(p.email || '').toLowerCase();
      if (name.includes(q) || email.includes(q) || code.includes(q)) return true;
      if (digits && normPhone(phone).includes(digits)) return true;
      return false;
    });
  }

  const all = data || [];
  const metrics = {
    total: all.length,
    active: all.filter((p: any) => String(p.status || 'active') === 'active').length,
    inactive: all.filter((p: any) => String(p.status) === 'inactive').length,
  };

  return NextResponse.json({ ok: true, patients: rows, metrics });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'patient_create').trim();

  if (action === 'patient_create') {
    const full_name = String(body.fullName || body.full_name || body.name || '').trim();
    if (!full_name) return NextResponse.json({ error: 'Patient name required' }, { status: 400 });
    const phone = body.phone != null ? String(body.phone).trim() || null : null;

    if (phone) {
      const { data: existing } = await admin
        .from('healthcare_patients')
        .select('id, full_name, phone, status')
        .eq('business_id', c.businessId)
        .eq('phone', phone)
        .limit(5);
      if (existing && existing.length && !body.force) {
        return NextResponse.json(
          {
            error: 'A patient with this phone may already exist',
            duplicates: existing,
            code: 'DUPLICATE_PHONE',
          },
          { status: 409 }
        );
      }
    }

    const rich = {
      business_id: c.businessId,
      full_name,
      phone,
      email: body.email || null,
      sex: body.sex || null,
      date_of_birth: body.dateOfBirth || body.date_of_birth || null,
      address: body.address || null,
      emergency_contact_name: body.emergencyContactName || null,
      emergency_contact_phone: body.emergencyContactPhone || null,
      notes: body.notes || null,
      status: body.status || 'active',
    };

    let { data, error } = await admin.from('healthcare_patients').insert(rich).select('*').single();
    if (error) {
      const minimal: Record<string, unknown> = {
        business_id: c.businessId,
        full_name,
        phone,
      };
      const retry = await admin.from('healthcare_patients').insert(minimal).select('*').single();
      if (retry.error) {
        const retry2 = await admin
          .from('healthcare_patients')
          .insert({ business_id: c.businessId, name: full_name, phone })
          .select('*')
          .single();
        if (retry2.error) return NextResponse.json({ error: retry2.error.message }, { status: 500 });
        return NextResponse.json({ ok: true, patient: retry2.data });
      }
      data = retry.data;
    }
    return NextResponse.json({ ok: true, patient: data });
  }

  if (action === 'patient_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.fullName != null || body.full_name != null) patch.full_name = body.fullName || body.full_name;
    if (body.phone != null) patch.phone = body.phone || null;
    if (body.email != null) patch.email = body.email || null;
    if (body.notes != null) patch.notes = body.notes;
    if (body.sex != null) patch.sex = body.sex;
    if (body.dateOfBirth != null || body.date_of_birth != null) {
      patch.date_of_birth = body.dateOfBirth || body.date_of_birth;
    }
    if (body.address != null) patch.address = body.address;

    const { data, error } = await admin
      .from('healthcare_patients')
      .update(patch)
      .eq('id', id)
      .eq('business_id', c.businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, patient: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

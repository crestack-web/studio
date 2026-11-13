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

async function resolveStaffName(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  staffId: string
) {
  const native = await admin
    .from('healthcare_staff')
    .select('id, full_name, name, role')
    .eq('business_id', businessId)
    .eq('id', staffId)
    .maybeSingle();
  if (native.data) {
    return {
      id: native.data.id,
      name: String(native.data.full_name || native.data.name || 'Clinician'),
      role: native.data.role || null,
    };
  }
  const rec = await admin
    .from('industry_records')
    .select('id, title, metadata')
    .eq('business_id', businessId)
    .eq('id', staffId)
    .maybeSingle();
  if (rec.data) {
    return {
      id: rec.data.id,
      name: String(rec.data.title || 'Clinician'),
      role: rec.data.metadata?.role || null,
    };
  }
  return null;
}

/** Prefer explicit clinician body fields; else patient's assigned primary. */
async function resolveClinician(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  let staffId = body.clinicianStaffId || body.clinician_staff_id || body.staffId || null;
  let name = body.clinicianName || body.clinician_name || null;

  if (!staffId && body.patientId) {
    const { data: patient } = await admin
      .from('healthcare_patients')
      .select('id, assigned_staff_id, assigned_clinician_name, primary_clinician_id')
      .eq('business_id', businessId)
      .eq('id', String(body.patientId))
      .maybeSingle();
    if (patient) {
      staffId = patient.assigned_staff_id || patient.primary_clinician_id || null;
      name = name || patient.assigned_clinician_name || null;
    }
  }

  if (staffId && !name) {
    const member = await resolveStaffName(admin, businessId, String(staffId));
    if (member) name = member.name;
  }

  return {
    clinician_staff_id: staffId ? String(staffId) : null,
    clinician_name: name ? String(name) : null,
  };
}

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
      clinician_staff_id: r.metadata?.clinician_staff_id || null,
      clinician_name: r.metadata?.clinician_name || null,
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
      const hay = `${r.patient_name || ''} ${r.chief_complaint || r.notes || ''} ${r.clinician_name || ''}`.toLowerCase();
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

    const clinician = await resolveClinician(admin, c.businessId, body);

    const payload = {
      business_id: c.businessId,
      patient_id: body.patientId || body.patient_id || null,
      patient_name: patientName,
      appointment_id: body.appointmentId || body.appointment_id || null,
      clinician_staff_id: clinician.clinician_staff_id,
      clinician_name: clinician.clinician_name,
      chief_complaint: body.chiefComplaint || body.chief_complaint || body.reason || null,
      notes: body.notes || null,
      status: body.status || 'open',
      amount: Number(body.amount || 0),
    };

    let native = await admin.from('healthcare_visits').insert(payload).select('*').single();
    if (native.error) {
      // Schema without clinician columns
      const { clinician_staff_id: _a, clinician_name: _b, ...basic } = payload;
      native = await admin.from('healthcare_visits').insert(basic).select('*').single();
    }

    if (!native.error && native.data) {
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
          ...native.data,
          clinician_staff_id: native.data.clinician_staff_id || clinician.clinician_staff_id,
          clinician_name: native.data.clinician_name || clinician.clinician_name,
        },
        source: 'native',
      });
    }

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
          clinician_staff_id: payload.clinician_staff_id,
          clinician_name: payload.clinician_name,
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
        clinician_staff_id: payload.clinician_staff_id,
        clinician_name: payload.clinician_name,
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

    if (body.clinicianStaffId !== undefined || body.clinician_staff_id !== undefined) {
      const sid = body.clinicianStaffId ?? body.clinician_staff_id;
      patch.clinician_staff_id = sid || null;
      if (sid) {
        const member = await resolveStaffName(admin, c.businessId, String(sid));
        patch.clinician_name = member?.name || body.clinicianName || null;
      } else {
        patch.clinician_name = null;
      }
    }

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

    const existing = await admin
      .from('industry_records')
      .select('metadata')
      .eq('id', id)
      .eq('business_id', c.businessId)
      .maybeSingle();

    if (body.clinicianStaffId !== undefined || body.clinician_staff_id !== undefined) {
      const sid = body.clinicianStaffId ?? body.clinician_staff_id;
      let cname = body.clinicianName || null;
      if (sid && !cname) {
        const member = await resolveStaffName(admin, c.businessId, String(sid));
        cname = member?.name || null;
      }
      recPatch.metadata = {
        ...(existing.data?.metadata || {}),
        clinician_staff_id: sid || null,
        clinician_name: cname,
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
    return NextResponse.json({ ok: true, visit: rec.data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

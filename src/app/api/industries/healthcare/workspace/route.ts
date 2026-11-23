import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { notifySolutionStaffInvite } from '@/lib/industries/staff-invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDITION = 'healthcare';

const MODULES = ['beds', 'supplies', 'payments', 'condition-log', 'settings'] as const;

async function ctx(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!s.businessId) return null;
  return { businessId: s.businessId, businessName: s.businessName };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

async function loadRecords(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  moduleName: string,
  limit = 300
) {
  const { data, error } = await admin
    .from('industry_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('product_edition', EDITION)
    .eq('module', moduleName)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [] as any[], warning: error.message };
  return { rows: asRows(data), warning: null as string | null };
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function patientCode() {
  return `MRC-${Math.floor(1000 + Math.random() * 8999)}`;
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { businessId } = c;

  const [branding, patientsRes, apptsRes, visitsRes, staffRes, billingRes, ...recordSets] =
    await Promise.all([
      admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
      admin
        .from('healthcare_patients')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('healthcare_appointments')
        .select('*')
        .eq('business_id', businessId)
        .order('scheduled_at', { ascending: false })
        .limit(500),
      admin
        .from('healthcare_visits')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('healthcare_staff')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })
        .limit(300),
      admin
        .from('healthcare_billing')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(500),
      ...MODULES.map((m) => loadRecords(admin, businessId, m)),
    ]);

  const byModule: Record<string, any[]> = {};
  MODULES.forEach((m, i) => {
    byModule[m] = recordSets[i]?.rows || [];
  });

  const patients = asRows(patientsRes.data);
  const appointments = asRows(apptsRes.data);
  const visits = asRows(visitsRes.data);
  const staff = asRows(staffRes.data);
  const billing = asRows(billingRes.data);

  const warnings = [
    branding.error?.message,
    patientsRes.error?.message,
    apptsRes.error?.message,
    visitsRes.error?.message,
    staffRes.error?.message,
    billingRes.error?.message,
    ...recordSets.map((r: any) => r?.warning),
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    businessId,
    businessName: c.businessName,
    branding: branding.data || { display_name: c.businessName, logo_url: null, currency: 'NGN' },
    metrics: {
      patients: patients.length,
      appointments: appointments.length,
      visits: visits.length,
      staff: staff.length,
      billed: billing.reduce((s, b) => s + Number(b.amount || 0), 0),
      collected: billing.reduce((s, b) => s + Number(b.paid_amount || 0), 0),
      openConditions: byModule['condition-log'].filter((r) => String(r.status) === 'active').length,
    },
    patients,
    appointments,
    visits,
    staff,
    billing,
    beds: byModule.beds,
    supplies: byModule.supplies,
    payments: byModule.payments,
    conditionLog: byModule['condition-log'],
    settings: byModule.settings?.[0] || null,
    warnings,
  });
}

async function ensurePatient(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  if (body.patientId || body.patient_id) {
    return {
      id: String(body.patientId || body.patient_id),
      full_name: String(body.patientName || body.patient_name || 'Patient'),
    };
  }
  const name = String(body.patientName || body.patient_name || body.fullName || '').trim();
  if (!name) return null;
  const phone = body.phone ? String(body.phone).trim() : '';
  if (phone) {
    const found = await admin
      .from('healthcare_patients')
      .select('id, full_name, phone')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .limit(1)
      .maybeSingle();
    if (found.data?.id) return { id: found.data.id, full_name: found.data.full_name };
  }
  const inserted = await admin
    .from('healthcare_patients')
    .insert({
      business_id: businessId,
      full_name: name,
      phone: phone || null,
      patient_code: patientCode(),
      status: 'active',
    })
    .select('id, full_name')
    .single();
  if (inserted.error) return null;
  return { id: inserted.data.id, full_name: inserted.data.full_name };
}

async function addConditionLog(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  const patientId = String(body.patientId || body.patient_id || '');
  const condition = String(body.condition || body.title || '').trim();
  if (!patientId || !condition) return null;
  const action = String(body.action || 'add');
  const { data } = await admin
    .from('industry_records')
    .insert({
      business_id: businessId,
      product_edition: EDITION,
      module: 'condition-log',
      title: condition,
      status: action === 'resolve' ? 'resolved' : action === 'note' ? 'note' : 'active',
      notes: body.note || body.notes || null,
      meta: {
        patient_id: patientId,
        patient_name: body.patientName || null,
        condition,
        action,
        severity: body.severity || null,
      },
      occurred_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  return data || null;
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').trim();
  const { businessId } = c;

  if (action === 'settings_save') {
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
    const title = String(settings.name || settings.displayName || 'Clinic settings');
    const existing = await admin
      .from('industry_records')
      .select('id')
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .eq('module', 'settings')
      .limit(1)
      .maybeSingle();
    const { data, error } = existing.data
      ? await admin
          .from('industry_records')
          .update({ title, meta: settings, status: 'active' })
          .eq('id', existing.data.id)
          .eq('business_id', businessId)
          .select('*')
          .single()
      : await admin
          .from('industry_records')
          .insert({
            business_id: businessId,
            product_edition: EDITION,
            module: 'settings',
            title,
            status: 'active',
            meta: settings,
            occurred_at: new Date().toISOString(),
          })
          .select('*')
          .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (settings.name || settings.logoUrl || settings.currency) {
      await admin.from('solution_branding').upsert(
        {
          business_id: businessId,
          product_edition: EDITION,
          display_name: settings.name || title,
          logo_url: settings.logoUrl || null,
          currency: settings.currency || 'NGN',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id' }
      );
    }
    return NextResponse.json({ ok: true, settings: data });
  }

  if (action === 'patient_create' || action === 'patient_update') {
    const isUpdate = action === 'patient_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const fullName = String(body.fullName || body.full_name || '').trim();
    if (!isUpdate && !fullName) {
      return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {};
    if (fullName) payload.full_name = fullName;
    const simple: Array<[string, string]> = [
      ['phone', 'phone'],
      ['email', 'email'],
      ['sex', 'sex'],
      ['dateOfBirth', 'date_of_birth'],
      ['date_of_birth', 'date_of_birth'],
      ['bloodGroup', 'blood_group'],
      ['blood_group', 'blood_group'],
      ['address', 'address'],
      ['notes', 'notes'],
      ['status', 'status'],
      ['assignedClinicianName', 'assigned_clinician_name'],
      ['assigned_clinician_name', 'assigned_clinician_name'],
      ['patientCode', 'patient_code'],
      ['patient_code', 'patient_code'],
      ['emergencyContactName', 'emergency_contact_name'],
      ['emergencyContactPhone', 'emergency_contact_phone'],
    ];
    for (const [from, to] of simple) {
      if (body[from] !== undefined) payload[to] = body[from] === '' ? null : body[from];
    }
    if (body.conditions !== undefined) payload.conditions = toArray(body.conditions);
    if (body.allergies !== undefined) payload.allergies = toArray(body.allergies);
    payload.updated_at = new Date().toISOString();
    if (!isUpdate && !payload.patient_code) payload.patient_code = patientCode();

    const query = isUpdate
      ? admin
          .from('healthcare_patients')
          .update(payload)
          .eq('id', id)
          .eq('business_id', businessId)
      : admin.from('healthcare_patients').insert({ business_id: businessId, ...payload });

    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, patient: data });
  }

  if (action === 'condition_update') {
    const patientId = String(body.patientId || body.patient_id || '');
    const condition = String(body.condition || '').trim();
    const mode = String(body.mode || 'add');
    if (!patientId || !condition) {
      return NextResponse.json({ error: 'patientId and condition required' }, { status: 400 });
    }
    const { data: patient, error } = await admin
      .from('healthcare_patients')
      .select('id, full_name, conditions')
      .eq('id', patientId)
      .eq('business_id', businessId)
      .maybeSingle();
    if (error || !patient) {
      return NextResponse.json({ error: error?.message || 'Patient not found' }, { status: 404 });
    }
    const current = toArray(patient.conditions);
    const lower = condition.toLowerCase();
    let next = current;
    if (mode === 'add' && !current.some((c) => c.toLowerCase() === lower)) {
      next = [...current, condition];
    } else if (mode === 'resolve') {
      next = current.filter((c) => c.toLowerCase() !== lower);
    }
    const update: Record<string, unknown> = {
      conditions: next,
      updated_at: new Date().toISOString(),
    };
    if (body.status) update.status = body.status;
    const saved = await admin
      .from('healthcare_patients')
      .update(update)
      .eq('id', patientId)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (saved.error) return NextResponse.json({ error: saved.error.message }, { status: 500 });
    const log = await addConditionLog(admin, businessId, {
      ...body,
      patientId,
      patientName: patient.full_name,
      condition,
      action: mode === 'resolve' ? 'resolve' : 'add',
    });
    return NextResponse.json({ ok: true, patient: saved.data, log });
  }

  if (action === 'appointment_create') {
    const patient = await ensurePatient(admin, businessId, body);
    if (!patient) return NextResponse.json({ error: 'Patient name required' }, { status: 400 });
    let scheduledAt = body.scheduledAt || body.scheduled_at;
    if (!scheduledAt && body.date) {
      scheduledAt = new Date(`${body.date}T${body.time || '09:00'}:00`).toISOString();
    }
    if (!scheduledAt) scheduledAt = new Date().toISOString();
    const payload: Record<string, unknown> = {
      business_id: businessId,
      patient_id: patient.id,
      patient_name: patient.full_name,
      scheduled_at: scheduledAt,
      status: body.status || 'scheduled',
      reason: body.reason || null,
      amount: Number(body.amount || 0),
      clinician_name: body.clinicianName || body.clinician || null,
      clinician_staff_id: body.clinicianStaffId || null,
      department: body.department || null,
      duration_minutes: body.duration != null ? Number(body.duration) : 20,
      mode: body.mode || 'in_person',
      room: body.room || null,
    };
    let res = await admin.from('healthcare_appointments').insert(payload).select('*').single();
    if (res.error) {
      const { data, error } = await admin
        .from('healthcare_appointments')
        .insert({
          business_id: businessId,
          patient_id: patient.id,
          patient_name: patient.full_name,
          scheduled_at: scheduledAt,
          status: payload.status,
          reason: payload.reason,
          amount: payload.amount,
        })
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, appointment: data });
    }
    return NextResponse.json({ ok: true, appointment: res.data });
  }

  if (action === 'appointment_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required', status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of [
      'status',
      'reason',
      'clinician_name',
      'clinician_staff_id',
      'department',
      'mode',
      'room',
    ]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (body.clinicianName != null) patch.clinician_name = body.clinicianName;
    if (body.duration != null) patch.duration_minutes = Number(body.duration);
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.scheduledAt != null || body.scheduled_at != null) {
      patch.scheduled_at = body.scheduledAt || body.scheduled_at;
    }
    const { data, error } = await admin
      .from('healthcare_appointments')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, appointment: data });
  }

  if (action === 'visit_create' || action === 'visit_update') {
    const isUpdate = action === 'visit_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required', status: 400 });
    const payload: Record<string, unknown> = {};
    const simple: Array<[string, string]> = [
      ['patientId', 'patient_id'],
      ['patientName', 'patient_name'],
      ['appointmentId', 'appointment_id'],
      ['clinicianName', 'clinician_name'],
      ['clinicianStaffId', 'clinician_staff_id'],
      ['department', 'department'],
      ['visitType', 'visit_type'],
      ['type', 'visit_type'],
      ['chiefComplaint', 'chief_complaint'],
      ['reason', 'chief_complaint'],
      ['diagnosis', 'diagnosis'],
      ['notes', 'notes'],
      ['status', 'status'],
      ['room', 'room'],
    ];
    for (const [from, to] of simple) {
      if (body[from] !== undefined) payload[to] = body[from];
    }
    if (body.vitals !== undefined) payload.vitals = body.vitals || {};
    if (body.amount !== undefined) payload.amount = Number(body.amount);
    payload.updated_at = new Date().toISOString();
    if (!isUpdate) {
      if (!payload.patient_name) {
        return NextResponse.json({ error: 'patientName required' }, { status: 400 });
      }
      payload.status = payload.status || 'open';
      const inserted = await admin
        .from('healthcare_visits')
        .insert({ business_id: businessId, ...payload })
        .select('*')
        .single();
      if (inserted.error) return NextResponse.json({ error: inserted.error.message }, { status: 500 });
      if (payload.appointment_id) {
        await admin
          .from('healthcare_appointments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', String(payload.appointment_id))
          .eq('business_id', businessId);
      }
      return NextResponse.json({ ok: true, visit: inserted.data });
    }
    const { data, error } = await admin
      .from('healthcare_visits')
      .update(payload)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, visit: data });
  }

  if (action === 'staff_create' || action === 'staff_update') {
    const isUpdate = action === 'staff_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const payload: Record<string, unknown> = {};
    const fullName = String(body.fullName || body.full_name || '').trim();
    if (fullName) payload.full_name = fullName;
    for (const key of ['role', 'specialty', 'department', 'phone', 'email', 'license_number', 'shift', 'notes', 'status']) {
      if (body[key] !== undefined) payload[key] = body[key];
    }
    if (body.license != null) payload.license_number = body.license;
    payload.updated_at = new Date().toISOString();
    if (!isUpdate && !payload.full_name) {
      return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    }
    const query = isUpdate
      ? admin.from('healthcare_staff').update(payload).eq('id', id).eq('business_id', businessId)
      : admin.from('healthcare_staff').insert({ business_id: businessId, ...payload });
    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invite =
      !isUpdate && String(payload.email || '')
        ? await notifySolutionStaffInvite({
            email: String(payload.email),
            staffName: fullName || 'there',
            businessName: c.businessName,
            suiteName: 'Busmo Healthcare',
          })
        : null;

    return NextResponse.json({ ok: true, staff: data, businessName: c.businessName, ...(invite || {}) });
  }

  if (action === 'billing_create' || action === 'billing_update') {
    const isUpdate = action === 'billing_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const payload: Record<string, unknown> = {};
    for (const key of ['patient_id', 'patient_name', 'visit_id', 'invoice_number', 'description', 'payer', 'status', 'due_date']) {
      if (body[key] !== undefined) payload[key] = body[key];
    }
    if (body.patientId != null) payload.patient_id = body.patientId;
    if (body.patientName != null) payload.patient_name = body.patientName;
    if (body.amount != null) payload.amount = Number(body.amount);
    if (body.paid != null || body.paidAmount != null) {
      payload.paid_amount = Number(body.paidAmount ?? body.paid);
    }
    if (payload.status === 'paid' && !payload.paid_at) payload.paid_at = new Date().toISOString();
    payload.updated_at = new Date().toISOString();
    if (!isUpdate && (!payload.patient_name || !payload.amount)) {
      return NextResponse.json({ error: 'patientName and amount required' }, { status: 400 });
    }
    const query = isUpdate
      ? admin.from('healthcare_billing').update(payload).eq('id', id).eq('business_id', businessId)
      : admin.from('healthcare_billing').insert({ business_id: businessId, ...payload });
    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, billing: data });
  }

  if (action === 'record_create') {
    const moduleName = String(body.module || '').trim();
    if (!(MODULES as readonly string[]).includes(moduleName)) {
      return NextResponse.json(
        { error: `module must be one of ${MODULES.join(', ')}` },
        { status: 400 }
      );
    }
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const { data, error } = await admin
      .from('industry_records')
      .insert({
        business_id: businessId,
        product_edition: EDITION,
        module: moduleName,
        title,
        status: body.status || 'open',
        amount: body.amount != null ? Number(body.amount) : 0,
        notes: body.notes || null,
        meta: body.meta || {},
        occurred_at: body.occurredAt || new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (action === 'record_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.title != null) patch.title = body.title;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.notes != null) patch.notes = body.notes;
    if (body.meta != null) {
      const existing = await admin
        .from('industry_records')
        .select('meta')
        .eq('id', id)
        .eq('business_id', businessId)
        .maybeSingle();
      patch.meta = { ...(existing.data?.meta || {}), ...body.meta };
    }
    if (body.occurredAt != null) patch.occurred_at = body.occurredAt;
    const { data, error } = await admin
      .from('industry_records')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (action === 'record_delete') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin
      .from('industry_records')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

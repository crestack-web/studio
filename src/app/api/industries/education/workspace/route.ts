import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDITION = 'education';

const MODULES = [
  'classes',
  'enrollments',
  'teachers',
  'timetable',
  'topics',
  'fees',
  'attendance-days',
  'attendance-records',
  'settings',
] as const;

type ModuleName = (typeof MODULES)[number];

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
  limit = 400
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

function normDay(iso: string) {
  return String(iso || '').slice(0, 10);
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { businessId } = c;

  const [branding, studentsRes, feesRes, ...recordSets] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    admin
      .from('education_students')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('education_fee_payments')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(500),
    ...MODULES.map((m) => loadRecords(admin, businessId, m)),
  ]);

  const students = asRows(studentsRes.data);
  const fees = asRows(feesRes.data);
  const byModule: Record<string, any[]> = {};
  MODULES.forEach((m, i) => {
    byModule[m] = recordSets[i]?.rows || [];
  });

  const today = normDay(new Date().toISOString());
  const collectedToday = fees
    .filter((f) => normDay(f.created_at) === today && String(f.status) !== 'reversed')
    .reduce((s, f) => s + Number(f.amount || 0), 0);

  const warnings = [
    branding.error?.message,
    studentsRes.error?.message,
    feesRes.error?.message,
    ...recordSets.map((r: any) => r?.warning),
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    businessId,
    businessName: c.businessName,
    branding: branding.data || { display_name: c.businessName, logo_url: null, currency: 'NGN' },
    metrics: {
      students: students.length,
      feesToday: fees.filter((f) => normDay(f.created_at) === today).length,
      collectedToday,
      pending: fees.filter((f) => String(f.status) === 'pending').length,
      classes: byModule.classes.length,
      teachers: byModule.teachers.length,
      lessons: byModule.timetable.length,
      topics: byModule.topics.length,
    },
    students,
    fees,
    classes: byModule.classes,
    enrollments: byModule.enrollments,
    teachers: byModule.teachers,
    timetable: byModule.timetable,
    topics: byModule.topics,
    feeInvoices: byModule.fees,
    attendanceDays: byModule['attendance-days'],
    attendanceRecords: byModule['attendance-records'],
    settings: byModule.settings?.[0] || null,
    warnings,
  });
}

async function insertRecord(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  const moduleName = String(body.module || '').trim();
  const title = String(body.title || '').trim();
  if (!(MODULES as readonly string[]).includes(moduleName)) {
    return { error: `module must be one of ${MODULES.join(', ')}`, status: 400 as const };
  }
  if (!title) return { error: 'title required', status: 400 as const };

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
  if (error) return { error: error.message, status: 500 as const };
  return { record: data };
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
    const title = String(settings.name || settings.displayName || 'School settings');
    const existing = await admin
      .from('industry_records')
      .select('id')
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .eq('module', 'settings')
      .limit(1)
      .maybeSingle();
    const payload = {
      business_id: businessId,
      product_edition: EDITION,
      module: 'settings',
      title,
      status: 'active',
      notes: null,
      meta: settings,
      occurred_at: new Date().toISOString(),
    };
    const { data, error } = existing.data
      ? await admin
          .from('industry_records')
          .update({ title, meta: settings, status: 'active' })
          .eq('id', existing.data.id)
          .eq('business_id', businessId)
          .select('*')
          .single()
      : await admin.from('industry_records').insert(payload).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, settings: data });
  }

  if (action === 'student_create') {
    const full_name = String(body.fullName || body.full_name || '').trim();
    if (!full_name) return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    const payload: Record<string, unknown> = {
      business_id: businessId,
      full_name,
      class_name: body.className || body.class_name || null,
      admission_no: body.admissionNo || body.admission_no || null,
      gender: body.gender || null,
      date_of_birth: body.dateOfBirth || body.date_of_birth || null,
      guardian: body.guardian || null,
      guardian_phone: body.guardianPhone || body.guardian_phone || null,
      email: body.email || null,
      notes: body.notes || null,
      status: body.status || 'active',
    };
    let res = await admin.from('education_students').insert(payload).select('*').single();
    if (res.error) {
      // Older schema safety net
      const { data, error } = await admin
        .from('education_students')
        .insert({ business_id: businessId, full_name, class_name: payload.class_name })
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, student: data });
    }
    return NextResponse.json({ ok: true, student: res.data });
  }

  if (action === 'student_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const map: Array<[string, string]> = [
      ['fullName', 'full_name'],
      ['full_name', 'full_name'],
      ['className', 'class_name'],
      ['class_name', 'class_name'],
      ['admissionNo', 'admission_no'],
      ['admission_no', 'admission_no'],
      ['gender', 'gender'],
      ['dateOfBirth', 'date_of_birth'],
      ['date_of_birth', 'date_of_birth'],
      ['guardian', 'guardian'],
      ['guardianPhone', 'guardian_phone'],
      ['guardian_phone', 'guardian_phone'],
      ['email', 'email'],
      ['notes', 'notes'],
      ['status', 'status'],
    ];
    for (const [from, to] of map) {
      if (body[from] !== undefined) patch[to] = body[from];
    }
    const { data, error } = await admin
      .from('education_students')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, student: data });
  }

  if (action === 'student_delete') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin
      .from('education_students')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'fee_create') {
    const student_name = String(body.studentName || body.student_name || '').trim();
    if (!student_name) return NextResponse.json({ error: 'studentName required' }, { status: 400 });
    const payload: Record<string, unknown> = {
      business_id: businessId,
      student_id: body.studentId || body.student_id || null,
      student_name,
      amount: Number(body.amount || 0),
      status: body.status || 'recorded',
      method: body.method || 'cash',
      note: body.note || body.notes || null,
      invoice_number: body.invoiceNumber || body.invoice_number || null,
      term: body.term || null,
      class_name: body.className || body.class_name || null,
      due_date: body.dueDate || body.due_date || null,
    };
    let res = await admin.from('education_fee_payments').insert(payload).select('*').single();
    if (res.error) {
      const { data, error } = await admin
        .from('education_fee_payments')
        .insert({
          business_id: businessId,
          student_id: payload.student_id,
          student_name,
          amount: payload.amount,
          status: payload.status,
          method: payload.method,
          note: payload.note,
        })
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, fee: data });
    }
    return NextResponse.json({ ok: true, fee: res.data });
  }

  if (action === 'fee_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required', status: 400 });
    const patch: Record<string, unknown> = {};
    if (body.status != null) patch.status = body.status;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.note != null || body.notes != null) patch.note = body.note || body.notes;
    if (body.paid != null) patch.paid = Number(body.paid);
    const { data, error } = await admin
      .from('education_fee_payments')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, fee: data });
  }

  if (action === 'record_create') {
    const res = await insertRecord(admin, businessId, body);
    if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, record: res.record });
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
      // Merge so partial meta updates never erase sibling keys.
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

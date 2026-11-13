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
  return { user, businessId: s.businessId, businessName: s.businessName };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

async function loadRecords(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  moduleName: string
) {
  const { data, error } = await admin
    .from('industry_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('product_edition', 'professional')
    .eq('module', moduleName)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return { rows: [] as any[], warning: error.message };
  return { rows: asRows(data), warning: null as string | null };
}

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { businessId } = c;

  const [
    branding,
    clientsRes,
    tasksRes,
    projects,
    invoices,
    timeEntries,
    events,
    deliverables,
    expenses,
    team,
    workload,
    payments,
  ] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    admin
      .from('professional_clients')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('professional_tasks')
      .select('*')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(100),
    loadRecords(admin, businessId, 'projects'),
    loadRecords(admin, businessId, 'invoices'),
    loadRecords(admin, businessId, 'time-tracking'),
    loadRecords(admin, businessId, 'calendar'),
    loadRecords(admin, businessId, 'deliverables'),
    loadRecords(admin, businessId, 'expenses'),
    loadRecords(admin, businessId, 'team'),
    loadRecords(admin, businessId, 'workload'),
    loadRecords(admin, businessId, 'payments'),
  ]);

  const clients = asRows(clientsRes.data);
  const tasks = asRows(tasksRes.data);
  const projectRows = projects.rows;
  const invoiceRows = invoices.rows;

  const openTasks = tasks.filter((t) => ['open', 'in_progress', 'todo'].includes(String(t.status)));
  const activeProjects = projectRows.filter(
    (p) => !['done', 'completed', 'cancelled', 'archived'].includes(String(p.status))
  );
  const outstanding = invoiceRows
    .filter((i) => ['draft', 'sent', 'overdue', 'open'].includes(String(i.status)))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const paid = invoiceRows
    .filter((i) => String(i.status) === 'paid')
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const warnings = [
    branding.error?.message,
    clientsRes.error?.message,
    tasksRes.error?.message,
    projects.warning,
    invoices.warning,
    timeEntries.warning,
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    businessId,
    branding: branding.data || { display_name: c.businessName, logo_url: null, currency: 'NGN' },
    metrics: {
      clients: clients.length,
      activeProjects: activeProjects.length,
      openTasks: openTasks.length,
      outstanding,
      paid,
      timeLogged: timeEntries.rows.reduce((s, r) => s + Number(r.amount || 0), 0),
      deliverablesOpen: deliverables.rows.filter((d) => String(d.status) !== 'accepted').length,
    },
    clients,
    tasks,
    projects: projectRows,
    invoices: invoiceRows,
    timeEntries: timeEntries.rows,
    events: events.rows,
    deliverables: deliverables.rows,
    expenses: expenses.rows,
    team: team.rows,
    workload: workload.rows,
    payments: payments.rows,
    warnings,
  });
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const { businessId } = c;
  const action = String(body.action || '').trim();

  if (action === 'client_create') {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Client name required' }, { status: 400 });
    const { data, error } = await admin
      .from('professional_clients')
      .insert({
        business_id: businessId,
        name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        notes: body.notes || null,
        status: body.status || 'active',
      })
      .select('*')
      .single();
    if (error) {
      const { data: d2, error: e2 } = await admin
        .from('professional_clients')
        .insert({ business_id: businessId, name })
        .select('*')
        .single();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json({ ok: true, client: d2 });
    }
    return NextResponse.json({ ok: true, client: data });
  }

  if (action === 'client_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.name != null) patch.name = body.name;
    if (body.notes != null) patch.notes = body.notes;
    const { data, error } = await admin
      .from('professional_clients')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, client: data });
  }

  if (action === 'task_create') {
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'Task title required' }, { status: 400 });
    const { data, error } = await admin
      .from('professional_tasks')
      .insert({
        business_id: businessId,
        title,
        client_name: body.clientName || body.client_name || null,
        status: body.status || 'open',
        due_date: body.dueDate || body.due_date || null,
        priority: body.priority || 'medium',
        assignee: body.assignee || null,
      })
      .select('*')
      .single();
    if (error) {
      const { data: d2, error: e2 } = await admin
        .from('professional_tasks')
        .insert({
          business_id: businessId,
          title,
          client_name: body.clientName || null,
          status: body.status || 'open',
          due_date: body.dueDate || null,
        })
        .select('*')
        .single();
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      return NextResponse.json({ ok: true, task: d2 });
    }
    return NextResponse.json({ ok: true, task: data });
  }

  if (action === 'task_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.title != null) patch.title = body.title;
    if (body.priority != null) patch.priority = body.priority;
    const { data, error } = await admin
      .from('professional_tasks')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, task: data });
  }

  if (action === 'record_create') {
    const moduleName = String(body.module || '').trim();
    const title = String(body.title || '').trim();
    if (!moduleName || !title) {
      return NextResponse.json({ error: 'module and title required' }, { status: 400 });
    }
    const { data, error } = await admin
      .from('industry_records')
      .insert({
        business_id: businessId,
        product_edition: 'professional',
        module: moduleName,
        title,
        status: body.status || 'open',
        amount: body.amount != null ? Number(body.amount) : 0,
        notes: body.notes || null,
        occurred_at: body.occurredAt || new Date().toISOString(),
        metadata: body.metadata || {},
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (action === 'record_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (body.status != null) patch.status = body.status;
    if (body.title != null) patch.title = body.title;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.notes != null) patch.notes = body.notes;
    const { data, error } = await admin
      .from('industry_records')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

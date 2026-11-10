import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, { product_edition: 'professional' });
  return s.businessId || null;
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();

  const [branding, clients, tasks] = await Promise.all([
    admin.from('solution_branding').select('*').eq('business_id', businessId).maybeSingle(),
    admin.from('professional_clients').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(40),
    admin
      .from('professional_tasks')
      .select('*')
      .eq('business_id', businessId)
      .in('status', ['open', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(40),
  ]);

  const taskRows = tasks.data || [];
  return NextResponse.json({
    ok: true,
    branding: branding.data || { display_name: null, logo_url: null, currency: 'NGN' },
    metrics: {
      clients: (clients.data || []).length,
      openTasks: taskRows.filter((t: any) => t.status === 'open').length,
      inProgress: taskRows.filter((t: any) => t.status === 'in_progress').length,
      dueSoon: taskRows.filter((t: any) => t.due_date).length,
    },
    clients: clients.data || [],
    tasks: taskRows,
    warnings: [branding.error?.message, clients.error?.message, tasks.error?.message].filter(Boolean),
  });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();
  const action = String(body.action || 'task');

  if (action === 'client') {
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const { data, error } = await admin
      .from('professional_clients')
      .insert({ business_id: businessId, name })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, client: data });
  }

  if (action === 'task') {
    const title = String(body.title || '').trim();
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    const { data, error } = await admin
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, task: data });
  }

  if (action === 'update_task') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { data, error } = await admin
      .from('professional_tasks')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('business_id', businessId)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, task: data });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

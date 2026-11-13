import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  getHomePayload,
  handleChat,
  listTasks,
  createTask,
  updateTaskStatus,
  listActivities,
} from '@/lib/crew/manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveBusiness(userId: string) {
  const admin = getSupabaseAdmin();
  const { data: own } = await admin.from('businesses').select('id, name').eq('id', userId).maybeSingle();
  if (own?.id) return { id: String(own.id), name: String((own as any).name || 'Your business') };

  const { data: profile } = await admin.from('users').select('business_id, name').eq('id', userId).maybeSingle();
  const fromProfile = (profile as any)?.business_id ? String((profile as any).business_id) : '';
  if (fromProfile) {
    const { data: biz } = await admin.from('businesses').select('id, name').eq('id', fromProfile).maybeSingle();
    return { id: fromProfile, name: String((biz as any)?.name || 'Your business') };
  }

  const { data: owned } = await admin
    .from('businesses')
    .select('id, name')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();
  if (owned?.id) return { id: String(owned.id), name: String((owned as any).name || 'Your business') };
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const business = await resolveBusiness(user.id);
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 });

  const view = req.nextUrl.searchParams.get('view') || 'home';
  if (view === 'tasks') {
    const tasks = await listTasks(business.id);
    return NextResponse.json({ ok: true, businessId: business.id, tasks });
  }
  if (view === 'activity') {
    const activities = await listActivities(business.id);
    return NextResponse.json({ ok: true, businessId: business.id, activities });
  }

  const payload = await getHomePayload(business.id, business.name);
  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const business = await resolveBusiness(user.id);
  if (!business) return NextResponse.json({ error: 'No business found for this account' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'chat');

  if (action === 'chat') {
    const message = String(body.message || '').trim();
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });
    const result = await handleChat({
      businessId: business.id,
      businessName: business.name,
      userId: user.id,
      room: String(body.room || 'mo'),
      message,
    });
    return NextResponse.json({ ok: true, ...result });
  }

  if (action === 'create_task') {
    const task = await createTask({
      businessId: business.id,
      agentId: String(body.agentId || 'bin'),
      title: String(body.title || 'Task'),
      payload: body.payload || {},
      createdBy: user.id,
      status: String(body.status || 'awaiting'),
    });
    return NextResponse.json({ ok: true, task });
  }

  if (action === 'update_task') {
    const taskId = String(body.taskId || '');
    const status = String(body.status || '');
    if (!taskId || !status) return NextResponse.json({ error: 'taskId and status required' }, { status: 400 });
    const task = await updateTaskStatus(
      business.id,
      taskId,
      status,
      status === 'approved' || status === 'done' ? user.id : undefined
    );
    return NextResponse.json({ ok: true, task });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

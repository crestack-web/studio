/**
 * Crew Manager — central orchestration.
 * Routes messages, runs tools, drafts tasks, writes activity/memory.
 */
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAgent, type CrewAgentId } from './agents';
import {
  loadCrewBrief,
  type CrewBrief,
  listLowStock,
  listCreditBalances,
} from './tools';
import { detectTaskFromMessage, runCrewTask } from './tasks';

export type CrewReply = { agent: string; text: string };

export type ManagerChatInput = {
  businessId: string;
  businessName: string;
  userId: string;
  room: string;
  message: string;
};

function textFromTool(brief: CrewBrief, agent: string): string {
  if (agent === 'tally') {
    const s = brief.sales;
    const e = brief.expenses;
    if (!s.ok) return s.error || 'Tally could not read sales.';
    const st = (s.data as any)?.text;
    const et = e.ok ? (e.data as any)?.text : '';
    return [st?.today, st?.yesterday, et].filter(Boolean).join('\n');
  }
  if (agent === 'bin') {
    const b = brief.lowStock;
    if (!b.ok) return b.error || 'Bin could not read stock.';
    return String((b.data as any)?.text || '');
  }
  if (agent === 'ledger') {
    const c = brief.credit;
    if (!c.ok) return c.error || 'Ledger could not read credit.';
    return String((c.data as any)?.text || '');
  }
  return 'That agent is not on duty yet.';
}

export async function logActivity(
  businessId: string,
  agentId: string | null,
  type: string,
  summary: string,
  payload: Record<string, unknown> = {}
) {
  try {
    const admin = getSupabaseAdmin();
    await admin.from('crew_activities').insert({
      business_id: businessId,
      agent_id: agentId,
      type,
      summary,
      payload,
    });
  } catch (e) {
    console.warn('[crew] activity log failed', e);
  }
}

export async function listTasks(businessId: string, limit = 30) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('crew_tasks')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[crew] listTasks', error.message);
    return [];
  }
  return data || [];
}

export async function createTask(params: {
  businessId: string;
  agentId: string;
  title: string;
  payload?: Record<string, unknown>;
  createdBy?: string;
  status?: string;
}) {
  const admin = getSupabaseAdmin();
  const row = {
    business_id: params.businessId,
    agent_id: params.agentId,
    title: params.title,
    status: params.status || 'awaiting',
    payload: params.payload || {},
    created_by: params.createdBy || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await admin.from('crew_tasks').insert(row).select('*').maybeSingle();
  if (error) throw new Error(error.message);
  await logActivity(params.businessId, params.agentId, 'task_created', params.title, {
    taskId: data?.id,
  });
  return data;
}

export async function updateTaskStatus(
  businessId: string,
  taskId: string,
  status: string,
  approvedBy?: string
) {
  const admin = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (approvedBy) patch.approved_by = approvedBy;
  const { data, error } = await admin
    .from('crew_tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('business_id', businessId)
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  await logActivity(businessId, data?.agent_id || null, 'task_' + status, data?.title || taskId, {
    taskId,
  });
  return data;
}

export async function listActivities(businessId: string, limit = 40) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('crew_activities')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('[crew] listActivities', error.message);
    return [];
  }
  return data || [];
}

export async function remember(
  businessId: string,
  agentId: string,
  content: string,
  kind = 'note'
) {
  try {
    const admin = getSupabaseAdmin();
    await admin.from('crew_memories').insert({
      business_id: businessId,
      agent_id: agentId,
      kind,
      content: content.slice(0, 2000),
    });
  } catch (e) {
    console.warn('[crew] remember failed', e);
  }
}

export async function handleChat(input: ManagerChatInput): Promise<{ replies: CrewReply[]; task?: any }> {
  const { businessId, businessName, room, message, userId } = input;
  const q = message.trim().toLowerCase();
  const brief = await loadCrewBrief(businessId, businessName);
  const replies: CrewReply[] = [];

  // Task intents: research with real tools, then Tasks tab for approval when needed
  const detected = detectTaskFromMessage(room, message);
  if (detected) {
    try {
      const { task, summary } = await runCrewTask({
        businessId,
        userId,
        agentId: detected.agentId,
        kind: detected.kind,
      });
      const findings = (task?.payload as any)?.findings;
      const detail = findings?.detail ? `\n\n${findings.detail}` : '';
      replies.push({
        agent: detected.agentId,
        text:
          summary +
          detail +
          (task?.status === 'awaiting'
            ? '\n\nOpen the Tasks tab to approve or reject before anything is sent or ordered.'
            : ''),
      });
      await logActivity(businessId, detected.agentId, 'chat_task', message.slice(0, 120), {
        taskId: task?.id,
        kind: detected.kind,
      });
      return { replies, task };
    } catch (e: any) {
      replies.push({
        agent: detected.agentId,
        text: `I could not finish that task: ${e?.message || 'error'}.`,
      });
      return { replies };
    }
  }

  const wantsAll =
    room === 'crew' ||
    room === 'mo' ||
    /why|profit|what.?s wrong|health|overview|how is the business/.test(q);

  if (wantsAll) {
    replies.push({ agent: 'tally', text: textFromTool(brief, 'tally') });
    replies.push({ agent: 'bin', text: textFromTool(brief, 'bin') });
    replies.push({ agent: 'ledger', text: textFromTool(brief, 'ledger') });
  } else if (room === 'bin' || /stock|restock|inventory|product/.test(q)) {
    replies.push({ agent: 'bin', text: textFromTool(brief, 'bin') });
  } else if (room === 'ledger' || /owe|debt|credit|customer/.test(q)) {
    replies.push({ agent: 'ledger', text: textFromTool(brief, 'ledger') });
  } else if (room === 'tally' || /sale|money|revenue|expense|profit|cash/.test(q)) {
    replies.push({ agent: 'tally', text: textFromTool(brief, 'tally') });
  } else if (/staff|shift|attendance/.test(q) || room === 'shift') {
    replies.push({
      agent: 'mo',
      text: 'Shift is still warming up. Staff attendance stays on the Staff page for now.',
    });
  } else {
    const id = (['tally', 'bin', 'ledger'].includes(room) ? room : 'tally') as string;
    replies.push({ agent: id, text: textFromTool(brief, id) });
  }

  await logActivity(businessId, room || 'mo', 'chat', message.slice(0, 120), {
    room,
    replyAgents: replies.map((r) => r.agent),
  });
  await remember(
    businessId,
    room === 'mo' || room === 'crew' ? 'mo' : room,
    `User: ${message.slice(0, 200)}`,
    'chat'
  );

  return { replies };
}

export async function getHomePayload(businessId: string, businessName: string) {
  const brief = await loadCrewBrief(businessId, businessName);
  const [tasks, activities] = await Promise.all([
    listTasks(businessId, 20),
    listActivities(businessId, 20),
  ]);
  return {
    ok: true,
    businessId,
    businessName,
    signals: brief.signals,
    tasks,
    activities,
  };
}

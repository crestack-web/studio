/**
 * Crew task runners — research with real tools, attach findings, await approval.
 */
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  listLowStock,
  listCreditBalances,
  getSalesSummary,
  getExpenseSummary,
} from './tools';

export type TaskKind =
  | 'restock_research'
  | 'debt_followups'
  | 'sales_review'
  | 'expense_review'
  | 'stock_check'
  | 'credit_check';

function naira(n: number) {
  return `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
}

async function logActivity(
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

export async function runCrewTask(params: {
  businessId: string;
  userId: string;
  agentId: string;
  kind: TaskKind;
  title?: string;
}): Promise<{ task: any; summary: string }> {
  const { businessId, userId, agentId, kind } = params;
  const admin = getSupabaseAdmin();

  const title =
    params.title ||
    ({
      restock_research: 'Restock research',
      debt_followups: 'Debt follow-up draft',
      sales_review: 'Sales review',
      expense_review: 'Expense review',
      stock_check: 'Stock check',
      credit_check: 'Credit check',
    }[kind] || 'Crew task');

  const { data: task, error: createErr } = await admin
    .from('crew_tasks')
    .insert({
      business_id: businessId,
      agent_id: agentId,
      title,
      status: 'researching',
      payload: { kind, stage: 'researching' },
      created_by: userId,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (createErr || !task) throw new Error(createErr?.message || 'Could not create task');

  let findings: Record<string, unknown> = {};
  let summary = '';
  let needsApproval = true;

  if (kind === 'restock_research' || kind === 'stock_check') {
    const low = await listLowStock(businessId);
    const items = low.ok ? ((low.data as any)?.items as any[]) || [] : [];
    findings = {
      kind,
      items,
      count: items.length,
      detail:
        items.length === 0
          ? 'No products are at or below reorder level.'
          : items
              .slice(0, 12)
              .map((i: any) => `${i.name}: ${i.stock} left (reorder ${i.reorder})`)
              .join('\n'),
    };
    summary =
      items.length === 0
        ? 'Stock check complete — nothing below reorder level.'
        : `Found ${items.length} low-stock product${items.length === 1 ? '' : 's'}. Open Tasks to review before restocking.`;
    needsApproval = items.length > 0 && kind === 'restock_research';
  } else if (kind === 'debt_followups' || kind === 'credit_check') {
    const credit = await listCreditBalances(businessId);
    const debtors = credit.ok ? ((credit.data as any)?.debtors as any[]) || [] : [];
    const total = credit.ok ? Number((credit.data as any)?.total) || 0 : 0;
    findings = {
      kind,
      debtors: debtors.slice(0, 20),
      count: debtors.length,
      total,
      detail:
        debtors.length === 0
          ? 'No outstanding customer balances.'
          : debtors
              .slice(0, 12)
              .map((d: any) => `${d.name}: ${naira(d.balance)}`)
              .join('\n'),
      draft_messages: debtors.slice(0, 5).map((d: any) => ({
        to: d.name,
        phone: d.phone,
        body: `Hi ${d.name}, friendly reminder that ${naira(d.balance)} is still open on your account. Please settle when you can. Thank you.`,
      })),
    };
    summary =
      debtors.length === 0
        ? 'Credit check complete — no open balances.'
        : `${debtors.length} customer${debtors.length === 1 ? '' : 's'} owe ${naira(total)}. Drafts are in Tasks for approval.`;
    needsApproval = debtors.length > 0 && kind === 'debt_followups';
  } else if (kind === 'sales_review') {
    const sales = await getSalesSummary(businessId);
    const data = sales.ok ? (sales.data as any) : null;
    findings = {
      kind,
      today: data?.today,
      yesterday: data?.yesterday,
      detail: data
        ? `${data.text?.today || ''}\n${data.text?.yesterday || ''}`
        : sales.error || 'Could not read sales',
    };
    summary = data?.text?.today || 'Sales review complete.';
    needsApproval = false;
  } else if (kind === 'expense_review') {
    const exp = await getExpenseSummary(businessId);
    const data = exp.ok ? (exp.data as any) : null;
    findings = {
      kind,
      today: data?.today,
      yesterday: data?.yesterday,
      detail: data?.text || exp.error || 'Could not read expenses',
    };
    summary = data?.text || 'Expense review complete.';
    needsApproval = false;
  }

  const nextStatus = needsApproval ? 'awaiting' : 'done';
  const { data: updated, error } = await admin
    .from('crew_tasks')
    .update({
      status: nextStatus,
      payload: {
        kind,
        stage: needsApproval ? 'awaiting_approval' : 'done',
        findings,
        summary,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', task.id)
    .eq('business_id', businessId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);

  await logActivity(businessId, agentId, 'task_research_done', summary, {
    taskId: (updated || task).id,
    kind,
  });

  return { task: updated || task, summary };
}

export function detectTaskFromMessage(
  room: string,
  message: string
): { agentId: string; kind: TaskKind } | null {
  const q = message.trim().toLowerCase();
  if (/restock|reorder/.test(q)) return { agentId: 'bin', kind: 'restock_research' };
  if ((room === 'bin' || /stock|inventory/.test(q)) && /check|list|research|prepare|find|run/.test(q)) {
    return { agentId: 'bin', kind: 'stock_check' };
  }
  if (/follow.?up|remind.*pay|send.*remind/.test(q)) return { agentId: 'ledger', kind: 'debt_followups' };
  if (/who owes|outstanding|credit check|debts?/.test(q)) return { agentId: 'ledger', kind: 'credit_check' };
  if ((room === 'tally' || /sale|revenue|profit/.test(q)) && /review|report|summary|today|check/.test(q)) {
    return { agentId: 'tally', kind: 'sales_review' };
  }
  if (/expense/.test(q) && /review|report|summary|check/.test(q)) {
    return { agentId: 'tally', kind: 'expense_review' };
  }
  return null;
}

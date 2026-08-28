import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type SupportSenderRole = 'user' | 'admin' | 'agent' | 'bot' | 'system';

export const DEFAULT_AGENT_NAME = 'Busmo Support';

export function newId() {
  return randomUUID();
}

/**
 * Create or resume a ticket for a widget session.
 * Tolerant of missing migration columns (session_id / guest_email / needs_human).
 */
export async function getOrCreateTicket(params: {
  sessionId: string;
  guestEmail?: string | null;
  userId?: string | null;
  businessId?: string | null;
  category?: string;
  source?: string;
}) {
  const sb = getSupabaseAdmin();

  // Prefer session_id lookup when column exists
  try {
    const { data: existing, error } = await sb
      .from('support_tickets')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && existing) return existing;
  } catch {
    /* column may not exist */
  }

  // Fallback: look up by subject encoding session
  const subjectKey = `Chat · ${params.sessionId.slice(0, 36)}`;
  const { data: bySubject } = await sb
    .from('support_tickets')
    .select('*')
    .eq('subject', subjectKey)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (bySubject) return bySubject;

  const id = newId();
  const base: Record<string, unknown> = {
    id,
    user_id: params.userId || null,
    business_id: params.businessId || null,
    subject: subjectKey,
    message: '',
    category: params.category || 'general',
    status: 'open',
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Try full row with e2e columns first
  const full = {
    ...base,
    session_id: params.sessionId,
    guest_email: params.guestEmail || null,
    needs_human: false,
    source: params.source || 'widget',
  };

  let { data, error } = await sb.from('support_tickets').insert(full).select('*').single();
  if (error) {
    console.warn('[support] full ticket insert failed, retrying base:', error.message);
    const retry = await sb.from('support_tickets').insert(base).select('*').single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(error.message);
  return data;
}

export async function appendMessage(params: {
  ticketId: string;
  content: string;
  senderRole: SupportSenderRole;
  userId?: string | null;
  agentName?: string | null;
}) {
  const sb = getSupabaseAdmin();
  const id = newId();

  const row: Record<string, unknown> = {
    id,
    ticket_id: params.ticketId,
    user_id: params.userId || null,
    sender_role: params.senderRole,
    content: params.content,
    attachments: [],
    read: false,
    created_at: new Date().toISOString(),
  };

  let { data, error } = await sb.from('support_messages').insert(row).select('*').single();
  if (error) {
    // Some schemas may not have attachments array default
    console.warn('[support] message insert retry without attachments:', error.message);
    delete row.attachments;
    const retry = await sb.from('support_messages').insert(row).select('*').single();
    data = retry.data;
    error = retry.error;
  }
  if (error) throw new Error(error.message);

  await sb
    .from('support_tickets')
    .update({
      updated_at: new Date().toISOString(),
      message: params.content.slice(0, 500),
    })
    .eq('id', params.ticketId);

  return data;
}

export async function setNeedsHuman(ticketId: string, needs: boolean) {
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = {
    status: needs ? 'needs_human' : 'open',
    updated_at: new Date().toISOString(),
  };
  // needs_human column optional
  const withFlag = { ...patch, needs_human: needs };
  const { error } = await sb.from('support_tickets').update(withFlag).eq('id', ticketId);
  if (error) {
    await sb.from('support_tickets').update(patch).eq('id', ticketId);
  }
}

export async function listMessages(ticketId: string) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('support_messages')
    .select('id, ticket_id, sender_role, content, created_at, read')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTicketBySession(sessionId: string) {
  const sb = getSupabaseAdmin();
  try {
    const { data, error } = await sb
      .from('support_tickets')
      .select('*')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) return data;
  } catch {
    /* ignore */
  }
  const subjectKey = `Chat · ${sessionId.slice(0, 36)}`;
  const { data } = await sb
    .from('support_tickets')
    .select('*')
    .eq('subject', subjectKey)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function listOpenTickets(limit = 80) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data || [];
}

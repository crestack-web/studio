import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type SupportSenderRole = 'user' | 'admin' | 'agent' | 'bot' | 'system';

export function newId() {
  return randomUUID();
}

export async function getOrCreateTicket(params: {
  sessionId: string;
  guestEmail?: string | null;
  userId?: string | null;
  businessId?: string | null;
  category?: string;
  source?: string;
}) {
  const sb = getSupabaseAdmin();
  const { data: existing } = await sb
    .from('support_tickets')
    .select('*')
    .eq('session_id', params.sessionId)
    .in('status', ['open', 'waiting', 'assigned', 'needs_human'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const id = newId();
  const row = {
    id,
    session_id: params.sessionId,
    guest_email: params.guestEmail || null,
    user_id: params.userId || null,
    business_id: params.businessId || null,
    subject: 'Chat with Busmo',
    message: '',
    category: params.category || 'general',
    status: 'open',
    priority: 'normal',
    needs_human: false,
    source: params.source || 'widget',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb.from('support_tickets').insert(row).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function appendMessage(params: {
  ticketId: string;
  content: string;
  senderRole: SupportSenderRole;
  userId?: string | null;
}) {
  const sb = getSupabaseAdmin();
  const id = newId();
  const { data, error } = await sb
    .from('support_messages')
    .insert({
      id,
      ticket_id: params.ticketId,
      user_id: params.userId || null,
      sender_role: params.senderRole,
      content: params.content,
      attachments: [],
      read: false,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();
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
  await sb
    .from('support_tickets')
    .update({
      needs_human: needs,
      status: needs ? 'needs_human' : 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId);
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
  const { data } = await sb
    .from('support_tickets')
    .select('*')
    .eq('session_id', sessionId)
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

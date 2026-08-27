/**
 * WhatsApp conversation + message persistence + idempotency (server-only).
 * Business resolution is always from whatsapp_connections (sender mapping).
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizePhone } from '@/lib/infobip/client';

export type AgentStatus = 'ai_active' | 'human_active';

export type WhatsappConnection = {
  id: string;
  business_id: string;
  provider: string;
  whatsapp_sender: string;
  status: string;
  metadata?: Record<string, unknown> | null;
};

export async function resolveBusinessBySender(
  sender: string,
  provider = 'infobip'
): Promise<WhatsappConnection | null> {
  const phone = normalizePhone(sender);
  if (!phone) return null;
  const sb = getSupabaseAdmin();

  const { data: exact } = await sb
    .from('whatsapp_connections')
    .select('id, business_id, provider, whatsapp_sender, status, metadata')
    .eq('provider', provider)
    .eq('status', 'active')
    .eq('whatsapp_sender', phone)
    .maybeSingle();

  if (exact) return exact as WhatsappConnection;

  const { data: rows } = await sb
    .from('whatsapp_connections')
    .select('id, business_id, provider, whatsapp_sender, status, metadata')
    .eq('provider', provider)
    .eq('status', 'active');

  const match =
    (rows || []).find((r: any) => normalizePhone(r.whatsapp_sender) === phone) || null;
  return match as WhatsappConnection | null;
}


/** Global pause: metadata.mo_enabled === false means merchant paused MO. Default true. */
export function isMoGloballyEnabled(connection: WhatsappConnection): boolean {
  const meta = (connection.metadata || {}) as Record<string, unknown>;
  return meta.mo_enabled !== false;
}

export async function getOrCreateConversation(params: {
  businessId: string;
  customerPhone: string;
  provider?: string;
}): Promise<{ id: string; agent_status: AgentStatus }> {
  const sb = getSupabaseAdmin();
  const provider = params.provider || 'infobip';
  const customerPhone = normalizePhone(params.customerPhone);

  const { data: existing } = await sb
    .from('whatsapp_conversations')
    .select('id, agent_status')
    .eq('business_id', params.businessId)
    .eq('customer_phone', customerPhone)
    .eq('provider', provider)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      agent_status: (existing.agent_status as AgentStatus) || 'ai_active',
    };
  }

  const id = crypto.randomUUID();
  const { data, error } = await sb
    .from('whatsapp_conversations')
    .insert({
      id,
      business_id: params.businessId,
      customer_phone: customerPhone,
      provider,
      agent_status: 'ai_active',
      last_message_at: new Date().toISOString(),
    })
    .select('id, agent_status')
    .single();

  if (error) {
    const { data: again } = await sb
      .from('whatsapp_conversations')
      .select('id, agent_status')
      .eq('business_id', params.businessId)
      .eq('customer_phone', customerPhone)
      .eq('provider', provider)
      .maybeSingle();
    if (again) {
      return {
        id: again.id,
        agent_status: (again.agent_status as AgentStatus) || 'ai_active',
      };
    }
    throw error;
  }

  return {
    id: data.id,
    agent_status: (data.agent_status as AgentStatus) || 'ai_active',
  };
}

export async function getConversationAgentStatus(
  conversationId: string
): Promise<AgentStatus> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('whatsapp_conversations')
    .select('agent_status')
    .eq('id', conversationId)
    .maybeSingle();
  return ((data?.agent_status as AgentStatus) || 'ai_active');
}

/**
 * Claim inbound via unique (provider, provider_message_id).
 * duplicate:true → caller MUST NOT run MO.
 */
export async function claimInboundMessage(params: {
  conversationId: string;
  businessId: string;
  providerMessageId: string;
  provider?: string;
  messageType?: string;
  messageText?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; duplicate: boolean }> {
  const sb = getSupabaseAdmin();
  const id = crypto.randomUUID();
  const provider = params.provider || 'infobip';

  if (!params.providerMessageId) {
    throw new Error('providerMessageId required for idempotent claim');
  }

  const { error } = await sb.from('whatsapp_messages').insert({
    id,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    provider,
    provider_message_id: params.providerMessageId,
    direction: 'inbound',
    message_type: params.messageType || 'text',
    message_text: params.messageText ?? null,
    processing_status: 'processing',
    metadata: params.metadata || {},
    sent_at: null,
  });

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message || '')) {
      return { id, duplicate: true };
    }
    throw error;
  }

  await sb
    .from('whatsapp_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.conversationId);

  return { id, duplicate: false };
}

export async function insertOutboundMessage(params: {
  conversationId: string;
  businessId: string;
  provider?: string;
  clientMessageId?: string;
  messageText: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const sb = getSupabaseAdmin();
  const id = crypto.randomUUID();
  const provider = params.provider || 'infobip';

  const { error } = await sb.from('whatsapp_messages').insert({
    id,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    provider,
    provider_message_id: null,
    direction: 'outbound',
    message_type: 'text',
    message_text: params.messageText,
    processing_status: 'processing',
    metadata: {
      ...(params.metadata || {}),
      clientMessageId: params.clientMessageId || null,
    },
    sent_at: null,
  });

  if (error) throw error;

  await sb
    .from('whatsapp_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.conversationId);

  return { id };
}

export async function updateMessageStatus(
  messageId: string,
  status: string,
  metadataPatch?: Record<string, unknown>,
  opts?: { setSentAt?: boolean; providerMessageId?: string }
) {
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = { processing_status: status };

  if (opts?.setSentAt) {
    patch.sent_at = new Date().toISOString();
  }
  if (opts?.providerMessageId) {
    patch.provider_message_id = opts.providerMessageId;
  }

  if (metadataPatch) {
    const { data } = await sb
      .from('whatsapp_messages')
      .select('metadata')
      .eq('id', messageId)
      .maybeSingle();
    patch.metadata = { ...((data?.metadata as object) || {}), ...metadataPatch };
  }

  await sb.from('whatsapp_messages').update(patch).eq('id', messageId);
}

export async function getRecentMessages(
  conversationId: string,
  businessId: string,
  limit = 12
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('whatsapp_messages')
    .select('direction, message_text, created_at')
    .eq('conversation_id', conversationId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = (data || []).reverse();
  return rows
    .filter((r: any) => r.message_text)
    .map((r: any) => ({
      role: r.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
      content: String(r.message_text),
    }));
}

export async function getBusinessProfile(businessId: string): Promise<{
  name: string;
  description: string | null;
  location: string | null;
  category: string | null;
  currency: string;
}> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('businesses')
    .select('name, description, location, category, currency')
    .eq('id', businessId)
    .maybeSingle();

  return {
    name: data?.name || 'Business',
    description: data?.description || null,
    location: data?.location || null,
    category: data?.category || null,
    currency: data?.currency || 'NGN',
  };
}

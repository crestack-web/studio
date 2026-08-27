/**
 * WhatsApp conversation + message persistence + idempotency (server-only).
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
};

export async function resolveBusinessBySender(
  sender: string,
  provider = 'infobip'
): Promise<WhatsappConnection | null> {
  const phone = normalizePhone(sender);
  if (!phone) return null;
  const sb = getSupabaseAdmin();

  let { data } = await sb
    .from('whatsapp_connections')
    .select('id, business_id, provider, whatsapp_sender, status')
    .eq('provider', provider)
    .eq('status', 'active')
    .eq('whatsapp_sender', phone)
    .maybeSingle();

  if (!data) {
    const { data: rows } = await sb
      .from('whatsapp_connections')
      .select('id, business_id, provider, whatsapp_sender, status')
      .eq('provider', provider)
      .eq('status', 'active');
    data =
      (rows || []).find((r: any) => normalizePhone(r.whatsapp_sender) === phone) || null;
  }

  return data as WhatsappConnection | null;
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

export async function isProviderMessageProcessed(
  providerMessageId: string,
  provider = 'infobip'
): Promise<boolean> {
  if (!providerMessageId) return false;
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('whatsapp_messages')
    .select('id')
    .eq('provider', provider)
    .eq('provider_message_id', providerMessageId)
    .maybeSingle();
  return Boolean(data);
}

export async function insertMessage(params: {
  conversationId: string;
  businessId: string;
  provider?: string;
  providerMessageId?: string | null;
  direction: 'inbound' | 'outbound';
  messageType?: string;
  messageText?: string | null;
  processingStatus?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string; duplicate?: boolean }> {
  const sb = getSupabaseAdmin();
  const id = crypto.randomUUID();
  const provider = params.provider || 'infobip';

  const { error } = await sb.from('whatsapp_messages').insert({
    id,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    provider,
    provider_message_id: params.providerMessageId || null,
    direction: params.direction,
    message_type: params.messageType || 'text',
    message_text: params.messageText ?? null,
    processing_status: params.processingStatus || 'received',
    metadata: params.metadata || {},
    sent_at: params.direction === 'outbound' ? new Date().toISOString() : null,
  });

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
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

  return { id };
}

export async function updateMessageStatus(
  messageId: string,
  status: string,
  metadataPatch?: Record<string, unknown>
) {
  const sb = getSupabaseAdmin();
  const patch: Record<string, unknown> = { processing_status: status };
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
  limit = 12
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('whatsapp_messages')
    .select('direction, message_text, created_at')
    .eq('conversation_id', conversationId)
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
    .select('name, description, location, category, currency, metadata')
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

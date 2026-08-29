/**
 * WhatsApp conversation + message persistence + idempotency (server-only).
 *
 * Connection resolution is always from whatsapp_connections (provider + sender).
 * connection_type, agent_profile, and business_id come ONLY from the DB row —
 * never from Infobip payload, client request, or message text.
 *
 * Phase 5A: platform conversations/messages may have business_id NULL and are
 * scoped by connection_id → conversation_id (never by phone alone).
 * Phase 5B: setConversationAgentStatus for acquisition (and merchant) handoff.
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizePhone } from '@/lib/infobip/client';

export type AgentStatus = 'ai_active' | 'human_active';

export type ConnectionType = 'merchant' | 'platform';
export type AgentProfile = 'merchant_sales' | 'busmo_acquisition';

/**
 * Merchant-facing connection shape used by existing webhook / credits paths.
 * business_id is always a non-null string when returned from resolveBusinessBySender.
 */
export type WhatsappConnection = {
  id: string;
  business_id: string;
  provider: string;
  whatsapp_sender: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  connection_type?: ConnectionType;
  agent_profile?: AgentProfile;
};

/** Trusted resolution result for multi-profile routing. */
export type ResolvedWhatsappConnection = {
  connection: {
    id: string;
    provider: string;
    whatsapp_sender: string;
    status: string;
    metadata: Record<string, unknown> | null;
    connection_type: ConnectionType;
    agent_profile: AgentProfile;
    /** Raw DB value; may be null for platform connections. */
    business_id: string | null;
  };
  connectionType: ConnectionType;
  agentProfile: AgentProfile;
  /** Null for platform connections; never invented. */
  businessId: string | null;
};

export type GetOrCreateConversationParams = {
  /** Required. Platform and merchant conversations attach to a connection. */
  connectionId: string;
  /**
   * Merchant: non-null business id matching the connection.
   * Platform: must be null.
   */
  businessId: string | null;
  customerPhone: string;
  provider?: string;
  /** From resolveConnectionBySender — never from client payload. */
  connectionType: ConnectionType;
};

const CONNECTION_SELECT =
  'id, business_id, provider, whatsapp_sender, status, metadata, connection_type, agent_profile';

function normalizeConnectionType(raw: unknown): ConnectionType {
  return String(raw || '').toLowerCase() === 'platform' ? 'platform' : 'merchant';
}

function normalizeAgentProfile(raw: unknown, connectionType: ConnectionType): AgentProfile {
  const v = String(raw || '').toLowerCase();
  if (v === 'busmo_acquisition') return 'busmo_acquisition';
  if (v === 'merchant_sales') return 'merchant_sales';
  return connectionType === 'platform' ? 'busmo_acquisition' : 'merchant_sales';
}

/**
 * Validate conversation ownership invariants.
 * Platform must never receive a merchant business_id; merchant must never be null.
 */
export function assertConversationOwnership(params: {
  connectionType: ConnectionType;
  connectionBusinessId: string | null;
  businessId: string | null;
}): void {
  if (params.connectionType === 'platform') {
    if (params.businessId != null) {
      throw new Error('platform_conversation_must_have_null_business_id');
    }
    return;
  }
  if (!params.businessId) {
    throw new Error('merchant_conversation_requires_business_id');
  }
  if (
    params.connectionBusinessId &&
    params.businessId !== params.connectionBusinessId
  ) {
    throw new Error('merchant_business_id_mismatch');
  }
}

/**
 * Map a DB row into a trusted ResolvedWhatsappConnection.
 * Exported for unit tests — does not accept caller-supplied profile/type overrides.
 */
export function mapConnectionRow(row: Record<string, unknown> | null | undefined): ResolvedWhatsappConnection | null {
  if (!row || !row.id) return null;

  const connectionType = normalizeConnectionType(row.connection_type);
  const agentProfile = normalizeAgentProfile(row.agent_profile, connectionType);

  let businessId: string | null =
    row.business_id != null && String(row.business_id).trim() !== ''
      ? String(row.business_id)
      : null;

  if (connectionType === 'platform') {
    businessId = null;
  } else if (connectionType === 'merchant' && !businessId) {
    return null;
  }

  return {
    connection: {
      id: String(row.id),
      provider: String(row.provider || 'infobip'),
      whatsapp_sender: String(row.whatsapp_sender || ''),
      status: String(row.status || ''),
      metadata: (row.metadata as Record<string, unknown>) || null,
      connection_type: connectionType,
      agent_profile: agentProfile,
      business_id: businessId,
    },
    connectionType,
    agentProfile,
    businessId,
  };
}

async function fetchActiveConnectionRow(
  phone: string,
  provider: string
): Promise<Record<string, unknown> | null> {
  const sb = getSupabaseAdmin();

  const { data: exact } = await sb
    .from('whatsapp_connections')
    .select(CONNECTION_SELECT)
    .eq('provider', provider)
    .eq('status', 'active')
    .eq('whatsapp_sender', phone)
    .maybeSingle();

  if (exact) return exact as Record<string, unknown>;

  const { data: rows } = await sb
    .from('whatsapp_connections')
    .select(CONNECTION_SELECT)
    .eq('provider', provider)
    .eq('status', 'active');

  const match =
    (rows || []).find(
      (r: any) => normalizePhone(r.whatsapp_sender) === phone
    ) || null;

  return match as Record<string, unknown> | null;
}

/**
 * Trusted sender → connection → profile resolution.
 * Unknown senders return null (never auto-classified as platform).
 */
export async function resolveConnectionBySender(
  sender: string,
  provider = 'infobip'
): Promise<ResolvedWhatsappConnection | null> {
  const phone = normalizePhone(sender);
  if (!phone) return null;

  const row = await fetchActiveConnectionRow(phone, provider);
  return mapConnectionRow(row);
}

/**
 * Merchant-compatible resolver. Platform connections resolve to null here.
 */
export async function resolveBusinessBySender(
  sender: string,
  provider = 'infobip'
): Promise<WhatsappConnection | null> {
  const resolved = await resolveConnectionBySender(sender, provider);
  if (!resolved) return null;

  if (resolved.connectionType !== 'merchant' || !resolved.businessId) {
    return null;
  }

  return {
    id: resolved.connection.id,
    business_id: resolved.businessId,
    provider: resolved.connection.provider,
    whatsapp_sender: resolved.connection.whatsapp_sender,
    status: resolved.connection.status,
    metadata: resolved.connection.metadata,
    connection_type: resolved.connectionType,
    agent_profile: resolved.agentProfile,
  };
}

/** Global pause: metadata.mo_enabled === false means MO paused. Default true. */
export function isMoGloballyEnabled(
  connection: WhatsappConnection | { metadata?: Record<string, unknown> | null }
): boolean {
  const meta = (connection.metadata || {}) as Record<string, unknown>;
  return meta.mo_enabled !== false;
}

/**
 * Get or create a conversation for merchant or platform.
 *
 * Merchant: uniqueness (business_id, customer_phone, provider); connection_id set.
 * Platform: uniqueness (connection_id, customer_phone, provider); business_id NULL.
 */
export async function getOrCreateConversation(
  params: GetOrCreateConversationParams
): Promise<{ id: string; agent_status: AgentStatus }> {
  const sb = getSupabaseAdmin();
  const provider = params.provider || 'infobip';
  const customerPhone = normalizePhone(params.customerPhone);
  const connectionId = String(params.connectionId || '').trim();
  if (!connectionId) {
    throw new Error('connection_id_required');
  }

  assertConversationOwnership({
    connectionType: params.connectionType,
    connectionBusinessId:
      params.connectionType === 'merchant' ? params.businessId : null,
    businessId: params.businessId,
  });

  // ── Platform path ──────────────────────────────────────────────────────────
  if (params.connectionType === 'platform') {
    const { data: existing } = await sb
      .from('whatsapp_conversations')
      .select('id, agent_status')
      .eq('connection_id', connectionId)
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
        business_id: null,
        connection_id: connectionId,
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
        .eq('connection_id', connectionId)
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

  // ── Merchant path ──────────────────────────────────────────────────────────
  const businessId = params.businessId as string;

  const { data: existing } = await sb
    .from('whatsapp_conversations')
    .select('id, agent_status')
    .eq('business_id', businessId)
    .eq('customer_phone', customerPhone)
    .eq('provider', provider)
    .maybeSingle();

  if (existing) {
    await sb
      .from('whatsapp_conversations')
      .update({ connection_id: connectionId })
      .eq('id', existing.id)
      .is('connection_id', null);

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
      business_id: businessId,
      connection_id: connectionId,
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
      .eq('business_id', businessId)
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
  return (data?.agent_status as AgentStatus) || 'ai_active';
}

/**
 * Set conversation agent status (AI vs human handoff).
 * Used by merchant handoff and Phase 5B acquisition handoff_to_human.
 * Reuses agent_status — does not create a second handoff mechanism.
 */
export async function setConversationAgentStatus(
  conversationId: string,
  status: AgentStatus
): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('whatsapp_conversations')
    .update({
      agent_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw error;
}

/**
 * Claim inbound via unique (provider, provider_message_id).
 * duplicate:true → caller MUST NOT run MO / stub twice.
 * businessId may be null for platform messages (migration 0011).
 */
export async function claimInboundMessage(params: {
  conversationId: string;
  businessId: string | null;
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
  businessId: string | null;
  provider?: string;
  clientMessageId?: string;
  messageText: string;
  metadata?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const sb = getSupabaseAdmin();
  const id = crypto.randomUUID();
  const provider = params.provider || 'infobip';
  const text = String(params.messageText ?? '');

  const row: Record<string, unknown> = {
    id,
    conversation_id: params.conversationId,
    business_id: params.businessId,
    provider,
    direction: 'outbound',
    message_type: 'text',
    message_text: text,
    processing_status: 'processing',
    metadata: {
      ...(params.metadata || {}),
      clientMessageId: params.clientMessageId || null,
    },
  };

  const { error } = await sb.from('whatsapp_messages').insert(row);

  if (error) {
    console.error(
      JSON.stringify({
        event: 'outbound_persist_failed',
        businessId: params.businessId,
        conversationId: params.conversationId,
        error: error.message,
        code: error.code,
      })
    );
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

/**
 * History for a single conversation.
 * Always filtered by conversation_id.
 * When businessId is provided (merchant), also filters business_id for isolation.
 * Never queries by customer_phone alone — prevents cross-connection leakage.
 */
export async function getRecentMessages(
  conversationId: string,
  businessId: string | null,
  limit = 12
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('whatsapp_messages')
    .select('direction, message_text, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (businessId) {
    q = q.eq('business_id', businessId);
  }

  const { data } = await q;

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

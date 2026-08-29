/**
 * Infobip WhatsApp inbound webhook
 * POST /api/webhooks/infobip/whatsapp
 *
 * Idempotency: unique claim insert on (provider, provider_message_id) is the source of truth.
 * Connection isolation: connection_type / agent_profile / business_id ONLY from
 * resolveConnectionBySender() → whatsapp_connections row (never from Infobip payload).
 *
 * Phase 5B: merchant → existing MO path; platform → acquisition MO (leads + tools + handoff).
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppText, normalizePhone, isInfobipConfigured } from '@/lib/infobip/client';
import {
  resolveConnectionBySender,
  getOrCreateConversation,
  claimInboundMessage,
  insertOutboundMessage,
  updateMessageStatus,
  getRecentMessages,
  getConversationAgentStatus,
  isMoGloballyEnabled,
  type ResolvedWhatsappConnection,
  type WhatsappConnection,
} from '@/lib/services/whatsapp/conversation-store';
import { generateSalesReply } from '@/lib/services/whatsapp/mo-sales-agent';
import { generateAcquisitionReply } from '@/lib/services/whatsapp/mo-acquisition-agent';
import { getOrCreateLead } from '@/lib/services/whatsapp/busmo-lead-store';
import {
  getAvailableCredits,
  deductForMoResponse,
  refundUsageForFailedSend,
  ensureTrialCredits,
  MO_CREDITS_PER_RESPONSE,
} from '@/lib/services/whatsapp/mo-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEBHOOK_BUILD_MARKER = 'phase5b-acquisition-mo-v1';
const WEBHOOK_COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  'unknown';

type InboundResult = {
  from?: string;
  sender?: string;
  to?: string;
  destination?: string;
  integrationType?: string;
  receivedAt?: string;
  messageId?: string;
  message?: { type?: string; text?: string; caption?: string };
  content?: Array<{ type?: string; text?: string; cleanText?: string }>;
  contact?: { name?: string; phoneNumber?: string };
  status?: unknown;
  doneAt?: string;
  sentAt?: string;
  bulkId?: string;
  channel?: string;
  event?: string;
};

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.INFOBIP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header =
    req.headers.get('authorization') ||
    req.headers.get('x-infobip-signature') ||
    req.headers.get('x-webhook-secret') ||
    '';
  return (
    header === secret ||
    header === `App ${secret}` ||
    header === `Bearer ${secret}`
  );
}

function extractInboundMessages(body: any): InboundResult[] {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.results)) return body.results as InboundResult[];
  if (body.result) return [body.result as InboundResult];
  if (Array.isArray(body.messages)) return body.messages as InboundResult[];
  if (body.messageId || body.message || body.sender || body.from) {
    return [body as InboundResult];
  }
  return [];
}

function normalizeInboundItem(item: InboundResult): InboundResult {
  const from = item.from || item.sender || item.contact?.phoneNumber || '';
  const to = item.to || item.destination || '';
  let message = item.message;
  if (!message && Array.isArray(item.content) && item.content.length) {
    const c = item.content[0];
    message = { type: c.type || 'TEXT', text: c.text || c.cleanText || '' };
  }
  return {
    ...item,
    from: from ? String(from) : item.from,
    to: to ? String(to) : item.to,
    message,
  };
}

function safePhoneDiag(value: unknown): { present: boolean; suffix: string | null; len: number } {
  const digits = normalizePhone(String(value ?? ''));
  if (!digits) return { present: Boolean(value), suffix: null, len: 0 };
  return { present: true, suffix: digits.slice(-4), len: digits.length };
}

function safeInboundPayloadDiagnostic(raw: InboundResult, bodyKeys: string[]): Record<string, unknown> {
  const contact = raw.contact && typeof raw.contact === 'object' ? raw.contact : null;
  return {
    event: 'infobip_inbound_payload_structure',
    bodyTopLevelKeys: bodyKeys.slice(0, 20),
    resultFieldNames: Object.keys(raw || {}).slice(0, 30),
    fields: {
      from: { ...safePhoneDiag(raw.from), field: 'from' },
      sender: { ...safePhoneDiag(raw.sender), field: 'sender' },
      to: { ...safePhoneDiag(raw.to), field: 'to' },
      destination: { ...safePhoneDiag(raw.destination), field: 'destination' },
      contactPhoneNumber: {
        ...safePhoneDiag(contact?.phoneNumber),
        field: 'contact.phoneNumber',
      },
    },
    hasMessage: Boolean(raw.message),
    hasContentArray: Array.isArray(raw.content) && raw.content.length > 0,
    hasStatus: raw.status != null,
    channel: raw.channel || null,
    eventType: raw.event || null,
    integrationType: raw.integrationType || null,
    messageIdPresent: Boolean(raw.messageId),
    messageIdSuffix: raw.messageId ? String(raw.messageId).slice(-12) : null,
  };
}

function isStatusOrDeliveryEvent(item: InboundResult): boolean {
  if (item.status && !item.message) return true;
  if (item.doneAt && !item.message) return true;
  if (
    item.status &&
    typeof item.status === 'object' &&
    ('groupName' in (item.status as object) || 'groupId' in (item.status as object))
  ) {
    return true;
  }
  return false;
}

/**
 * Phase 5B — platform path: persist + lead + acquisition MO (no merchant credits).
 */
async function handlePlatformPhase5B(params: {
  resolved: ResolvedWhatsappConnection;
  customerPhone: string;
  businessSender: string;
  messageId: string;
  text: string;
  msgType: string;
  item: InboundResult;
}): Promise<void> {
  const { resolved, customerPhone, businessSender, messageId, text, msgType, item } = params;

  console.log(
    JSON.stringify({
      event: 'acquisition_connection_resolved',
      connectionType: resolved.connectionType,
      agentProfile: resolved.agentProfile,
      businessId: resolved.businessId,
      connectionId: resolved.connection.id,
      messageId,
      senderSuffix: businessSender.slice(-4),
      phase: 'phase5b_acquisition',
    })
  );

  const conversation = await getOrCreateConversation({
    connectionId: resolved.connection.id,
    businessId: null,
    customerPhone,
    connectionType: 'platform',
  });

  const claim = await claimInboundMessage({
    conversationId: conversation.id,
    businessId: null,
    providerMessageId: messageId,
    messageType: (msgType || 'TEXT').toLowerCase(),
    messageText: text.slice(0, 4000),
    metadata: {
      receivedAt: item.receivedAt,
      integrationType: item.integrationType,
      contactName: item.contact?.name ? String(item.contact.name).slice(0, 80) : undefined,
      connectionId: resolved.connection.id,
      agentProfile: resolved.agentProfile,
    },
  });

  if (claim.duplicate) {
    console.log(
      JSON.stringify({
        event: 'message_claimed',
        duplicate: true,
        messageId,
        connectionId: resolved.connection.id,
        conversationId: conversation.id,
        phase: 'phase5b',
      })
    );
    return;
  }

  console.log(
    JSON.stringify({
      event: 'message_claimed',
      direction: 'inbound',
      id: claim.id,
      messageId,
      conversationId: conversation.id,
      businessId: null,
      connectionId: resolved.connection.id,
      phase: 'phase5b',
    })
  );

  if (!isMoGloballyEnabled({ metadata: resolved.connection.metadata })) {
    await updateMessageStatus(claim.id, 'skipped', { reason: 'mo_disabled' });
    console.log(
      JSON.stringify({
        event: 'acquisition_skipped',
        reason: 'mo_disabled',
        conversationId: conversation.id,
        messageId,
      })
    );
    return;
  }

  const agentStatus = await getConversationAgentStatus(conversation.id);
  if (agentStatus === 'human_active') {
    await updateMessageStatus(claim.id, 'skipped', { reason: 'human_active' });
    console.log(
      JSON.stringify({
        event: 'acquisition_skipped',
        reason: 'human_active',
        conversationId: conversation.id,
        messageId,
      })
    );
    return;
  }

  let lead;
  try {
    lead = await getOrCreateLead({
      phone: customerPhone,
      sourceConnectionId: resolved.connection.id,
      source: 'whatsapp',
      contactName: item.contact?.name ? String(item.contact.name).slice(0, 80) : null,
    });
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'acquisition_lead_failed',
        error: e?.message || 'lead_failed',
        conversationId: conversation.id,
        messageId,
      })
    );
    await updateMessageStatus(claim.id, 'failed', { error: 'lead_load_failed' });
    return;
  }

  if (!isInfobipConfigured()) {
    await updateMessageStatus(claim.id, 'failed', { error: 'infobip_not_configured' });
    console.error(JSON.stringify({ event: 'whatsapp_send_failed', error: 'infobip_not_configured', phase: 'phase5b' }));
    return;
  }

  const history = await getRecentMessages(conversation.id, null, 12);
  const prior = history.slice(0, -1);

  const mo = await generateAcquisitionReply({
    lead,
    conversationId: conversation.id,
    connectionId: resolved.connection.id,
    customerPhone,
    customerMessage: text,
    history: prior,
    contactName: item.contact?.name ? String(item.contact.name) : null,
  });

  const replyText = String(mo.reply || '').trim();
  const clientMessageId = `busmo-acq-${messageId}`.slice(0, 200);

  try {
    if (!mo.ok) {
      await updateMessageStatus(claim.id, 'failed', { error: mo.error || 'acquisition_mo_failed' });
    } else {
      await updateMessageStatus(claim.id, 'received', {
        moOk: true,
        toolsUsed: mo.toolsUsed,
        handedOff: mo.handedOff,
      });
    }
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'inbound_status_update_failed',
        conversationId: conversation.id,
        error: e?.message || 'status update failed',
      })
    );
  }

  if (!replyText) {
    console.error(
      JSON.stringify({
        event: 'whatsapp_send_failed',
        error: 'empty_acquisition_reply',
        conversationId: conversation.id,
        messageId,
      })
    );
    return;
  }

  // NO merchant credit deduction for acquisition
  let outboundId: string | null = null;
  try {
    const outbound = await insertOutboundMessage({
      conversationId: conversation.id,
      businessId: null,
      clientMessageId,
      messageText: replyText,
      metadata: {
        inReplyTo: messageId,
        moOk: mo.ok,
        toolsUsed: mo.toolsUsed,
        handedOff: mo.handedOff,
        leadId: lead.id,
      },
    });
    outboundId = outbound.id;
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'outbound_persist_failed',
        conversationId: conversation.id,
        error: e?.message || 'outbound persist failed',
        continuingToSend: true,
      })
    );
  }

  const sendResult = await sendWhatsAppText({
    from: businessSender,
    to: customerPhone,
    text: replyText,
    messageId: clientMessageId,
  });

  if (outboundId) {
    if (sendResult.ok) {
      await updateMessageStatus(
        outboundId,
        'sent',
        { infobipStatus: sendResult.status },
        { setSentAt: true, providerMessageId: sendResult.messageId || clientMessageId }
      );
    } else {
      await updateMessageStatus(outboundId, 'failed', {
        error: sendResult.error || 'send_failed',
      });
    }
  }

  console.log(
    JSON.stringify({
      event: sendResult.ok ? 'acquisition_send_pipeline_done' : 'acquisition_send_pipeline_failed',
      conversationId: conversation.id,
      leadId: lead.id,
      outboundId,
      toolsUsed: mo.toolsUsed,
      handedOff: mo.handedOff,
      replyLen: replyText.length,
      sendError: sendResult.ok ? undefined : sendResult.error,
      fromSuffix: businessSender.slice(-4),
      toSuffix: customerPhone.slice(-4),
    })
  );
}

async function processInbound(raw: InboundResult): Promise<void> {
  const item = normalizeInboundItem(raw);
  const messageId = String(item.messageId || '').trim();
  if (!messageId) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'missing_message_id' }));
    return;
  }

  if (isStatusOrDeliveryEvent(item)) {
    const st = (item.status && typeof item.status === 'object' ? item.status : {}) as Record<string, unknown>;
    const groupName = String(st.groupName || '');
    const statusName = String(st.name || '');
    const description = String(st.description || '');
    const toSuffix = normalizePhone(String(item.to || '')).slice(-4) || null;

    console.log(
      JSON.stringify({
        event: 'outbound_delivery_received',
        messageId,
        statusGroup: groupName || null,
        statusName: statusName || null,
        statusDescription: description || null,
        toSuffix,
      })
    );

    const upper = `${groupName} ${statusName}`.toUpperCase();
    if (
      upper.includes('REJECT') ||
      upper.includes('UNDELIVER') ||
      upper.includes('EXPIRED') ||
      upper.includes('FAILED') ||
      upper.includes('ERROR')
    ) {
      console.log(
        JSON.stringify({
          event: 'outbound_delivery_failed',
          messageId,
          statusGroup: groupName || null,
          statusName: statusName || null,
          statusDescription: description || null,
          toSuffix,
        })
      );
    } else if (
      upper.includes('DELIVERED') ||
      upper.includes('SEEN') ||
      (upper.includes('READ') && !upper.includes('UNREAD'))
    ) {
      console.log(
        JSON.stringify({
          event: 'outbound_delivery_succeeded',
          messageId,
          statusGroup: groupName || null,
          statusName: statusName || null,
          statusDescription: description || null,
          toSuffix,
        })
      );
    }
    return;
  }

  const msgType = String(item.message?.type || '').toUpperCase();
  const text = String(item.message?.text || item.message?.caption || '').trim();

  if (msgType && msgType !== 'TEXT') {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'unsupported_type', type: msgType, messageId }));
    return;
  }
  if (!text) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'empty_text', messageId }));
    return;
  }

  const rawFromDigits = normalizePhone(item.from || '');
  const rawSenderDigits = normalizePhone(item.sender || '');
  const rawContactDigits = normalizePhone(item.contact?.phoneNumber || '');
  const rawToDigits = normalizePhone(item.to || '');
  const rawDestinationDigits = normalizePhone(item.destination || '');

  const customerPhone =
    rawFromDigits || rawSenderDigits || rawContactDigits || '';
  const businessSender = rawToDigits || rawDestinationDigits || '';

  console.log(JSON.stringify({
    event: 'webhook_received',
    messageId,
    type: msgType || 'TEXT',
    fromSuffix: customerPhone.slice(-4) || null,
    toSuffix: businessSender.slice(-4) || null,
    textLen: text.length,
    sourceFields: {
      fromLen: rawFromDigits.length,
      senderLen: rawSenderDigits.length,
      contactLen: rawContactDigits.length,
      toLen: rawToDigits.length,
      destinationLen: rawDestinationDigits.length,
    },
  }));

  if (!customerPhone || !businessSender) {
    console.log(JSON.stringify({
      event: 'webhook_received',
      skipped: true,
      reason: 'missing_phone',
      messageId,
      hasCustomer: Boolean(customerPhone),
      hasBusiness: Boolean(businessSender),
    }));
    return;
  }

  if (customerPhone === businessSender) {
    console.error(JSON.stringify({
      event: 'whatsapp_phone_routing_diagnostic',
      error: 'customer_equals_business_sender',
      messageId,
      sharedSuffix: customerPhone.slice(-4),
      sharedLen: customerPhone.length,
      note: 'Inbound from and to resolved to the same number — refusing to create conversation',
    }));
    return;
  }

  const resolved = await resolveConnectionBySender(businessSender);
  if (!resolved) {
    console.error(JSON.stringify({
      event: 'conversation_resolved',
      error: 'no_connection_for_sender',
      senderSuffix: businessSender.slice(-4),
      messageId,
    }));
    return;
  }

  if (
    resolved.connectionType === 'platform' ||
    resolved.agentProfile === 'busmo_acquisition'
  ) {
    await handlePlatformPhase5B({
      resolved,
      customerPhone,
      businessSender,
      messageId,
      text,
      msgType,
      item,
    });
    return;
  }

  if (!resolved.businessId) {
    console.error(JSON.stringify({
      event: 'conversation_resolved',
      error: 'merchant_missing_business_id',
      connectionId: resolved.connection.id,
      messageId,
    }));
    return;
  }

  const connection: WhatsappConnection = {
    id: resolved.connection.id,
    business_id: resolved.businessId,
    provider: resolved.connection.provider,
    whatsapp_sender: resolved.connection.whatsapp_sender,
    status: resolved.connection.status,
    metadata: resolved.connection.metadata,
    connection_type: resolved.connectionType,
    agent_profile: resolved.agentProfile,
  };

  const conversation = await getOrCreateConversation({
    connectionId: connection.id,
    businessId: connection.business_id,
    customerPhone,
    connectionType: 'merchant',
  });

  console.log(JSON.stringify({
    event: 'connection_resolved',
    connectionType: resolved.connectionType,
    agentProfile: resolved.agentProfile,
    businessId: connection.business_id,
    conversationId: conversation.id,
    agentStatus: conversation.agent_status,
    messageId,
    senderSuffix: businessSender.slice(-4),
  }));

  const claim = await claimInboundMessage({
    conversationId: conversation.id,
    businessId: connection.business_id,
    providerMessageId: messageId,
    messageType: (msgType || 'TEXT').toLowerCase(),
    messageText: text.slice(0, 4000),
    metadata: {
      receivedAt: item.receivedAt,
      integrationType: item.integrationType,
      contactName: item.contact?.name ? String(item.contact.name).slice(0, 80) : undefined,
    },
  });

  if (claim.duplicate) {
    console.log(JSON.stringify({
      event: 'message_claimed',
      duplicate: true,
      messageId,
      businessId: connection.business_id,
    }));
    return;
  }

  console.log(JSON.stringify({
    event: 'message_claimed',
    direction: 'inbound',
    id: claim.id,
    messageId,
    businessId: connection.business_id,
  }));

  if (!isMoGloballyEnabled(connection)) {
    await updateMessageStatus(claim.id, 'skipped', { reason: 'mo_disabled' });
    console.log(JSON.stringify({
      event: 'mo_started',
      skipped: true,
      reason: 'mo_disabled',
      conversationId: conversation.id,
      messageId,
      businessId: connection.business_id,
    }));
    return;
  }

  const agentStatus = await getConversationAgentStatus(conversation.id);
  if (agentStatus === 'human_active') {
    await updateMessageStatus(claim.id, 'skipped', { reason: 'human_active' });
    console.log(JSON.stringify({
      event: 'mo_started',
      skipped: true,
      reason: 'human_active',
      conversationId: conversation.id,
      messageId,
    }));
    return;
  }

  try {
    await ensureTrialCredits(connection.business_id);
  } catch {
    // non-fatal
  }

  const availableCredits = await getAvailableCredits(connection.business_id);
  if (availableCredits < MO_CREDITS_PER_RESPONSE) {
    await updateMessageStatus(claim.id, 'skipped', {
      reason: 'insufficient_credits',
      availableCredits,
    });
    console.log(JSON.stringify({
      event: 'mo_started',
      skipped: true,
      reason: 'insufficient_credits',
      conversationId: conversation.id,
      messageId,
      businessId: connection.business_id,
      availableCredits,
    }));
    return;
  }

  if (!isInfobipConfigured()) {
    await updateMessageStatus(claim.id, 'failed', { error: 'infobip_not_configured' });
    console.error(JSON.stringify({ event: 'whatsapp_send_failed', error: 'infobip_not_configured' }));
    return;
  }

  const history = await getRecentMessages(conversation.id, connection.business_id, 12);
  const prior = history.slice(0, -1);

  const mo = await generateSalesReply({
    businessId: connection.business_id,
    customerMessage: text,
    history: prior,
  });

  const replyText = String(mo.reply || '').trim();
  const clientMessageId = `busmo-out-${messageId}`.slice(0, 200);

  console.log(
    JSON.stringify({
      event: 'whatsapp_send_prepare',
      businessId: connection.business_id,
      inboundId: claim.id,
      messageId,
      replyLen: replyText.length,
      moOk: mo.ok,
      fromSuffix: businessSender.slice(-4),
      toSuffix: customerPhone.slice(-4),
    })
  );

  try {
    if (!mo.ok) {
      await updateMessageStatus(claim.id, 'failed', { error: mo.error || 'mo_failed' });
    } else {
      await updateMessageStatus(claim.id, 'received', { moOk: true });
    }
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'inbound_status_update_failed',
        businessId: connection.business_id,
        inboundId: claim.id,
        error: e?.message || 'status update failed',
      })
    );
  }

  if (!replyText) {
    console.error(
      JSON.stringify({
        event: 'whatsapp_send_failed',
        businessId: connection.business_id,
        inboundId: claim.id,
        error: 'empty_mo_reply',
        fromSuffix: businessSender.slice(-4),
        toSuffix: customerPhone.slice(-4),
      })
    );
    return;
  }

  let outboundId: string | null = null;
  try {
    const outbound = await insertOutboundMessage({
      conversationId: conversation.id,
      businessId: connection.business_id,
      clientMessageId,
      messageText: replyText,
      metadata: { inReplyTo: messageId, moOk: mo.ok },
    });
    outboundId = outbound.id;
    console.log(
      JSON.stringify({
        event: 'outbound_persisted',
        businessId: connection.business_id,
        inboundId: claim.id,
        outboundId,
        replyLen: replyText.length,
      })
    );
  } catch (e: any) {
    console.error(
      JSON.stringify({
        event: 'outbound_persist_failed',
        businessId: connection.business_id,
        inboundId: claim.id,
        error: e?.message || 'outbound persist failed',
        continuingToSend: true,
      })
    );
  }

  const creditDeduct = await deductForMoResponse({
    businessId: connection.business_id,
    amount: MO_CREDITS_PER_RESPONSE,
    conversationId: conversation.id,
    messageId: claim.id,
    providerMessageId: messageId,
    description: 'MO automatic response',
  });
  if (!creditDeduct.ok) {
    await updateMessageStatus(claim.id, 'skipped', {
      reason: 'insufficient_credits',
      availableCredits: creditDeduct.balance,
    });
    console.log(JSON.stringify({
      event: 'mo_credit_deduct_blocked',
      businessId: connection.business_id,
      messageId,
      balance: creditDeduct.balance,
      error: creditDeduct.error,
    }));
    return;
  }

  const sendResult = await sendWhatsAppText({
    from: businessSender,
    to: customerPhone,
    text: replyText,
    messageId: clientMessageId,
  });

  if (outboundId) {
    if (sendResult.ok) {
      await updateMessageStatus(
        outboundId,
        'sent',
        { infobipStatus: sendResult.status, creditLedgerId: creditDeduct.ledgerId },
        { setSentAt: true, providerMessageId: sendResult.messageId || clientMessageId }
      );
    } else {
      await updateMessageStatus(outboundId, 'failed', {
        error: sendResult.error || 'send_failed',
      });
      await refundUsageForFailedSend({
        businessId: connection.business_id,
        messageId: claim.id,
        reason: 'outbound_send_failed',
      });
    }
  } else if (!sendResult.ok) {
    await refundUsageForFailedSend({
      businessId: connection.business_id,
      messageId: claim.id,
      reason: 'outbound_send_failed',
    });
  }

  console.log(
    JSON.stringify({
      event: sendResult.ok ? 'whatsapp_send_pipeline_done' : 'whatsapp_send_pipeline_failed',
      businessId: connection.business_id,
      inboundId: claim.id,
      outboundId,
      fromSuffix: businessSender.slice(-4),
      toSuffix: customerPhone.slice(-4),
      replyLen: replyText.length,
      sendError: sendResult.ok ? undefined : sendResult.error,
    })
  );

  console.log(
    JSON.stringify({
      event: 'whatsapp_phone_routing_diagnostic',
      providerMessageId: messageId,
      inboundFromSuffix: customerPhone.slice(-4),
      inboundToSuffix: businessSender.slice(-4),
      parsedCustomerSuffix: customerPhone.slice(-4),
      parsedBusinessSenderSuffix: businessSender.slice(-4),
      conversationCustomerSuffix: customerPhone.slice(-4),
      conversationId: conversation.id,
      businessId: connection.business_id,
      outboundFromSuffix: businessSender.slice(-4),
      outboundToSuffix: customerPhone.slice(-4),
      outboundProviderMessageId: sendResult.messageId || clientMessageId || null,
      sendOk: sendResult.ok,
      sendError: sendResult.ok ? undefined : sendResult.error || null,
      sendStatusName: sendResult.statusName || null,
      sendStatusDescription: sendResult.statusDescription || null,
    })
  );
}

export async function POST(req: NextRequest) {
  console.log(
    JSON.stringify({
      event: 'infobip_webhook_build_marker',
      build: WEBHOOK_BUILD_MARKER,
      commit: WEBHOOK_COMMIT,
      timestamp: new Date().toISOString(),
    })
  );

  console.log(
    JSON.stringify({
      event: 'infobip_webhook_received',
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  );

  try {
    if (!verifyWebhookSecret(req)) {
      console.error(
        JSON.stringify({
          event: 'infobip_webhook_unauthorized',
          method: req.method,
          timestamp: new Date().toISOString(),
          secretConfigured: Boolean(process.env.INFOBIP_WEBHOOK_SECRET?.trim()),
        })
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      console.log(
        JSON.stringify({
          event: 'infobip_webhook_invalid_json',
          timestamp: new Date().toISOString(),
        })
      );
      return NextResponse.json({ ok: true, processed: 0, note: 'invalid_json' });
    }

    const items = extractInboundMessages(body);
    if (!items.length) {
      console.log(
        JSON.stringify({
          event: 'infobip_webhook_no_inbound_items',
          timestamp: new Date().toISOString(),
        })
      );
      return NextResponse.json({ ok: true, processed: 0 });
    }

    const bodyKeys =
      body && typeof body === 'object' ? Object.keys(body as object) : [];

    for (const item of items) {
      try {
        console.log(JSON.stringify(safeInboundPayloadDiagnostic(item, bodyKeys)));
        await processInbound(item);
      } catch (e: any) {
        console.error(JSON.stringify({
          event: 'process_inbound_error',
          error: e?.message || 'process failed',
          stack: typeof e?.stack === 'string' ? e.stack.slice(0, 400) : undefined,
          messageId: item?.messageId,
        }));
      }
    }

    return NextResponse.json({ ok: true, processed: items.length });
  } catch (e: any) {
    console.error(JSON.stringify({
      event: 'infobip_webhook_error',
      error: e?.message || 'webhook failed',
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({ ok: true, error: 'handled' });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'infobip-whatsapp-webhook',
    configured: isInfobipConfigured(),
    build: WEBHOOK_BUILD_MARKER,
    commit: WEBHOOK_COMMIT,
  });
}

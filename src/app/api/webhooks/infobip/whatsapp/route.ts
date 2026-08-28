/**
 * Infobip WhatsApp inbound webhook
 * POST /api/webhooks/infobip/whatsapp
 *
 * Idempotency: unique claim insert on (provider, provider_message_id) is the source of truth.
 * Business isolation: business_id only from whatsapp_connections.sender mapping.
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppText, normalizePhone, isInfobipConfigured } from '@/lib/infobip/client';
import {
  resolveBusinessBySender,
  getOrCreateConversation,
  claimInboundMessage,
  insertOutboundMessage,
  updateMessageStatus,
  getRecentMessages,
  getConversationAgentStatus,
  isMoGloballyEnabled,
} from '@/lib/services/whatsapp/conversation-store';
import { generateSalesReply } from '@/lib/services/whatsapp/mo-sales-agent';
import {
  getAvailableCredits,
  deductForMoResponse,
  refundUsageForFailedSend,
  ensureTrialCredits,
  MO_CREDITS_PER_RESPONSE,
} from '@/lib/services/whatsapp/mo-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Safe deploy fingerprint — proves which build is handling webhook traffic */
const WEBHOOK_BUILD_MARKER = 'phone-routing-diagnostic-v2';
const WEBHOOK_COMMIT =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  'unknown';

type InboundResult = {
  from?: string;
  /** Subscription / multi-channel payloads often use sender instead of from */
  sender?: string;
  to?: string;
  /** Messages API style destination (business number) */
  destination?: string;
  integrationType?: string;
  receivedAt?: string;
  messageId?: string;
  message?: { type?: string; text?: string; caption?: string };
  /** Some formats put text content under content[] */
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

  // Classic WhatsApp MO + most subscription channel payloads
  if (Array.isArray(body.results)) return body.results as InboundResult[];
  if (body.result) return [body.result as InboundResult];

  // Rare envelope: { messages: [...] }
  if (Array.isArray(body.messages)) return body.messages as InboundResult[];

  // Single inbound object
  if (body.messageId || body.message || body.sender || body.from) {
    return [body as InboundResult];
  }
  return [];
}

/** Normalize field names across Forward-to-HTTP and Subscription formats. */
function normalizeInboundItem(item: InboundResult): InboundResult {
  const from =
    item.from ||
    item.sender ||
    item.contact?.phoneNumber ||
    '';
  const to = item.to || item.destination || '';

  let message = item.message;
  if (!message && Array.isArray(item.content) && item.content.length) {
    const c = item.content[0];
    message = {
      type: c.type || 'TEXT',
      text: c.text || c.cleanText || '',
    };
  }

  return {
    ...item,
    from: from ? String(from) : item.from,
    to: to ? String(to) : item.to,
    message,
  };
}

/**
 * SAFE diagnostic of inbound Infobip payload structure.
 * Never logs full phone numbers, API keys, or auth headers.
 * Shows field names, last-4 suffixes, and normalized lengths only.
 */
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
    // Failures first (REJECTED_NOT_DELIVERED contains substring DELIVERED)
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
    // Never run MO on delivery/status callbacks
    return;
  }

  const msgType = String(item.message?.type || '').toUpperCase();
  const text = String(item.message?.text || item.message?.caption || '').trim();

  // Accept TEXT / text; empty type with text body is treated as text
  if (msgType && msgType !== 'TEXT') {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'unsupported_type', type: msgType, messageId }));
    return;
  }
  if (!text) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'empty_text', messageId }));
    return;
  }

  // Semantic: inbound from = CUSTOMER, to = BUSINESS WhatsApp sender
  // Never resolve business from inbound from; never use business number as customer.
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

  // Detect accidental swap / same-number (would route outbound to trial sender)
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

  const connection = await resolveBusinessBySender(businessSender);
  if (!connection) {
    console.error(JSON.stringify({
      event: 'conversation_resolved',
      error: 'no_business_for_sender',
      senderSuffix: businessSender.slice(-4),
      messageId,
    }));
    return;
  }

  const conversation = await getOrCreateConversation({
    businessId: connection.business_id,
    customerPhone,
  });

  console.log(JSON.stringify({
    event: 'business_resolved',
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

  // Global merchant pause (settings → moEnabled false → metadata.mo_enabled)
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

  // Ensure trial wallet once; do not charge yet
  try {
    await ensureTrialCredits(connection.business_id);
  } catch {
    // non-fatal — deduct path will still enforce balance
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

  // Persist outbound row, but never block the Infobip send if persistence fails.
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

  // Atomic credit reservation before outbound send (idempotent on inbound claim id)
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

  // Free-form text only for customer-initiated inbound TEXT (24h care window).
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
      // Refund reserved credit when Infobip rejects the send
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

  // Full phone-routing diagnostic (suffixes only) — proves inbound→conversation→outbound mapping
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
  // Unmistakable deploy fingerprint — runs for EVERY POST before auth/parse/MO.
  console.log(
    JSON.stringify({
      event: 'infobip_webhook_build_marker',
      build: WEBHOOK_BUILD_MARKER,
      commit: WEBHOOK_COMMIT,
      timestamp: new Date().toISOString(),
    })
  );

  // First diagnostic — proves the request reached the Next.js route handler.
  // Must run before auth, JSON parse, validation, DB, or MO.
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
        // SAFE structure diagnostic (no full numbers)
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

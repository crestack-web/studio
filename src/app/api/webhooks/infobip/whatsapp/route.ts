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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    if (upper.includes('DELIVERED') || upper.includes('SEEN') || upper.includes('READ')) {
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
    } else if (
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

  const customerPhone = normalizePhone(item.from || item.contact?.phoneNumber || '');
  const businessSender = normalizePhone(item.to || '');

  console.log(JSON.stringify({
    event: 'webhook_received',
    messageId,
    type: msgType || 'TEXT',
    fromSuffix: customerPhone.slice(-4),
    toSuffix: businessSender.slice(-4),
    textLen: text.length,
  }));

  if (!customerPhone || !businessSender) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'missing_phone', messageId }));
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
}

export async function POST(req: NextRequest) {
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

    for (const item of items) {
      try {
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
  });
}

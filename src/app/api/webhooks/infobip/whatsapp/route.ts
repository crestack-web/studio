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
  to?: string;
  integrationType?: string;
  receivedAt?: string;
  messageId?: string;
  message?: { type?: string; text?: string; caption?: string };
  contact?: { name?: string; phoneNumber?: string };
  status?: unknown;
  doneAt?: string;
  sentAt?: string;
  bulkId?: string;
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
  if (body.messageId || body.message) return [body as InboundResult];
  return [];
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

async function processInbound(item: InboundResult): Promise<void> {
  const messageId = String(item.messageId || '').trim();
  if (!messageId) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'missing_message_id' }));
    return;
  }

  if (isStatusOrDeliveryEvent(item)) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'status_event', messageId }));
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
    event: 'conversation_resolved',
    businessId: connection.business_id,
    conversationId: conversation.id,
    agentStatus: conversation.agent_status,
    messageId,
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
      event: 'message_persisted',
      duplicate: true,
      messageId,
      businessId: connection.business_id,
    }));
    return;
  }

  console.log(JSON.stringify({
    event: 'message_persisted',
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

  if (!mo.ok) {
    await updateMessageStatus(claim.id, 'failed', { error: mo.error || 'mo_failed' });
  } else {
    await updateMessageStatus(claim.id, 'received', { moOk: true });
  }

  const replyText = mo.reply;
  const clientMessageId = `busmo-out-${messageId}`.slice(0, 200);

  const outbound = await insertOutboundMessage({
    conversationId: conversation.id,
    businessId: connection.business_id,
    clientMessageId,
    messageText: replyText,
    metadata: { inReplyTo: messageId, moOk: mo.ok },
  });

  const sendResult = await sendWhatsAppText({
    from: businessSender,
    to: customerPhone,
    text: replyText,
    messageId: clientMessageId,
  });

  if (sendResult.ok) {
    await updateMessageStatus(
      outbound.id,
      'sent',
      { infobipStatus: sendResult.status },
      { setSentAt: true, providerMessageId: sendResult.messageId || clientMessageId }
    );
  } else {
    await updateMessageStatus(outbound.id, 'failed', {
      error: sendResult.error || 'send_failed',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: true, processed: 0, note: 'invalid_json' });
    }

    const items = extractInboundMessages(body);
    if (!items.length) {
      return NextResponse.json({ ok: true, processed: 0 });
    }

    for (const item of items) {
      try {
        await processInbound(item);
      } catch (e: any) {
        console.error(JSON.stringify({
          event: 'webhook_received',
          error: e?.message || 'process failed',
          messageId: item?.messageId,
        }));
      }
    }

    return NextResponse.json({ ok: true, processed: items.length });
  } catch (e: any) {
    console.error(JSON.stringify({ event: 'webhook_received', error: e?.message || 'webhook failed' }));
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

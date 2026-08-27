/**
 * Infobip WhatsApp inbound webhook
 * POST /api/webhooks/infobip/whatsapp
 */
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppText, normalizePhone } from '@/lib/infobip/client';
import {
  resolveBusinessBySender,
  getOrCreateConversation,
  isProviderMessageProcessed,
  insertMessage,
  updateMessageStatus,
  getRecentMessages,
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
};

function verifyWebhookSecret(req: NextRequest): boolean {
  const secret = process.env.INFOBIP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  const header =
    req.headers.get('authorization') ||
    req.headers.get('x-infobip-signature') ||
    req.headers.get('x-webhook-secret') ||
    '';
  if (header === secret) return true;
  if (header === `App ${secret}`) return true;
  if (header === `Bearer ${secret}`) return true;
  return false;
}

function extractInboundMessages(body: any): InboundResult[] {
  if (!body) return [];
  if (Array.isArray(body.results)) return body.results as InboundResult[];
  if (body.result) return [body.result as InboundResult];
  if (body.messageId || body.message) return [body as InboundResult];
  return [];
}

async function processInbound(item: InboundResult): Promise<void> {
  const messageId = item.messageId || '';
  const msgType = (item.message?.type || '').toUpperCase();
  const text = item.message?.text || item.message?.caption || '';

  if (!messageId) return;
  if (item.status && !item.message) return;
  if (msgType && msgType !== 'TEXT' && !text) {
    console.log(JSON.stringify({ event: 'webhook_received', skipped: true, reason: 'non_text', messageId, type: msgType }));
    return;
  }
  if (!text?.trim()) {
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
  }));

  if (!customerPhone || !businessSender) return;

  if (await isProviderMessageProcessed(messageId)) {
    console.log(JSON.stringify({ event: 'webhook_received', duplicate: true, messageId }));
    return;
  }

  const connection = await resolveBusinessBySender(businessSender);
  if (!connection) {
    console.error(JSON.stringify({
      event: 'conversation_resolved',
      error: 'no_business_for_sender',
      senderSuffix: businessSender.slice(-4),
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
  }));

  const inbound = await insertMessage({
    conversationId: conversation.id,
    businessId: connection.business_id,
    providerMessageId: messageId,
    direction: 'inbound',
    messageType: (msgType || 'TEXT').toLowerCase(),
    messageText: text.trim(),
    processingStatus: 'received',
    metadata: {
      receivedAt: item.receivedAt,
      integrationType: item.integrationType,
      contactName: item.contact?.name,
    },
  });

  if (inbound.duplicate) {
    console.log(JSON.stringify({ event: 'message_persisted', duplicate: true, messageId }));
    return;
  }

  console.log(JSON.stringify({ event: 'message_persisted', direction: 'inbound', id: inbound.id, messageId }));

  if (conversation.agent_status === 'human_active') {
    await updateMessageStatus(inbound.id, 'skipped', { reason: 'human_active' });
    console.log(JSON.stringify({ event: 'mo_started', skipped: true, reason: 'human_active', conversationId: conversation.id }));
    return;
  }

  const history = await getRecentMessages(conversation.id, 12);
  const reply = await generateSalesReply({
    businessId: connection.business_id,
    customerMessage: text.trim(),
    history: history.slice(0, -1),
  });

  const outbound = await insertMessage({
    conversationId: conversation.id,
    businessId: connection.business_id,
    direction: 'outbound',
    messageType: 'text',
    messageText: reply,
    processingStatus: 'processing',
    metadata: { inReplyTo: messageId },
  });

  const sendResult = await sendWhatsAppText({
    from: businessSender,
    to: customerPhone,
    text: reply,
  });

  if (sendResult.ok) {
    await updateMessageStatus(outbound.id, 'sent', {
      providerMessageId: sendResult.messageId,
      infobipStatus: sendResult.status,
    });
  } else {
    await updateMessageStatus(outbound.id, 'failed', {
      error: sendResult.error,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyWebhookSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
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
    configured: Boolean(
      process.env.INFOBIP_API_KEY &&
        (process.env.INFOBIP_BASE_URL || process.env.INFOBIP_API_BASE_URL)
    ),
  });
}

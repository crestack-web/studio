import { NextRequest, NextResponse } from 'next/server';
import {
  appendMessage,
  getOrCreateTicket,
  getTicketBySession,
  listMessages,
  setNeedsHuman,
} from '@/lib/support/support-chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET ?sessionId= — poll messages for a support session */
export async function GET(req: NextRequest) {
  try {
    const sessionId = new URL(req.url).searchParams.get('sessionId')?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const ticket = await getTicketBySession(sessionId);
    if (!ticket) {
      return NextResponse.json({ ticket: null, messages: [] });
    }

    const messages = await listMessages((ticket as any).id);
    return NextResponse.json({
      ticket: {
        id: (ticket as any).id,
        status: (ticket as any).status,
        needsHuman: Boolean((ticket as any).needs_human),
        guestEmail: (ticket as any).guest_email,
      },
      messages: messages.map((m: any) => ({
        id: m.id,
        role:
          m.sender_role === 'user'
            ? 'user'
            : m.sender_role === 'bot'
              ? 'assistant'
              : m.sender_role === 'system'
                ? 'system'
                : 'agent',
        senderRole: m.sender_role,
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  } catch (e: any) {
    console.error('[support/chat GET]', e?.message);
    return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}

/**
 * POST — send a visitor message.
 * body: { sessionId, message, guestEmail?, requestHuman?, userId?, businessId? }
 * When requestHuman is false, also returns an AI-style ack; AI text can be supplied by client
 * calling /api/ask-mo separately — we still persist both sides when botReply is provided.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.sessionId || '').trim();
    const message = String(body.message || '').trim();
    const guestEmail = body.guestEmail ? String(body.guestEmail).trim() : null;
    const requestHuman = Boolean(body.requestHuman);
    const botReply = body.botReply ? String(body.botReply).trim() : null;
    const userId = body.userId ? String(body.userId) : null;
    const businessId = body.businessId ? String(body.businessId) : null;
    const category = body.category ? String(body.category) : 'general';

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }
    if (!message && !requestHuman) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const ticket = await getOrCreateTicket({
      sessionId,
      guestEmail,
      userId,
      businessId,
      category,
      source: 'welcome_widget',
    });

    const ticketId = (ticket as any).id as string;

    if (requestHuman) {
      await setNeedsHuman(ticketId, true);
      await appendMessage({
        ticketId,
        content: message || 'Visitor requested a human agent.',
        senderRole: 'user',
        userId,
      });
      const agentName = 'Ada from Busmo Support';
      await appendMessage({
        ticketId,
        content:
          `${agentName} received your request. A human agent will respond here soon — usually within a few minutes during business hours. You can keep typing in this chat.`,
        senderRole: 'system',
      });
      const messages = await listMessages(ticketId);
      return NextResponse.json({
        ok: true,
        ticketId,
        needsHuman: true,
        messages: messages.map((m: any) => ({
          id: m.id,
          role:
            m.sender_role === 'user'
              ? 'user'
              : m.sender_role === 'bot'
                ? 'assistant'
                : m.sender_role === 'system'
                  ? 'system'
                  : 'agent',
          senderRole: m.sender_role,
          content: m.content,
          createdAt: m.created_at,
        })),
      });
    }

    await appendMessage({
      ticketId,
      content: message,
      senderRole: 'user',
      userId,
    });

    if (botReply) {
      await appendMessage({
        ticketId,
        content: botReply,
        senderRole: 'bot',
      });
    }

    const messages = await listMessages(ticketId);
    return NextResponse.json({
      ok: true,
      ticketId,
      needsHuman: Boolean((ticket as any).needs_human),
      messages: messages.map((m: any) => ({
        id: m.id,
        role:
          m.sender_role === 'user'
            ? 'user'
            : m.sender_role === 'bot'
              ? 'assistant'
              : m.sender_role === 'system'
                ? 'system'
                : 'agent',
        senderRole: m.sender_role,
        content: m.content,
        createdAt: m.created_at,
      })),
    });
  } catch (e: any) {
    console.error('[support/chat POST]', e?.message);
    return NextResponse.json({ error: e?.message || 'Failed to send' }, { status: 500 });
  }
}

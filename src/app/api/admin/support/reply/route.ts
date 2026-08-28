import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { appendMessage, listMessages } from '@/lib/support/support-chat';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized — sign in again on /admin/login' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticketId || '').trim();
    const message = String(body.message || '').trim();
    if (!ticketId || !message) {
      return NextResponse.json({ error: 'ticketId and message required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: ticket, error: ticketErr } = await sb
      .from('support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketErr) {
      console.error('[admin/support/reply] ticket lookup', ticketErr.message);
      return NextResponse.json({ error: ticketErr.message }, { status: 500 });
    }
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Persist agent reply (must succeed)
    let msgRow;
    try {
      msgRow = await appendMessage({
        ticketId,
        content: message,
        senderRole: 'admin',
        userId: admin.id && String(admin.id).includes('-') ? admin.id : null,
        agentName: admin.email,
      });
    } catch (appendErr: any) {
      console.error('[admin/support/reply] append', appendErr?.message);
      return NextResponse.json(
        { error: appendErr?.message || 'Failed to save message' },
        { status: 500 }
      );
    }

    // Best-effort ticket status update (never fail the reply if columns missing)
    try {
      const patchFull: Record<string, unknown> = {
        status: 'assigned',
        updated_at: new Date().toISOString(),
        message: message.slice(0, 500),
        needs_human: true,
      };
      if (admin.id && String(admin.id).includes('-')) {
        patchFull.assigned_to = admin.id;
      }
      const { error: upErr } = await sb.from('support_tickets').update(patchFull).eq('id', ticketId);
      if (upErr) {
        await sb
          .from('support_tickets')
          .update({
            status: 'assigned',
            updated_at: new Date().toISOString(),
            message: message.slice(0, 500),
          })
          .eq('id', ticketId);
      }
    } catch (upCatch: any) {
      console.warn('[admin/support/reply] ticket update soft-fail', upCatch?.message);
    }

    let messages: any[] = [];
    try {
      messages = await listMessages(ticketId);
    } catch {
      messages = msgRow
        ? [
            {
              id: (msgRow as any).id,
              sender_role: 'admin',
              content: message,
              created_at: new Date().toISOString(),
            },
          ]
        : [];
    }

    console.log(
      JSON.stringify({
        event: 'admin_support_reply_ok',
        ticketId: ticketId.slice(0, 8),
        admin: admin.email,
        source: admin.source,
      })
    );

    return NextResponse.json({
      ok: true,
      messageId: (msgRow as any)?.id,
      messages,
    });
  } catch (e: any) {
    console.error('[admin/support/reply]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Reply failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { appendMessage, listMessages } from '@/lib/support/support-chat';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ticketId = String(body.ticketId || '').trim();
    const message = String(body.message || '').trim();
    if (!ticketId || !message) {
      return NextResponse.json({ error: 'ticketId and message required' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const { data: ticket } = await sb.from('support_tickets').select('id').eq('id', ticketId).maybeSingle();
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    await appendMessage({
      ticketId,
      content: message,
      senderRole: 'admin',
      userId: (admin as any).id || null,
    });

    await sb
      .from('support_tickets')
      .update({
        status: 'assigned',
        needs_human: true,
        updated_at: new Date().toISOString(),
        assigned_to: (admin as any).id && String((admin as any).id).includes('-') ? (admin as any).id : null,
      })
      .eq('id', ticketId);

    const messages = await listMessages(ticketId);
    return NextResponse.json({ ok: true, messages });
  } catch (e: any) {
    console.error('[admin/support/reply]', e?.message);
    return NextResponse.json({ error: e?.message || 'Reply failed' }, { status: 500 });
  }
}

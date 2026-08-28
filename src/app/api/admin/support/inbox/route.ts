import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { listMessages, listOpenTickets } from '@/lib/support/support-chat';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const ticketId = url.searchParams.get('ticketId');

    if (ticketId) {
      const sb = getSupabaseAdmin();
      const { data: ticket } = await sb.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
      if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const messages = await listMessages(ticketId);
      return NextResponse.json({ ticket, messages });
    }

    const tickets = await listOpenTickets(100);
    return NextResponse.json({
      tickets: tickets.map((t: any) => ({
        id: t.id,
        status: t.status,
        needsHuman: Boolean(t.needs_human) || t.status === 'needs_human',
        guestEmail: t.guest_email,
        userId: t.user_id,
        businessId: t.business_id,
        category: t.category,
        lastMessage: t.message,
        subject: t.subject,
        source: t.source,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        sessionId: t.session_id,
      })),
    });
  } catch (e: any) {
    console.error('[admin/support/inbox]', e?.message);
    return NextResponse.json({ error: 'Failed to load inbox' }, { status: 500 });
  }
}

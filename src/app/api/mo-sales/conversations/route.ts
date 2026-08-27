import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser, assertBusinessAccess } from '../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const businessId = url.searchParams.get('businessId');
    const filter = url.searchParams.get('filter') || 'all';
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const admin = getSupabaseAdmin();
    let query = admin
      .from('whatsapp_conversations')
      .select('id, customer_phone, agent_status, last_message_at, metadata, created_at, updated_at')
      .eq('business_id', businessId)
      .order('last_message_at', { ascending: false })
      .limit(100);

    if (filter === 'needs_you') query = query.eq('agent_status', 'human_active');
    if (filter === 'mo_handling') query = query.eq('agent_status', 'ai_active');

    const { data: convos, error } = await query;
    if (error) {
      console.error('[mo-sales/conversations]', error.message);
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }

    let list = convos || [];
    if (q) {
      list = list.filter((c: any) => {
        const phone = String(c.customer_phone || '');
        const name = String((c.metadata as any)?.contactName || '');
        return phone.includes(q) || name.toLowerCase().includes(q);
      });
    }

    const ids = list.map((c: any) => c.id);
    const lastMessages: Record<string, string> = {};
    if (ids.length) {
      const { data: msgs } = await admin
        .from('whatsapp_messages')
        .select('conversation_id, message_text, created_at')
        .eq('business_id', businessId)
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
        .limit(200);
      for (const m of msgs || []) {
        const cid = (m as any).conversation_id;
        if (!lastMessages[cid] && (m as any).message_text) {
          lastMessages[cid] = String((m as any).message_text).slice(0, 140);
        }
      }
    }

    return NextResponse.json({
      conversations: list.map((c: any) => ({
        id: c.id,
        customerPhone: c.customer_phone,
        customerName: (c.metadata as any)?.contactName || null,
        agentStatus: c.agent_status,
        lastMessageAt: c.last_message_at || c.created_at,
        lastMessage: lastMessages[c.id] || null,
      })),
    });
  } catch (e: any) {
    console.error('[mo-sales/conversations]', e?.message);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}

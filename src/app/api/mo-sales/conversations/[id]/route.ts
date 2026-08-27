import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser, assertBusinessAccess } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: conversationId } = await params;
    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const admin = getSupabaseAdmin();
    const { data: convo } = await admin
      .from('whatsapp_conversations')
      .select('id, business_id, customer_phone, agent_status, last_message_at, metadata, created_at')
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: messages } = await admin
      .from('whatsapp_messages')
      .select('id, direction, message_text, message_type, processing_status, created_at, sent_at')
      .eq('conversation_id', conversationId)
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .limit(200);

    return NextResponse.json({
      conversation: {
        id: convo.id,
        customerPhone: convo.customer_phone,
        customerName: (convo.metadata as any)?.contactName || null,
        agentStatus: convo.agent_status,
        lastMessageAt: convo.last_message_at,
      },
      messages: (messages || []).map((m: any) => ({
        id: m.id,
        direction: m.direction,
        text: m.message_text,
        type: m.message_type,
        status: m.processing_status,
        createdAt: m.created_at,
      })),
    });
  } catch (e: any) {
    console.error('[mo-sales/conversations/id GET]', e?.message);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: conversationId } = await params;
    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId || new URL(req.url).searchParams.get('businessId');
    const agentStatus = body.agentStatus;

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!['ai_active', 'human_active'].includes(agentStatus)) {
      return NextResponse.json({ error: 'Invalid agentStatus' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const admin = getSupabaseAdmin();
    const { data: updated, error } = await admin
      .from('whatsapp_conversations')
      .update({
        agent_status: agentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('business_id', businessId)
      .select('id, agent_status')
      .maybeSingle();

    if (error) {
      console.error('[mo-sales/conversations/id PATCH]', error.message);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true, agentStatus: updated.agent_status });
  } catch (e: any) {
    console.error('[mo-sales/conversations/id PATCH]', e?.message);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

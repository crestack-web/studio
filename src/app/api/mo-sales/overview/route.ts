import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser, assertBusinessAccess } from '../_auth';
import { ensureTrialCredits } from '@/lib/services/whatsapp/mo-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = new URL(req.url).searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    // Grant trial once per business (idempotent)
    let creditSnapshot = null;
    try {
      creditSnapshot = await ensureTrialCredits(businessId);
    } catch {
      creditSnapshot = null;
    }

    const admin = getSupabaseAdmin();

    const { data: connections } = await admin
      .from('whatsapp_connections')
      .select('id, business_id, provider, whatsapp_sender, status, metadata, updated_at')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(5);

    const connection =
      (connections || []).find((c: any) => c.status === 'active') ||
      (connections || [])[0] ||
      null;

    const meta = (connection?.metadata as Record<string, unknown>) || {};
    const moEnabled = meta.mo_enabled !== false;

    const { data: products, count: productCount } = await admin
      .from('products')
      .select('id, price, stock_level, status', { count: 'exact' })
      .eq('business_id', businessId)
      .eq('status', 'active');

    const activeProducts = products || [];
    const totalActive = productCount ?? activeProducts.length;
    const missingPrice = activeProducts.filter(
      (p: any) => p.price === null || p.price === undefined
    ).length;

    const { data: convos } = await admin
      .from('whatsapp_conversations')
      .select('id, customer_phone, agent_status, last_message_at, metadata, created_at')
      .eq('business_id', businessId)
      .order('last_message_at', { ascending: false })
      .limit(50);

    const list = convos || [];
    const needsYou = list.filter((c: any) => c.agent_status === 'human_active').length;
    const moHandling = list.filter((c: any) => c.agent_status === 'ai_active').length;

    const recentIds = list.slice(0, 8).map((c: any) => c.id);
    const lastMessages: Record<string, { text: string; at: string; direction: string }> = {};
    if (recentIds.length) {
      const { data: msgs } = await admin
        .from('whatsapp_messages')
        .select('conversation_id, message_text, created_at, direction')
        .eq('business_id', businessId)
        .in('conversation_id', recentIds)
        .order('created_at', { ascending: false })
        .limit(40);

      for (const m of msgs || []) {
        const cid = (m as any).conversation_id;
        if (!lastMessages[cid] && (m as any).message_text) {
          lastMessages[cid] = {
            text: String((m as any).message_text).slice(0, 120),
            at: (m as any).created_at,
            direction: (m as any).direction,
          };
        }
      }
    }

    const recentConversations = list.slice(0, 8).map((c: any) => ({
      id: c.id,
      customerPhone: c.customer_phone,
      customerName: (c.metadata as any)?.contactName || null,
      agentStatus: c.agent_status,
      lastMessageAt: c.last_message_at || c.created_at,
      lastMessage: lastMessages[c.id]?.text || null,
    }));

    const { count: messageCount } = await admin
      .from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const { count: inboundCount } = await admin
      .from('whatsapp_messages')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('direction', 'inbound');

    const metrics = {
      salesGenerated: null as number | null,
      ordersCount: null as number | null,
      customersHandled: list.length,
      conversationsTotal: list.length,
      messagesTotal: messageCount ?? 0,
      inboundMessages: inboundCount ?? 0,
      needsYou,
      moHandling,
      conversionRate: null as number | null,
    };

    const connected = Boolean(connection && connection.status === 'active');
    const pending = Boolean(connection && connection.status === 'pending');
    const failed = Boolean(connection && connection.status === 'failed');

    let health: 'healthy' | 'needs_attention' | 'not_connected' = 'not_connected';
    if (connected && moEnabled) health = missingPrice > 0 ? 'needs_attention' : 'healthy';
    else if (connected && !moEnabled) health = 'needs_attention';
    else if (pending || failed) health = 'needs_attention';

    return NextResponse.json({
      connection: connection
        ? {
            id: connection.id,
            sender: connection.whatsapp_sender,
            status: connection.status,
            provider: connection.provider,
            moEnabled,
            settings: {
              personality: (meta.personality as string) || 'friendly',
              maxDiscountPct: Number(meta.max_discount_pct) || 0,
              allowNegotiate: meta.allow_negotiate === true,
              humanHandoff: meta.human_handoff !== false,
              language: (meta.language as string) || 'en',
            },
          }
        : null,
      productReadiness: {
        activeProducts: totalActive,
        missingPrice,
        inventoryConnected: true,
      },
      metrics,
      recentConversations,
      health,
      credits: creditSnapshot
        ? {
            available: creditSnapshot.availableCredits,
            status: creditSnapshot.status,
            trialRemaining: creditSnapshot.trialCreditsRemaining,
          }
        : null,
    });
  } catch (e: any) {
    console.error('[mo-sales/overview]', e?.message);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}

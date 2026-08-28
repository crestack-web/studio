import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../_auth';
import { listLedger, maskPhone } from '@/lib/services/whatsapp/mo-credits';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const businessId = url.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 40)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const since = url.searchParams.get('since') || undefined;
    const until = url.searchParams.get('until') || undefined;

    const rows = await listLedger({ businessId, limit, offset, since, until });

    const convoIds = Array.from(
      new Set(rows.map((r) => r.conversationId).filter(Boolean) as string[])
    );
    const phoneByConvo: Record<string, string> = {};
    if (convoIds.length) {
      const sb = getSupabaseAdmin();
      const { data } = await sb
        .from('whatsapp_conversations')
        .select('id, customer_phone')
        .eq('business_id', businessId)
        .in('id', convoIds);
      for (const c of data || []) {
        phoneByConvo[(c as any).id] = maskPhone(String((c as any).customer_phone || ''));
      }
    }

    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        balanceAfter: r.balanceAfter,
        description: r.description,
        createdAt: r.createdAt,
        customerMasked: r.conversationId ? phoneByConvo[r.conversationId] || null : null,
        conversationId: r.conversationId,
      })),
      limit,
      offset,
    });
  } catch (e: any) {
    console.error('[mo-sales/credits/usage]', e?.message);
    return NextResponse.json({ error: 'Failed to load usage' }, { status: 500 });
  }
}

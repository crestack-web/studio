import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { getMoSellAdmin, isMoSellAdminConfigured } from '@/lib/mo-sell-admin-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MO_SELL_APP_URL = process.env.MO_SELL_APP_URL?.replace(/\/$/, '') || 'https://mo-sell.store';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: biz, error: bizErr } = await admin
    .from('businesses')
    .select(
      'id, name, business_name, email, owner_id, mo_sell_business_id, mo_sell_store_url, mo_sell_linked_at'
    )
    .eq('id', businessId)
    .maybeSingle();

  if (bizErr || !biz) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const connectUrl = `${MO_SELL_APP_URL}/dashboard/settings?connectFromBusmo=1&busmoBusinessId=${encodeURIComponent(businessId)}&edition=hospitality`;
  const moSellId = biz.mo_sell_business_id as string | null;

  if (!moSellId) {
    return NextResponse.json({
      linked: false,
      connectUrl,
      busmoBusinessId: businessId,
      moSellStoreUrl: null,
      store: null,
      metrics: null,
    });
  }

  if (!isMoSellAdminConfigured()) {
    return NextResponse.json({
      linked: true,
      connectUrl,
      busmoBusinessId: businessId,
      moSellBusinessId: moSellId,
      moSellStoreUrl: biz.mo_sell_store_url || MO_SELL_APP_URL,
      linkedAt: biz.mo_sell_linked_at,
      configured: false,
      message: 'Mo-sell is linked. Configure MO_SELL admin env to load live store metrics.',
      store: null,
      metrics: null,
    });
  }

  try {
    const mo = getMoSellAdmin();
    // Best-effort store profile — table names may vary; keep resilient
    let store: Record<string, unknown> | null = null;
    let metrics: Record<string, number> | null = null;

    const { data: storeRow } = await mo
      .from('businesses')
      .select('id, name, slug, store_mode, billing_model, commission_rate')
      .eq('id', moSellId)
      .maybeSingle();

    if (storeRow) {
      const slug = (storeRow as any).slug as string | null;
      store = {
        name: (storeRow as any).name,
        slug,
        mode: (storeRow as any).store_mode,
        billingModel: (storeRow as any).billing_model,
        commissionRate: Number((storeRow as any).commission_rate || 0),
        publicStoreUrl: slug ? `${MO_SELL_APP_URL}/store/${slug}` : biz.mo_sell_store_url,
        publicBioUrl: slug ? `${MO_SELL_APP_URL}/${slug}` : null,
      };
    }

    // Optional product/order counts
    try {
      const { count: productCount } = await mo
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', moSellId);
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: orders } = await mo
        .from('orders')
        .select('id, total, created_at')
        .eq('business_id', moSellId)
        .gte('created_at', since.toISOString())
        .limit(500);
      const list = orders || [];
      metrics = {
        productCount: productCount || 0,
        orders30d: list.length,
        gmv30d: list.reduce((s, o: any) => s + Number(o.total || 0), 0),
      };
    } catch {
      metrics = null;
    }

    return NextResponse.json({
      linked: true,
      configured: true,
      connectUrl,
      busmoBusinessId: businessId,
      moSellBusinessId: moSellId,
      moSellStoreUrl:
        (store as any)?.publicStoreUrl || biz.mo_sell_store_url || MO_SELL_APP_URL,
      linkedAt: biz.mo_sell_linked_at,
      store,
      metrics,
    });
  } catch (e: any) {
    return NextResponse.json({
      linked: true,
      connectUrl,
      moSellBusinessId: moSellId,
      moSellStoreUrl: biz.mo_sell_store_url || MO_SELL_APP_URL,
      message: e?.message || 'Linked, but store details unavailable',
      store: null,
      metrics: null,
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getMoSellAdmin, isMoSellAdminConfigured } from '@/lib/mo-sell-admin-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const busmo = getSupabaseAdmin();

    const { data: linkedBiz, error: linkErr } = await busmo
      .from('businesses')
      .select('id, name, business_name, mo_sell_business_id, mo_sell_store_url, mo_sell_linked_at, email, category, updated_at')
      .not('mo_sell_business_id', 'is', null)
      .order('mo_sell_linked_at', { ascending: false })
      .limit(200);

    if (linkErr) {
      console.error('[admin/mo-sell/activity] busmo links', linkErr.message);
    }

    const links = (linkedBiz || []).map((b: any) => ({
      busmoBusinessId: b.id as string,
      busmoName: (b.name || b.business_name || 'Business') as string,
      moSellBusinessId: b.mo_sell_business_id as string,
      moSellStoreUrl: (b.mo_sell_store_url || null) as string | null,
      linkedAt: (b.mo_sell_linked_at || null) as string | null,
      email: (b.email || null) as string | null,
      category: (b.category || null) as string | null,
    }));

    if (!isMoSellAdminConfigured()) {
      return NextResponse.json({
        configured: false,
        message:
          'Set MO_SELL_SUPABASE_URL and MO_SELL_SUPABASE_SERVICE_ROLE_KEY on Busmo to load live Mo-sell activity.',
        generatedAt: new Date().toISOString(),
        metrics: {
          totalStores: 0,
          totalOrders: 0,
          orders7d: 0,
          orders30d: 0,
          gmv30d: 0,
          totalProducts: 0,
          totalUsers: 0,
          linkedToBusmo: links.length,
        },
        links,
        stores: [],
        recentOrders: [],
        topStores: [],
        recentUsers: [],
      });
    }

    const ms = getMoSellAdmin();
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      storesRes,
      ordersCountRes,
      orders7Res,
      orders30Res,
      productsRes,
      recentOrdersRes,
      recentStoresRes,
    ] = await Promise.all([
      ms.from('businesses').select('id', { count: 'exact', head: true }),
      ms.from('storeOrders').select('id', { count: 'exact', head: true }),
      ms.from('storeOrders').select('id', { count: 'exact', head: true }).gte('createdAt', since7),
      ms.from('storeOrders').select('id, total, businessId, createdAt').gte('createdAt', since30).limit(5000),
      ms.from('storeProducts').select('id', { count: 'exact', head: true }),
      ms
        .from('storeOrders')
        .select(
          'id, orderNumber, businessId, customerName, customerEmail, total, status, paymentStatus, paystackReference, createdAt'
        )
        .order('createdAt', { ascending: false })
        .limit(80),
      ms
        .from('businesses')
        .select('id, storeName, businessName, storeSlug, contactEmail, email, plan, status, createdAt, updatedAt, busmoBusinessId')
        .order('updatedAt', { ascending: false })
        .limit(100),
    ]);

    let totalUsers = 0;
    let recentUsers: Array<{
      id: string;
      email: string | null;
      createdAt: string;
      lastSignInAt: string | null;
    }> = [];
    try {
      const { data: authData, error: authErr } = await ms.auth.admin.listUsers({ page: 1, perPage: 100 });
      if (!authErr && authData?.users) {
        totalUsers = authData.users.length;
        recentUsers = authData.users
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 40)
          .map((u) => ({
            id: u.id,
            email: u.email ?? null,
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
          }));
        if (authData.users.length === 100) {
          totalUsers = 100;
        }
      }
    } catch (e) {
      console.error('[admin/mo-sell/activity] listUsers', e);
    }

    const orders30 = orders30Res.data || [];
    const gmv30d = orders30.reduce((s: number, o: any) => s + Number(o.total || 0), 0);

    const byBiz: Record<string, { orders: number; gmv: number }> = {};
    for (const o of orders30 as any[]) {
      const id = o.businessId as string;
      if (!id) continue;
      if (!byBiz[id]) byBiz[id] = { orders: 0, gmv: 0 };
      byBiz[id].orders += 1;
      byBiz[id].gmv += Number(o.total || 0);
    }

    const storeRows = recentStoresRes.data || [];
    const storeNameById: Record<string, string> = {};
    for (const s of storeRows as any[]) {
      storeNameById[s.id] = s.storeName || s.businessName || s.storeSlug || s.id;
    }

    const topStores = Object.entries(byBiz)
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, 20)
      .map(([id, v]) => ({
        businessId: id,
        name: storeNameById[id] || id,
        orders30d: v.orders,
        gmv30d: Math.round(v.gmv * 100) / 100,
      }));

    const missingIds = topStores.filter((t) => t.name === t.businessId).map((t) => t.businessId);
    if (missingIds.length) {
      const { data: extra } = await ms
        .from('businesses')
        .select('id, storeName, businessName, storeSlug')
        .in('id', missingIds);
      for (const s of extra || []) {
        const name = (s as any).storeName || (s as any).businessName || (s as any).storeSlug || (s as any).id;
        storeNameById[(s as any).id] = name;
      }
      for (const t of topStores) {
        if (storeNameById[t.businessId]) t.name = storeNameById[t.businessId];
      }
    }

    const recentOrders = (recentOrdersRes.data || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      businessId: o.businessId,
      storeName: storeNameById[o.businessId] || o.businessId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      total: Number(o.total || 0),
      status: o.status,
      paymentStatus: o.paymentStatus,
      reference: o.paystackReference,
      createdAt: o.createdAt,
    }));

    const stores = (storeRows as any[]).map((s) => ({
      id: s.id,
      name: s.storeName || s.businessName || s.storeSlug || 'Store',
      slug: s.storeSlug || null,
      email: s.contactEmail || s.email || null,
      plan: s.plan || null,
      status: s.status || null,
      busmoBusinessId: s.busmoBusinessId || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({
      configured: true,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalStores: storesRes.count ?? stores.length,
        totalOrders: ordersCountRes.count ?? 0,
        orders7d: orders7Res.count ?? 0,
        orders30d: orders30.length,
        gmv30d: Math.round(gmv30d * 100) / 100,
        totalProducts: productsRes.count ?? 0,
        totalUsers: totalUsers,
        linkedToBusmo: links.length,
      },
      links,
      stores,
      recentOrders,
      topStores,
      recentUsers,
    });
  } catch (e: any) {
    console.error('[admin/mo-sell/activity]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to load Mo-sell activity' }, { status: 500 });
  }
}

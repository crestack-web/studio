import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getMoSellAdmin, isMoSellAdminConfigured } from '@/lib/mo-sell-admin-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

function emptyPayload(links: unknown[], message?: string) {
  return {
    configured: false,
    message:
      message ||
      'Set MO_SELL_SUPABASE_URL and MO_SELL_SUPABASE_SERVICE_ROLE_KEY on Busmo to load live Mo-sell activity.',
    generatedAt: new Date().toISOString(),
    metrics: {
      totalStores: 0,
      totalOrders: 0,
      orders7d: 0,
      orders30d: 0,
      gmv30d: 0,
      gmvAll: 0,
      totalProducts: 0,
      totalUsers: 0,
      linkedToBusmo: links.length,
      commission30d: 0,
      commissionAll: 0,
      netToMerchants30d: 0,
      availableEarnings: 0,
      pendingPayouts: 0,
      paidOut: 0,
      linkBioStores: 0,
      storefrontStores: 0,
      bothModeStores: 0,
      paygStores: 0,
      monthlyStores: 0,
      newStores7d: 0,
      newStores30d: 0,
    },
    links,
    stores: [],
    recentOrders: [],
    topStores: [],
    recentUsers: [],
    earnings: [],
    payouts: [],
    bioPages: [],
    billingBreakdown: {},
    modeBreakdown: {},
    monthlyRollup: [],
    productTypeBreakdown: {},
  };
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
      .select(
        'id, name, business_name, mo_sell_business_id, mo_sell_store_url, mo_sell_linked_at, email, category, updated_at'
      )
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
      return NextResponse.json(emptyPayload(links));
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
      earningsRes,
      payoutsRes,
      monthlyRevRes,
      productsSampleRes,
    ] = await Promise.all([
      ms.from('businesses').select('id', { count: 'exact', head: true }),
      ms.from('storeOrders').select('id', { count: 'exact', head: true }),
      ms.from('storeOrders').select('id', { count: 'exact', head: true }).gte('createdAt', since7),
      ms
        .from('storeOrders')
        .select('id, total, businessId, createdAt, commissionAmount, netAmount, commissionRate')
        .gte('createdAt', since30)
        .limit(5000),
      ms.from('storeProducts').select('id', { count: 'exact', head: true }),
      ms
        .from('storeOrders')
        .select(
          'id, orderNumber, businessId, customerName, customerEmail, total, status, paymentStatus, paystackReference, commissionAmount, commissionRate, netAmount, createdAt'
        )
        .order('createdAt', { ascending: false })
        .limit(100),
      ms
        .from('businesses')
        .select(
          'id, storeName, businessName, storeSlug, contactEmail, email, plan, status, createdAt, updatedAt, busmoBusinessId, mode, linkBio, linkBioTheme, billingModel, billingPlan, billingStatus, commissionRate, managedPayments'
        )
        .order('updatedAt', { ascending: false })
        .limit(200),
      ms
        .from('storeEarnings')
        .select(
          'id, businessId, orderId, orderNumber, customerName, grossAmount, commissionRate, commissionAmount, netAmount, currency, status, createdAt'
        )
        .order('createdAt', { ascending: false })
        .limit(150),
      ms
        .from('payoutRequests')
        .select(
          'id, businessId, amount, currency, bankName, accountName, status, createdAt, processedAt, sentAt'
        )
        .order('createdAt', { ascending: false })
        .limit(80),
      ms
        .from('businessMonthlyRevenue')
        .select('businessId, month, revenue, commission, orders, updatedAt')
        .order('month', { ascending: false })
        .limit(120),
      ms.from('storeProducts').select('id, productType, businessId, status').limit(3000),
    ]);

    let totalUsers = 0;
    let recentUsers: Array<{
      id: string;
      email: string | null;
      createdAt: string;
      lastSignInAt: string | null;
    }> = [];
    try {
      const { data: authData, error: authErr } = await ms.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });
      if (!authErr && authData?.users) {
        totalUsers = authData.users.length;
        recentUsers = authData.users
          .slice()
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 50)
          .map((u) => ({
            id: u.id,
            email: u.email ?? null,
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
          }));
      }
    } catch (e) {
      console.error('[admin/mo-sell/activity] listUsers', e);
    }

    const orders30 = (orders30Res.data || []) as any[];
    const gmv30d = sum(orders30.map((o) => Number(o.total || 0)));
    const commission30d = sum(orders30.map((o) => Number(o.commissionAmount || 0)));
    const netToMerchants30d = sum(orders30.map((o) => Number(o.netAmount || o.total || 0)));

    const storeRows = (recentStoresRes.data || []) as any[];
    const storeNameById: Record<string, string> = {};
    for (const s of storeRows) {
      storeNameById[s.id] = s.storeName || s.businessName || s.storeSlug || s.id;
    }

    const modeBreakdown: Record<string, number> = {};
    const billingBreakdown: Record<string, number> = {};
    let linkBioStores = 0;
    let storefrontStores = 0;
    let bothModeStores = 0;
    let paygStores = 0;
    let monthlyStores = 0;
    let newStores7d = 0;
    let newStores30d = 0;

    for (const s of storeRows) {
      const mode = String(s.mode || 'unknown').toLowerCase();
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
      if (mode === 'link-bio' || mode === 'link_bio' || mode === 'bio') linkBioStores += 1;
      else if (mode === 'both') bothModeStores += 1;
      else if (mode === 'store' || mode === 'storefront') storefrontStores += 1;

      const bm = String(s.billingModel || s.plan || 'unknown').toLowerCase();
      billingBreakdown[bm] = (billingBreakdown[bm] || 0) + 1;
      if (bm.includes('pay') || bm === 'payg' || bm === 'pay_as_you_go') paygStores += 1;
      if (bm === 'monthly' || bm === 'standard' || bm === 'pro' || bm === 'enterprise') {
        monthlyStores += 1;
      }

      const created = s.createdAt ? new Date(s.createdAt).getTime() : 0;
      if (created >= Date.now() - 7 * 86400000) newStores7d += 1;
      if (created >= Date.now() - 30 * 86400000) newStores30d += 1;
    }

    const byBiz: Record<string, { orders: number; gmv: number; commission: number }> = {};
    for (const o of orders30) {
      const id = o.businessId as string;
      if (!id) continue;
      if (!byBiz[id]) byBiz[id] = { orders: 0, gmv: 0, commission: 0 };
      byBiz[id].orders += 1;
      byBiz[id].gmv += Number(o.total || 0);
      byBiz[id].commission += Number(o.commissionAmount || 0);
    }

    const topStores = Object.entries(byBiz)
      .sort((a, b) => b[1].gmv - a[1].gmv)
      .slice(0, 25)
      .map(([id, v]) => ({
        businessId: id,
        name: storeNameById[id] || id,
        orders30d: v.orders,
        gmv30d: Math.round(v.gmv * 100) / 100,
        commission30d: Math.round(v.commission * 100) / 100,
      }));

    const missingIds = topStores.filter((t) => t.name === t.businessId).map((t) => t.businessId);
    if (missingIds.length) {
      const { data: extra } = await ms
        .from('businesses')
        .select('id, storeName, businessName, storeSlug')
        .in('id', missingIds);
      for (const s of extra || []) {
        storeNameById[(s as any).id] =
          (s as any).storeName || (s as any).businessName || (s as any).storeSlug || (s as any).id;
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
      commissionAmount: Number(o.commissionAmount || 0),
      commissionRate: Number(o.commissionRate || 0),
      netAmount: Number(o.netAmount || 0),
      status: o.status,
      paymentStatus: o.paymentStatus,
      reference: o.paystackReference,
      createdAt: o.createdAt,
    }));

    const earningsRows = (earningsRes.data || []) as any[];
    let availableEarnings = 0;
    let commissionAllFromEarnings = 0;
    let gmvAllFromEarnings = 0;
    for (const e of earningsRows) {
      const status = String(e.status || '').toLowerCase();
      if (status === 'available' || status === 'pending') {
        availableEarnings += Number(e.netAmount || 0);
      }
      commissionAllFromEarnings += Number(e.commissionAmount || 0);
      gmvAllFromEarnings += Number(e.grossAmount || 0);
    }

    const earnings = earningsRows.slice(0, 80).map((e) => ({
      id: e.id,
      businessId: e.businessId,
      storeName: storeNameById[e.businessId] || e.businessId,
      orderNumber: e.orderNumber,
      customerName: e.customerName,
      grossAmount: Number(e.grossAmount || 0),
      commissionRate: Number(e.commissionRate || 0),
      commissionAmount: Number(e.commissionAmount || 0),
      netAmount: Number(e.netAmount || 0),
      currency: e.currency || 'NGN',
      status: e.status,
      createdAt: e.createdAt,
    }));

    const payoutRows = (payoutsRes.data || []) as any[];
    let pendingPayouts = 0;
    let paidOut = 0;
    for (const p of payoutRows) {
      const st = String(p.status || '').toLowerCase();
      const amt = Number(p.amount || 0);
      if (st === 'requested' || st === 'processing' || st === 'pending' || st === 'sent') {
        pendingPayouts += amt;
      }
      if (st === 'completed' || st === 'paid' || st === 'paid_out') {
        paidOut += amt;
      }
    }

    const payouts = payoutRows.map((p) => ({
      id: p.id,
      businessId: p.businessId,
      storeName: storeNameById[p.businessId] || p.businessId,
      amount: Number(p.amount || 0),
      currency: p.currency || 'NGN',
      bankName: p.bankName,
      accountName: p.accountName,
      status: p.status,
      createdAt: p.createdAt,
      processedAt: p.processedAt || p.sentAt || null,
    }));

    const bioPages = storeRows
      .filter((s) => {
        const mode = String(s.mode || '').toLowerCase();
        const hasBio = s.linkBio && (typeof s.linkBio === 'object' || typeof s.linkBio === 'string');
        return mode === 'link-bio' || mode === 'link_bio' || mode === 'both' || mode === 'bio' || hasBio;
      })
      .map((s) => {
        let bio: any = s.linkBio;
        if (typeof bio === 'string') {
          try {
            bio = JSON.parse(bio);
          } catch {
            bio = {};
          }
        }
        bio = bio || {};
        const socials = Array.isArray(bio.socials) ? bio.socials.length : 0;
        const customLinks = Array.isArray(bio.customLinks) ? bio.customLinks.length : 0;
        return {
          id: s.id,
          name: s.storeName || s.businessName || bio.name || s.storeSlug || 'Bio page',
          slug: s.storeSlug || null,
          bioName: bio.name || null,
          bioText: bio.bio ? String(bio.bio).slice(0, 120) : null,
          socialsCount: socials,
          customLinksCount: customLinks,
          theme: s.linkBioTheme || bio.theme || null,
          mode: s.mode || null,
          email: s.contactEmail || s.email || null,
          publicUrl: s.storeSlug ? `https://mo-sell.store/${s.storeSlug}` : null,
          updatedAt: s.updatedAt,
        };
      });

    const productTypeBreakdown: Record<string, number> = {};
    for (const p of (productsSampleRes.data || []) as any[]) {
      const t = String(p.productType || 'unknown').toLowerCase();
      productTypeBreakdown[t] = (productTypeBreakdown[t] || 0) + 1;
    }

    const monthMap: Record<string, { revenue: number; commission: number; orders: number }> = {};
    for (const r of (monthlyRevRes.data || []) as any[]) {
      const month = r.month || 'unknown';
      if (!monthMap[month]) monthMap[month] = { revenue: 0, commission: 0, orders: 0 };
      monthMap[month].revenue += Number(r.revenue || 0);
      monthMap[month].commission += Number(r.commission || 0);
      monthMap[month].orders += Number(r.orders || 0);
    }
    const monthlyRollup = Object.entries(monthMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
      .map(([month, v]) => ({
        month,
        revenue: Math.round(v.revenue * 100) / 100,
        commission: Math.round(v.commission * 100) / 100,
        orders: v.orders,
      }));

    const stores = storeRows.map((s) => ({
      id: s.id,
      name: s.storeName || s.businessName || s.storeSlug || 'Store',
      slug: s.storeSlug || null,
      email: s.contactEmail || s.email || null,
      plan: s.plan || s.billingPlan || null,
      billingModel: s.billingModel || null,
      billingStatus: s.billingStatus || null,
      mode: s.mode || null,
      status: s.status || null,
      busmoBusinessId: s.busmoBusinessId || null,
      commissionRate: Number(s.commissionRate || 0),
      managedPayments: Boolean(s.managedPayments),
      hasLinkBio: Boolean(s.linkBio),
      publicStoreUrl: s.storeSlug ? `https://mo-sell.store/store/${s.storeSlug}` : null,
      publicBioUrl: s.storeSlug ? `https://mo-sell.store/${s.storeSlug}` : null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    const commissionAll =
      commissionAllFromEarnings > 0
        ? commissionAllFromEarnings
        : commission30d + sum(monthlyRollup.map((m) => m.commission));

    return NextResponse.json({
      configured: true,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalStores: storesRes.count ?? stores.length,
        totalOrders: ordersCountRes.count ?? 0,
        orders7d: orders7Res.count ?? 0,
        orders30d: orders30.length,
        gmv30d: Math.round(gmv30d * 100) / 100,
        gmvAll: Math.round((gmvAllFromEarnings || gmv30d) * 100) / 100,
        totalProducts: productsRes.count ?? 0,
        totalUsers,
        linkedToBusmo: links.length,
        commission30d: Math.round(commission30d * 100) / 100,
        commissionAll: Math.round(commissionAll * 100) / 100,
        netToMerchants30d: Math.round(netToMerchants30d * 100) / 100,
        availableEarnings: Math.round(availableEarnings * 100) / 100,
        pendingPayouts: Math.round(pendingPayouts * 100) / 100,
        paidOut: Math.round(paidOut * 100) / 100,
        linkBioStores,
        storefrontStores,
        bothModeStores,
        paygStores,
        monthlyStores,
        newStores7d,
        newStores30d,
      },
      links,
      stores,
      recentOrders,
      topStores,
      recentUsers,
      earnings,
      payouts,
      bioPages,
      billingBreakdown,
      modeBreakdown,
      monthlyRollup,
      productTypeBreakdown,
    });
  } catch (e: any) {
    console.error('[admin/mo-sell/activity]', e?.message || e);
    return NextResponse.json(
      { error: e?.message || 'Failed to load Mo-sell activity' },
      { status: 500 }
    );
  }
}

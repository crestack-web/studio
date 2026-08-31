import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMoSellAdmin, isMoSellAdminConfigured } from '@/lib/mo-sell-admin-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MO_SELL_APP_URL = process.env.MO_SELL_APP_URL?.replace(/\/$/, '') || 'https://mo-sell.store';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
  } = await client.auth.getUser();
  return user;
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const businessId = req.nextUrl.searchParams.get('businessId') || '';
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const sb = getServiceClient();
    if (!sb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const { data: biz, error: bizErr } = await sb
      .from('businesses')
      .select(
        'id, name, business_name, email, owner_id, mo_sell_business_id, mo_sell_store_url, mo_sell_linked_at'
      )
      .eq('id', businessId)
      .maybeSingle();

    if (bizErr || !biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const connectUrl = `${MO_SELL_APP_URL}/dashboard/settings?connectFromBusmo=1&busmoBusinessId=${encodeURIComponent(businessId)}`;
    const moSellId = biz.mo_sell_business_id as string | null;

    if (!moSellId) {
      return NextResponse.json({
        linked: false,
        connectUrl,
        busmoBusinessId: businessId,
        busmoName: biz.business_name || biz.name || 'Business',
        metrics: null,
        store: null,
        recentOrders: [],
        earnings: [],
        message: 'Connect Mo-sell to track online store activity here.',
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
        message: 'Mo-sell live data is not configured on this server yet.',
        metrics: null,
        store: null,
        recentOrders: [],
        earnings: [],
      });
    }

    const ms = getMoSellAdmin();
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [storeRes, ordersRes, orders30Res, earningsRes, productsRes] = await Promise.all([
      ms
        .from('businesses')
        .select(
          'id, storeName, businessName, storeSlug, mode, billingModel, billingPlan, commissionRate, status, updatedAt'
        )
        .eq('id', moSellId)
        .maybeSingle(),
      ms
        .from('storeOrders')
        .select(
          'id, orderNumber, customerName, customerEmail, total, status, paymentStatus, commissionAmount, netAmount, createdAt'
        )
        .eq('businessId', moSellId)
        .order('createdAt', { ascending: false })
        .limit(50),
      ms
        .from('storeOrders')
        .select('id, total, commissionAmount, netAmount, createdAt')
        .eq('businessId', moSellId)
        .gte('createdAt', since30)
        .limit(2000),
      ms
        .from('storeEarnings')
        .select(
          'id, orderNumber, grossAmount, commissionAmount, netAmount, status, currency, createdAt'
        )
        .eq('businessId', moSellId)
        .order('createdAt', { ascending: false })
        .limit(40),
      ms.from('storeProducts').select('id', { count: 'exact', head: true }).eq('businessId', moSellId),
    ]);

    const orders30 = (orders30Res.data || []) as any[];
    const gmv30d = sum(orders30.map((o) => Number(o.total || 0)));
    const commission30d = sum(orders30.map((o) => Number(o.commissionAmount || 0)));
    const net30d = sum(orders30.map((o) => Number(o.netAmount || o.total || 0)));

    const store = storeRes.data as any;
    const slug = store?.storeSlug || null;

    return NextResponse.json({
      linked: true,
      configured: true,
      connectUrl,
      busmoBusinessId: businessId,
      moSellBusinessId: moSellId,
      moSellStoreUrl:
        biz.mo_sell_store_url || (slug ? `${MO_SELL_APP_URL}/store/${slug}` : MO_SELL_APP_URL),
      linkedAt: biz.mo_sell_linked_at,
      store: store
        ? {
            name: store.storeName || store.businessName || slug || 'Store',
            slug,
            mode: store.mode || null,
            billingModel: store.billingModel || store.billingPlan || null,
            commissionRate: Number(store.commissionRate || 0),
            status: store.status || null,
            publicStoreUrl: slug ? `${MO_SELL_APP_URL}/store/${slug}` : null,
            publicBioUrl: slug ? `${MO_SELL_APP_URL}/${slug}` : null,
            updatedAt: store.updatedAt,
          }
        : null,
      metrics: {
        orders30d: orders30.length,
        gmv30d: Math.round(gmv30d * 100) / 100,
        commission30d: Math.round(commission30d * 100) / 100,
        net30d: Math.round(net30d * 100) / 100,
        productCount: productsRes.count ?? 0,
        orderCountAll: (ordersRes.data || []).length,
      },
      recentOrders: (ordersRes.data || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        total: Number(o.total || 0),
        commissionAmount: Number(o.commissionAmount || 0),
        netAmount: Number(o.netAmount || 0),
        status: o.paymentStatus || o.status,
        createdAt: o.createdAt,
      })),
      earnings: (earningsRes.data || []).map((e: any) => ({
        id: e.id,
        orderNumber: e.orderNumber,
        grossAmount: Number(e.grossAmount || 0),
        commissionAmount: Number(e.commissionAmount || 0),
        netAmount: Number(e.netAmount || 0),
        status: e.status,
        currency: e.currency || 'NGN',
        createdAt: e.createdAt,
      })),
    });
  } catch (e: any) {
    console.error('[owner/mo-sell/activity]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to load' }, { status: 500 });
  }
}

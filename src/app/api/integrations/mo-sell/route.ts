import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MO_SELL_APP_URL = process.env.MO_SELL_APP_URL?.replace(/\/$/, '') || 'https://mo-sell.store';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return { error: NextResponse.json({ error: 'Server not configured' }, { status: 503 }) };
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  return { user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if ('error' in auth && auth.error) return auth.error;
    const businessId = req.nextUrl.searchParams.get('businessId') || '';
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    const sb = getServiceClient();
    if (!sb) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    const { data: biz, error } = await sb
      .from('businesses')
      .select('id, name, business_name, mo_sell_business_id, mo_sell_store_url, mo_sell_linked_at')
      .eq('id', businessId)
      .maybeSingle();
    if (error || !biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    const connectUrl =
      `${MO_SELL_APP_URL}/dashboard/settings?connectFromBusmo=1&busmoBusinessId=${encodeURIComponent(businessId)}`;
    return NextResponse.json({
      businessId,
      businessName: biz.business_name || biz.name,
      linked: {
        moSellBusinessId: biz.mo_sell_business_id || null,
        moSellStoreUrl: biz.mo_sell_store_url || null,
        moSellLinkedAt: biz.mo_sell_linked_at || null,
      },
      connectUrl,
      moSellAppUrl: MO_SELL_APP_URL,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if ('error' in auth && auth.error) return auth.error;
    const sb = getServiceClient();
    if (!sb) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const businessId = String(body.businessId || '');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (action === 'unlink') {
      const { error } = await sb.from('businesses').update({
        mo_sell_business_id: null, mo_sell_store_url: null, mo_sell_linked_at: null,
      }).eq('id', businessId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (action === 'mark-linked') {
      const { error } = await sb.from('businesses').update({
        mo_sell_business_id: body.moSellBusinessId || null,
        mo_sell_store_url: body.moSellStoreUrl || MO_SELL_APP_URL,
        mo_sell_linked_at: new Date().toISOString(),
      }).eq('id', businessId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { getMoSellAdmin, isMoSellAdminConfigured } from '@/lib/mo-sell-admin-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Pull recent Mo-sell orders into hospitality_bookings (idempotent). */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  const businessId = session.businessId;
  if (!businessId) return NextResponse.json({ error: 'No business' }, { status: 400 });

  if (!isMoSellAdminConfigured()) {
    return NextResponse.json({
      ok: false,
      error: 'Mo-sell admin not configured on server',
      imported: 0,
    });
  }

  const admin = getSupabaseAdmin();
  const { data: biz } = await admin
    .from('businesses')
    .select('mo_sell_business_id')
    .eq('id', businessId)
    .maybeSingle();
  const moSellId = biz?.mo_sell_business_id as string | null;
  if (!moSellId) {
    return NextResponse.json({ ok: false, error: 'Mo-sell not linked', imported: 0 });
  }

  const mo = getMoSellAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 60);

  let orders: any[] = [];
  try {
    const { data, error } = await mo
      .from('orders')
      .select('*')
      .eq('business_id', moSellId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    orders = data || [];
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || 'Could not read Mo-sell orders',
      imported: 0,
    });
  }

  let imported = 0;
  let skipped = 0;

  for (const o of orders) {
    const orderId = String(o.id || '');
    if (!orderId) continue;

    const { data: existing } = await admin
      .from('hospitality_bookings')
      .select('id')
      .eq('business_id', businessId)
      .ilike('notes', `%mo-sell:${orderId}%`)
      .limit(1);
    if (existing?.length) {
      skipped += 1;
      continue;
    }

    const guest_name = String(
      o.customer_name || o.customerName || o.guest_name || 'Website guest'
    );
    const amount = Number(o.total || o.amount || o.grand_total || 0);
    const checkIn = new Date(o.created_at || Date.now()).toISOString().slice(0, 10);
    const out = new Date(checkIn + 'T12:00:00');
    out.setDate(out.getDate() + 1);
    const checkOut = out.toISOString().slice(0, 10);

    const { error } = await admin.from('hospitality_bookings').insert({
      business_id: businessId,
      guest_name,
      guest_phone: o.customer_phone || o.phone || null,
      guest_email: o.customer_email || o.email || null,
      status: 'confirmed',
      check_in_date: checkIn,
      check_out_date: checkOut,
      amount,
      nights: 1,
      rate_per_night: amount,
      deposit_amount: amount,
      balance_amount: 0,
      source: 'website',
      notes: `mo-sell:${orderId}`,
      special_requests: o.notes || null,
    });
    if (!error) imported += 1;
  }

  return NextResponse.json({ ok: true, imported, skipped, scanned: orders.length });
}

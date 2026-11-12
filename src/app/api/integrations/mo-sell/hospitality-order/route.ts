import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Webhook / server callback from Mo-sell when an order is placed for a
 * Busmo-linked hospitality business. Creates a hospitality_bookings row.
 *
 * Auth: Authorization Bearer MO_SELL_WEBHOOK_SECRET or x-mo-sell-secret header.
 */
export async function POST(req: NextRequest) {
  const secret =
    process.env.MO_SELL_WEBHOOK_SECRET?.trim() ||
    process.env.MO_SELL_HANDOFF_SECRET?.trim() ||
    '';
  const hdr =
    req.headers.get('x-mo-sell-secret') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || hdr !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const businessId = String(body.busmoBusinessId || body.businessId || '').trim();
  const orderId = String(body.orderId || body.id || '').trim();
  if (!businessId) {
    return NextResponse.json({ error: 'busmoBusinessId required' }, { status: 400 });
  }

  const guest_name = String(
    body.customerName || body.guestName || body.customer?.name || 'Website guest'
  ).trim();
  const guest_phone = body.customerPhone || body.guestPhone || body.customer?.phone || null;
  const guest_email = body.customerEmail || body.guestEmail || body.customer?.email || null;
  const amount = Number(body.total || body.amount || 0);
  const checkIn =
    String(body.checkInDate || body.check_in_date || '').slice(0, 10) ||
    new Date().toISOString().slice(0, 10);
  let checkOut = String(body.checkOutDate || body.check_out_date || '').slice(0, 10);
  if (!checkOut) {
    const d = new Date(checkIn + 'T12:00:00');
    d.setDate(d.getDate() + Math.max(1, Number(body.nights || 1)));
    checkOut = d.toISOString().slice(0, 10);
  }

  const admin = getSupabaseAdmin();

  // Idempotent on mo-sell order id in notes
  if (orderId) {
    const { data: existing } = await admin
      .from('hospitality_bookings')
      .select('id')
      .eq('business_id', businessId)
      .ilike('notes', `%mo-sell:${orderId}%`)
      .limit(1);
    if (existing?.length) {
      return NextResponse.json({ ok: true, bookingId: existing[0].id, duplicate: true });
    }
  }

  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut + 'T12:00:00').getTime() - new Date(checkIn + 'T12:00:00').getTime()) /
        86400000
    )
  );

  const { data: booking, error } = await admin
    .from('hospitality_bookings')
    .insert({
      business_id: businessId,
      guest_name,
      guest_phone,
      guest_email,
      status: 'confirmed',
      check_in_date: checkIn,
      check_out_date: checkOut,
      amount,
      nights,
      rate_per_night: nights ? amount / nights : amount,
      deposit_amount: Number(body.paid || 0),
      balance_amount: Math.max(0, amount - Number(body.paid || 0)),
      source: 'website',
      notes: orderId ? `mo-sell:${orderId}` : 'mo-sell order',
      special_requests: body.notes || body.specialRequests || null,
      adults: Number(body.adults || 1),
      children: Number(body.children || 0),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    if (booking?.id && amount > 0) {
      await admin.from('hospitality_folio_lines').insert({
        business_id: businessId,
        booking_id: booking.id,
        line_type: 'charge',
        description: 'Mo-sell website order',
        amount,
      });
      if (Number(body.paid || 0) > 0) {
        await admin.from('hospitality_folio_lines').insert({
          business_id: businessId,
          booking_id: booking.id,
          line_type: 'payment',
          description: 'Paid on Mo-sell',
          amount: Number(body.paid || 0),
        });
      }
    }
  } catch {
    /* optional */
  }

  return NextResponse.json({ ok: true, bookingId: booking?.id });
}

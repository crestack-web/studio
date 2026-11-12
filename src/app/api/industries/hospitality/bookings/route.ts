import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import {
  assertRoomAvailable,
  listAvailableRooms,
} from '@/lib/industries/hospitality-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return session.businessId || null;
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const status = req.nextUrl.searchParams.get('status');
  const availableFor = req.nextUrl.searchParams.get('availableFor'); // checkIn
  const availableUntil = req.nextUrl.searchParams.get('availableUntil'); // checkOut

  // Availability query: rooms free for a stay window
  if (availableFor) {
    const rooms = await listAvailableRooms(
      admin,
      businessId,
      availableFor,
      availableUntil || null
    );
    return NextResponse.json({ ok: true, rooms });
  }

  let q = admin
    .from('hospitality_bookings')
    .select('*')
    .eq('business_id', businessId)
    .order('check_in_date', { ascending: false })
    .limit(200);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, bookings: data || [] });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const guest_name = String(body.guestName || body.guest_name || '').trim();
  if (!guest_name) return NextResponse.json({ error: 'guestName required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const roomId = body.roomId || body.room_id || null;
  const status = body.status || 'confirmed';
  const checkIn = body.checkInDate || new Date().toISOString().slice(0, 10);
  const checkOut = body.checkOutDate || null;

  if (!checkOut) {
    return NextResponse.json({ error: 'checkOutDate required' }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
  }

  // Double-booking guard
  if (roomId && status !== 'cancelled') {
    const gate = await assertRoomAvailable(admin, {
      businessId,
      roomId,
      checkIn,
      checkOut,
    });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message, conflicts: gate.conflicts }, { status: 409 });
    }
  }

  let nights = body.nights != null ? Number(body.nights) : null;
  if (nights == null && checkOut && checkIn) {
    const a = new Date(checkIn + 'T12:00:00');
    const b = new Date(checkOut + 'T12:00:00');
    nights = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
  }
  nights = nights || 1;

  let ratePerNight = body.ratePerNight != null ? Number(body.ratePerNight) : null;
  if (ratePerNight == null && roomId) {
    const { data: room } = await admin
      .from('hospitality_rooms')
      .select('rate_amount')
      .eq('id', roomId)
      .eq('business_id', businessId)
      .maybeSingle();
    if (room) ratePerNight = Number(room.rate_amount || 0);
  }
  ratePerNight = ratePerNight || 0;
  const amount =
    body.amount != null && body.amount !== ''
      ? Number(body.amount)
      : ratePerNight * nights;
  const deposit = Number(body.depositAmount ?? body.deposit_amount ?? 0);
  const balance = Math.max(0, amount - deposit);

  const { data, error } = await admin
    .from('hospitality_bookings')
    .insert({
      business_id: businessId,
      room_id: roomId,
      guest_name,
      guest_phone: body.guestPhone || body.guest_phone || null,
      guest_email: body.guestEmail || body.guest_email || null,
      status,
      check_in_date: checkIn,
      check_out_date: checkOut,
      amount,
      notes: body.notes || null,
      adults: Number(body.adults ?? 1),
      children: Number(body.children ?? 0),
      nights,
      rate_per_night: ratePerNight,
      deposit_amount: deposit,
      balance_amount: balance,
      source: body.source || 'front_desk',
      special_requests: body.specialRequests || body.special_requests || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.id && amount > 0) {
    try {
      await admin.from('hospitality_folio_lines').insert({
        business_id: businessId,
        booking_id: data.id,
        line_type: 'charge',
        description: `Room stay (${nights} night${nights > 1 ? 's' : ''})`,
        amount,
      });
      if (deposit > 0) {
        await admin.from('hospitality_folio_lines').insert({
          business_id: businessId,
          booking_id: data.id,
          line_type: 'payment',
          description: 'Deposit',
          amount: deposit,
        });
      }
    } catch {
      /* folio table may not be migrated yet */
    }
  }

  if (roomId && status === 'checked_in') {
    await admin
      .from('hospitality_rooms')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('business_id', businessId);
  }

  return NextResponse.json({ ok: true, booking: data });
}

export async function PATCH(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from('hospitality_bookings')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const status = body.status || existing.status;
  const roomId = body.roomId || body.room_id || existing.room_id || null;
  const checkIn = body.checkInDate || existing.check_in_date;
  const checkOut = body.checkOutDate !== undefined ? body.checkOutDate : existing.check_out_date;

  if (status === 'checked_in' && !roomId) {
    return NextResponse.json({ error: 'Assign a room before check-in' }, { status: 400 });
  }

  // Guard on assign or check-in
  if (
    roomId &&
    status !== 'cancelled' &&
    status !== 'checked_out' &&
    status !== 'no_show'
  ) {
    const gate = await assertRoomAvailable(admin, {
      businessId,
      roomId,
      checkIn,
      checkOut,
      excludeBookingId: id,
    });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message, conflicts: gate.conflicts }, { status: 409 });
    }
  }

  const { data, error } = await admin
    .from('hospitality_bookings')
    .update({
      status,
      room_id: roomId,
      updated_at: new Date().toISOString(),
      ...(body.amount != null ? { amount: Number(body.amount) } : {}),
      ...(body.notes != null ? { notes: body.notes } : {}),
      ...(body.checkInDate ? { check_in_date: body.checkInDate } : {}),
      ...(body.checkOutDate !== undefined ? { check_out_date: body.checkOutDate } : {}),
    })
    .eq('id', id)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (roomId) {
    if (status === 'checked_in') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'occupied', updated_at: new Date().toISOString() })
        .eq('id', roomId)
        .eq('business_id', businessId);
    }
    if (status === 'checked_out') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'cleaning', updated_at: new Date().toISOString() })
        .eq('id', roomId)
        .eq('business_id', businessId);
    }
  }

  return NextResponse.json({ ok: true, booking: data });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { listAvailableRooms, assertRoomAvailable } from '@/lib/industries/hospitality-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const clean = String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  if (!clean) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = getSupabaseAdmin();
  const { data: site, error } = await admin
    .from('hospitality_websites')
    .select('*')
    .eq('slug', clean)
    .eq('published', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!site) return NextResponse.json({ error: 'Hotel site not found or not published' }, { status: 404 });

  const checkIn = req.nextUrl.searchParams.get('checkIn');
  const checkOut = req.nextUrl.searchParams.get('checkOut');

  let rooms: unknown[] = [];
  if (checkIn && checkOut) {
    rooms = await listAvailableRooms(admin, site.business_id, checkIn, checkOut);
  } else {
    const { data } = await admin
      .from('hospitality_rooms')
      .select('id, room_number, category, rate_amount, capacity, status')
      .eq('business_id', site.business_id)
      .in('status', ['available', 'occupied', 'cleaning'])
      .order('room_number');
    rooms = data || [];
  }

  return NextResponse.json({
    ok: true,
    hotel: {
      slug: site.slug,
      propertyName: site.property_name,
      tagline: site.tagline,
      about: site.about,
      addressLine: site.address_line,
      city: site.city,
      state: site.state,
      country: site.country,
      phone: site.phone,
      whatsapp: site.whatsapp,
      email: site.email,
      checkInTime: site.check_in_time,
      checkOutTime: site.check_out_time,
      amenities: site.amenities || [],
      heroImageUrl: site.hero_image_url,
      gallery: site.gallery || [],
      bookingEnabled: site.booking_enabled !== false,
      primaryColor: site.primary_color || '#5b21b6',
    },
    rooms,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { slug } = await ctx.params;
  const clean = String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  const body = await req.json().catch(() => ({}));

  const admin = getSupabaseAdmin();
  const { data: site } = await admin
    .from('hospitality_websites')
    .select('*')
    .eq('slug', clean)
    .eq('published', true)
    .maybeSingle();

  if (!site || site.booking_enabled === false) {
    return NextResponse.json({ error: 'Online booking is not available' }, { status: 404 });
  }

  const guest_name = String(body.guestName || body.guest_name || '').trim();
  const checkIn = String(body.checkInDate || body.check_in_date || '').slice(0, 10);
  const checkOut = String(body.checkOutDate || body.check_out_date || '').slice(0, 10);
  if (!guest_name || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'guestName, checkInDate and checkOutDate required' },
      { status: 400 }
    );
  }
  if (checkOut <= checkIn) {
    return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
  }

  const roomId = body.roomId || body.room_id || null;
  if (roomId) {
    const gate = await assertRoomAvailable(admin, {
      businessId: site.business_id,
      roomId,
      checkIn,
      checkOut,
    });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.message }, { status: 409 });
    }
  }

  let nights = 1;
  {
    const a = new Date(checkIn + 'T12:00:00');
    const b = new Date(checkOut + 'T12:00:00');
    nights = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
  }

  let ratePerNight = body.ratePerNight != null ? Number(body.ratePerNight) : null;
  if (ratePerNight == null && roomId) {
    const { data: room } = await admin
      .from('hospitality_rooms')
      .select('rate_amount')
      .eq('id', roomId)
      .eq('business_id', site.business_id)
      .maybeSingle();
    if (room) ratePerNight = Number(room.rate_amount || 0);
  }
  ratePerNight = ratePerNight || 0;
  const amount =
    body.amount != null && body.amount !== ''
      ? Number(body.amount)
      : ratePerNight * nights;

  const { data: booking, error } = await admin
    .from('hospitality_bookings')
    .insert({
      business_id: site.business_id,
      room_id: roomId,
      guest_name,
      guest_phone: body.guestPhone || body.guest_phone || null,
      guest_email: body.guestEmail || body.guest_email || null,
      status: 'confirmed',
      check_in_date: checkIn,
      check_out_date: checkOut,
      amount,
      nights,
      rate_per_night: ratePerNight,
      deposit_amount: 0,
      balance_amount: amount,
      source: 'website',
      special_requests: body.specialRequests || body.notes || null,
      notes: 'Booked via public hotel website',
      adults: Number(body.adults ?? 1),
      children: Number(body.children ?? 0),
    })
    .select('id, guest_name, check_in_date, check_out_date, amount, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    if (booking?.id && amount > 0) {
      await admin.from('hospitality_folio_lines').insert({
        business_id: site.business_id,
        booking_id: booking.id,
        line_type: 'charge',
        description: `Website booking (${nights} night${nights > 1 ? 's' : ''})`,
        amount,
      });
    }
  } catch {
    /* optional */
  }

  return NextResponse.json({
    ok: true,
    booking,
    message: 'Reservation received. The hotel will confirm your stay.',
  });
}

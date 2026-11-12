import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return session.businessId || null;
}

/** Business-date night audit snapshot (African SME hotel close-of-day). */
export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const date =
    req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const admin = getSupabaseAdmin();
  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    admin.from('hospitality_rooms').select('*').eq('business_id', businessId),
    admin
      .from('hospitality_bookings')
      .select('*')
      .eq('business_id', businessId)
      .neq('status', 'cancelled'),
  ]);

  const roomList = rooms || [];
  const bookList = bookings || [];

  const arrivals = bookList.filter(
    (b) => b.check_in_date === date && ['confirmed', 'checked_in'].includes(b.status)
  );
  const departures = bookList.filter(
    (b) => b.check_out_date === date && ['checked_out', 'checked_in', 'confirmed'].includes(b.status)
  );
  const inHouse = bookList.filter((b) => {
    if (b.status !== 'checked_in') return false;
    const inD = b.check_in_date;
    const outD = b.check_out_date || '9999-12-31';
    return inD <= date && date < outD;
  });
  // Also count occupied rooms
  const occupiedRooms = roomList.filter((r) => r.status === 'occupied').length;
  const availableRooms = roomList.filter((r) => r.status === 'available').length;
  const cleaningRooms = roomList.filter((r) => r.status === 'cleaning').length;
  const oooRooms = roomList.filter((r) =>
    ['maintenance', 'blocked'].includes(r.status)
  ).length;

  const roomRevenue = inHouse.reduce((s, b) => {
    const nights = Number(b.nights || 1) || 1;
    const rate = Number(b.rate_per_night != null ? b.rate_per_night : Number(b.amount || 0) / nights);
    return s + rate;
  }, 0);

  // Stay-night revenue attributed to this date for any overlapping stay
  let soldNightsToday = 0;
  let revenueToday = 0;
  for (const b of bookList) {
    if (['cancelled', 'no_show'].includes(b.status)) continue;
    const inD = b.check_in_date;
    const outD = b.check_out_date || inD;
    if (inD <= date && date < outD) {
      soldNightsToday += 1;
      const nights = Number(b.nights || 1) || 1;
      const rate =
        b.rate_per_night != null
          ? Number(b.rate_per_night)
          : Number(b.amount || 0) / nights;
      revenueToday += rate;
    }
  }

  const sellable = Math.max(0, roomList.length - oooRooms);
  const occupancyPct = sellable ? Math.round((soldNightsToday / sellable) * 100) : 0;
  const adr = soldNightsToday ? revenueToday / soldNightsToday : 0;
  const revpar = sellable ? revenueToday / sellable : 0;

  return NextResponse.json({
    ok: true,
    date,
    property: {
      totalRooms: roomList.length,
      sellableRooms: sellable,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      outOfOrder: oooRooms,
    },
    activity: {
      arrivals: arrivals.length,
      departures: departures.length,
      inHouse: inHouse.length,
      soldNights: soldNightsToday,
    },
    revenue: {
      roomRevenueToday: Math.round(revenueToday * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      revpar: Math.round(revpar * 100) / 100,
      occupancyPct,
    },
    arrivals,
    departures,
    inHouse,
  });
}

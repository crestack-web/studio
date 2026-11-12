import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { staysOverlap } from '@/lib/industries/hospitality-availability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return session.businessId || null;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const start =
    req.nextUrl.searchParams.get('start') || new Date().toISOString().slice(0, 10);
  const days = Math.min(31, Math.max(7, Number(req.nextUrl.searchParams.get('days') || 14)));

  const dates: string[] = [];
  for (let i = 0; i < days; i++) dates.push(addDays(start, i));

  const admin = getSupabaseAdmin();
  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    admin
      .from('hospitality_rooms')
      .select('id, room_number, category, status, rate_amount')
      .eq('business_id', businessId)
      .order('room_number'),
    admin
      .from('hospitality_bookings')
      .select('id, room_id, guest_name, status, check_in_date, check_out_date')
      .eq('business_id', businessId)
      .in('status', ['confirmed', 'checked_in']),
  ]);

  const roomList = rooms || [];
  const bookList = (bookings || []).filter((b) => b.room_id);

  const grid = roomList.map((room) => {
    const cells = dates.map((date) => {
      if (room.status === 'maintenance' || room.status === 'blocked') {
        return { date, state: 'ooo', bookingId: null, guest: null };
      }
      const hit = bookList.find(
        (b) =>
          b.room_id === room.id &&
          staysOverlap(date, addDays(date, 1), b.check_in_date, b.check_out_date)
      );
      if (hit) {
        return {
          date,
          state: hit.status === 'checked_in' ? 'in_house' : 'reserved',
          bookingId: hit.id,
          guest: hit.guest_name,
        };
      }
      return { date, state: 'free', bookingId: null, guest: null };
    });
    return {
      roomId: room.id,
      roomNumber: room.room_number,
      category: room.category,
      status: room.status,
      cells,
    };
  });

  return NextResponse.json({ ok: true, start, days, dates, grid });
}

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * True if two date ranges overlap (hotel nights: checkout day is free for next guest).
 * Stay [in, out) — checkout morning frees the room.
 */
export function staysOverlap(
  inA: string,
  outA: string | null | undefined,
  inB: string,
  outB: string | null | undefined
): boolean {
  const startA = inA;
  const endA = outA || inA;
  const startB = inB;
  const endB = outB || inB;
  // [start, end) overlap
  return startA < endB && startB < endA;
}

const BLOCKING = new Set(['confirmed', 'checked_in']);

/**
 * Returns conflicting bookings for a room over a date range, or null if free.
 */
export async function findRoomConflicts(
  admin: SupabaseClient,
  params: {
    businessId: string;
    roomId: string;
    checkIn: string;
    checkOut: string | null;
    excludeBookingId?: string | null;
  }
): Promise<{ id: string; guest_name: string; check_in_date: string; check_out_date: string | null; status: string }[]> {
  const { businessId, roomId, checkIn, checkOut, excludeBookingId } = params;

  let q = admin
    .from('hospitality_bookings')
    .select('id, guest_name, check_in_date, check_out_date, status, room_id')
    .eq('business_id', businessId)
    .eq('room_id', roomId)
    .in('status', Array.from(BLOCKING));

  if (excludeBookingId) {
    q = q.neq('id', excludeBookingId);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  return data.filter((b) =>
    staysOverlap(checkIn, checkOut, b.check_in_date, b.check_out_date)
  );
}

export async function assertRoomAvailable(
  admin: SupabaseClient,
  params: {
    businessId: string;
    roomId: string;
    checkIn: string;
    checkOut: string | null;
    excludeBookingId?: string | null;
  }
): Promise<{ ok: true } | { ok: false; message: string; conflicts: unknown[] }> {
  // Room physical status
  const { data: room } = await admin
    .from('hospitality_rooms')
    .select('id, room_number, status')
    .eq('id', params.roomId)
    .eq('business_id', params.businessId)
    .maybeSingle();

  if (!room) {
    return { ok: false, message: 'Room not found', conflicts: [] };
  }
  if (room.status === 'maintenance' || room.status === 'blocked') {
    return {
      ok: false,
      message: `Room ${room.room_number} is ${room.status} and cannot be assigned`,
      conflicts: [],
    };
  }

  const conflicts = await findRoomConflicts(admin, params);
  if (conflicts.length) {
    const c = conflicts[0];
    return {
      ok: false,
      message: `Room ${room.room_number} is already booked (${c.guest_name}, ${c.check_in_date}${c.check_out_date ? ` → ${c.check_out_date}` : ''})`,
      conflicts,
    };
  }
  return { ok: true };
}

/** Rooms free for a date range (not maintenance/blocked; no overlapping confirmed/in-house stays). */
export async function listAvailableRooms(
  admin: SupabaseClient,
  businessId: string,
  checkIn: string,
  checkOut: string | null
) {
  const { data: rooms } = await admin
    .from('hospitality_rooms')
    .select('*')
    .eq('business_id', businessId)
    .order('room_number');

  if (!rooms?.length) return [];

  const free: typeof rooms = [];
  for (const room of rooms) {
    if (room.status === 'maintenance' || room.status === 'blocked') continue;
    const conflicts = await findRoomConflicts(admin, {
      businessId,
      roomId: room.id,
      checkIn,
      checkOut,
    });
    if (!conflicts.length) free.push(room);
  }
  return free;
}

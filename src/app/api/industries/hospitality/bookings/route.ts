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

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const guest_name = String(body.guestName || body.guest_name || '').trim();
  if (!guest_name) return NextResponse.json({ error: 'guestName required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const roomId = body.roomId || body.room_id || null;
  const status = body.status || 'confirmed';

  const { data, error } = await admin
    .from('hospitality_bookings')
    .insert({
      business_id: businessId,
      room_id: roomId,
      guest_name,
      guest_phone: body.guestPhone || null,
      guest_email: body.guestEmail || null,
      status,
      check_in_date: body.checkInDate || new Date().toISOString().slice(0, 10),
      check_out_date: body.checkOutDate || null,
      amount: Number(body.amount ?? 0),
      notes: body.notes || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sync room status on check-in
  if (roomId && status === 'checked_in') {
    await admin
      .from('hospitality_rooms')
      .update({ status: 'occupied', updated_at: new Date().toISOString() })
      .eq('id', roomId)
      .eq('business_id', businessId);
  }
  if (roomId && status === 'checked_out') {
    await admin
      .from('hospitality_rooms')
      .update({ status: 'cleaning', updated_at: new Date().toISOString() })
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
  const { data, error } = await admin
    .from('hospitality_bookings')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(body.amount != null ? { amount: Number(body.amount) } : {}),
    })
    .eq('id', id)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (existing.room_id) {
    if (status === 'checked_in') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'occupied', updated_at: new Date().toISOString() })
        .eq('id', existing.room_id)
        .eq('business_id', businessId);
    }
    if (status === 'checked_out') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'cleaning', updated_at: new Date().toISOString() })
        .eq('id', existing.room_id)
        .eq('business_id', businessId);
    }
  }

  return NextResponse.json({ ok: true, booking: data });
}

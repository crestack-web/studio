import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { resolveIndustryAccess, canAccessDesk, canMutateDesk } from '@/lib/industries/access';

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
  const room_number = String(body.roomNumber || body.room_number || '').trim();
  if (!room_number) return NextResponse.json({ error: 'roomNumber required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_rooms')
    .insert({
      business_id: businessId,
      room_number,
      floor: body.floor ? String(body.floor) : null,
      category: String(body.category || 'Standard'),
      rate_amount: Number(body.rateAmount ?? body.rate_amount ?? 0),
      capacity: Number(body.capacity ?? 2),
      status: body.status || 'available',
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, room: data });
}

export async function PATCH(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) patch.status = body.status;
  if (body.rateAmount != null) patch.rate_amount = Number(body.rateAmount);
  if (body.category) patch.category = String(body.category);
  if (body.floor != null) patch.floor = String(body.floor);
  if (body.capacity != null) patch.capacity = Number(body.capacity);

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_rooms')
    .update(patch)
    .eq('id', id)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, room: data });
}

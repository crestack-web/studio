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

export async function GET(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();

  const { data: guests, error } = await admin
    .from('hospitality_guests')
    .select('*')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })
    .limit(300);

  if (error) {
    // Table may not exist — derive from bookings
    const { data: bookings } = await admin
      .from('hospitality_bookings')
      .select('guest_name, guest_phone, guest_email, amount, check_in_date, status')
      .eq('business_id', businessId)
      .order('check_in_date', { ascending: false })
      .limit(300);
    return NextResponse.json({ ok: true, guests: [], bookings: bookings || [], derived: true });
  }

  const { data: bookings } = await admin
    .from('hospitality_bookings')
    .select('id, guest_id, guest_name, guest_phone, guest_email, amount, check_in_date, status')
    .eq('business_id', businessId)
    .limit(500);

  return NextResponse.json({ ok: true, guests: guests || [], bookings: bookings || [] });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const full_name = String(body.fullName || body.full_name || '').trim();
  if (!full_name) return NextResponse.json({ error: 'fullName required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_guests')
    .insert({
      business_id: businessId,
      full_name,
      phone: body.phone || null,
      email: body.email || null,
      id_number: body.idNumber || body.id_number || null,
      notes: body.notes || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, guest: data });
}

export async function PATCH(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.fullName || body.full_name) patch.full_name = body.fullName || body.full_name;
  if (body.phone !== undefined) patch.phone = body.phone;
  if (body.email !== undefined) patch.email = body.email;
  if (body.idNumber !== undefined || body.id_number !== undefined)
    patch.id_number = body.idNumber || body.id_number;
  if (body.notes !== undefined) patch.notes = body.notes;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_guests')
    .update(patch)
    .eq('id', id)
    .eq('business_id', businessId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, guest: data });
}

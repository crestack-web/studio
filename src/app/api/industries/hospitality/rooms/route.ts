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

function roomFields(body: Record<string, unknown>, includeNumber: boolean) {
  const row: Record<string, unknown> = {
    floor: body.floor ? String(body.floor) : null,
    category: String(body.category || 'Standard'),
    rate_amount: Number(body.rateAmount ?? body.rate_amount ?? 0),
    capacity: Number(body.capacity ?? 2),
    status: body.status || 'available',
    notes: body.notes ? String(body.notes) : null,
    image_url: body.imageUrl ? String(body.imageUrl) : null,
    bed_type: body.bedType ? String(body.bedType) : null,
    description: body.description ? String(body.description) : null,
    size_sqm: body.sizeSqm === '' || body.sizeSqm == null ? null : Number(body.sizeSqm),
    amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [],
  };
  if (includeNumber) row.room_number = String(body.roomNumber || body.room_number || '').trim();
  return row;
}

const DETAIL_KEYS = ['image_url', 'bed_type', 'description', 'size_sqm', 'amenities'];

async function writeRoom(
  mode: 'insert' | 'update',
  row: Record<string, unknown>,
  businessId: string,
  id?: string,
) {
  const admin = getSupabaseAdmin();
  const run = (payload: Record<string, unknown>) => {
    if (mode === 'insert') {
      return admin.from('hospitality_rooms').insert({ ...payload, business_id: businessId }).select('*').single();
    }
    return admin
      .from('hospitality_rooms')
      .update(payload)
      .eq('id', id as string)
      .eq('business_id', businessId)
      .select('*')
      .single();
  };

  let result = await run(row);
  if (result.error && /column|schema cache/i.test(result.error.message || '')) {
    const slim = { ...row };
    for (const key of DETAIL_KEYS) delete slim[key];
    result = await run(slim);
    return { ...result, warning: 'Room saved without photo and extra details. Run the rooms SQL update.' };
  }
  return result;
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const row = roomFields(body, true);
  if (!row.room_number) return NextResponse.json({ error: 'roomNumber required' }, { status: 400 });

  const { data, error, warning } = await writeRoom('insert', row, businessId) as {
    data: unknown;
    error: { message: string } | null;
    warning?: string;
  };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, room: data, warning });
}

export async function PATCH(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || '');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status && Object.keys(body).length <= 2) {
    patch.status = body.status;
  } else {
    Object.assign(patch, roomFields(body, Boolean(body.roomNumber)));
    if (body.status) patch.status = body.status;
  }

  const { data, error, warning } = await writeRoom('update', patch, businessId, id) as {
    data: unknown;
    error: { message: string } | null;
    warning?: string;
  };
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, room: data, warning });
}

export async function DELETE(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('hospitality_rooms').delete().eq('id', id).eq('business_id', businessId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

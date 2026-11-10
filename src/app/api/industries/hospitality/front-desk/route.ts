import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { resolveIndustryAccess, canAccessDesk, canMutateDesk } from '@/lib/industries/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireHospitalityBusiness(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!session.businessId) {
    return { error: NextResponse.json({ error: 'No organization', needsOnboarding: true }, { status: 403 }) };
  }
  return { user, businessId: session.businessId as string, session };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** GET front-desk snapshot: settings, metrics, rooms, recent bookings */
export async function GET(req: NextRequest) {
  const gate = await requireHospitalityBusiness(req);
  if ('error' in gate && gate.error) return gate.error;
  const { businessId } = gate as { businessId: string };

  const admin = getSupabaseAdmin();
  const today = todayISO();

  const [settingsRes, roomsRes, bookingsRes] = await Promise.all([
    admin.from('hospitality_settings').select('*').eq('business_id', businessId).maybeSingle(),
    admin.from('hospitality_rooms').select('*').eq('business_id', businessId).order('room_number'),
    admin
      .from('hospitality_bookings')
      .select('*, hospitality_rooms(room_number, category)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  // Tables may not exist yet — soft empty
  const settingsMissing =
    settingsRes.error &&
    (settingsRes.error.message || '').toLowerCase().includes('schema');
  const rooms = roomsRes.data || [];
  const bookings = bookingsRes.data || [];

  const totalRooms = rooms.length;
  const occupied = rooms.filter((r: any) => r.status === 'occupied').length;
  const available = rooms.filter((r: any) => r.status === 'available').length;
  const occupancyRate = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

  const checkInsToday = bookings.filter(
    (b: any) => b.check_in_date === today && ['confirmed', 'checked_in'].includes(b.status)
  ).length;

  const totalRevenue = bookings
    .filter((b: any) => b.status !== 'cancelled')
    .reduce((s: number, b: any) => s + Number(b.amount || 0), 0);

  const floors = Array.from(
    new Set(rooms.map((r: any) => r.floor).filter(Boolean))
  ).sort();

  return NextResponse.json({
    ok: true,
    businessId,
    settings: settingsRes.data || {
      business_id: businessId,
      property_name: null,
      logo_url: null,
      currency: 'NGN',
    },
    metrics: {
      occupancyRate,
      checkInsToday,
      availableRooms: available,
      totalRooms,
      occupiedRooms: occupied,
      totalRevenue,
    },
    floors,
    rooms,
    recentBookings: bookings.slice(0, 12),
    schemaReady: !settingsMissing && !roomsRes.error,
    warnings: [settingsRes.error?.message, roomsRes.error?.message, bookingsRes.error?.message].filter(
      Boolean
    ),
  });
}

/** PATCH settings (logo, property name) — owner front desk branding */
export async function PATCH(req: NextRequest) {
  const gate = await requireHospitalityBusiness(req);
  if ('error' in gate && gate.error) return gate.error;
  const { businessId } = gate as { businessId: string };
  const body = await req.json().catch(() => ({}));

  const payload: Record<string, unknown> = {
    business_id: businessId,
    updated_at: new Date().toISOString(),
  };
  if (typeof body.propertyName === 'string') payload.property_name = body.propertyName.trim() || null;
  if (typeof body.logoUrl === 'string') payload.logo_url = body.logoUrl.trim() || null;
  if (typeof body.currency === 'string') payload.currency = body.currency.trim() || 'NGN';

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_settings')
    .upsert(payload, { onConflict: 'business_id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, settings: data });
}

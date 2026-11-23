import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';
import { notifySolutionStaffInvite } from '@/lib/industries/staff-invite';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDITION = 'hospitality';

const MODULES = [
  'tasks',
  'housekeeping',
  'room-service',
  'expenses',
  'payments',
  'reviews',
  'inquiries',
  'website-sections',
  'activity',
  'settings',
] as const;

type ModuleName = (typeof MODULES)[number];

async function ctx(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const s = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  if (!s.businessId) return null;
  return { businessId: s.businessId, businessName: s.businessName };
}

function asRows(data: any): any[] {
  return Array.isArray(data) ? data : [];
}

async function loadRecords(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  moduleName: string,
  limit = 400
) {
  const { data, error } = await admin
    .from('industry_records')
    .select('*')
    .eq('business_id', businessId)
    .eq('product_edition', EDITION)
    .eq('module', moduleName)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) return { rows: [] as any[], warning: error.message };
  return { rows: asRows(data), warning: null as string | null };
}

function nightsBetween(a: string, b: string) {
  const start = new Date(`${a}T12:00:00`);
  const end = new Date(`${b}T12:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Math.max(1, Number.isFinite(diff) ? diff : 1);
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

export async function GET(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const { businessId } = c;

  const [
    settingsRes,
    roomsRes,
    bookingsRes,
    guestsRes,
    folioRes,
    staffRes,
    websiteRes,
    ...recordSets
  ] = await Promise.all([
    admin.from('hospitality_settings').select('*').eq('business_id', businessId).maybeSingle(),
    admin
      .from('hospitality_rooms')
      .select('*')
      .eq('business_id', businessId)
      .order('room_number', { ascending: true })
      .limit(500),
    admin
      .from('hospitality_bookings')
      .select('*')
      .eq('business_id', businessId)
      .order('check_in_date', { ascending: false })
      .limit(500),
    admin
      .from('hospitality_guests')
      .select('*')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false })
      .limit(500),
    admin
      .from('hospitality_folio_lines')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('hospitality_staff')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .limit(300),
    admin.from('hospitality_websites').select('*').eq('business_id', businessId).maybeSingle(),
    ...MODULES.map((m) => loadRecords(admin, businessId, m)),
  ]);

  const byModule: Record<string, any[]> = {};
  MODULES.forEach((m, i) => {
    byModule[m] = recordSets[i]?.rows || [];
  });

  const settings = settingsRes.data || null;
  const rooms = asRows(roomsRes.data);
  const bookings = asRows(bookingsRes.data);
  const guests = asRows(guestsRes.data);
  const folioLines = asRows(folioRes.data);
  const staff = asRows(staffRes.data);
  const website = websiteRes.data || null;

  const today = new Date().toISOString().slice(0, 10);
  const occupied = rooms.filter((r) => String(r.status) === 'occupied').length;
  const available = rooms.filter((r) => String(r.status) === 'available').length;
  const inHouse = bookings.filter((b) => String(b.status) === 'checked_in');
  const arrivals = bookings.filter(
    (b) => String(b.check_in_date).slice(0, 10) === today && ['confirmed', 'pending'].includes(String(b.status))
  );
  const departures = bookings.filter(
    (b) => String(b.check_out_date).slice(0, 10) === today && String(b.status) === 'checked_in'
  );
  const totalRooms = rooms.length || Number(settings?.total_rooms || 0) || 0;
  const revenue = bookings
    .filter((b) => !['cancelled', 'no_show'].includes(String(b.status)))
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const outstanding = bookings.reduce((s, b) => s + Number(b.balance_amount || 0), 0);

  const warnings = [
    settingsRes.error?.message,
    roomsRes.error?.message,
    bookingsRes.error?.message,
    guestsRes.error?.message,
    folioRes.error?.message,
    staffRes.error?.message,
    websiteRes.error?.message,
    ...recordSets.map((r: any) => r?.warning),
  ].filter(Boolean);

  return NextResponse.json({
    ok: true,
    businessId,
    businessName: c.businessName,
    settings: {
      ...(settings || {
        business_id: businessId,
        property_name: c.businessName,
        logo_url: null,
        currency: 'NGN',
        timezone: 'Africa/Lagos',
      }),
      meta: byModule.settings?.[0]?.meta || null,
    },
    metrics: {
      totalRooms,
      occupied,
      available,
      occupancyRate: totalRooms ? Math.round((occupied / totalRooms) * 100) : 0,
      arrivals: arrivals.length,
      departures: departures.length,
      inHouse: inHouse.length,
      bookings: bookings.length,
      revenue,
      outstanding,
    },
    rooms,
    bookings,
    guests,
    folioLines,
    staff,
    website,
    tasks: byModule.tasks,
    housekeeping: byModule.housekeeping.length
      ? byModule.housekeeping
      : rooms.map((r) => {
          const st = String(r.status || 'available');
          let stage = 'ready';
          if (st === 'cleaning' || st === 'dirty') stage = 'dirty';
          else if (st === 'occupied') stage = 'dirty';
          else if (st === 'maintenance' || st === 'blocked') stage = 'dirty';
          else if (st === 'available') stage = 'ready';
          return {
            id: r.id,
            title: `Room ${r.room_number}`,
            status: stage,
            meta: {
              room_id: r.id,
              room_number: r.room_number,
              category: r.category || 'Standard',
              stage,
              priority: st === 'maintenance' ? 'high' : 'medium',
              source: 'rooms',
            },
            notes: r.notes || null,
          };
        }),
    roomService: byModule['room-service'],
    expenses: byModule.expenses,
    payments: byModule.payments,
    reviews: byModule.reviews,
    inquiries: byModule.inquiries,
    websiteSections: byModule['website-sections'],
    activity: byModule.activity,
    warnings,
  });
}

async function insertRecord(
  admin: ReturnType<typeof getSupabaseAdmin>,
  businessId: string,
  body: any
) {
  const moduleName = String(body.module || '').trim();
  const title = String(body.title || '').trim();
  if (!(MODULES as readonly string[]).includes(moduleName)) {
    return { error: `module must be one of ${MODULES.join(', ')}`, status: 400 as const };
  }
  if (!title) return { error: 'title required', status: 400 as const };

  const { data, error } = await admin
    .from('industry_records')
    .insert({
      business_id: businessId,
      product_edition: EDITION,
      module: moduleName,
      title,
      status: body.status || 'open',
      amount: body.amount != null ? Number(body.amount) : 0,
      notes: body.notes || null,
      meta: body.meta || {},
      occurred_at: body.occurredAt || new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) return { error: error.message, status: 500 as const };
  return { record: data };
}

export async function POST(req: NextRequest) {
  const c = await ctx(req);
  if (!c) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = getSupabaseAdmin();
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '').trim();
  const { businessId } = c;

  if (action === 'settings_save') {
    const settings = body.settings && typeof body.settings === 'object' ? body.settings : {};
    const title = String(settings.name || settings.displayName || 'Hotel settings');
    const existing = await admin
      .from('industry_records')
      .select('id')
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .eq('module', 'settings')
      .limit(1)
      .maybeSingle();
    const { data, error } = existing.data
      ? await admin
          .from('industry_records')
          .update({ title, meta: settings, status: 'active' })
          .eq('id', existing.data.id)
          .eq('business_id', businessId)
          .select('*')
          .single()
      : await admin
          .from('industry_records')
          .insert({
            business_id: businessId,
            product_edition: EDITION,
            module: 'settings',
            title,
            status: 'active',
            meta: settings,
            occurred_at: new Date().toISOString(),
          })
          .select('*')
          .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (settings.name || settings.logoUrl || settings.currency) {
      await admin.from('solution_branding').upsert(
        {
          business_id: businessId,
          product_edition: EDITION,
          display_name: settings.name || title,
          logo_url: settings.logoUrl || null,
          currency: settings.currency || 'NGN',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id' }
      );
      await admin.from('hospitality_settings').upsert(
        {
          business_id: businessId,
          property_name: settings.name || title,
          logo_url: settings.logoUrl || null,
          currency: settings.currency || 'NGN',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id' }
      );
    }
    return NextResponse.json({ ok: true, settings: data });
  }

  if (action === 'room_create' || action === 'room_update') {
    const isUpdate = action === 'room_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const row = roomFields(body, !isUpdate);
    if (!isUpdate && !row.room_number) {
      return NextResponse.json({ error: 'roomNumber required' }, { status: 400 });
    }
    row.updated_at = new Date().toISOString();
    if (isUpdate && !body.status) delete row.status;
    const query = isUpdate
      ? admin.from('hospitality_rooms').update(row).eq('id', id).eq('business_id', businessId)
      : admin.from('hospitality_rooms').insert({ business_id: businessId, ...row });
    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, room: data });
  }

  if (action === 'room_delete') {
    const id = String(body.id || req.nextUrl.searchParams.get('id') || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin
      .from('hospitality_rooms')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === 'booking_create' || action === 'booking_update') {
    const isUpdate = action === 'booking_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const guestName = String(body.guestName || body.guest_name || '').trim();
    if (!isUpdate && !guestName) {
      return NextResponse.json({ error: 'guestName required' }, { status: 400 });
    }
    const checkIn = String(body.checkInDate || body.check_in_date || new Date().toISOString().slice(0, 10));
    const checkOut = body.checkOutDate || body.check_out_date || null;
    if (!isUpdate && !checkOut) {
      return NextResponse.json({ error: 'checkOutDate required' }, { status: 400 });
    }
    if (!isUpdate && String(checkOut) <= checkIn) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    const roomId = body.roomId || body.room_id || null;
    let ratePerNight = body.ratePerNight != null ? Number(body.ratePerNight) : null;
    let roomNumber = body.roomNumber || body.room_number || '';
    if (roomId) {
      const { data: room } = await admin
        .from('hospitality_rooms')
        .select('room_number, category, rate_amount')
        .eq('id', roomId)
        .eq('business_id', businessId)
        .maybeSingle();
      if (room) {
        roomNumber = roomNumber || room.room_number;
        if (ratePerNight == null) ratePerNight = Number(room.rate_amount || 0);
      }
    }
    const nights = Number(body.nights || (checkOut ? nightsBetween(checkIn, String(checkOut)) : 1));
    ratePerNight = ratePerNight || 0;
    const amount =
      body.amount != null && body.amount !== '' ? Number(body.amount) : ratePerNight * nights;
    const deposit = Number(body.depositAmount ?? body.deposit_amount ?? 0);


    // Keep guest directory in sync with bookings
    let guestId = body.guestId || body.guest_id || null;
    if (!guestId && guestName) {
      const phone = body.guestPhone || body.guest_phone || null;
      const email = body.guestEmail || body.guest_email || null;
      try {
        let existing: any = null;
        if (email) {
          const { data } = await admin
            .from('hospitality_guests')
            .select('id')
            .eq('business_id', businessId)
            .eq('email', email)
            .maybeSingle();
          existing = data;
        }
        if (!existing && phone) {
          const { data } = await admin
            .from('hospitality_guests')
            .select('id')
            .eq('business_id', businessId)
            .eq('phone', phone)
            .maybeSingle();
          existing = data;
        }
        if (!existing) {
          const { data } = await admin
            .from('hospitality_guests')
            .select('id')
            .eq('business_id', businessId)
            .eq('full_name', guestName)
            .limit(1)
            .maybeSingle();
          existing = data;
        }
        if (existing?.id) {
          guestId = existing.id;
          await admin
            .from('hospitality_guests')
            .update({
              phone: phone || undefined,
              email: email || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', guestId)
            .eq('business_id', businessId);
        } else {
          const { data: created } = await admin
            .from('hospitality_guests')
            .insert({
              business_id: businessId,
              full_name: guestName,
              phone,
              email,
              country: body.country || 'Nigeria',
            })
            .select('id')
            .single();
          guestId = created?.id || null;
        }
      } catch {
        /* guests table may lag migrations */
      }
    }

    const payload: Record<string, unknown> = {
      room_id: roomId,
      guest_id: guestId || undefined,
      guest_name: guestName || undefined,
      guest_phone: body.guestPhone || body.guest_phone || null,
      guest_email: body.guestEmail || body.guest_email || null,
      status: body.status || 'confirmed',
      check_in_date: checkIn,
      check_out_date: checkOut,
      amount,
      notes: body.notes || null,
      adults: Number(body.adults ?? 1),
      children: Number(body.children ?? 0),
      nights,
      rate_per_night: ratePerNight,
      deposit_amount: deposit,
      balance_amount: Math.max(0, amount - deposit),
      source: body.source || 'front_desk',
      special_requests: body.specialRequests || body.special_requests || null,
      updated_at: new Date().toISOString(),
    };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    if (isUpdate && checkOut == null) delete payload.check_out_date;

    const query = isUpdate
      ? admin.from('hospitality_bookings').update(payload).eq('id', id).eq('business_id', businessId)
      : admin.from('hospitality_bookings').insert({ business_id: businessId, ...payload });
    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!isUpdate && data?.id && amount > 0) {
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

    if (roomId && data?.status === 'checked_in') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'occupied', updated_at: new Date().toISOString() })
        .eq('id', roomId)
        .eq('business_id', businessId);
    }
    if (roomId && data?.status === 'checked_out') {
      await admin
        .from('hospitality_rooms')
        .update({ status: 'cleaning', updated_at: new Date().toISOString() })
        .eq('id', roomId)
        .eq('business_id', businessId);
    }

    return NextResponse.json({ ok: true, booking: data, roomNumber });
  }

  if (action === 'guest_create' || action === 'guest_update') {
    let isUpdate = action === 'guest_update';
    let id = String(body.id || '');
    // Derived booking guests (booking-guest-*) are not real rows — create on first write
    if (isUpdate && (id.startsWith('booking-guest-') || !id)) {
      isUpdate = false;
    }
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const fullName = String(body.fullName || body.full_name || '').trim();
    if (!isUpdate && !fullName) {
      return NextResponse.json({ error: 'fullName required' }, { status: 400 });
    }
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fullName) payload.full_name = fullName;
    for (const key of ['phone', 'email', 'country', 'notes']) {
      if (body[key] !== undefined) payload[key] = body[key] === '' ? null : body[key];
    }
    if (body.idNumber !== undefined || body.id_number !== undefined) {
      payload.id_number = body.idNumber || body.id_number || null;
    }
    if (body.vip !== undefined) payload.vip = Boolean(body.vip);

    const run = async (pl: Record<string, unknown>) => {
      if (isUpdate) {
        return admin.from('hospitality_guests').update(pl).eq('id', id).eq('business_id', businessId).select('*').single();
      }
      return admin.from('hospitality_guests').insert({ business_id: businessId, ...pl }).select('*').single();
    };

    let { data, error } = await run(payload);
    // Schema without vip column — fold into notes
    if (error && body.vip !== undefined && /column|schema cache|vip/i.test(error.message || '')) {
      const { vip: _v, ...rest } = payload as any;
      const vipTag = Boolean(body.vip) ? '[VIP] ' : '';
      const notes = String(rest.notes || body.notes || '').replace(/^\[VIP\]\s*/i, '');
      rest.notes = Boolean(body.vip) ? `${vipTag}${notes}`.trim() : notes;
      ({ data, error } = await run(rest));
      if (!error && data) {
        (data as any).vip = Boolean(body.vip);
      }
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, guest: data });
  }

  if (action === 'folio_add') {
    const bookingId = String(body.bookingId || body.booking_id || '');
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });
    const description = String(body.description || '').trim();
    if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 });
    const { data, error } = await admin
      .from('hospitality_folio_lines')
      .insert({
        business_id: businessId,
        booking_id: bookingId,
        line_type: body.lineType || body.line_type || 'charge',
        description,
        amount: Number(body.amount || 0),
      })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const lineType = String(body.lineType || body.line_type || 'charge');
    const amt = Number(body.amount || 0);
    // Keep booking balance in sync for payments / charges
    if (amt > 0 && (lineType === 'payment' || lineType === 'charge' || lineType === 'adjustment')) {
      try {
        const { data: booking } = await admin
          .from('hospitality_bookings')
          .select('id, amount, balance_amount, deposit_amount')
          .eq('id', bookingId)
          .eq('business_id', businessId)
          .maybeSingle();
        if (booking) {
          const { data: lines } = await admin
            .from('hospitality_folio_lines')
            .select('line_type, amount')
            .eq('booking_id', bookingId)
            .eq('business_id', businessId);
          const rows = Array.isArray(lines) ? lines : [];
          const charges = rows
            .filter((l) => !['payment', 'discount'].includes(String(l.line_type)))
            .reduce((s, l) => s + Number(l.amount || 0), 0);
          const payments = rows
            .filter((l) => String(l.line_type) === 'payment')
            .reduce((s, l) => s + Number(l.amount || 0), 0);
          const balance = Math.max(0, charges - payments);
          await admin
            .from('hospitality_bookings')
            .update({ balance_amount: balance, updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .eq('business_id', businessId);
        }
      } catch {
        /* balance column optional */
      }
    }

    return NextResponse.json({ ok: true, folioLine: data });
  }

  if (action === 'staff_create' || action === 'staff_update') {
    const isUpdate = action === 'staff_update';
    const id = String(body.id || '');
    if (isUpdate && !id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const fullName = String(body.fullName || body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!isUpdate && (!fullName || !email)) {
      return NextResponse.json({ error: 'fullName and email required' }, { status: 400 });
    }
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fullName) payload.full_name = fullName;
    if (email) payload.email = email;
    for (const key of ['phone', 'role', 'department', 'shift', 'status']) {
      if (body[key] !== undefined) payload[key] = body[key];
    }
    const query = isUpdate
      ? admin.from('hospitality_staff').update(payload).eq('id', id).eq('business_id', businessId)
      : admin.from('hospitality_staff').insert({ business_id: businessId, ...payload });
    const { data, error } = await query.select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const invite =
      !isUpdate && String(payload.email || '')
        ? await notifySolutionStaffInvite({
            email: String(payload.email),
            staffName: fullName || 'there',
            businessName: c.businessName,
            suiteName: 'Busmo Hospitality',
          })
        : null;

    return NextResponse.json({ ok: true, staff: data, businessName: c.businessName, ...(invite || {}) });
  }

  if (action === 'record_create') {
    const res = await insertRecord(admin, businessId, body);
    if ('error' in res) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, record: res.record });
  }

  if (action === 'record_update') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status != null) patch.status = body.status;
    if (body.title != null) patch.title = body.title;
    if (body.amount != null) patch.amount = Number(body.amount);
    if (body.notes != null) patch.notes = body.notes;
    if (body.meta != null) {
      const existing = await admin
        .from('industry_records')
        .select('meta')
        .eq('id', id)
        .eq('business_id', businessId)
        .maybeSingle();
      patch.meta = { ...(existing.data?.meta || {}), ...body.meta };
    }
    if (body.occurredAt != null) patch.occurred_at = body.occurredAt;
    const { data, error } = await admin
      .from('industry_records')
      .update(patch)
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION)
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, record: data });
  }

  if (action === 'record_delete') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await admin
      .from('industry_records')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId)
      .eq('product_edition', EDITION);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }


  if (action === 'housekeeping_set_stage') {
    const roomId = String(body.roomId || body.room_id || body.id || '');
    const stage = String(body.stage || body.status || 'dirty');
    const roomNumber = String(body.roomNumber || body.room_number || '').trim();
    if (!roomId && !roomNumber) {
      return NextResponse.json({ error: 'roomId or roomNumber required' }, { status: 400 });
    }

    // Map HK stage → room inventory status
    const stageToRoom: Record<string, string> = {
      dirty: 'cleaning',
      in_progress: 'cleaning',
      inspected: 'available',
      ready: 'available',
    };
    const roomStatus = stageToRoom[stage] || 'cleaning';

    if (roomId) {
      await admin
        .from('hospitality_rooms')
        .update({ status: roomStatus, updated_at: new Date().toISOString() })
        .eq('business_id', businessId)
        .eq('id', roomId);
    } else if (roomNumber) {
      await admin
        .from('hospitality_rooms')
        .update({ status: roomStatus, updated_at: new Date().toISOString() })
        .eq('business_id', businessId)
        .eq('room_number', roomNumber);
    }

    // Prefer updating existing HK record; else create one
    const meta = {
      ...(body.meta || {}),
      room_id: roomId || undefined,
      room_number: roomNumber || undefined,
      stage,
      assignee: body.assignee || body.meta?.assignee || undefined,
      priority: body.priority || body.meta?.priority || 'medium',
    };
    if (roomId && !String(roomId).startsWith('booking-')) {
      // Try record_update first if this id is an industry_records row
      const existing = await admin
        .from('industry_records')
        .select('id, meta')
        .eq('id', roomId)
        .eq('business_id', businessId)
        .eq('product_edition', EDITION)
        .eq('module', 'housekeeping')
        .maybeSingle();
      if (existing.data?.id) {
        const { data, error } = await admin
          .from('industry_records')
          .update({
            status: stage,
            meta: { ...(existing.data.meta || {}), ...meta },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id)
          .select('*')
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true, record: data, roomStatus });
      }
    }

    const res = await insertRecord(admin, businessId, {
      module: 'housekeeping',
      title: roomNumber ? `Room ${roomNumber}` : 'Housekeeping task',
      status: stage,
      meta,
      notes: body.notes || null,
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, record: res.record, roomStatus });
  }

  if (action === 'room_service_create' || action === 'room_service_update') {
    const isUpdate = action === 'room_service_update';
    const id = String(body.id || '');
    if (isUpdate) {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.status != null) patch.status = body.status;
      if (body.title != null) patch.title = body.title;
      if (body.amount != null) patch.amount = Number(body.amount);
      if (body.notes != null) patch.notes = body.notes;
      if (body.meta != null) {
        const existing = await admin
          .from('industry_records')
          .select('meta')
          .eq('id', id)
          .eq('business_id', businessId)
          .maybeSingle();
        patch.meta = { ...(existing.data?.meta || {}), ...body.meta };
      }
      const { data, error } = await admin
        .from('industry_records')
        .update(patch)
        .eq('id', id)
        .eq('business_id', businessId)
        .eq('product_edition', EDITION)
        .eq('module', 'room-service')
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Optional: post total to folio when delivered/completed
      if (body.postToFolio && body.bookingId && Number(body.amount || data?.amount || 0) > 0) {
        try {
          await admin.from('hospitality_folio_lines').insert({
            business_id: businessId,
            booking_id: String(body.bookingId),
            line_type: 'charge',
            description: String(body.description || data?.title || 'Room service'),
            amount: Number(body.amount || data?.amount || 0),
          });
        } catch {
          /* ignore */
        }
      }
      return NextResponse.json({ ok: true, record: data });
    }

    const res = await insertRecord(admin, businessId, {
      module: 'room-service',
      title: body.title || body.code || 'Room service order',
      status: body.status || 'received',
      amount: Number(body.amount || body.total || 0),
      notes: body.notes || null,
      meta: body.meta || {
        room_number: body.roomNumber,
        guest_name: body.guestName,
        items: body.items || [],
        booking_id: body.bookingId || null,
      },
    });
    if (res.error) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ ok: true, record: res.record });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/attendance
 * body: { action: 'clock_in' | 'clock_out', businessId, staffId?, staffName? }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '').toLowerCase();
    const businessId = String(
      body.businessId ||
        user.user_metadata?.businessId ||
        user.user_metadata?.business_id ||
        ''
    ).trim();
    const staffId = String(body.staffId || user.id);
    const staffName =
      body.staffName ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Staff';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (action !== 'clock_in' && action !== 'clock_out') {
      return NextResponse.json({ error: 'action must be clock_in or clock_out' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'clock_in') {
      // Prevent double open shift
      const { data: openRows } = await supabase
        .from('attendance')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .is('check_out', null)
        .limit(5);

      if (openRows && openRows.length > 0) {
        return NextResponse.json({
          ok: true,
          alreadyOpen: true,
          id: openRows[0].id,
        });
      }

      const id = crypto.randomUUID();
      const note = JSON.stringify({
        status: 'clocked_in',
        staffName,
        staffId,
      });

      const { error } = await supabase.from('attendance').insert({
        id,
        business_id: businessId,
        user_id: user.id,
        check_in: now,
        check_out: null,
        note,
        created_at: now,
      });

      if (error) {
        console.error('[attendance] clock_in', error);
        return NextResponse.json(
          { error: error.message || 'Failed to clock in' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, id, checkIn: now });
    }

    // clock_out
    const { data: openRows } = await supabase
      .from('attendance')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .is('check_out', null)
      .order('check_in', { ascending: false })
      .limit(1);

    const open = openRows?.[0];
    if (!open) {
      return NextResponse.json({ error: 'No open shift to clock out' }, { status: 404 });
    }

    let note = open.note;
    try {
      const parsed =
        typeof note === 'string' && note.startsWith('{')
          ? JSON.parse(note)
          : { staffName, staffId };
      parsed.status = 'clocked_out';
      note = JSON.stringify(parsed);
    } catch {
      note = JSON.stringify({ status: 'clocked_out', staffName, staffId });
    }

    const { error } = await supabase
      .from('attendance')
      .update({ check_out: now, note })
      .eq('id', open.id)
      .eq('business_id', businessId);

    if (error) {
      console.error('[attendance] clock_out', error);
      return NextResponse.json(
        { error: error.message || 'Failed to clock out' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: open.id, checkOut: now });
  } catch (err: any) {
    console.error('[attendance]', err);
    return NextResponse.json(
      { error: err?.message || 'Attendance failed' },
      { status: 500 }
    );
  }
}

/** GET /api/staff/attendance?businessId= */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const user = userData.user;
    const businessId = String(
      req.nextUrl.searchParams.get('businessId') ||
        user.user_metadata?.businessId ||
        user.user_metadata?.business_id ||
        ''
    ).trim();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, records: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load attendance' },
      { status: 500 }
    );
  }
}

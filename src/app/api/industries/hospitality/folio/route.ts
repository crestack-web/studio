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
  const bookingId = req.nextUrl.searchParams.get('bookingId');
  if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: booking } = await admin
    .from('hospitality_bookings')
    .select('*')
    .eq('id', bookingId)
    .eq('business_id', businessId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const { data: lines, error } = await admin
    .from('hospitality_folio_lines')
    .select('*')
    .eq('booking_id', bookingId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({
      ok: true,
      booking,
      lines: [],
      totals: { charges: Number(booking.amount || 0), payments: Number(booking.deposit_amount || 0), balance: Number(booking.balance_amount ?? booking.amount ?? 0) },
      warning: error.message,
    });
  }

  const charges = (lines || [])
    .filter((l) => l.line_type === 'charge' || l.line_type === 'adjustment')
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const payments = (lines || [])
    .filter((l) => l.line_type === 'payment')
    .reduce((s, l) => s + Number(l.amount || 0), 0);

  return NextResponse.json({
    ok: true,
    booking,
    lines: lines || [],
    totals: { charges, payments, balance: Math.max(0, charges - payments) },
  });
}

export async function POST(req: NextRequest) {
  const businessId = await biz(req);
  if (!businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const bookingId = String(body.bookingId || body.booking_id || '');
  const description = String(body.description || '').trim();
  const line_type = String(body.lineType || body.line_type || 'charge');
  const amount = Number(body.amount || 0);
  if (!bookingId || !description) {
    return NextResponse.json({ error: 'bookingId and description required' }, { status: 400 });
  }
  if (!['charge', 'payment', 'adjustment'].includes(line_type)) {
    return NextResponse.json({ error: 'Invalid line type' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: booking } = await admin
    .from('hospitality_bookings')
    .select('id')
    .eq('id', bookingId)
    .eq('business_id', businessId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const { data, error } = await admin
    .from('hospitality_folio_lines')
    .insert({
      business_id: businessId,
      booking_id: bookingId,
      line_type,
      description,
      amount,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Refresh balance on booking
  const { data: lines } = await admin
    .from('hospitality_folio_lines')
    .select('line_type, amount')
    .eq('booking_id', bookingId);
  const charges = (lines || [])
    .filter((l) => l.line_type === 'charge' || l.line_type === 'adjustment')
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const payments = (lines || [])
    .filter((l) => l.line_type === 'payment')
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  await admin
    .from('hospitality_bookings')
    .update({
      amount: charges,
      balance_amount: Math.max(0, charges - payments),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .eq('business_id', businessId);

  return NextResponse.json({
    ok: true,
    line: data,
    totals: { charges, payments, balance: Math.max(0, charges - payments) },
  });
}

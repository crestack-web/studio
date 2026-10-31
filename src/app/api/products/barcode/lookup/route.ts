import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { normalizeBarcode } from '@/lib/barcode/generate';
import { assertBusinessAccess } from '@/app/api/mo-sales/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/products/barcode/lookup?businessId=&barcode=
 * Requires auth + membership for the business. Never trusts businessId alone.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const businessId = String(sp.get('businessId') || '').trim();
    const barcode = normalizeBarcode(sp.get('barcode') || '');
    if (!businessId || !barcode) {
      return NextResponse.json({ error: 'businessId and barcode required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(userData.user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const { data: byBarcode, error: bErr } = await supabase
      .from('products')
      .select('id, name, sku, barcode, price, cost, stock_level, category, business_id, image_url, status')
      .eq('business_id', businessId)
      .eq('barcode', barcode)
      .limit(5);

    if (bErr) {
      console.error('[barcode/lookup]', bErr);
      return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }

    if (byBarcode && byBarcode.length) {
      return NextResponse.json({ found: true, matchType: 'barcode', products: byBarcode });
    }

    const { data: bySku } = await supabase
      .from('products')
      .select('id, name, sku, barcode, price, cost, stock_level, category, business_id, image_url, status')
      .eq('business_id', businessId)
      .ilike('sku', barcode)
      .limit(5);

    if (bySku && bySku.length) {
      return NextResponse.json({ found: true, matchType: 'sku', products: bySku });
    }

    return NextResponse.json({ found: false, products: [] });
  } catch (e: any) {
    console.error('[barcode/lookup]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

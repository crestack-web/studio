import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { proposeBusmoBarcode, normalizeBarcode } from '@/lib/barcode/generate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/products/barcode/generate
 * body: { businessId, seed? }
 * Returns a unique-within-business Busmo internal barcode (BSM-…).
 * Does not write the product — client assigns on save.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    // Collision-resistant generation with a few retries
    let barcode = '';
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = normalizeBarcode(proposeBusmoBarcode(businessId.slice(-4)));
      const { data } = await supabase
        .from('products')
        .select('id')
        .eq('business_id', businessId)
        .eq('barcode', candidate)
        .limit(1);
      if (!data || data.length === 0) {
        barcode = candidate;
        break;
      }
    }

    if (!barcode) {
      return NextResponse.json({ error: 'Could not allocate unique barcode' }, { status: 500 });
    }

    return NextResponse.json({
      barcode,
      symbology: 'Code128',
      note: 'Busmo internal identifier — not a GS1 GTIN',
    });
  } catch (e: any) {
    console.error('[barcode/generate]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

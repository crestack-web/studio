import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { proposeBusmoBarcode, normalizeBarcode } from '@/lib/barcode/generate';
import { assertBusinessAccess } from '@/app/api/mo-sales/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/products/barcode/generate
 * body: { businessId } | { businessId, productIds: string[] } for bulk fill missing
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

    const access = await assertBusinessAccess(userData.user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const productIds: string[] = Array.isArray(body.productIds)
      ? body.productIds.map((x: any) => String(x))
      : [];

    async function allocateOne(): Promise<string | null> {
      for (let attempt = 0; attempt < 12; attempt++) {
        const candidate = normalizeBarcode(proposeBusmoBarcode(businessId.slice(-4)));
        const { data } = await supabase
          .from('products')
          .select('id')
          .eq('business_id', businessId)
          .eq('barcode', candidate)
          .limit(1);
        if (!data || data.length === 0) return candidate;
      }
      return null;
    }

    // Single generate (no write)
    if (!productIds.length) {
      const barcode = await allocateOne();
      if (!barcode) {
        return NextResponse.json({ error: 'Could not allocate unique barcode' }, { status: 500 });
      }
      return NextResponse.json({
        barcode,
        symbology: 'Code128',
        note: 'Busmo internal identifier — not a GS1 GTIN',
      });
    }

    // Bulk: only products missing barcode
    const { data: rows, error: listErr } = await supabase
      .from('products')
      .select('id, name, barcode, sku')
      .eq('business_id', businessId)
      .in('id', productIds);

    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }

    const results: { id: string; name?: string; barcode?: string; status: string; error?: string }[] = [];
    for (const row of rows || []) {
      const existing = String((row as any).barcode || '').trim();
      if (existing) {
        results.push({ id: row.id, name: row.name, barcode: existing, status: 'skipped_has_barcode' });
        continue;
      }
      const barcode = await allocateOne();
      if (!barcode) {
        results.push({ id: row.id, name: row.name, status: 'failed', error: 'allocate' });
        continue;
      }
      const { error: upErr } = await supabase
        .from('products')
        .update({ barcode, updated_at: new Date().toISOString() })
        .eq('id', row.id)
        .eq('business_id', businessId)
        .is('barcode', null);

      // also allow empty string barcodes
      if (upErr) {
        const { error: upErr2 } = await supabase
          .from('products')
          .update({ barcode, updated_at: new Date().toISOString() })
          .eq('id', row.id)
          .eq('business_id', businessId);
        if (upErr2) {
          results.push({ id: row.id, name: row.name, status: 'failed', error: upErr2.message });
          continue;
        }
      }
      results.push({ id: row.id, name: row.name, barcode, status: 'generated' });
    }

    return NextResponse.json({
      results,
      generated: results.filter((r) => r.status === 'generated').length,
      skipped: results.filter((r) => r.status === 'skipped_has_barcode').length,
      failed: results.filter((r) => r.status === 'failed').length,
      note: 'Busmo internal identifiers — not GS1 GTINs',
    });
  } catch (e: any) {
    console.error('[barcode/generate]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

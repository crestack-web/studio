import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { assertBusinessAccess } from '@/app/api/mo-sales/_auth';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReceiveItem = {
  productId: string;
  quantity: number;
  unitCost?: number;
  location?: string;
  productName?: string;
};

/**
 * POST /api/inventory/receive
 * Idempotent stock increment for authorized business members.
 * body: { businessId, operationId, receiptNumber?, items: ReceiveItem[], supplierId?, supplierName?, paymentMethod?, totalCost? }
 *
 * If the same operationId is submitted again for the business, stock is NOT applied twice.
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
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const operationId = String(body.operationId || '').trim();
    const items: ReceiveItem[] = Array.isArray(body.items) ? body.items : [];

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!operationId) {
      return NextResponse.json({ error: 'operationId required for idempotency' }, { status: 400 });
    }
    if (!items.length) {
      return NextResponse.json({ error: 'items required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(userId, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    // Already applied?
    const { data: existing } = await supabase
      .from('stock_receipts')
      .select('id, operation_id, metadata')
      .eq('business_id', businessId)
      .eq('operation_id', operationId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        duplicate: true,
        receiptId: existing.id,
        message: 'Receipt already applied — stock not changed again',
      });
    }

    // Validate items
    const normalized = items
      .map((it) => ({
        productId: String(it.productId || '').trim(),
        quantity: Number(it.quantity) || 0,
        unitCost: Number(it.unitCost) || 0,
        location: it.location ? String(it.location) : '',
        productName: it.productName ? String(it.productName) : '',
      }))
      .filter((it) => it.productId && it.quantity > 0);

    if (!normalized.length) {
      return NextResponse.json({ error: 'No valid receive lines' }, { status: 400 });
    }

    const receiptId = randomUUID();
    const receiptNumber =
      String(body.receiptNumber || '').trim() ||
      `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    // Insert receipt first (unique operation_id) — if race, second writer gets conflict
    const { error: insErr } = await supabase.from('stock_receipts').insert({
      id: receiptId,
      business_id: businessId,
      operation_id: operationId,
      receipt_number: receiptNumber,
      items: normalized,
      supplier_id: body.supplierId ? String(body.supplierId) : null,
      supplier_name: body.supplierName ? String(body.supplierName) : null,
      total_cost: Number(body.totalCost) || 0,
      payment_method: body.paymentMethod ? String(body.paymentMethod) : null,
      created_by: userId,
      note: body.note ? String(body.note).slice(0, 2000) : null,
      metadata: {
        source: 'api_inventory_receive',
        operationId,
        receiptNumber,
      },
    });

    if (insErr) {
      // Unique violation = concurrent duplicate
      if (String(insErr.code) === '23505' || /duplicate|unique/i.test(insErr.message || '')) {
        return NextResponse.json({
          ok: true,
          duplicate: true,
          message: 'Receipt already applied — stock not changed again',
        });
      }
      console.error('[inventory/receive] insert', insErr);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    const stockErrors: string[] = [];
    for (const it of normalized) {
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('id, stock_level, metadata')
        .eq('business_id', businessId)
        .eq('id', it.productId)
        .maybeSingle();

      if (pErr || !prod) {
        stockErrors.push(`${it.productId}: not found`);
        continue;
      }
      const current = Number((prod as any).stock_level) || 0;
      const next = current + it.quantity;
      const meta = ((prod as any).metadata as Record<string, unknown>) || {};
      const stockByLocation =
        (meta.stockByLocation as Record<string, number>) ||
        ((prod as any).stockByLocation as Record<string, number>) ||
        {};
      if (it.location) {
        stockByLocation[it.location] =
          (Number(stockByLocation[it.location]) || 0) + it.quantity;
      }

      const { error: uErr } = await supabase
        .from('products')
        .update({
          stock_level: next,
          cost: it.unitCost > 0 ? it.unitCost : undefined,
          updated_at: new Date().toISOString(),
          metadata: { ...meta, stockByLocation },
        })
        .eq('id', it.productId)
        .eq('business_id', businessId);

      if (uErr) stockErrors.push(`${it.productId}: ${uErr.message}`);
    }

    return NextResponse.json({
      ok: true,
      duplicate: false,
      receiptId,
      receiptNumber,
      stockErrors: stockErrors.length ? stockErrors : undefined,
    });
  } catch (e: any) {
    console.error('[inventory/receive]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

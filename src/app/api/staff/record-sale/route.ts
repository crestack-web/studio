import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/record-sale
 * Service-role write so staff can record sales even when RLS blocks
 * client inserts on `sales` / `products`.
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

    const staffUser = userData.user;
    const body = await req.json().catch(() => ({}));

    const businessId = String(
      body.businessId ||
        staffUser.user_metadata?.businessId ||
        staffUser.user_metadata?.business_id ||
        ''
    ).trim();

    const products = Array.isArray(body.products) ? body.products : [];
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!products.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Confirm this user is staff of the business (metadata or users/staff row)
    const metaBiz =
      staffUser.user_metadata?.businessId || staffUser.user_metadata?.business_id;
    let allowed = metaBiz && String(metaBiz) === businessId;

    if (!allowed) {
      const { data: staffRow } = await supabase
        .from('staff')
        .select('id, status, business_id')
        .eq('user_id', staffUser.id)
        .eq('business_id', businessId)
        .maybeSingle();
      if (staffRow && String(staffRow.status || 'active').toLowerCase() !== 'removed') {
        allowed = true;
      }
    }

    if (!allowed) {
      const { data: userRow } = await supabase
        .from('users')
        .select('business_id, businessId, role')
        .eq('id', staffUser.id)
        .maybeSingle();
      const ub =
        (userRow as any)?.business_id || (userRow as any)?.businessId || null;
      if (ub && String(ub) === businessId) allowed = true;
    }

    // Staff portal only exposes one businessId from invite metadata / resolve.
    // Trust session staff markers when businessId is present.
    if (!allowed) {
      const meta = staffUser.user_metadata || {};
      const isStaffAccount = Boolean(
        meta.staffId ||
          meta.staff_id ||
          ['staff', 'cashier', 'manager', 'seller', 'attendant', 'clerk'].includes(
            String(meta.role || '').toLowerCase()
          )
      );
      if (isStaffAccount && businessId) {
        allowed = true;
        console.log('[staff/record-sale] allowed via staff metadata + businessId');
      }
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'You are not allowed to record sales for this business' },
        { status: 403 }
      );
    }

    const total = Number(body.total) || 0;
    const paymentMethod = String(body.paymentMethod || 'cash');
    const paymentMethods = body.paymentMethods || {};
    const note = body.note ? String(body.note).slice(0, 2000) : '';
    const staffName =
      body.staffName ||
      staffUser.user_metadata?.full_name ||
      staffUser.user_metadata?.name ||
      staffUser.email?.split('@')[0] ||
      'Staff';
    const staffRole = body.staffRole || staffUser.user_metadata?.role || 'Staff';
    const staffId = body.staffId || staffUser.id;

    const normalizedProducts = products.map((p: any) => ({
      productId: String(p.productId || p.id || ''),
      name: String(p.name || 'Product'),
      price: Number(p.price) || 0,
      costPrice: Number(p.costPrice || p.cost || 0) || 0,
      quantity: Number(p.quantity || p.qty || 1) || 1,
    }));

    const profit = normalizedProducts.reduce(
      (acc: number, p: any) => acc + (p.price - p.costPrice) * p.quantity,
      0
    );
    const totalCost = normalizedProducts.reduce(
      (acc: number, p: any) => acc + p.costPrice * p.quantity,
      0
    );

    const saleId = crypto.randomUUID();
    const now = new Date().toISOString();

    const paymentBreakdown = Array.isArray(body.paymentBreakdown)
      ? body.paymentBreakdown
      : Object.keys(paymentMethods).length
        ? Object.entries(paymentMethods).map(([method, amount]) => ({
            method,
            amount: Number(amount) || 0,
            received: true,
          }))
        : [{ method: paymentMethod, amount: total, received: true }];

    const row: Record<string, unknown> = {
      id: saleId,
      business_id: businessId,
      items: normalizedProducts,
      total_amount: total,
      total_revenue: total,
      profit,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now,
      metadata: {
        products: normalizedProducts,
        items: normalizedProducts,
        total,
        totalRevenue: total,
        totalCost,
        profit,
        paymentMethods,
        paymentBreakdown,
        notes: note,
        soldBy: staffId,
        soldByName: staffName,
        recordedBy: {
          uid: staffUser.id,
          email: staffUser.email,
          displayName: staffName,
          role: staffRole,
          staffId,
        },
        source: 'staff_portal',
      },
    };

    let insertErr = (await supabase.from('sales').insert(row)).error;
    if (insertErr) {
      console.warn('[staff/record-sale] full insert failed, trying minimal row', insertErr.message);
      // Minimal schema fallback (some projects lack total_revenue / profit columns)
      const minimal = {
        id: saleId,
        business_id: businessId,
        items: normalizedProducts,
        total_amount: total,
        payment_method: paymentMethod,
        status: 'completed',
        created_at: now,
        metadata: row.metadata,
      };
      insertErr = (await supabase.from('sales').insert(minimal)).error;
    }
    if (insertErr) {
      console.error('[staff/record-sale] insert error', insertErr);
      return NextResponse.json(
        {
          error:
            insertErr.message ||
            insertErr.details ||
            'Failed to save sale',
          code: insertErr.code,
          hint: insertErr.hint,
        },
        { status: 500 }
      );
    }

    // Decrement stock (best-effort per product)
    const stockErrors: string[] = [];
    for (const p of normalizedProducts) {
      if (!p.productId) continue;
      try {
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('id, stock_level, metadata')
          .eq('id', p.productId)
          .eq('business_id', businessId)
          .maybeSingle();

        if (prodErr) {
          stockErrors.push(`${p.name}: ${prodErr.message}`);
          continue;
        }
        if (!prod) {
          stockErrors.push(`${p.name}: product not found`);
          continue;
        }

        const current =
          Number((prod as any).stock_level) ||
          Number((prod as any).stock) ||
          0;
        const next = Math.max(0, current - p.quantity);

        const { error: upErr } = await supabase
          .from('products')
          .update({
            stock_level: next,
            updated_at: now,
          })
          .eq('id', p.productId)
          .eq('business_id', businessId);

        if (upErr) stockErrors.push(`${p.name}: ${upErr.message}`);
      } catch (e: any) {
        stockErrors.push(`${p.name}: ${e?.message || 'stock update failed'}`);
      }
    }

    console.log('[staff/record-sale] ok', saleId, 'biz', businessId, 'staff', staffUser.id);

    return NextResponse.json({
      ok: true,
      saleId,
      stockErrors: stockErrors.length ? stockErrors : undefined,
    });
  } catch (err: any) {
    console.error('[staff/record-sale]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to record sale' },
      { status: 500 }
    );
  }
}

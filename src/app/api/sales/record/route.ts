import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return r === 'owner' || r === 'admin' || r === 'business owner';
}

function isStaffRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return [
    'staff',
    'cashier',
    'manager',
    'store manager',
    'seller',
    'sales attendant',
    'attendant',
    'clerk',
    'supervisor',
    'assistant',
  ].includes(r);
}

/**
 * POST /api/sales/record
 * Shared owner + staff sale write (service role).
 * Used by online staff sales and offline queue sync for everyone.
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
    const meta = user.user_metadata || {};
    const body = await req.json().catch(() => ({}));

    const businessId = String(
      body.businessId || meta.businessId || meta.business_id || ''
    ).trim();
    const products = Array.isArray(body.products) ? body.products : [];

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!products.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ── Authorization: owner of business OR staff of business ──────────
    let allowed = false;

    // Metadata business match
    const metaBiz = meta.businessId || meta.business_id;
    if (metaBiz && String(metaBiz) === businessId) {
      allowed = true;
    }

    // Owner via businesses.owner_id
    if (!allowed) {
      const { data: business } = await supabase
        .from('businesses')
        .select('id, owner_id, ownerId, user_id')
        .eq('id', businessId)
        .maybeSingle();
      const ownerId =
        business?.owner_id || business?.ownerId || business?.user_id || null;
      if (ownerId && String(ownerId) === user.id) allowed = true;
    }

    // Users table
    if (!allowed) {
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (userRow) {
        const ub = (userRow as any).business_id || (userRow as any).businessId;
        if (ub && String(ub) === businessId) allowed = true;
        if (isOwnerRole((userRow as any).role) && ub && String(ub) === businessId) {
          allowed = true;
        }
      }
    }

    // Staff table
    if (!allowed) {
      const { data: staffRow } = await supabase
        .from('staff')
        .select('id, status, business_id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle();
      if (staffRow && String(staffRow.status || 'active').toLowerCase() !== 'removed') {
        allowed = true;
      }
    }

    // Invited staff markers
    if (!allowed && (meta.staffId || meta.staff_id || isStaffRole(meta.role))) {
      if (businessId) allowed = true;
    }

    // Owner role in metadata with businessId
    if (!allowed && isOwnerRole(meta.role) && businessId) {
      allowed = true;
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
    const offlineId = body.offlineId ? String(body.offlineId) : null;

    const displayName =
      body.staffName ||
      meta.full_name ||
      meta.name ||
      user.email?.split('@')[0] ||
      'User';
    const role =
      body.staffRole ||
      meta.role ||
      (meta.staffId || meta.staff_id ? 'Staff' : 'Owner');
    const actorId = body.staffId || user.id;

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

    const metadata: Record<string, unknown> = {
      products: normalizedProducts,
      items: normalizedProducts,
      total,
      totalRevenue: total,
      totalCost,
      profit,
      paymentMethods,
      paymentBreakdown,
      notes: note,
      soldBy: actorId,
      soldByName: displayName,
      recordedBy: {
        uid: user.id,
        email: user.email,
        displayName,
        role,
        staffId: body.staffId || meta.staffId || null,
      },
      source: offlineId ? 'offline_sync' : 'app',
      offlineId,
    };

    const fullRow: Record<string, unknown> = {
      id: saleId,
      business_id: businessId,
      items: normalizedProducts,
      total_amount: total,
      total_revenue: total,
      profit,
      payment_method: paymentMethod,
      status: 'completed',
      created_at: now,
      metadata,
    };

    let insertErr = (await supabase.from('sales').insert(fullRow)).error;
    if (insertErr) {
      console.warn('[sales/record] full insert failed, trying minimal', insertErr.message);
      const minimal = {
        id: saleId,
        business_id: businessId,
        items: normalizedProducts,
        total_amount: total,
        payment_method: paymentMethod,
        status: 'completed',
        created_at: now,
        metadata,
      };
      insertErr = (await supabase.from('sales').insert(minimal)).error;
    }

    if (insertErr) {
      console.error('[sales/record] insert error', insertErr);
      return NextResponse.json(
        {
          error: insertErr.message || insertErr.details || 'Failed to save sale',
          code: insertErr.code,
          hint: insertErr.hint,
        },
        { status: 500 }
      );
    }

    const stockErrors: string[] = [];
    for (const p of normalizedProducts) {
      if (!p.productId) continue;
      try {
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('id, stock_level')
          .eq('id', p.productId)
          .eq('business_id', businessId)
          .maybeSingle();

        if (prodErr || !prod) {
          stockErrors.push(`${p.name}: ${prodErr?.message || 'not found'}`);
          continue;
        }

        const current = Number((prod as any).stock_level) || 0;
        const next = Math.max(0, current - p.quantity);
        const { error: upErr } = await supabase
          .from('products')
          .update({ stock_level: next, updated_at: now })
          .eq('id', p.productId)
          .eq('business_id', businessId);

        if (upErr) stockErrors.push(`${p.name}: ${upErr.message}`);
      } catch (e: any) {
        stockErrors.push(`${p.name}: ${e?.message || 'stock update failed'}`);
      }
    }

    console.log('[sales/record] ok', saleId, 'biz', businessId, 'user', user.id);

    return NextResponse.json({
      ok: true,
      saleId,
      stockErrors: stockErrors.length ? stockErrors : undefined,
    });
  } catch (err: any) {
    console.error('[sales/record]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to record sale' },
      { status: 500 }
    );
  }
}

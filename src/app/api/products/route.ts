import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function assertCanWriteBusiness(userId: string, businessId: string) {
  const admin = getSupabaseAdmin();

  // Signup convention
  if (businessId === userId) return true;

  const { data: biz } = await admin
    .from('businesses')
    .select('id, owner_id, ownerId, user_id')
    .eq('id', businessId)
    .maybeSingle();

  if (biz) {
    const owner = (biz as any).owner_id || (biz as any).ownerId || (biz as any).user_id;
    if (!owner || String(owner) === String(userId)) return true;
  }

  const { data: profile } = await admin
    .from('users')
    .select('business_id, businessId, role')
    .eq('id', userId)
    .maybeSingle();

  const bid =
    (profile as any)?.business_id || (profile as any)?.businessId || null;
  if (bid && String(bid) === String(businessId)) return true;

  const role = String((profile as any)?.role || '').toLowerCase();
  if (['admin', 'superadmin'].includes(role)) return true;

  return false;
}

/**
 * POST /api/products
 * Body: { businessId, product: Record<string, unknown> }
 * Inserts/updates a product using service role after ownership check.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const businessId = String(body.businessId || '').trim();
    const product = body.product as Record<string, unknown> | undefined;
    const mode = body.mode === 'update' ? 'update' : 'insert';
    const productId = body.productId ? String(body.productId) : null;

    if (!businessId || !product) {
      return NextResponse.json(
        { error: 'businessId and product are required' },
        { status: 400 }
      );
    }

    const allowed = await assertCanWriteBusiness(user.id, businessId);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden: not a member of this business' },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    const id =
      productId ||
      (typeof product.id === 'string' && product.id
        ? product.id
        : crypto.randomUUID());

    // Normalize to products table columns + metadata
    const metadata: Record<string, unknown> = {
      ...((product.metadata as object) || {}),
    };
    const known = new Set([
      'name',
      'description',
      'category',
      'sku',
      'barcode',
      'price',
      'cost',
      'stock_level',
      'reorder_level',
      'unit',
      'image_url',
      'tags',
      'status',
      'metadata',
      'id',
      'business_id',
      'created_at',
      'updated_at',
    ]);

    const aliases: Record<string, string> = {
      stock: 'stock_level',
      stockLevel: 'stock_level',
      quantity: 'stock_level',
      costPrice: 'cost',
      sellingPrice: 'price',
      reorderLevel: 'reorder_level',
      imageUrl: 'image_url',
      lowStockThreshold: 'reorder_level',
    };

    const row: Record<string, unknown> = {
      id,
      business_id: businessId,
      updated_at: new Date().toISOString(),
    };

    for (const [key, value] of Object.entries(product)) {
      if (key === 'id' || key === 'businessId' || key === 'business_id') continue;
      if (key === 'active' && typeof value === 'boolean') {
        row.status = value ? 'active' : 'inactive';
        continue;
      }
      const col = aliases[key] || key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
      if (known.has(col) && col !== 'metadata') {
        row[col] = value;
      } else if (key === 'metadata' && value && typeof value === 'object') {
        Object.assign(metadata, value as object);
      } else {
        metadata[key] = value;
      }
    }

    // Coerce integers
    if (row.stock_level != null) {
      row.stock_level = Math.max(0, Math.round(Number(row.stock_level) || 0));
    }
    if (row.reorder_level != null) {
      row.reorder_level = Math.max(0, Math.round(Number(row.reorder_level) || 0));
    }
    if (row.price != null) row.price = Number(row.price) || 0;
    if (row.cost != null) row.cost = Number(row.cost) || 0;
    if (!row.status) row.status = 'active';
    if (!row.name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    row.metadata = metadata;

    if (mode === 'update') {
      const { error } = await admin
        .from('products')
        .update(row)
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) {
        console.error('[api/products] update', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      if (!row.created_at) row.created_at = new Date().toISOString();
      const { error } = await admin.from('products').upsert(row, { onConflict: 'id' });
      if (error) {
        console.error('[api/products] insert', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    // Best-effort: keep users.business_id linked for future RLS
    try {
      await admin
        .from('users')
        .update({ business_id: businessId, businessId })
        .eq('id', user.id);
    } catch {
      /* ignore */
    }

    return NextResponse.json({ success: true, id });
  } catch (e: any) {
    console.error('[api/products]', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const businessId = String(body.businessId || '').trim();
    const productId = String(body.productId || '').trim();
    if (!businessId || !productId) {
      return NextResponse.json(
        { error: 'businessId and productId required' },
        { status: 400 }
      );
    }
    const allowed = await assertCanWriteBusiness(user.id, businessId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

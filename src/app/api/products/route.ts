import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  // Preferred: pass JWT directly to getUser
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (!error && data.user) return data.user;

  // Fallback: Authorization header on client
  const client2 = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const res2 = await client2.auth.getUser();
  if (!res2.error && res2.data.user) return res2.data.user;
  return null;
}

/**
 * Ensure the business row exists and the user is allowed to write products for it.
 * Creates a minimal businesses row when missing (signup often only wrote Firestore).
 */
async function ensureBusinessAccess(userId: string, businessId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const admin = getSupabaseAdmin();

  // Always allow the Busmo signup convention: business id === auth uid
  const isSelfBiz = businessId === userId;

  const { data: biz, error: bizErr } = await admin
    .from('businesses')
    .select('id, owner_id, name')
    .eq('id', businessId)
    .maybeSingle();

  if (bizErr) {
    console.warn('[api/products] businesses select', bizErr.message);
  }

  if (biz) {
    const owner = (biz as any).owner_id;
    if (owner && String(owner) !== String(userId) && !isSelfBiz) {
      // Another owner — deny
      // Still allow if profile points here (shared edge cases)
      const { data: profile } = await admin
        .from('users')
        .select('business_id, role')
        .eq('id', userId)
        .maybeSingle();
      const linked = (profile as any)?.business_id;
      if (linked && String(linked) === String(businessId)) return { ok: true };
      const role = String((profile as any)?.role || '').toLowerCase();
      if (['admin', 'superadmin'].includes(role)) return { ok: true };
      return { ok: false, reason: 'Not the owner of this business' };
    }
    // No owner or matches current user
    if (!owner) {
      await admin
        .from('businesses')
        .update({ owner_id: userId })
        .eq('id', businessId)
        .is('owner_id', null);
    }
    return { ok: true };
  }

  // Business row missing in Postgres — create it so FK + RLS paths work
  if (isSelfBiz) {
    const { error: insErr } = await admin.from('businesses').upsert(
      {
        id: businessId,
        owner_id: userId,
        name: 'My Business',
        category: 'restaurant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (insErr) {
      console.error('[api/products] create business', insErr);
      // Continue — product insert may still work if FK is deferred or not enforced
    }
    return { ok: true };
  }

  // Profile-linked business id
  const { data: profile } = await admin
    .from('users')
    .select('business_id, role')
    .eq('id', userId)
    .maybeSingle();
  const linked = (profile as any)?.business_id;
  if (linked && String(linked) === String(businessId)) {
    const { error: insErr } = await admin.from('businesses').upsert(
      {
        id: businessId,
        owner_id: userId,
        name: 'My Business',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (insErr) console.error('[api/products] create linked business', insErr);
    return { ok: true };
  }

  const role = String((profile as any)?.role || '').toLowerCase();
  if (['admin', 'superadmin'].includes(role)) return { ok: true };

  // Last resort for authenticated owners: if they claim this businessId and
  // no other owner holds it, allow and create the row
  const { error: createErr } = await admin.from('businesses').upsert(
    {
      id: businessId,
      owner_id: userId,
      name: 'My Business',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );
  if (!createErr) return { ok: true };

  return {
    ok: false,
    reason: `Cannot access business ${businessId}: ${createErr.message}`,
  };
}

function buildProductRow(
  businessId: string,
  product: Record<string, unknown>,
  id: string,
  mode: 'insert' | 'update'
) {
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
    ingredientUnit: 'unit',
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
    const col =
      aliases[key] ||
      key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (known.has(col) && col !== 'metadata') {
      row[col] = value;
    } else if (key === 'metadata' && value && typeof value === 'object') {
      Object.assign(metadata, value as object);
    } else {
      // Keep kitchen-specific fields in metadata
      metadata[key] = value;
    }
  }

  if (row.stock_level != null) {
    row.stock_level = Math.max(0, Math.round(Number(row.stock_level) || 0));
  } else {
    row.stock_level = 0;
  }
  if (row.reorder_level != null) {
    row.reorder_level = Math.max(0, Math.round(Number(row.reorder_level) || 0));
  } else {
    row.reorder_level = 10;
  }
  if (row.price != null) row.price = Number(row.price) || 0;
  else row.price = 0;
  if (row.cost != null) row.cost = Number(row.cost) || 0;
  else row.cost = 0;
  if (!row.status) row.status = 'active';
  if (!row.unit) row.unit = (metadata.ingredientUnit as string) || 'unit';
  if (!row.tags) row.tags = [];
  if (!Array.isArray(row.tags)) row.tags = [];

  row.metadata = metadata;

  if (mode === 'insert' && !row.created_at) {
    row.created_at = new Date().toISOString();
  }

  return row;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[api/products] SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        {
          error:
            'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY missing. Product saves cannot bypass RLS.',
        },
        { status: 500 }
      );
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized — please sign in again' },
        { status: 401 }
      );
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

    if (!product.name || !String(product.name).trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const access = await ensureBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const id =
      productId ||
      (typeof product.id === 'string' && product.id
        ? product.id
        : crypto.randomUUID());

    const row = buildProductRow(businessId, product, id, mode);

    // Service role upsert — must not hit RLS
    const { data, error } = await admin
      .from('products')
      .upsert(row, { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[api/products] upsert error', error);
      // Surface real PostgREST message
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 400 }
      );
    }

    // Link profile for future RLS-friendly client reads
    try {
      await admin
        .from('users')
        .update({
          business_id: businessId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (e) {
      console.warn('[api/products] profile backfill failed', e);
    }

    return NextResponse.json({ success: true, id: data?.id || id });
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY missing' },
        { status: 500 }
      );
    }

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

    const access = await ensureBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Delete failed' },
      { status: 500 }
    );
  }
}

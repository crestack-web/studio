import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendStaffStockAlertToOwner } from '@/services/email/inventory-emails';

/**
 * POST /api/staff/stock-alert
 * Staff notifies the business owner about low / lost stock.
 * Body: { businessId, products: [{name, stock, ...}], note?, alertType? }
 * Auth: Bearer staff session (Supabase).
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
    const body = await req.json();
    const businessId = String(body.businessId || staffUser.user_metadata?.businessId || '').trim();
    const products = Array.isArray(body.products) ? body.products : [];
    const note = body.note ? String(body.note).slice(0, 1000) : undefined;
    const alertType = body.alertType === 'lost_stock' ? 'lost_stock' : 'low_stock';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!products.length) {
      return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
    }

    // Resolve owner email from business
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    const ownerId =
      business?.owner_id ||
      business?.ownerId ||
      business?.user_id ||
      business?.userId ||
      null;

    let ownerEmail: string | null = business?.owner_email || business?.ownerEmail || null;
    let ownerName = business?.owner_name || business?.ownerName || business?.name || 'Owner';
    const businessName =
      business?.business_name ||
      business?.businessName ||
      business?.name ||
      'your business';

    if (!ownerEmail && ownerId) {
      const { data: ownerRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', ownerId)
        .maybeSingle();
      ownerEmail = ownerRow?.email || null;
      ownerName =
        ownerRow?.display_name ||
        ownerRow?.displayName ||
        ownerRow?.full_name ||
        ownerRow?.name ||
        ownerName;
    }

    // Fallback: auth admin getUserById
    if (!ownerEmail && ownerId) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
        ownerEmail = authUser?.user?.email || null;
        if (!ownerName || ownerName === 'Owner') {
          ownerName =
            authUser?.user?.user_metadata?.full_name ||
            authUser?.user?.user_metadata?.name ||
            ownerName;
        }
      } catch {
        /* ignore */
      }
    }

    if (!ownerEmail) {
      return NextResponse.json(
        { error: 'Could not find owner email for this business' },
        { status: 404 }
      );
    }

    const staffName =
      staffUser.user_metadata?.full_name ||
      staffUser.user_metadata?.name ||
      staffUser.email?.split('@')[0] ||
      'Staff member';
    const staffRole = staffUser.user_metadata?.role || 'Staff';

    await sendStaffStockAlertToOwner({
      ownerEmail,
      ownerName,
      businessName,
      staffName,
      staffEmail: staffUser.email || undefined,
      staffRole,
      products: products.map((p: any) => ({
        name: String(p.name || 'Product'),
        stock: Number(p.stock) || 0,
        lowStockThreshold: p.lowStockThreshold != null ? Number(p.lowStockThreshold) : undefined,
        status: p.status,
      })),
      note,
      alertType,
    });

    // Best-effort audit log
    try {
      await supabase.from('audit_trail').insert({
        business_id: businessId,
        user_id: staffUser.id,
        action: 'staff_stock_alert',
        entity_type: 'inventory',
        details: {
          products,
          note,
          alertType,
          staffName,
          staffEmail: staffUser.email,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({ ok: true, emailed: ownerEmail });
  } catch (err: any) {
    console.error('[staff/stock-alert]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send stock alert' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendStaffStockAlertToOwner } from '@/services/email/inventory-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OwnerInfo = {
  email: string;
  name: string;
  businessName: string;
};

function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return r === 'owner' || r === 'admin' || r === 'business owner';
}

/**
 * Resolve the business owner's email from several possible sources.
 * Staff alerts must reach the real owner inbox via Resend.
 */
async function resolveOwner(supabase: ReturnType<typeof getSupabaseAdmin>, businessId: string): Promise<OwnerInfo> {
  let businessName = 'your business';
  let ownerEmail: string | null = null;
  let ownerName = 'Owner';
  let ownerId: string | null = null;

  // 1) Businesses table
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle();

  if (bizErr) {
    console.warn('[staff/stock-alert] businesses lookup:', bizErr.message);
  }

  if (business) {
    businessName =
      business.business_name ||
      business.businessName ||
      business.name ||
      businessName;
    ownerId =
      business.owner_id ||
      business.ownerId ||
      business.user_id ||
      business.userId ||
      null;
    ownerEmail =
      business.owner_email ||
      business.ownerEmail ||
      business.email ||
      null;
    ownerName =
      business.owner_name ||
      business.ownerName ||
      business.name ||
      ownerName;
  }

  // 2) Users linked to this business with Owner role
  if (!ownerEmail) {
    const { data: byBiz } = await supabase
      .from('users')
      .select('*')
      .or(`business_id.eq.${businessId},businessId.eq.${businessId}`)
      .limit(20);

    const owners = (byBiz || []).filter((u: any) => isOwnerRole(u.role));
    const pick = owners[0] || (byBiz || []).find((u: any) => u.email);
    if (pick?.email) {
      ownerEmail = pick.email;
      ownerName =
        pick.display_name ||
        pick.displayName ||
        pick.full_name ||
        pick.name ||
        ownerName;
      ownerId = pick.id || ownerId;
    }
  }

  // 3) Users by owner id
  if (!ownerEmail && ownerId) {
    const { data: ownerRow } = await supabase
      .from('users')
      .select('*')
      .eq('id', ownerId)
      .maybeSingle();
    if (ownerRow?.email) {
      ownerEmail = ownerRow.email;
      ownerName =
        ownerRow.display_name ||
        ownerRow.displayName ||
        ownerRow.full_name ||
        ownerRow.name ||
        ownerName;
    }
  }

  // 4) Auth admin API
  if (!ownerEmail && ownerId) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(ownerId);
      if (authUser?.user?.email) {
        ownerEmail = authUser.user.email;
        ownerName =
          authUser.user.user_metadata?.full_name ||
          authUser.user.user_metadata?.name ||
          ownerName;
      }
    } catch (e) {
      console.warn('[staff/stock-alert] auth.getUserById failed', e);
    }
  }

  // 5) Last resort: list users and match metadata.businessId
  if (!ownerEmail) {
    try {
      const { data: listed } = await supabase.auth.admin.listUsers({ perPage: 200 });
      const match = (listed?.users || []).find((u) => {
        const meta = u.user_metadata || {};
        const metaBiz = meta.businessId || meta.business_id;
        return metaBiz === businessId && isOwnerRole(meta.role || 'Owner');
      });
      // Prefer explicit owner role; otherwise any user with this businessId who is not staff-only
      const fallback = (listed?.users || []).find((u) => {
        const meta = u.user_metadata || {};
        return (meta.businessId || meta.business_id) === businessId && u.email;
      });
      const chosen = match || fallback;
      if (chosen?.email) {
        // Skip if this looks like a staff-only account (has staffId and non-owner role)
        const role = String(chosen.user_metadata?.role || '').toLowerCase();
        const isStaffOnly =
          chosen.user_metadata?.staffId &&
          role &&
          !isOwnerRole(role);
        if (!isStaffOnly) {
          ownerEmail = chosen.email;
          ownerName =
            chosen.user_metadata?.full_name ||
            chosen.user_metadata?.name ||
            ownerName;
        }
      }
    } catch (e) {
      console.warn('[staff/stock-alert] listUsers failed', e);
    }
  }

  if (!ownerEmail) {
    throw new Error(
      'Could not find the business owner email. Ask the owner to open Settings and confirm their account email.'
    );
  }

  return { email: ownerEmail, name: ownerName, businessName };
}

/**
 * POST /api/staff/stock-alert
 * Staff notifies the business owner about low / lost stock via Resend.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[staff/stock-alert] RESEND_API_KEY is missing');
      return NextResponse.json(
        { error: 'Email service is not configured (RESEND_API_KEY). Contact support.' },
        { status: 503 }
      );
    }

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
      body.businessId || staffUser.user_metadata?.businessId || staffUser.user_metadata?.business_id || ''
    ).trim();
    const products = Array.isArray(body.products) ? body.products : [];
    const note = body.note ? String(body.note).slice(0, 1000) : undefined;
    const alertType = body.alertType === 'lost_stock' ? 'lost_stock' : 'low_stock';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!products.length) {
      return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
    }

    console.log('[staff/stock-alert] resolving owner for business', businessId);

    const owner = await resolveOwner(supabase, businessId);
    console.log('[staff/stock-alert] owner resolved →', owner.email);

    const staffName =
      staffUser.user_metadata?.full_name ||
      staffUser.user_metadata?.name ||
      staffUser.email?.split('@')[0] ||
      'Staff member';
    const staffRole = staffUser.user_metadata?.role || 'Staff';

    const result = await sendStaffStockAlertToOwner({
      ownerEmail: owner.email,
      ownerName: owner.name,
      businessName: owner.businessName,
      staffName,
      staffEmail: staffUser.email || undefined,
      staffRole,
      products: products.map((p: any) => ({
        name: String(p.name || 'Product'),
        stock: Number(p.stock) || 0,
        lowStockThreshold:
          p.lowStockThreshold != null ? Number(p.lowStockThreshold) : undefined,
        status: p.status,
      })),
      note,
      alertType,
    });

    if (!result?.id) {
      console.error('[staff/stock-alert] Resend returned no message id', result);
      return NextResponse.json(
        { error: 'Email provider did not confirm delivery. Try again.' },
        { status: 502 }
      );
    }

    console.log('[staff/stock-alert] Resend message id', result.id, '→', owner.email);

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
          ownerEmail: owner.email,
          resendId: result.id,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      emailed: owner.email,
      messageId: result.id,
    });
  } catch (err: any) {
    console.error('[staff/stock-alert]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send stock alert' },
      { status: 500 }
    );
  }
}

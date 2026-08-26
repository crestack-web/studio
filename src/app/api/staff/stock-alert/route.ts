import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAdminDb, getNativeAdminFirestore, isAdminInitialized } from '@/lib/firebase-admin';
import { sendStaffStockAlertEmail } from '@/services/email/brevo-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return r === 'owner' || r === 'admin' || r === 'business owner';
}

/**
 * Resolve owner email the same way other Busmo server routes do:
 * Firestore admin first (source of truth for many businesses), then Supabase.
 */
async function resolveOwnerEmail(businessId: string): Promise<{
  email: string;
  name: string;
  businessName: string;
}> {
  let email: string | null = null;
  let name = 'Owner';
  let businessName = 'your business';
  let ownerId: string | null = null;

  // ── Firestore Admin (same stack as staff invite) ─────────────────────
  try {
    const adminDb = getAdminDb();
    const bizSnap = await adminDb.collection('businesses').doc(businessId).get();
    if (bizSnap.exists) {
      const bd = bizSnap.data() || {};
      businessName =
        bd.businessName || bd.name || bd.ownerName || businessName;
      ownerId = bd.ownerId || bd.owner_id || bd.userId || bd.user_id || null;
      email =
        bd.ownerEmail ||
        bd.owner_email ||
        bd.email ||
        null;
      name = bd.ownerName || bd.owner_name || name;
    }

    if (!email && ownerId) {
      const userSnap = await adminDb.collection('users').doc(String(ownerId)).get();
      if (userSnap.exists) {
        const ud = userSnap.data() || {};
        email = ud.email || null;
        name = ud.displayName || ud.fullName || ud.name || name;
      }
    }

    if (!email) {
      const usersSnap = await adminDb
        .collection('users')
        .where('businessId', '==', businessId)
        .limit(25)
        .get();
      for (const doc of usersSnap.docs) {
        const ud = doc.data() || {};
        if (isOwnerRole(ud.role) && ud.email) {
          email = ud.email;
          name = ud.displayName || ud.fullName || ud.name || name;
          break;
        }
      }
      if (!email) {
        for (const doc of usersSnap.docs) {
          const ud = doc.data() || {};
          const role = String(ud.role || '').toLowerCase();
          if (ud.email && role !== 'staff' && !ud.staffId) {
            email = ud.email;
            name = ud.displayName || ud.fullName || ud.name || name;
            break;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[staff/stock-alert] Firestore resolve failed', e);
  }

  // Native Firestore dual-write store
  if (!email && isAdminInitialized()) {
    try {
      const native = getNativeAdminFirestore();
      const bizSnap = await native.collection('businesses').doc(businessId).get();
      if (bizSnap.exists) {
        const bd = bizSnap.data() || {};
        businessName =
          bd.businessName || bd.name || businessName;
        ownerId = ownerId || bd.ownerId || bd.owner_id || null;
        email =
          email ||
          bd.ownerEmail ||
          bd.owner_email ||
          bd.email ||
          null;
      }
      if (!email && ownerId) {
        const userSnap = await native.collection('users').doc(String(ownerId)).get();
        if (userSnap.exists) {
          const ud = userSnap.data() || {};
          email = ud.email || null;
          name = ud.displayName || ud.fullName || ud.name || name;
        }
      }
    } catch (e) {
      console.warn('[staff/stock-alert] native Firestore resolve failed', e);
    }
  }

  // ── Supabase ─────────────────────────────────────────────────────────
  try {
    const supabase = getSupabaseAdmin();
    if (!email) {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      if (business) {
        businessName =
          business.business_name ||
          business.businessName ||
          business.name ||
          businessName;
        ownerId =
          ownerId ||
          business.owner_id ||
          business.ownerId ||
          business.user_id ||
          null;
        email =
          business.owner_email ||
          business.ownerEmail ||
          business.email ||
          null;
      }
    }

    if (!email && ownerId) {
      const { data: ownerRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', ownerId)
        .maybeSingle();
      if (ownerRow?.email) {
        email = ownerRow.email;
        name =
          ownerRow.display_name ||
          ownerRow.displayName ||
          ownerRow.full_name ||
          ownerRow.name ||
          name;
      }
      if (!email) {
        const { data: authUser } = await supabase.auth.admin.getUserById(
          String(ownerId)
        );
        if (authUser?.user?.email) {
          email = authUser.user.email;
          name =
            authUser.user.user_metadata?.full_name ||
            authUser.user.user_metadata?.name ||
            name;
        }
      }
    }

    if (!email) {
      const { data: byBiz } = await supabase
        .from('users')
        .select('*')
        .eq('business_id', businessId)
        .limit(25);
      const owners = (byBiz || []).filter((u: any) => isOwnerRole(u.role) && u.email);
      if (owners[0]) {
        email = owners[0].email;
        name =
          owners[0].display_name ||
          owners[0].name ||
          name;
      }
    }
  } catch (e) {
    console.warn('[staff/stock-alert] Supabase resolve failed', e);
  }

  if (!email || !email.includes('@')) {
    throw new Error(
      'Could not find the business owner email. Open owner Settings and confirm the account email is saved.'
    );
  }

  return { email: String(email).trim().toLowerCase(), name, businessName };
}

/**
 * POST /api/staff/stock-alert
 * Mirrors staff-invitation: resolve recipient, then Resend via brevo-service.
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[staff/stock-alert] RESEND_API_KEY missing');
      return NextResponse.json(
        { error: 'Email service not configured (RESEND_API_KEY)' },
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
      body.businessId ||
        staffUser.user_metadata?.businessId ||
        staffUser.user_metadata?.business_id ||
        ''
    ).trim();
    const products = Array.isArray(body.products) ? body.products : [];
    const note = body.note ? String(body.note).slice(0, 1000) : undefined;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (!products.length) {
      return NextResponse.json(
        { error: 'At least one product is required' },
        { status: 400 }
      );
    }

    console.log('[staff/stock-alert] businessId=', businessId, 'products=', products.length);

    const owner = await resolveOwnerEmail(businessId);
    console.log('[staff/stock-alert] owner email resolved:', owner.email);

    const staffName =
      staffUser.user_metadata?.full_name ||
      staffUser.user_metadata?.name ||
      staffUser.email?.split('@')[0] ||
      'Staff member';
    const staffRole = staffUser.user_metadata?.role || 'Staff';

    // Same Resend entry point as staff invitation emails
    const result = await sendStaffStockAlertEmail({
      ownerEmail: owner.email,
      ownerName: owner.name,
      businessName: owner.businessName,
      staffName,
      staffEmail: staffUser.email || undefined,
      staffRole,
      products: products.map((p: any) => ({
        name: String(p.name || 'Product'),
        stock: Number(p.stock) || 0,
        threshold:
          p.lowStockThreshold != null ? Number(p.lowStockThreshold) : undefined,
        status: p.status,
      })),
      note,
    });

    if (!result?.id) {
      return NextResponse.json(
        { error: 'Resend did not return a message id' },
        { status: 502 }
      );
    }

    console.log('[staff/stock-alert] Resend OK id=', result.id, 'to=', owner.email);

    return NextResponse.json({
      ok: true,
      success: true,
      emailed: owner.email,
      messageId: result.id,
    });
  } catch (err: any) {
    console.error('[staff/stock-alert] FAILED', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Failed to send stock alert' },
      { status: 500 }
    );
  }
}

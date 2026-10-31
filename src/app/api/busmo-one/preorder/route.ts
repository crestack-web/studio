import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { BUSMO_ONE_CONFIG, formatNgn } from '@/lib/busmo-one/config';
import { ADMIN_EMAILS } from '@/lib/adminEmails';
import { sendTransactionalEmail } from '@/services/email/brevo-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function normalizeNgPhone(raw: string): string {
  let p = String(raw || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+234')) p = '0' + p.slice(4);
  if (p.startsWith('234') && p.length >= 12) p = '0' + p.slice(3);
  return p;
}

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Simple in-memory rate limit per IP (best-effort on serverless) */
const hits = new Map<string, { n: number; t: number }>();
function rateLimit(ip: string, max = 8, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now - cur.t > windowMs) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  if (cur.n >= max) return false;
  cur.n += 1;
  return true;
}


async function notifyAdminsOfPreorder(payload: {
  id?: string;
  fullName: string;
  businessName: string;
  phone: string;
  email: string;
  businessType: string;
  cityOrState: string;
  quantity: number;
  message: string;
}) {
  const recipients = ADMIN_EMAILS.filter(Boolean);
  if (!recipients.length) return;

  const price = formatNgn(BUSMO_ONE_CONFIG.launchPriceNgn);
  const offer = BUSMO_ONE_CONFIG.promotionLabel;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0A1F14">
      <h2 style="color:#0D7A43;margin:0 0 8px">New Busmo One pre-order</h2>
      <p style="margin:0 0 16px;color:#3D6652">A merchant registered interest on the welcome page (not a paid order).</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#82A993">Name</td><td style="padding:6px 0;font-weight:600">${escapeHtml(payload.fullName)}</td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Business</td><td style="padding:6px 0;font-weight:600">${escapeHtml(payload.businessName)}</td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Phone</td><td style="padding:6px 0"><a href="tel:${escapeHtml(payload.phone)}">${escapeHtml(payload.phone)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Email</td><td style="padding:6px 0"><a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Type</td><td style="padding:6px 0">${escapeHtml(payload.businessType || '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Location</td><td style="padding:6px 0">${escapeHtml(payload.cityOrState || '—')}</td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Qty</td><td style="padding:6px 0">${payload.quantity}</td></tr>
        <tr><td style="padding:6px 0;color:#82A993">Offer</td><td style="padding:6px 0">${escapeHtml(price)} · ${escapeHtml(offer)}</td></tr>
        ${payload.message ? `<tr><td style="padding:6px 0;color:#82A993;vertical-align:top">Message</td><td style="padding:6px 0">${escapeHtml(payload.message)}</td></tr>` : ''}
        ${payload.id ? `<tr><td style="padding:6px 0;color:#82A993">Lead id</td><td style="padding:6px 0;font-family:monospace;font-size:12px">${escapeHtml(payload.id)}</td></tr>` : ''}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#82A993">View in Admin → Busmo One tab.</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: recipients.map((email) => ({ email })),
    subject: `Busmo One pre-order: ${payload.businessName} (${payload.quantity})`,
    htmlContent: html,
    params: { replyTo: payload.email },
  });
}

function escapeHtml(s: string) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/**
 * POST — public pre-order interest registration (not a paid purchase).
 * Does NOT activate Busmo Scale subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Try again shortly.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.fullName || '').trim().slice(0, 120);
    const businessName = String(body.businessName || '').trim().slice(0, 160);
    const phone = normalizeNgPhone(String(body.phone || ''));
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
    const businessType = String(body.businessType || '').trim().slice(0, 80);
    const cityOrState = String(body.cityOrState || '').trim().slice(0, 80);
    const quantity = Math.min(50, Math.max(1, parseInt(String(body.quantity || '1'), 10) || 1));
    const message = String(body.message || '').trim().slice(0, 1000);
    const understands = Boolean(body.understandsPreorder);

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!understands) {
      return NextResponse.json(
        { error: 'Please confirm you understand this is a pre-order registration, not a completed purchase.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Soft de-dupe: same email + phone in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('busmo_one_preorders')
      .select('id')
      .eq('email', email)
      .eq('phone', phone)
      .gte('created_at', since)
      .limit(1);

    if (recent && recent.length) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: 'You are already on the list. Our team will follow up.',
      });
    }

    const { data, error } = await supabase
      .from('busmo_one_preorders')
      .insert({
        full_name: fullName,
        business_name: businessName,
        phone,
        email,
        business_type: businessType || null,
        city_or_state: cityOrState || null,
        quantity,
        message: message || null,
        status: 'submitted',
        promotion_code: BUSMO_ONE_CONFIG.promotionCode,
        promotion_eligible: true,
        understands_preorder: true,
        source: String(body.source || 'welcome_page').slice(0, 40),
        metadata: {
          launchPriceNgn: BUSMO_ONE_CONFIG.launchPriceNgn,
          scaleAnnualValueNgn: BUSMO_ONE_CONFIG.scaleAnnualValueNgn,
          priceConfirmed: BUSMO_ONE_CONFIG.priceConfirmed,
          scaleOffer: BUSMO_ONE_CONFIG.promotionLabel,
          // Eligibility recorded only — subscription is NOT activated here
          scaleEntitlementActivated: false,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('[busmo-one/preorder]', error);
      return NextResponse.json({ error: 'Could not save your registration. Please try again.' }, { status: 500 });
    }

        // Notify Busmo admins (non-blocking for the submitter)
    try {
      await notifyAdminsOfPreorder({
        id: data?.id,
        fullName,
        businessName,
        phone,
        email,
        businessType,
        cityOrState,
        quantity,
        message,
      });
    } catch (mailErr) {
      console.error('[busmo-one/preorder] admin email failed', mailErr);
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
      message: 'You're on the list for Busmo One.',
    });
  } catch (e: any) {
    console.error('[busmo-one/preorder]', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

/** GET — admin only */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get('limit') || '50', 10) || 50);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('busmo_one_preorders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, submissions: data || [], count: data?.length || 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

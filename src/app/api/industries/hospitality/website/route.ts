import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

async function biz(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
  return { businessId: session.businessId || null, user };
}

export async function GET(req: NextRequest) {
  const ctx = await biz(req);
  if (!ctx?.businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('hospitality_websites')
    .select('*')
    .eq('business_id', ctx.businessId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    'https://www.busmo.io';
  const base = origin.startsWith('http') ? origin : `https://${origin}`;

  return NextResponse.json({
    ok: true,
    website: data,
    publicUrl: data?.slug ? `${base.replace(/\/$/, '')}/h/${data.slug}` : null,
  });
}

export async function PUT(req: NextRequest) {
  const ctx = await biz(req);
  if (!ctx?.businessId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const admin = getSupabaseAdmin();

  let slug = String(body.slug || '').trim().toLowerCase();
  if (!slug && body.propertyName) slug = slugify(String(body.propertyName));
  if (!slug) return NextResponse.json({ error: 'slug or propertyName required' }, { status: 400 });
  slug = slugify(slug);
  if (slug.length < 2) return NextResponse.json({ error: 'slug too short' }, { status: 400 });

  // Unique slug (allow own business)
  const { data: clash } = await admin
    .from('hospitality_websites')
    .select('business_id')
    .eq('slug', slug)
    .maybeSingle();
  if (clash && clash.business_id !== ctx.businessId) {
    return NextResponse.json({ error: 'That web address is already taken' }, { status: 409 });
  }

  const amenities = Array.isArray(body.amenities)
    ? body.amenities.map((a: unknown) => String(a).trim()).filter(Boolean)
    : typeof body.amenities === 'string'
      ? String(body.amenities)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map((g: unknown) => String(g).trim()).filter(Boolean).slice(0, 12)
    : [];

  const row = {
    business_id: ctx.businessId,
    slug,
    published: Boolean(body.published),
    property_name: body.propertyName || body.property_name || null,
    tagline: body.tagline || null,
    about: body.about || null,
    address_line: body.addressLine || body.address_line || null,
    city: body.city || null,
    state: body.state || null,
    country: body.country || 'Nigeria',
    phone: body.phone || null,
    whatsapp: body.whatsapp || null,
    email: body.email || null,
    check_in_time: body.checkInTime || body.check_in_time || '14:00',
    check_out_time: body.checkOutTime || body.check_out_time || '12:00',
    amenities,
    hero_image_url: body.heroImageUrl || body.hero_image_url || null,
    gallery,
    booking_enabled: body.bookingEnabled !== false,
    primary_color: body.primaryColor || body.primary_color || '#5b21b6',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from('hospitality_websites')
    .upsert(row, { onConflict: 'business_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Keep hospitality_settings in sync for desk branding
  try {
    await admin.from('hospitality_settings').upsert(
      {
        business_id: ctx.businessId,
        property_name: row.property_name,
        logo_url: row.hero_image_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    );
  } catch {
    /* optional */
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    'https://www.busmo.io';
  const base = origin.startsWith('http') ? origin : `https://${origin}`;

  return NextResponse.json({
    ok: true,
    website: data,
    publicUrl: `${base.replace(/\/$/, '')}/h/${data.slug}`,
  });
}

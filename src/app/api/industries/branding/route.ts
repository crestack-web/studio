import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loadIndustrySession } from '@/lib/industries/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolve(req: NextRequest, editionHint?: string) {
  const user = await getAuthUser(req);
  if (!user) return null;
  const session = await loadIndustrySession(user.id, {
    product_edition: editionHint || undefined,
  });
  if (!session.businessId) return null;
  return {
    user,
    businessId: session.businessId as string,
    edition: (session.productEdition || editionHint || 'business') as string,
  };
}

export async function GET(req: NextRequest) {
  const edition = req.nextUrl.searchParams.get('edition') || undefined;
  const ctx = await resolve(req, edition);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('solution_branding')
    .select('*')
    .eq('business_id', ctx.businessId)
    .maybeSingle();

  // Fallback hospitality_settings for hotels
  if (!data && ctx.edition === 'hospitality') {
    const { data: h } = await admin
      .from('hospitality_settings')
      .select('*')
      .eq('business_id', ctx.businessId)
      .maybeSingle();
    if (h) {
      return NextResponse.json({
        ok: true,
        branding: {
          business_id: ctx.businessId,
          display_name: h.property_name,
          logo_url: h.logo_url,
          currency: h.currency || 'NGN',
          product_edition: 'hospitality',
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    branding: data || {
      business_id: ctx.businessId,
      display_name: null,
      logo_url: null,
      currency: 'NGN',
      product_edition: ctx.edition,
    },
    warning: error?.message,
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const edition = String(body.edition || body.productEdition || 'business');
  const ctx = await resolve(req, edition);
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const payload = {
    business_id: ctx.businessId,
    product_edition: edition,
    display_name: typeof body.displayName === 'string' ? body.displayName.trim() || null : undefined,
    logo_url: typeof body.logoUrl === 'string' ? body.logoUrl.trim() || null : undefined,
    currency: typeof body.currency === 'string' ? body.currency.trim() || 'NGN' : undefined,
    updated_at: new Date().toISOString(),
  };
  // remove undefined
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));

  const { data, error } = await admin
    .from('solution_branding')
    .upsert({ ...clean, business_id: ctx.businessId, product_edition: edition }, { onConflict: 'business_id' })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mirror hospitality property branding
  if (edition === 'hospitality') {
    await admin.from('hospitality_settings').upsert(
      {
        business_id: ctx.businessId,
        property_name: data.display_name,
        logo_url: data.logo_url,
        currency: data.currency || 'NGN',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    );
  }

  return NextResponse.json({ ok: true, branding: data });
}

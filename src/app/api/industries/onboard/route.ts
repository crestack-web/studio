import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { ensureIndustryOrganization } from '@/lib/industries/onboard-org';
import {
  normalizeProductEdition,
  pathForEdition,
  type ProductEdition,
} from '@/lib/industries/resolve-edition';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/industries/onboard
 * Body: { businessName, productEdition }
 * Idempotent organization provisioning. Metadata updated only after org is confirmed.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const productEdition = normalizeProductEdition(body.productEdition || body.edition);
  const businessName = String(body.businessName || body.name || '').trim();

  if (!businessName) {
    return NextResponse.json({ error: 'businessName required' }, { status: 400 });
  }

  if (!['business', 'hospitality', 'professional'].includes(productEdition)) {
    return NextResponse.json({ error: 'Invalid productEdition' }, { status: 400 });
  }

  try {
    const result = await ensureIndustryOrganization({
      userId: user.id,
      email: user.email,
      businessName,
      productEdition: productEdition as ProductEdition,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, needsOnboarding: true },
        { status: 500 }
      );
    }

    try {
      const admin = getSupabaseAdmin();
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          businessId: result.businessId,
          business_id: result.businessId,
          product_edition: result.productEdition,
          industry: result.productEdition,
          category: result.productEdition === 'business' ? 'retail' : result.productEdition,
          businessName,
          onboardingComplete: true,
          onboarding_complete: true,
          role: 'Owner',
        },
      });
    } catch {
      /* metadata secondary */
    }

    return NextResponse.json({
      ok: true,
      businessId: result.businessId,
      created: result.created,
      productEdition: result.productEdition,
      dashboardPath: pathForEdition(result.productEdition),
      notice: result.created
        ? 'Organization created.'
        : 'Existing organization linked — no duplicate created.',
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Onboarding failed';
    return NextResponse.json({ error: msg, needsOnboarding: true }, { status: 500 });
  }
}

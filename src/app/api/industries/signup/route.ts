import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { ensureIndustryOrganization } from '@/lib/industries/onboard-org';
import {
  normalizeProductEdition,
  pathForEdition,
  type ProductEdition,
} from '@/lib/industries/resolve-edition';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import {
  createEmailConfirmToken,
  buildConfirmEmailUrl,
  buildConfirmationEmailHtml,
} from '@/lib/email-confirmation';
import { queueSolutionWelcomeEmail } from '@/services/email/solution-welcome';
import { getIndustryConfig } from '@/lib/industries/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/industries/signup
 *
 * Same reliability model as /api/auth/signup + business onboarding:
 * 1) Admin createUser (email_confirm: false — no stuck client signUp)
 * 2) Provision organization (idempotent)
 * 3) Client sends confirmation email + signs in after confirm
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const businessName = String(body.businessName || body.name || '').trim();
    const productEdition = normalizeProductEdition(body.productEdition || body.edition);

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }
    if (!businessName) {
      return NextResponse.json({ error: 'Business / hotel name is required.' }, { status: 400 });
    }
    if (!['hospitality', 'professional', 'healthcare', 'education', 'business'].includes(productEdition)) {
      return NextResponse.json({ error: 'Invalid product edition.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        role: 'Owner',
        product_edition: productEdition,
        solutionDetails: body.solutionDetails || {},
        industry: productEdition,
        category: productEdition === 'business' ? 'retail' : productEdition,
        businessName,
        onboardingComplete: false,
        onboarding_complete: false,
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists') ||
        error.status === 422
      ) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please log in instead.',
            code: 'email_exists',
          },
          { status: 409 }
        );
      }
      console.error('[industries/signup] createUser:', error.message);
      return NextResponse.json(
        { error: error.message || 'Failed to create account.' },
        { status: 400 }
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
    }

    const solutionDetails =
      body.solutionDetails && typeof body.solutionDetails === 'object'
        ? body.solutionDetails
        : {};

    const org = await ensureIndustryOrganization({
      userId,
      email,
      businessName,
      productEdition: productEdition as ProductEdition,
      solutionDetails,
    });

    if (!org.ok) {
      console.error('[industries/signup] org provision failed:', org.error);
      // Account exists; surface recovery path
      return NextResponse.json(
        {
          error:
            org.error ||
            'Account created but organization setup failed. Please sign in to finish setup.',
          userId,
          needsOnboarding: true,
          code: 'org_failed',
        },
        { status: 500 }
      );
    }

    // Mark metadata only after org is confirmed
    try {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: 'Owner',
          product_edition: org.productEdition,
          industry: org.productEdition,
          category: org.productEdition === 'business' ? 'retail' : org.productEdition,
          businessName,
          businessId: org.businessId,
          business_id: org.businessId,
          onboardingComplete: true,
          onboarding_complete: true,
        },
      });
    } catch (e) {
      console.error('[industries/signup] metadata update:', e);
    }

    // Mirror Busmo Business: Resend verification + welcome (do not block on failures)
    let confirmationSent = false;
    try {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'https://www.busmo.io';
      const cfg = getIndustryConfig(org.productEdition as any);
      const displayName = businessName || cfg?.productName || 'there';
      const token = createEmailConfirmToken(userId, email);
      const confirmUrl = buildConfirmEmailUrl(token, origin);
      const htmlContent = buildConfirmationEmailHtml({
        name: displayName,
        confirmUrl,
      });
      const product = cfg?.productName || 'Busmo';
      await sendTransactionalEmail({
        to: [{ email, name: displayName }],
        subject: `Confirm your ${product} email address`,
        htmlContent,
      });
      confirmationSent = true;
    } catch (mailErr) {
      console.error('[industries/signup] confirmation email failed', mailErr);
    }

    queueSolutionWelcomeEmail({
      email,
      name: businessName,
      businessName,
      productEdition: org.productEdition,
      loginPath: getIndustryConfig(org.productEdition as any)?.loginPath,
    });

    return NextResponse.json({
      ok: true,
      userId,
      email,
      businessId: org.businessId,
      productEdition: org.productEdition,
      dashboardPath: pathForEdition(org.productEdition),
      emailConfirmed: false,
      needsEmailConfirm: true,
      confirmationSent,
      message:
        'Account created. Check your email to confirm, then sign in to open your workspace.',
    });
  } catch (err: any) {
    console.error('[industries/signup]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}

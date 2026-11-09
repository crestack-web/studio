import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { ProductEdition } from './resolve-edition';
import { loadIndustrySession } from './session';

export type OnboardInput = {
  userId: string;
  email?: string | null;
  businessName: string;
  productEdition: ProductEdition;
  /** Extractive onboarding answers for this solution */
  solutionDetails?: Record<string, string | string[]>;
};

/**
 * Idempotent organization provisioning for industry / solutions signup.
 *
 * Stores edition on existing columns until product_edition migration is applied:
 * - industry
 * - category
 * - metadata.product_edition
 *
 * Uses business id === userId convention (matches is_business_member).
 * Does not create a second organization if one already exists.
 */
export async function ensureIndustryOrganization(input: OnboardInput): Promise<
  | { ok: true; businessId: string; created: boolean; productEdition: ProductEdition }
  | { ok: false; error: string }
> {
  const admin = getSupabaseAdmin();
  const edition = input.productEdition === 'business' ? 'business' : input.productEdition;
  const businessId = input.userId;
  const name = (input.businessName || '').trim() || 'My business';

  const existingSession = await loadIndustrySession(input.userId, {
    product_edition: edition,
  });
  if (existingSession.onboarded && existingSession.businessId) {
    // Soft-update edition fields without requiring product_edition column
    const { error: upErr } = await admin
      .from('businesses')
      .update({
        industry: edition,
        category: edition === 'business' ? 'retail' : edition,
        metadata: {
          product_edition: edition,
          source: 'industry_onboard',
          solution_details: input.solutionDetails || {},
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSession.businessId);

    if (upErr) {
      console.error('[onboard-org] update existing:', upErr.message);
    }

    return {
      ok: true,
      businessId: existingSession.businessId,
      created: false,
      productEdition:
        existingSession.productEdition !== 'business'
          ? existingSession.productEdition
          : edition,
    };
  }

  // Columns known to exist on production businesses table (no product_edition required)
  const basePayload: Record<string, unknown> = {
    id: businessId,
    owner_id: input.userId,
    name,
    category: edition === 'business' ? 'retail' : edition,
    industry: edition,
    status: 'active',
    currency: 'NGN',
    metadata: {
      product_edition: edition,
      source: 'industry_onboard',
      solution_details: input.solutionDetails || {},
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existingBiz } = await admin
    .from('businesses')
    .select('id, industry, category, metadata, owner_id')
    .eq('id', businessId)
    .maybeSingle();

  if (existingBiz) {
    const { error: upErr } = await admin
      .from('businesses')
      .update({
        name: name || undefined,
        industry: edition,
        category: edition === 'business' ? 'retail' : edition,
        metadata: {
          product_edition: edition,
          source: 'industry_onboard',
          solution_details: input.solutionDetails || {},
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);
    if (upErr) {
      return { ok: false, error: upErr.message || 'Failed to update organization' };
    }
  } else {
    const { error: insErr } = await admin.from('businesses').insert({
      ...basePayload,
      created_at: new Date().toISOString(),
    });
    if (insErr) {
      // Retry without status/currency if schema differs
      const msg = (insErr.message || '').toLowerCase();
      if (msg.includes('schema cache') || msg.includes('column')) {
        const minimal = {
          id: businessId,
          owner_id: input.userId,
          name,
          category: edition === 'business' ? 'retail' : edition,
          industry: edition,
          metadata: { product_edition: edition, source: 'industry_onboard' },
        };
        const { error: ins2 } = await admin.from('businesses').insert(minimal as any);
        if (ins2) {
          return { ok: false, error: ins2.message || 'Failed to create organization' };
        }
      } else {
        return { ok: false, error: insErr.message || 'Failed to create organization' };
      }
    }
  }

  // Optionally set product_edition if the column exists (ignore errors)
  try {
    await admin
      .from('businesses')
      .update({ product_edition: edition } as any)
      .eq('id', businessId);
  } catch {
    /* column may not exist yet */
  }

  const { data: existingUser } = await admin
    .from('users')
    .select('id')
    .eq('id', input.userId)
    .maybeSingle();

  if (existingUser) {
    await admin
      .from('users')
      .update({
        business_id: businessId,
        role: 'Owner',
        email: input.email || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.userId);
  } else {
    try {
      await admin.from('users').insert({
        id: input.userId,
        business_id: businessId,
        role: 'Owner',
        email: input.email || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {
      /* users row may be managed by trigger */
    }
  }

  return { ok: true, businessId, created: !existingBiz, productEdition: edition };
}

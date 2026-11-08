import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  editionFromBusinessRow,
  editionHintFromUserMetadata,
  type ProductEdition,
} from './resolve-edition';

export type IndustrySession = {
  userId: string;
  email: string | null;
  role: string;
  businessId: string | null;
  businessName: string | null;
  productEdition: ProductEdition;
  isOwner: boolean;
  onboarded: boolean;
  needsOnboarding: boolean;
};

/** Safe select — avoids product_edition until migration is applied. */
const BIZ_SELECT = 'id, name, industry, category, metadata, owner_id';

/**
 * Load authoritative industry session for a user.
 * Membership: owner_id, users.business_id, or id === userId convention.
 * Edition resolved from industry / category / metadata (and product_edition when present).
 */
export async function loadIndustrySession(
  userId: string,
  userMeta?: Record<string, unknown> | null
): Promise<IndustrySession> {
  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('users')
    .select('id, business_id, role, email, display_name, full_name')
    .eq('id', userId)
    .maybeSingle();

  let businessId =
    (profile as any)?.business_id ||
    (userMeta?.businessId as string) ||
    (userMeta?.business_id as string) ||
    null;

  if (!businessId) {
    const { data: owned } = await admin
      .from('businesses')
      .select(BIZ_SELECT)
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (owned) businessId = (owned as any).id;
  }

  if (!businessId) {
    const { data: byId } = await admin
      .from('businesses')
      .select(BIZ_SELECT)
      .eq('id', userId)
      .maybeSingle();
    if (byId) businessId = (byId as any).id;
  }

  if (!businessId) {
    const hint = editionHintFromUserMetadata(userMeta || null) || 'business';
    return {
      userId,
      email: (profile as any)?.email || null,
      role: String((profile as any)?.role || userMeta?.role || 'Owner'),
      businessId: null,
      businessName: null,
      productEdition: hint,
      isOwner: false,
      onboarded: false,
      needsOnboarding: true,
    };
  }

  const { data: biz } = await admin
    .from('businesses')
    .select(BIZ_SELECT)
    .eq('id', businessId)
    .maybeSingle();

  if (!biz) {
    return {
      userId,
      email: (profile as any)?.email || null,
      role: String((profile as any)?.role || 'Owner'),
      businessId,
      businessName: null,
      productEdition: editionHintFromUserMetadata(userMeta || null) || 'business',
      isOwner: false,
      onboarded: false,
      needsOnboarding: true,
    };
  }

  const isOwner =
    String((biz as any).owner_id) === String(userId) ||
    String((biz as any).id) === String(userId);

  if (!isOwner) {
    const profileBiz = String((profile as any)?.business_id || '');
    if (profileBiz !== String(businessId)) {
      try {
        const { data: staffRow } = await admin
          .from('staff')
          .select('id')
          .eq('business_id', businessId)
          .or(`user_id.eq.${userId},auth_user_id.eq.${userId}`)
          .limit(1)
          .maybeSingle();
        if (!staffRow) {
          return {
            userId,
            email: (profile as any)?.email || null,
            role: String((profile as any)?.role || 'Staff'),
            businessId: null,
            businessName: null,
            productEdition: 'business',
            isOwner: false,
            onboarded: false,
            needsOnboarding: true,
          };
        }
      } catch {
        /* staff table optional */
      }
    }
  }

  const productEdition = editionFromBusinessRow(biz as any);

  return {
    userId,
    email: (profile as any)?.email || null,
    role: String((profile as any)?.role || (isOwner ? 'Owner' : 'Staff')),
    businessId: String((biz as any).id),
    businessName: (biz as any).name || null,
    productEdition,
    isOwner,
    onboarded: true,
    needsOnboarding: false,
  };
}

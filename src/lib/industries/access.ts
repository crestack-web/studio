import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  type SolutionRole,
  normalizeSolutionRole,
  canMutateOwnerData,
  canMutateDesk,
  canAccessOwnerConsole,
  canAccessDesk,
} from './roles';

export type IndustryAccess = {
  businessId: string;
  role: SolutionRole;
  productEdition?: string | null;
};

/**
 * Resolve membership: business owner → owner role; else solution_members row.
 */
export async function resolveIndustryAccess(
  userId: string,
  businessId: string
): Promise<IndustryAccess | null> {
  if (!userId || !businessId) return null;
  const admin = getSupabaseAdmin();

  const { data: biz } = await admin
    .from('businesses')
    .select('id, owner_id')
    .eq('id', businessId)
    .maybeSingle();

  if (biz && String((biz as any).owner_id) === userId) {
    return { businessId, role: 'owner' };
  }

  // solution_members (migration 0029)
  const { data: member, error } = await admin
    .from('solution_members')
    .select('role, product_edition')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!error && member) {
    const role = normalizeSolutionRole((member as any).role) || 'readonly';
    return {
      businessId,
      role,
      productEdition: (member as any).product_edition || null,
    };
  }

  // Legacy staff roster: treat as desk if present
  const { data: staff } = await admin
    .from('staff')
    .select('id, role, business_id')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle();

  if (staff) {
    return { businessId, role: 'desk' };
  }

  return null;
}

export {
  canMutateOwnerData,
  canMutateDesk,
  canAccessOwnerConsole,
  canAccessDesk,
};

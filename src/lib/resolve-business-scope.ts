/**
 * Shared business scoping for owner + staff dashboards.
 * Prevents account mixing: never treat auth uid as businessId,
 * never adopt another owner's business from a staff link.
 */

import { getSupabase } from '@/lib/supabase';

export function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return r === 'owner' || r === 'admin' || r === 'business owner';
}

export function isStaffRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return [
    'staff',
    'cashier',
    'manager',
    'store manager',
    'seller',
    'sales attendant',
    'attendant',
    'clerk',
    'supervisor',
    'assistant',
  ].includes(r);
}

/**
 * Resolve the business this auth user *owns* (owner dashboard).
 * Returns null if none — callers must not invent a fallback id.
 */
export async function resolveOwnedBusinessId(
  userId: string | undefined | null
): Promise<string | null> {
  if (!userId) return null;
  try {
    const supabase = getSupabase();
    const { data: byOwner } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle();
    if (byOwner?.id) return String(byOwner.id);

    const { data: byOwnerCamel } = await supabase
      .from('businesses')
      .select('id')
      .eq('ownerId', userId)
      .limit(1)
      .maybeSingle();
    if (byOwnerCamel?.id) return String(byOwnerCamel.id);

    return null;
  } catch (e) {
    console.warn('[resolveOwnedBusinessId]', e);
    return null;
  }
}

/**
 * Prefer context businessId; if missing, resolve owned business only.
 * Never returns userId as businessId.
 */
export async function resolveOwnerScopeBusinessId(
  userId: string | undefined | null,
  contextBusinessId?: string | null
): Promise<string | null> {
  if (contextBusinessId && contextBusinessId !== userId) {
    // Verify ownership when possible
    try {
      const supabase = getSupabase();
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, owner_id, ownerId, user_id')
        .eq('id', contextBusinessId)
        .maybeSingle();
      if (biz) {
        const owner = biz.owner_id || biz.ownerId || biz.user_id;
        if (!owner || String(owner) === String(userId)) {
          return String(biz.id);
        }
        console.warn(
          '[resolveOwnerScopeBusinessId] rejecting non-owned business',
          contextBusinessId,
          userId
        );
      }
    } catch {
      // If verification fails, still prefer explicit context over inventing ids
      return contextBusinessId;
    }
  }
  return resolveOwnedBusinessId(userId);
}

/**
 * Staff scope: only the single businessId passed from staff workspace resolve.
 * Never substitute auth uid.
 */
export function assertStaffBusinessId(
  businessId: string | undefined | null
): string | null {
  if (!businessId || businessId === 'demo') return null;
  return String(businessId);
}

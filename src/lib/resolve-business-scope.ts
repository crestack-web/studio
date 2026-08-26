/**
 * Shared business scoping for owner + staff dashboards.
 *
 * Busmo convention (signup): business document id === owner auth uid,
 * and users.businessId / business_id points at that id.
 *
 * Never adopt another owner's business from a staff link.
 */

import { getSupabase } from '@/lib/supabase';

export function isOwnerRole(role: unknown): boolean {
  const r = String(role || '').toLowerCase().trim();
  return (
    r === 'owner' ||
    r === 'admin' ||
    r === 'business owner' ||
    r === '' ||
    r === 'free'
  );
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

async function fetchBusinessRow(businessId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('businesses')
    .select('id, owner_id, ownerId, user_id, name, business_name, businessName')
    .eq('id', businessId)
    .maybeSingle();
  return data;
}

function ownerFieldsMatch(biz: any, userId: string, altIds: string[] = []): boolean {
  if (!biz) return false;
  const owners = [biz.owner_id, biz.ownerId, biz.user_id]
    .filter(Boolean)
    .map((x: any) => String(x));
  const allowed = new Set([userId, ...altIds].map(String));
  return owners.some((o) => allowed.has(o));
}

/**
 * Resolve the business this auth user *owns* (owner dashboard).
 */
export async function resolveOwnedBusinessId(
  userId: string | undefined | null,
  options?: { firebaseUid?: string | null; email?: string | null }
): Promise<string | null> {
  if (!userId) return null;
  const altIds = [options?.firebaseUid].filter(Boolean).map(String) as string[];

  try {
    const supabase = getSupabase();

    // 1) businesses.owner_id / ownerId = auth user (or firebase uid)
    for (const ownerKey of [userId, ...altIds]) {
      for (const col of ['owner_id', 'ownerId', 'user_id'] as const) {
        try {
          const { data } = await supabase
            .from('businesses')
            .select('id')
            .eq(col, ownerKey)
            .limit(1)
            .maybeSingle();
          if (data?.id) return String(data.id);
        } catch {
          // column may not exist
        }
      }
    }

    // 2) Busmo signup convention: business id === user id
    const selfBiz = await fetchBusinessRow(userId);
    if (selfBiz?.id) {
      // Accept if owner matches OR owner fields empty (legacy) OR id === userId
      if (
        ownerFieldsMatch(selfBiz, userId, altIds) ||
        !(selfBiz.owner_id || selfBiz.ownerId || selfBiz.user_id)
      ) {
        return String(selfBiz.id);
      }
    }

    // 3) users profile business_id / businessId
    const { data: profile } = await supabase
      .from('users')
      .select('id, business_id, businessId, role, email')
      .eq('id', userId)
      .maybeSingle();

    let profileBid =
      (profile as any)?.business_id || (profile as any)?.businessId || null;

    if (!profile && altIds[0]) {
      const { data: fbProfile } = await supabase
        .from('users')
        .select('id, business_id, businessId, role')
        .eq('id', altIds[0])
        .maybeSingle();
      if (fbProfile) {
        profileBid =
          (fbProfile as any)?.business_id ||
          (fbProfile as any)?.businessId ||
          null;
      }
    }

    if (profileBid) {
      const bid = String(profileBid);
      // Signup convention: profile.businessId === userId is valid for owners
      if (bid === userId || altIds.includes(bid)) {
        return bid;
      }
      const biz = await fetchBusinessRow(bid);
      if (!biz) {
        // Profile points at an id with no Supabase row — still use it (Firestore-only legacy)
        if (!isStaffRole((profile as any)?.role)) {
          return bid;
        }
      } else if (
        ownerFieldsMatch(biz, userId, altIds) ||
        !(biz.owner_id || biz.ownerId || biz.user_id)
      ) {
        return String(biz.id);
      }
    }

    return null;
  } catch (e) {
    console.warn('[resolveOwnedBusinessId]', e);
    return null;
  }
}

/**
 * Prefer context businessId; if missing, resolve owned business.
 * Allows businessId === userId when that is the owned business (signup convention).
 */
export async function resolveOwnerScopeBusinessId(
  userId: string | undefined | null,
  contextBusinessId?: string | null,
  options?: { firebaseUid?: string | null }
): Promise<string | null> {
  if (!userId) return null;
  const altIds = [options?.firebaseUid].filter(Boolean).map(String) as string[];

  if (contextBusinessId) {
    const bid = String(contextBusinessId);
    // Signup convention
    if (bid === userId || altIds.includes(bid)) {
      return bid;
    }
    try {
      const biz = await fetchBusinessRow(bid);
      if (biz) {
        const owner = biz.owner_id || biz.ownerId || biz.user_id;
        if (!owner || ownerFieldsMatch(biz, userId, altIds)) {
          return String(biz.id);
        }
        console.warn(
          '[resolveOwnerScopeBusinessId] rejecting non-owned business',
          bid,
          userId
        );
      } else {
        // No row in Supabase — trust context only if it matches user (legacy)
        if (bid === userId) return bid;
      }
    } catch {
      if (bid === userId) return bid;
      return contextBusinessId;
    }
  }

  return resolveOwnedBusinessId(userId, options);
}

/**
 * Staff scope: only the single businessId passed from staff workspace resolve.
 * Never substitute auth uid blindly unless it is the staff's assigned business.
 */
export function assertStaffBusinessId(
  businessId: string | undefined | null
): string | null {
  if (!businessId || businessId === 'demo') return null;
  return String(businessId);
}

/**
 * Ensure users.business_id is populated for faster future loads (best-effort).
 */
export async function backfillUserBusinessId(
  userId: string,
  businessId: string
): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase
      .from('users')
      .update({
        business_id: businessId,
        businessId: businessId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch (e) {
    console.warn('[backfillUserBusinessId]', e);
  }
}

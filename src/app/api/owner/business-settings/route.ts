import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { CATEGORY_FEATURES } from '@/app/welcome/signup/onboarding-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveBusinessIdForOwner(
  sb: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  clientBusinessId: string
): Promise<{ id: string; created?: boolean } | { error: string }> {
  const candidates = Array.from(
    new Set(
      [clientBusinessId, userId]
        .map((x) => String(x || '').trim())
        .filter(Boolean)
    )
  );

  // 1) Exact id match
  for (const id of candidates) {
    const { data } = await sb
      .from('businesses')
      .select('id, owner_id')
      .eq('id', id)
      .maybeSingle();
    if (data?.id) {
      const ownerOk =
        !data.owner_id ||
        String(data.owner_id) === String(userId) ||
        String(data.id) === String(userId);
      if (ownerOk) return { id: String(data.id) };
    }
  }

  // 2) Owned by this user
  const { data: owned } = await sb
    .from('businesses')
    .select('id, owner_id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();
  if (owned?.id) return { id: String(owned.id) };

  // 3) users.business_id / metadata
  const { data: profile } = await sb
    .from('users')
    .select('business_id, metadata')
    .eq('id', userId)
    .maybeSingle();
  const meta =
    profile?.metadata && typeof profile.metadata === 'object'
      ? (profile.metadata as Record<string, unknown>)
      : {};
  const fromProfile = String(
    (profile as any)?.business_id || meta.businessId || meta.business_id || ''
  ).trim();
  if (fromProfile) {
    const { data: byProfile } = await sb
      .from('businesses')
      .select('id, owner_id')
      .eq('id', fromProfile)
      .maybeSingle();
    if (byProfile?.id) return { id: String(byProfile.id) };
  }

  // 4) Create business row (signup convention: id often === owner uid)
  const newId = clientBusinessId || fromProfile || userId;
  const { error: insErr } = await sb.from('businesses').insert({
    id: newId,
    owner_id: userId,
    name: null,
    category: null,
    industry: null,
    metadata: {},
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (insErr) {
    // Race: row may have been created concurrently
    const { data: again } = await sb
      .from('businesses')
      .select('id')
      .eq('id', newId)
      .maybeSingle();
    if (again?.id) return { id: String(again.id) };
    return { error: insErr.message || 'Could not create business' };
  }

  // Point user profile at this business if missing
  if (profile && !fromProfile) {
    await sb
      .from('users')
      .update({
        business_id: newId,
        metadata: {
          ...meta,
          businessId: newId,
          business_id: newId,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  return { id: newId, created: true };
}

/**
 * PATCH owner business settings (category, contact, name).
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const clientBusinessId = String(body.businessId || '').trim();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const category = body.category != null ? String(body.category).trim() : undefined;
    const phone = body.phone != null ? String(body.phone).trim() : undefined;
    const email = body.email != null ? String(body.email).trim() : undefined;
    const address = body.address != null ? String(body.address).trim() : undefined;
    const categoryLabel =
      body.categoryLabel != null ? String(body.categoryLabel).trim() : undefined;

    if (category !== undefined && !category) {
      return NextResponse.json({ error: 'Select a business category' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    const resolved = await resolveBusinessIdForOwner(sb, user.id, clientBusinessId);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: 500 });
    }
    const businessId = resolved.id;

    // Access: owner of resolved business, profile link, or same id as user
    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      // Soft-allow if we just resolved/created as owner
      const { data: bizCheck } = await sb
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle();
      if (String(bizCheck?.owner_id || '') !== String(user.id) && businessId !== user.id) {
        return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
      }
    }

    const { data: existing, error: loadErr } = await sb
      .from('businesses')
      .select('id, owner_id, metadata, name, category')
      .eq('id', businessId)
      .maybeSingle();
    if (loadErr) {
      return NextResponse.json({ error: loadErr.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json(
        { error: 'Business not found after resolve', businessId },
        { status: 404 }
      );
    }

    // Ensure owner_id is set for future RLS/access
    if (!existing.owner_id) {
      await sb
        .from('businesses')
        .update({ owner_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', businessId);
    }

    const prevMeta =
      existing.metadata && typeof existing.metadata === 'object'
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};

    const nextMeta: Record<string, unknown> = { ...prevMeta };
    if (category) {
      nextMeta.selectedCategory = category;
      nextMeta.category = category;
      if (categoryLabel) nextMeta.categoryLabel = categoryLabel;
    }
    if (phone !== undefined) nextMeta.phone = phone;
    if (email !== undefined) nextMeta.email = email;
    if (address !== undefined) nextMeta.address = address;

    const patch: Record<string, unknown> = {
      metadata: nextMeta,
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) patch.name = name || null;
    if (category) {
      patch.category = category;
      patch.industry = category;
    }

    const { error: upErr } = await sb.from('businesses').update(patch).eq('id', businessId);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (address !== undefined) {
      await sb.from('business_profiles').upsert(
        {
          business_id: businessId,
          address: address || null,
        },
        { onConflict: 'business_id' }
      );
    }

    let features: string[] = [];
    if (category) {
      features = CATEGORY_FEATURES[category] || CATEGORY_FEATURES.other || [];
      const { data: userRow } = await sb
        .from('users')
        .select('metadata, business_id')
        .eq('id', user.id)
        .maybeSingle();
      const umeta =
        userRow?.metadata && typeof userRow.metadata === 'object'
          ? { ...(userRow.metadata as Record<string, unknown>) }
          : {};
      const nextUserMeta = {
        ...umeta,
        selectedCategory: category,
        category,
        businessCategory: category,
        selectedFeatures: features,
        features,
        businessId,
        business_id: businessId,
      };
      await sb
        .from('users')
        .update({
          business_id: userRow?.business_id || businessId,
          metadata: nextUserMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      ok: true,
      businessId,
      created: !!resolved.created,
      category: category || existing.category,
      features,
    });
  } catch (e: any) {
    console.error('[business-settings]', e);
    return NextResponse.json({ error: e?.message || 'Save failed' }, { status: 500 });
  }
}

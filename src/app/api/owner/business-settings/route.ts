import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '@/app/api/mo-sales/_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { CATEGORY_FEATURES } from '@/app/welcome/signup/onboarding-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PATCH owner business settings (category, contact, name).
 * Uses service role after access check so RLS/owner_id edge cases do not block saves.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const category = body.category != null ? String(body.category).trim() : undefined;
    const phone = body.phone != null ? String(body.phone).trim() : undefined;
    const email = body.email != null ? String(body.email).trim() : undefined;
    const address = body.address != null ? String(body.address).trim() : undefined;
    const categoryLabel = body.categoryLabel != null ? String(body.categoryLabel).trim() : undefined;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    if (category !== undefined && !category) {
      return NextResponse.json({ error: 'Select a business category' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason || 'Forbidden' }, { status: 403 });
    }

    const sb = getSupabaseAdmin();
    const { data: existing, error: loadErr } = await sb
      .from('businesses')
      .select('id, owner_id, metadata, name, category')
      .eq('id', businessId)
      .maybeSingle();
    if (loadErr) {
      return NextResponse.json({ error: loadErr.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
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

    // Only columns that exist on public.businesses
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

    // business_profiles.address when profile row exists / can upsert lightly
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
        .select('metadata')
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
      };
      const { error: userErr } = await sb
        .from('users')
        .update({
          metadata: nextUserMeta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (userErr) {
        console.warn('[business-settings] user meta', userErr.message);
      }
    }

    return NextResponse.json({
      ok: true,
      businessId,
      category: category || existing.category,
      features,
    });
  } catch (e: any) {
    console.error('[business-settings]', e);
    return NextResponse.json({ error: e?.message || 'Save failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import { CustomFeatureError } from '@/lib/custom-features/service';
import {
  buildFeatureDraftFromNaturalLanguage,
  listDraftFeatures,
  toolCreateCustomFeatureDraft,
  toolGetCustomFeatureDraft,
  toolGetFeatureBuilderContext,
  toolUpdateCustomFeatureDraft,
  toolValidateFeatureDefinition,
} from '@/lib/custom-features/builder-tools';
import { publishCustomFeature } from '@/lib/custom-features/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errRes(e: unknown) {
  if (e instanceof CustomFeatureError) {
    return NextResponse.json(
      { error: e.message, details: e.details },
      { status: e.status }
    );
  }
  console.error('[custom-features/builder]', e);
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}

/**
 * POST /api/custom-features/builder
 *
 * Tools (AI / MO):
 *  - get_feature_builder_context
 *  - validate_feature_definition
 *  - create_custom_feature_draft  (definition JSON)
 *  - get_custom_feature_draft
 *  - update_custom_feature_draft
 *  - build_from_natural_language  (NL → draft; never publish)
 *
 * Owner-only (not AI):
 *  - publish_draft  (explicit owner action)
 *  - list_drafts
 *
 * businessId must match authenticated membership (assertBusinessAccess).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    // Never trust model-supplied alternate business ids
    const auth = { userId: user.id, businessId };
    const tool = String(body.tool || body.action || '').trim();

    switch (tool) {
      case 'get_feature_builder_context': {
        const data = await toolGetFeatureBuilderContext(auth);
        return NextResponse.json({ ok: true, ...data });
      }
      case 'validate_feature_definition': {
        const result = await toolValidateFeatureDefinition(
          auth,
          body.definition
        );
        return NextResponse.json(result);
      }
      case 'create_custom_feature_draft': {
        // Force draft path even if definition.status is published
        const { feature, created } = await toolCreateCustomFeatureDraft(
          auth,
          body.definition
        );
        return NextResponse.json({
          ok: true,
          created,
          feature,
          notice: 'DRAFT CREATED — not published. Owner must preview and publish.',
        });
      }
      case 'get_custom_feature_draft': {
        const feature = await toolGetCustomFeatureDraft(auth, {
          featureId: body.featureId,
          slug: body.slug,
        });
        return NextResponse.json({ ok: true, feature });
      }
      case 'update_custom_feature_draft': {
        const feature = await toolUpdateCustomFeatureDraft(auth, {
          featureId: String(body.featureId || ''),
          definition: body.definition,
        });
        return NextResponse.json({
          ok: true,
          feature,
          notice: 'DRAFT UPDATED — published version (if any) is unchanged.',
        });
      }
      case 'build_from_natural_language': {
        const message = String(body.message || body.userMessage || '').trim();
        if (!message) {
          return NextResponse.json(
            { error: 'message required' },
            { status: 400 }
          );
        }
        const out = await buildFeatureDraftFromNaturalLanguage(auth, message, {
          useLlm: body.useLlm !== false,
        });
        return NextResponse.json({
          ok: true,
          ...out,
          notice:
            out.feature
              ? 'DRAFT CREATED — not live until the owner publishes.'
              : undefined,
        });
      }
      case 'list_drafts': {
        const drafts = await listDraftFeatures(businessId);
        return NextResponse.json({ ok: true, drafts });
      }
      case 'publish_draft': {
        // Explicit owner action only — not exposed as an AI tool name in docs
        const featureId = String(body.featureId || '').trim();
        if (!featureId) {
          return NextResponse.json(
            { error: 'featureId required' },
            { status: 400 }
          );
        }
        const feature = await publishCustomFeature({
          businessId,
          featureId,
          userId: user.id,
        });
        return NextResponse.json({
          ok: true,
          feature,
          notice: 'FEATURE PUBLISHED — now active for this business.',
        });
      }
      default:
        return NextResponse.json(
          {
            error: 'Unknown tool',
            allowed: [
              'get_feature_builder_context',
              'validate_feature_definition',
              'create_custom_feature_draft',
              'get_custom_feature_draft',
              'update_custom_feature_draft',
              'build_from_natural_language',
              'list_drafts',
              'publish_draft',
            ],
          },
          { status: 400 }
        );
    }
  } catch (e) {
    return errRes(e);
  }
}

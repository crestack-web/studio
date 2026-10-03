import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import {
  CustomFeatureError,
  listCustomFeatures,
  publishCustomFeature,
  getCustomFeature,
} from '@/lib/custom-features/service';
import {
  buildFeatureDraftFromNaturalLanguage,
  planFeatureFromNaturalLanguage,
  listDraftFeatures,
  toolCreateCustomFeatureDraft,
  toolGetCustomFeatureDraft,
  toolGetFeatureBuilderContext,
  toolUpdateCustomFeatureDraft,
  toolValidateFeatureDefinition,
} from '@/lib/custom-features/builder-tools';
import { applyDefinitionEdit } from '@/lib/custom-features/apply-definition-edit';
import {
  formatChangeSummary,
  summarizeDefinitionChanges,
} from '@/lib/custom-features/definition-diff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errRes(e: unknown) {
  if (e instanceof CustomFeatureError) {
    return NextResponse.json(
      { error: e.message, details: e.details },
      { status: e.status }
    );
  }
  const msg = e instanceof Error ? e.message : String(e ?? '');
  console.error('[custom-features/builder]', e);
  if (/custom_features|schema cache|PGRST205|does not exist/i.test(msg)) {
    return NextResponse.json(
      {
        error:
          'Custom features tables are not installed yet. Run supabase/migrations/0020_custom_features_foundation.sql in the Supabase SQL editor, then reload the schema cache (or wait a minute).',
        code: 'MISSING_CUSTOM_FEATURES_TABLE',
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}

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

    const access = await assertBusinessAccess(user, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const tool = String(body.tool || '').trim();

    switch (tool) {
      case 'get_feature_builder_context': {
        return NextResponse.json({
          ok: true,
          context: toolGetFeatureBuilderContext({ userId: user.id, businessId }),
        });
      }
      case 'validate_feature_definition': {
        const result = toolValidateFeatureDefinition(
          { userId: user.id, businessId },
          body.definition
        );
        return NextResponse.json({ ok: true, result });
      }
      case 'create_custom_feature_draft': {
        const result = await toolCreateCustomFeatureDraft({
          businessId,
          userId: user.id,
          definition: body.definition,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'get_custom_feature_draft': {
        const result = await toolGetCustomFeatureDraft({
          businessId,
          userId: user.id,
          featureId: body.featureId,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'update_custom_feature_draft': {
        const result = await toolUpdateCustomFeatureDraft({
          businessId,
          userId: user.id,
          featureId: body.featureId,
          definition: body.definition,
          changeNote: body.changeNote,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'plan_from_natural_language': {
        const message = String(body.message || '').trim();
        if (!message) {
          return NextResponse.json(
            { error: 'message required' },
            { status: 400 }
          );
        }
        const result = await planFeatureFromNaturalLanguage(message, {
          useLlm: body.useLlm !== false,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'build_from_natural_language': {
        const message = String(body.message || '').trim();
        if (!message) {
          return NextResponse.json(
            { error: 'message required' },
            { status: 400 }
          );
        }
        const result = await buildFeatureDraftFromNaturalLanguage({
          businessId,
          userId: user.id,
          message,
          useLlm: body.useLlm !== false,
        });
        return NextResponse.json({ ok: true, ...result });
      }
      case 'edit_draft_from_natural_language': {
        const featureId = String(body.featureId || '').trim();
        const message = String(body.message || '').trim();
        if (!featureId || !message) {
          return NextResponse.json(
            { error: 'featureId and message required' },
            { status: 400 }
          );
        }
        const existing = await getCustomFeature(businessId, featureId);
        if (!existing) {
          return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
        }
        const def = (existing as any).definition;
        if (!def) {
          return NextResponse.json(
            {
              error:
                'Feature has no definition to edit. Build a new draft instead.',
            },
            { status: 400 }
          );
        }
        const edit = applyDefinitionEdit(def, message);
        if (!edit.ok) {
          return NextResponse.json({
            ok: true,
            result: { kind: 'unsupported', message: edit.message },
          });
        }
        const updated = await toolUpdateCustomFeatureDraft({
          businessId,
          userId: user.id,
          featureId,
          definition: edit.definition,
          changeNote: edit.note || 'draft-edit',
        });
        const diffs = summarizeDefinitionChanges(def, edit.definition);
        return NextResponse.json({
          ok: true,
          feature: (updated as any).feature || updated,
          changeLines: edit.note ? [edit.note] : [],
          note: edit.note || formatChangeSummary(diffs).join('; '),
        });
      }
      case 'list_drafts': {
        const drafts = await listDraftFeatures(businessId);
        return NextResponse.json({ ok: true, features: drafts });
      }
      case 'list_features': {
        const features = await listCustomFeatures(businessId);
        return NextResponse.json({ ok: true, features });
      }
      case 'publish_draft': {
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
        return NextResponse.json({ ok: true, feature });
      }
      default:
        return NextResponse.json(
          {
            error: 'Unknown tool',
            supported: [
              'get_feature_builder_context',
              'validate_feature_definition',
              'create_custom_feature_draft',
              'get_custom_feature_draft',
              'update_custom_feature_draft',
              'plan_from_natural_language',
              'build_from_natural_language',
              'edit_draft_from_natural_language',
              'list_drafts',
              'list_features',
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

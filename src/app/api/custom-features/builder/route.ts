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

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

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

      case 'plan_from_natural_language': {
        const message = String(body.message || body.userMessage || '').trim();
        if (!message) {
          return NextResponse.json(
            { error: 'message required' },
            { status: 400 }
          );
        }
        const out = await planFeatureFromNaturalLanguage(message, {
          useLlm: body.useLlm !== false,
        });
        return NextResponse.json({ ok: true, ...out });
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
      case 'edit_draft_from_natural_language': {
        const featureId = String(body.featureId || '').trim();
        const message = String(body.message || body.userMessage || '').trim();
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

        // Published tools: fork a draft automatically so the owner can edit without a separate step.
        let working = existing;
        let forked = false;
        if (existing.status !== 'draft') {
          const { feature: draft } = await toolCreateCustomFeatureDraft(auth, {
            ...existing.definition,
            status: 'draft',
          });
          working = draft;
          forked = true;
        }

        const applied = applyDefinitionEdit(working.definition, message);
        if (!applied.ok) {
          return NextResponse.json({
            ok: true,
            result: { kind: 'unsupported', message: applied.message },
            feature: working,
          });
        }
        const before = working.definition;
        const feature = await toolUpdateCustomFeatureDraft(auth, {
          featureId: working.id,
          definition: applied.definition,
        });
        const changes = summarizeDefinitionChanges(before, feature.definition);
        return NextResponse.json({
          ok: true,
          feature,
          changes,
          changeLines: formatChangeSummary(changes),
          note: applied.note,
          notice: forked
            ? 'Draft created from published tool and updated. Live version is unchanged until you publish again.'
            : 'DRAFT UPDATED — published version (if any) is unchanged.',
        });
      }
      case 'list_drafts': {
        const drafts = await listDraftFeatures(businessId);
        return NextResponse.json({ ok: true, drafts });
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

/**
 * Controlled tools for MO Feature Builder.
 * All tools require an already-authenticated (userId, businessId) from the server.
 * Never trust businessId from the model alone — API layer must assertBusinessAccess.
 *
 * Forbidden tools (do not implement): execute_sql, run_code, modify_files, deploy_code, publish.
 */
import 'server-only';
import { randomUUID } from 'crypto';
import type { BusmoFeatureDefinition } from './types';
import { validateFeatureDefinition } from './validate';
import { getFeatureBuilderContext, formatFeatureBuilderContextForPrompt } from './builder-context';
import {
  CustomFeatureError,
  createCustomFeature,
  getCustomFeature,
  listCustomFeatures,
  type CustomFeatureRow,
} from './service';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  naturalLanguageToFeatureDefinition,
  type NlBuildResult,
} from './nl-to-definition';

export const FEATURE_BUILDER_TOOL_NAMES = [
  'get_feature_builder_context',
  'validate_feature_definition',
  'create_custom_feature_draft',
  'get_custom_feature_draft',
  'update_custom_feature_draft',
] as const;

export type FeatureBuilderToolName = (typeof FEATURE_BUILDER_TOOL_NAMES)[number];

export type ToolAuthContext = {
  userId: string;
  businessId: string;
};

export async function toolGetFeatureBuilderContext(_auth: ToolAuthContext) {
  return {
    context: getFeatureBuilderContext(),
    promptBlock: formatFeatureBuilderContextForPrompt(),
  };
}

export async function toolValidateFeatureDefinition(
  _auth: ToolAuthContext,
  definition: unknown
) {
  return validateFeatureDefinition(definition);
}

/**
 * Create or refresh a draft. Never publishes.
 * If a draft already exists for the same slug, updates it instead of overwriting published rows.
 */
export async function toolCreateCustomFeatureDraft(
  authOrOpts: ToolAuthContext | (ToolAuthContext & { definition: unknown }),
  definitionArg?: unknown
): Promise<{ feature: CustomFeatureRow; created: boolean }> {
  let auth: ToolAuthContext;
  let definition: unknown;
  if (
    authOrOpts &&
    typeof authOrOpts === 'object' &&
    'definition' in authOrOpts &&
    definitionArg === undefined
  ) {
    const o = authOrOpts as ToolAuthContext & { definition: unknown };
    auth = { userId: o.userId, businessId: o.businessId };
    definition = o.definition;
  } else {
    auth = authOrOpts as ToolAuthContext;
    definition = definitionArg;
  }
  const v = validateFeatureDefinition(definition);
  if (!v.ok) {
    throw new CustomFeatureError('Invalid feature definition', 400, v.issues);
  }
  const def = {
    ...(definition as BusmoFeatureDefinition),
    status: 'draft' as const,
    businessId: auth.businessId,
  };

  const existingDraft = await findDraftBySlug(auth.businessId, def.slug);
  if (existingDraft) {
    const updated = await updateDraftRow({
      businessId: auth.businessId,
      featureId: existingDraft.id,
      userId: auth.userId,
      definition: {
        ...def,
        id: existingDraft.id,
        version: existingDraft.version,
        status: 'draft',
      },
    });
    return { feature: updated, created: false };
  }

  const maxVersion = await maxVersionForSlug(auth.businessId, def.slug);
  def.version = Math.max(def.version || 1, maxVersion + 1);
  if (!def.id || def.id === 'proto-delivery-tracker') {
    def.id = randomUUID();
  }

  const feature = await createCustomFeature({
    businessId: auth.businessId,
    definition: def,
    userId: auth.userId,
    status: 'draft',
  });
  return { feature, created: true };
}

export async function toolGetCustomFeatureDraft(
  authOrOpts:
    | ToolAuthContext
    | (ToolAuthContext & { featureId?: string; slug?: string }),
  opts?: { featureId?: string; slug?: string }
): Promise<{ feature: CustomFeatureRow | null } | CustomFeatureRow | null> {
  let auth: ToolAuthContext;
  let featureId: string | undefined;
  let slug: string | undefined;
  if (
    authOrOpts &&
    typeof authOrOpts === 'object' &&
    ('featureId' in authOrOpts || 'slug' in authOrOpts) &&
    opts === undefined
  ) {
    const o = authOrOpts as ToolAuthContext & {
      featureId?: string;
      slug?: string;
    };
    auth = { userId: o.userId, businessId: o.businessId };
    featureId = o.featureId;
    slug = o.slug;
  } else {
    auth = authOrOpts as ToolAuthContext;
    featureId = opts?.featureId;
    slug = opts?.slug;
  }

  let feature: CustomFeatureRow | null = null;
  if (featureId) {
    const f = await getCustomFeature(auth.businessId, featureId);
    feature = f || null;
  } else if (slug) {
    feature = await findDraftBySlug(auth.businessId, slug);
  }

  if (opts === undefined && 'businessId' in (authOrOpts as any)) {
    return { feature };
  }
  return feature;
}

export async function toolUpdateCustomFeatureDraft(
  authOrOpts:
    | ToolAuthContext
    | (ToolAuthContext & {
        featureId: string;
        definition: unknown;
        changeNote?: string;
      }),
  opts?: { featureId: string; definition: unknown; changeNote?: string }
): Promise<CustomFeatureRow | { feature: CustomFeatureRow }> {
  let auth: ToolAuthContext;
  let featureId: string;
  let definition: unknown;
  let objectForm = false;

  if (
    authOrOpts &&
    typeof authOrOpts === 'object' &&
    'featureId' in authOrOpts &&
    'definition' in authOrOpts &&
    opts === undefined
  ) {
    const o = authOrOpts as ToolAuthContext & {
      featureId: string;
      definition: unknown;
    };
    auth = { userId: o.userId, businessId: o.businessId };
    featureId = o.featureId;
    definition = o.definition;
    objectForm = true;
  } else {
    auth = authOrOpts as ToolAuthContext;
    featureId = opts!.featureId;
    definition = opts!.definition;
  }

  const existing = await getCustomFeature(auth.businessId, featureId);
  if (!existing) throw new CustomFeatureError('Feature not found', 404);
  if (existing.status !== 'draft') {
    throw new CustomFeatureError(
      'Only draft features can be updated by the feature builder. Published features stay live until the owner publishes a new version.',
      400
    );
  }

  const v = validateFeatureDefinition(definition);
  if (!v.ok) {
    throw new CustomFeatureError('Invalid feature definition', 400, v.issues);
  }

  const def = {
    ...(definition as BusmoFeatureDefinition),
    id: existing.id,
    businessId: auth.businessId,
    slug: existing.slug,
    version: existing.version,
    status: 'draft' as const,
  };

  const feature = await updateDraftRow({
    businessId: auth.businessId,
    featureId: existing.id,
    userId: auth.userId,
    definition: def,
  });
  return objectForm ? { feature } : feature;
}

/** List drafts for owner preview UI. */
export async function listDraftFeatures(
  businessId: string
): Promise<CustomFeatureRow[]> {
  const all = await listCustomFeatures(businessId);
  return all.filter((f) => f.status === 'draft');
}

/**
 * Plan mode: understand request, ask questions or return optimized prompt.
 * Never creates a draft. Never publishes.
 */
export async function planFeatureFromNaturalLanguage(
  userMessage: string,
  opts?: { useLlm?: boolean }
): Promise<{
  result:
    | NlBuildResult
    | {
        kind: 'plan';
        summary: string;
        optimizedPrompt: string;
        suggestedName: string;
      };
}> {
  const result = await naturalLanguageToFeatureDefinition(userMessage, opts);
  if (result.kind === 'definition') {
    const entity = result.definition.entities?.[0];
    const fieldLabels =
      entity?.fields?.map((f) => f.label).filter(Boolean).join(', ') ||
      'key business fields';
    const optimizedPrompt = [
      `Build "${result.definition.name}" for my business.`,
      result.definition.description || '',
      entity ? `Track each ${entity.label.toLowerCase()} with: ${fieldLabels}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
    return {
      result: {
        kind: 'plan',
        summary:
          result.summary ||
          `Plan ready: ${result.definition.name}. Switch to Builder to create the draft.`,
        optimizedPrompt,
        suggestedName: result.definition.name,
      },
    };
  }
  return { result };
}

/**
 * High-level MO entry: NL → validate → draft.
 * Does not publish.
 */
export async function buildFeatureDraftFromNaturalLanguage(
  authOrOpts: ToolAuthContext | (ToolAuthContext & { message: string; useLlm?: boolean }),
  userMessage?: string,
  opts?: { useLlm?: boolean }
): Promise<{
  result: NlBuildResult;
  feature?: CustomFeatureRow;
  created?: boolean;
}> {
  let auth: ToolAuthContext;
  let message: string;
  let useLlm: boolean | undefined;

  if (
    authOrOpts &&
    typeof authOrOpts === 'object' &&
    'message' in authOrOpts &&
    typeof (authOrOpts as any).message === 'string'
  ) {
    const o = authOrOpts as ToolAuthContext & { message: string; useLlm?: boolean };
    auth = { userId: o.userId, businessId: o.businessId };
    message = o.message;
    useLlm = o.useLlm;
  } else {
    auth = authOrOpts as ToolAuthContext;
    message = String(userMessage || '');
    useLlm = opts?.useLlm;
  }

  const result = await naturalLanguageToFeatureDefinition(message, {
    useLlm,
  });
  if (result.kind !== 'definition') {
    return { result };
  }
  const { feature, created } = await toolCreateCustomFeatureDraft(
    auth,
    result.definition
  );
  return { result, feature, created };
}

async function findDraftBySlug(
  businessId: string,
  slug: string
): Promise<CustomFeatureRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('custom_features')
    .select('*')
    .eq('business_id', businessId)
    .eq('slug', slug)
    .eq('status', 'draft')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new CustomFeatureError(error.message, 500);
  if (!data) return null;
  return {
    ...(data as any),
    definition: (data as any).definition,
  } as CustomFeatureRow;
}

async function maxVersionForSlug(
  businessId: string,
  slug: string
): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from('custom_features')
    .select('version')
    .eq('business_id', businessId)
    .eq('slug', slug)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number((data as any).version) || 0 : 0;
}

async function updateDraftRow(opts: {
  businessId: string;
  featureId: string;
  userId: string;
  definition: BusmoFeatureDefinition;
}): Promise<CustomFeatureRow> {
  const { data, error } = await getSupabaseAdmin()
    .from('custom_features')
    .update({
      name: opts.definition.name,
      description: opts.definition.description || null,
      definition: opts.definition,
      nav_label: opts.definition.navLabel || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opts.featureId)
    .eq('business_id', opts.businessId)
    .eq('status', 'draft')
    .select('*')
    .single();

  if (error) throw new CustomFeatureError(error.message, 500);

  await getSupabaseAdmin().from('custom_feature_versions').insert({
    id: randomUUID(),
    feature_id: opts.featureId,
    business_id: opts.businessId,
    version: opts.definition.version,
    definition: opts.definition,
    status: 'draft',
    created_by: opts.userId,
    change_note: 'draft-update',
  });

  return {
    ...(data as any),
    definition: (data as any).definition,
  } as CustomFeatureRow;
}

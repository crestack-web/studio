/**
 * Server-side custom features service.
 * All operations require an already-authorized businessId (caller must
 * authenticate + assertBusinessAccess before calling).
 */
import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type { BusmoFeatureDefinition, FeatureStatus } from './types';
import { validateFeatureDefinition } from './validate';
import { validateFeatureRecord } from './validate-record';

export class CustomFeatureError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'CustomFeatureError';
    this.status = status;
    this.details = details;
  }
}

export interface CustomFeatureRow {
  id: string;
  business_id: string;
  slug: string;
  name: string;
  description: string | null;
  definition: BusmoFeatureDefinition;
  version: number;
  status: FeatureStatus;
  nav_label: string | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFeatureRecordRow {
  id: string;
  business_id: string;
  feature_id: string;
  entity_key: string;
  data: Record<string, unknown>;
  status: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

function admin() {
  return getSupabaseAdmin();
}

function asDefinition(raw: unknown): BusmoFeatureDefinition {
  return raw as BusmoFeatureDefinition;
}

export async function listCustomFeatures(
  businessId: string
): Promise<CustomFeatureRow[]> {
  const { data, error } = await admin()
    .from('custom_features')
    .select('*')
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false });
  if (error) throw new CustomFeatureError(error.message, 500);
  return (data || []).map((r) => ({
    ...r,
    definition: asDefinition(r.definition),
  })) as CustomFeatureRow[];
}

export async function getCustomFeature(
  businessId: string,
  featureId: string
): Promise<CustomFeatureRow | null> {
  const { data, error } = await admin()
    .from('custom_features')
    .select('*')
    .eq('id', featureId)
    .eq('business_id', businessId)
    .maybeSingle();
  if (error) throw new CustomFeatureError(error.message, 500);
  if (!data) return null;
  return {
    ...(data as any),
    definition: asDefinition((data as any).definition),
  } as CustomFeatureRow;
}

export async function getPublishedFeatureBySlug(
  businessId: string,
  slug: string
): Promise<CustomFeatureRow | null> {
  const { data, error } = await admin()
    .from('custom_features')
    .select('*')
    .eq('business_id', businessId)
    .eq('slug', slug)
    .eq('status', 'published')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new CustomFeatureError(error.message, 500);
  if (!data) return null;
  return {
    ...(data as any),
    definition: asDefinition((data as any).definition),
  } as CustomFeatureRow;
}

export async function createCustomFeature(opts: {
  businessId: string;
  definition: BusmoFeatureDefinition;
  userId: string;
  status?: FeatureStatus;
}): Promise<CustomFeatureRow> {
  const v = validateFeatureDefinition(opts.definition);
  if (!v.ok) {
    throw new CustomFeatureError('Invalid feature definition', 400, v.issues);
  }

  const id = opts.definition.id || randomUUID();
  const version = opts.definition.version || 1;
  const status = opts.status || 'draft';
  const def: BusmoFeatureDefinition = {
    ...opts.definition,
    id,
    businessId: opts.businessId,
    version,
    status,
  };

  const row = {
    id,
    business_id: opts.businessId,
    slug: def.slug,
    name: def.name,
    description: def.description || null,
    definition: def,
    version,
    status,
    nav_label: def.navLabel || null,
    icon_key: def.iconKey || null,
    created_by: opts.userId,
    published_at: status === 'published' ? new Date().toISOString() : null,
    metadata: {},
  };

  const { data, error } = await admin()
    .from('custom_features')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new CustomFeatureError(error.message, 500);

  // Snapshot version
  await admin().from('custom_feature_versions').insert({
    id: randomUUID(),
    feature_id: id,
    business_id: opts.businessId,
    version,
    definition: def,
    status,
    created_by: opts.userId,
    change_note: 'initial',
  });

  return {
    ...(data as any),
    definition: asDefinition((data as any).definition),
  } as CustomFeatureRow;
}

export async function publishCustomFeature(opts: {
  businessId: string;
  featureId: string;
  userId: string;
}): Promise<CustomFeatureRow> {
  const feature = await getCustomFeature(opts.businessId, opts.featureId);
  if (!feature) throw new CustomFeatureError('Feature not found', 404);
  if (feature.status === 'archived') {
    throw new CustomFeatureError('Cannot publish an archived feature', 400);
  }

  const nextVersion = feature.version + 1;
  const def: BusmoFeatureDefinition = {
    ...feature.definition,
    version: nextVersion,
    status: 'published',
  };

  // Archive other published versions of same slug for this business
  await admin()
    .from('custom_features')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('business_id', opts.businessId)
    .eq('slug', feature.slug)
    .eq('status', 'published')
    .neq('id', feature.id);

  const { data, error } = await admin()
    .from('custom_features')
    .update({
      status: 'published',
      version: nextVersion,
      definition: def,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', feature.id)
    .eq('business_id', opts.businessId)
    .select('*')
    .single();

  if (error) throw new CustomFeatureError(error.message, 500);

  await admin().from('custom_feature_versions').insert({
    id: randomUUID(),
    feature_id: feature.id,
    business_id: opts.businessId,
    version: nextVersion,
    definition: def,
    status: 'published',
    created_by: opts.userId,
    change_note: 'publish',
  });

  return {
    ...(data as any),
    definition: asDefinition((data as any).definition),
  } as CustomFeatureRow;
}

export async function listFeatureRecords(opts: {
  businessId: string;
  featureId: string;
  entityKey?: string;
}): Promise<CustomFeatureRecordRow[]> {
  // Ensure feature belongs to business
  const feature = await getCustomFeature(opts.businessId, opts.featureId);
  if (!feature) throw new CustomFeatureError('Feature not found', 404);

  let q = admin()
    .from('custom_feature_records')
    .select('*')
    .eq('business_id', opts.businessId)
    .eq('feature_id', opts.featureId)
    .order('created_at', { ascending: false });

  if (opts.entityKey) q = q.eq('entity_key', opts.entityKey);

  const { data, error } = await q;
  if (error) throw new CustomFeatureError(error.message, 500);
  return (data || []) as CustomFeatureRecordRow[];
}

export async function createFeatureRecord(opts: {
  businessId: string;
  featureId: string;
  entityKey: string;
  data: unknown;
  userId: string;
}): Promise<CustomFeatureRecordRow> {
  const feature = await getCustomFeature(opts.businessId, opts.featureId);
  if (!feature) throw new CustomFeatureError('Feature not found', 404);
  if (feature.status === 'archived') {
    throw new CustomFeatureError('Cannot write records for an archived feature', 400);
  }
  if (feature.status !== 'published' && feature.status !== 'testing') {
    throw new CustomFeatureError(
      'Feature must be published or testing before records can be created',
      400
    );
  }

  const validated = validateFeatureRecord(
    feature.definition,
    opts.entityKey,
    opts.data
  );
  if (!validated.ok) {
    throw new CustomFeatureError('Invalid record', 400, validated.issues);
  }

  const statusVal =
    typeof validated.data.status === 'string'
      ? validated.data.status
      : null;

  const row = {
    id: randomUUID(),
    business_id: opts.businessId,
    feature_id: opts.featureId,
    entity_key: opts.entityKey,
    data: validated.data,
    status: statusVal,
    created_by: opts.userId,
    updated_by: opts.userId,
    metadata: {},
  };

  const { data, error } = await admin()
    .from('custom_feature_records')
    .insert(row)
    .select('*')
    .single();
  if (error) throw new CustomFeatureError(error.message, 500);
  return data as CustomFeatureRecordRow;
}

export async function updateFeatureRecord(opts: {
  businessId: string;
  featureId: string;
  recordId: string;
  data: unknown;
  userId: string;
}): Promise<CustomFeatureRecordRow> {
  const feature = await getCustomFeature(opts.businessId, opts.featureId);
  if (!feature) throw new CustomFeatureError('Feature not found', 404);
  if (feature.status === 'archived') {
    throw new CustomFeatureError('Cannot write records for an archived feature', 400);
  }

  const { data: existing, error: findErr } = await admin()
    .from('custom_feature_records')
    .select('*')
    .eq('id', opts.recordId)
    .eq('feature_id', opts.featureId)
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (findErr) throw new CustomFeatureError(findErr.message, 500);
  if (!existing) throw new CustomFeatureError('Record not found', 404);

  const merged = {
    ...((existing as any).data || {}),
    ...(isObject(opts.data) ? opts.data : {}),
  };

  const validated = validateFeatureRecord(
    feature.definition,
    (existing as any).entity_key,
    merged
  );
  if (!validated.ok) {
    throw new CustomFeatureError('Invalid record', 400, validated.issues);
  }

  const statusVal =
    typeof validated.data.status === 'string'
      ? validated.data.status
      : null;

  const { data, error } = await admin()
    .from('custom_feature_records')
    .update({
      data: validated.data,
      status: statusVal,
      updated_by: opts.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opts.recordId)
    .eq('business_id', opts.businessId)
    .select('*')
    .single();

  if (error) throw new CustomFeatureError(error.message, 500);
  return data as CustomFeatureRecordRow;
}

export async function deleteFeatureRecord(opts: {
  businessId: string;
  featureId: string;
  recordId: string;
}): Promise<void> {
  const { data: existing, error: findErr } = await admin()
    .from('custom_feature_records')
    .select('id')
    .eq('id', opts.recordId)
    .eq('feature_id', opts.featureId)
    .eq('business_id', opts.businessId)
    .maybeSingle();

  if (findErr) throw new CustomFeatureError(findErr.message, 500);
  if (!existing) throw new CustomFeatureError('Record not found', 404);

  const { error } = await admin()
    .from('custom_feature_records')
    .delete()
    .eq('id', opts.recordId)
    .eq('business_id', opts.businessId);

  if (error) throw new CustomFeatureError(error.message, 500);
}

/**
 * Ensure a published Delivery Tracker exists for the business (prototype bootstrap).
 */
export async function ensureDeliveryTrackerFeature(opts: {
  businessId: string;
  userId: string;
  definition: BusmoFeatureDefinition;
}): Promise<CustomFeatureRow> {
  const existing = await getPublishedFeatureBySlug(
    opts.businessId,
    opts.definition.slug
  );
  if (existing) return existing;

  // Any existing draft/testing with same slug?
  const { data: anyRow } = await admin()
    .from('custom_features')
    .select('*')
    .eq('business_id', opts.businessId)
    .eq('slug', opts.definition.slug)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (anyRow) {
    return publishCustomFeature({
      businessId: opts.businessId,
      featureId: (anyRow as any).id,
      userId: opts.userId,
    });
  }

  return createCustomFeature({
    businessId: opts.businessId,
    definition: opts.definition,
    userId: opts.userId,
    status: 'published',
  });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

import {
  ALLOWED_FIELD_TYPES,
  ALLOWED_VIEW_TYPES,
  ALLOWED_RELATION_TARGETS,
  ALLOWED_COMPUTED_OPS,
  type BusmoFeatureDefinition,
  type FieldType,
  type ViewType,
} from './types';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/**
 * Structural validation of a feature definition.
 * Rejects unknown field/view types — AI may only use the controlled vocabulary.
 */
export function validateFeatureDefinition(
  def: unknown
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!def || typeof def !== 'object') {
    return { ok: false, issues: [{ path: '', message: 'Definition must be an object' }] };
  }

  const d = def as Partial<BusmoFeatureDefinition>;

  if (!d.id || typeof d.id !== 'string') {
    issues.push({ path: 'id', message: 'id is required' });
  }
  if (!d.slug || typeof d.slug !== 'string') {
    issues.push({ path: 'slug', message: 'slug is required' });
  }
  if (!d.name || typeof d.name !== 'string') {
    issues.push({ path: 'name', message: 'name is required' });
  }
  if (typeof d.version !== 'number' || d.version < 1) {
    issues.push({ path: 'version', message: 'version must be >= 1' });
  }
  if (
    !d.status ||
    !['draft', 'testing', 'published', 'archived'].includes(d.status)
  ) {
    issues.push({ path: 'status', message: 'invalid status' });
  }

  if (!Array.isArray(d.entities) || d.entities.length === 0) {
    issues.push({ path: 'entities', message: 'at least one entity is required' });
  } else {
    const entityKeys = new Set<string>();
    d.entities.forEach((ent, i) => {
      const p = `entities[${i}]`;
      if (!ent?.key) issues.push({ path: `${p}.key`, message: 'key required' });
      if (ent?.key && entityKeys.has(ent.key)) {
        issues.push({ path: `${p}.key`, message: 'duplicate entity key' });
      }
      if (ent?.key) entityKeys.add(ent.key);
      if (!ent?.label) issues.push({ path: `${p}.label`, message: 'label required' });
      if (!Array.isArray(ent?.fields) || ent.fields.length === 0) {
        issues.push({ path: `${p}.fields`, message: 'fields required' });
      } else {
        ent.fields.forEach((f, j) => {
          const fp = `${p}.fields[${j}]`;
          if (!f?.key) issues.push({ path: `${fp}.key`, message: 'key required' });
          if (!f?.label) issues.push({ path: `${fp}.label`, message: 'label required' });
          if (!f?.type || !ALLOWED_FIELD_TYPES.includes(f.type as FieldType)) {
            issues.push({
              path: `${fp}.type`,
              message: `type must be one of: ${ALLOWED_FIELD_TYPES.join(', ')}`,
            });
          }
          if (f?.relationTarget && !ALLOWED_RELATION_TARGETS.includes(f.relationTarget as any)) {
            issues.push({
              path: `${fp}.relationTarget`,
              message: `relationTarget must be one of: ${ALLOWED_RELATION_TARGETS.join(', ')}`,
            });
          }
          if (f?.computed) {
            const c = f.computed as any;
            if (!c.op || !ALLOWED_COMPUTED_OPS.includes(c.op)) {
              issues.push({
                path: `${fp}.computed.op`,
                message: `computed.op must be one of: ${ALLOWED_COMPUTED_OPS.join(', ')}`,
              });
            }
            if (!Array.isArray(c.inputs) || c.inputs.length < 1) {
              issues.push({
                path: `${fp}.computed.inputs`,
                message: 'computed.inputs must be a non-empty array of field keys',
              });
            }
          }
        });
      }
    });

    if (Array.isArray(d.views)) {
      d.views.forEach((v, i) => {
        const p = `views[${i}]`;
        if (!v?.key) issues.push({ path: `${p}.key`, message: 'key required' });
        if (!v?.title) issues.push({ path: `${p}.title`, message: 'title required' });
        if (!v?.type || !ALLOWED_VIEW_TYPES.includes(v.type as ViewType)) {
          issues.push({
            path: `${p}.type`,
            message: `type must be one of: ${ALLOWED_VIEW_TYPES.join(', ')}`,
          });
        }
        if (!v?.entity || !entityKeys.has(v.entity)) {
          issues.push({ path: `${p}.entity`, message: 'entity must reference a defined entity' });
        }
      });
    }
  }

  return { ok: issues.length === 0, issues };
}

import type { BusmoFeatureDefinition, EntityDefinition, FieldDefinition } from './types';

export interface RecordValidationIssue {
  field: string;
  message: string;
}

export interface RecordValidationResult {
  ok: boolean;
  issues: RecordValidationIssue[];
  /** Sanitized data containing only known fields with coerced safe types. */
  data: Record<string, unknown>;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function validateField(
  field: FieldDefinition,
  raw: unknown
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (raw === undefined || raw === null || raw === '') {
    if (field.required) {
      return { ok: false, message: `${field.label} is required` };
    }
    return { ok: true, value: field.defaultValue ?? null };
  }

  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'phone':
    case 'email':
    case 'relation': {
      if (typeof raw !== 'string' && typeof raw !== 'number') {
        return { ok: false, message: `${field.label} must be text` };
      }
      const s = String(raw).trim();
      if (field.type === 'email' && s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
        return { ok: false, message: `${field.label} must be a valid email` };
      }
      return { ok: true, value: s };
    }
    case 'number':
    case 'currency': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) {
        return { ok: false, message: `${field.label} must be a number` };
      }
      return { ok: true, value: n };
    }
    case 'boolean': {
      if (typeof raw === 'boolean') return { ok: true, value: raw };
      if (raw === 'true' || raw === '1') return { ok: true, value: true };
      if (raw === 'false' || raw === '0') return { ok: true, value: false };
      return { ok: false, message: `${field.label} must be true or false` };
    }
    case 'date':
    case 'datetime': {
      const s = String(raw).trim();
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, message: `${field.label} must be a valid date` };
      }
      return { ok: true, value: s };
    }
    case 'select':
    case 'status': {
      const s = String(raw).trim();
      const opts = field.options || [];
      if (opts.length && !opts.includes(s)) {
        return {
          ok: false,
          message: `${field.label} must be one of: ${opts.join(', ')}`,
        };
      }
      return { ok: true, value: s };
    }
    default:
      return { ok: false, message: `${field.label} has unsupported type` };
  }
}

/**
 * Validate record payload against a feature entity definition.
 * Rejects unknown fields; does not silently drop them without error.
 */
export function validateFeatureRecord(
  definition: BusmoFeatureDefinition,
  entityKey: string,
  input: unknown
): RecordValidationResult {
  const issues: RecordValidationIssue[] = [];
  if (!isPlainObject(input)) {
    return {
      ok: false,
      issues: [{ field: '', message: 'Record data must be an object' }],
      data: {},
    };
  }

  const entity = definition.entities.find((e) => e.key === entityKey);
  if (!entity) {
    return {
      ok: false,
      issues: [{ field: 'entity', message: `Unknown entity: ${entityKey}` }],
      data: {},
    };
  }

  const allowed = new Set(entity.fields.map((f) => f.key));
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      issues.push({ field: key, message: `Unknown field: ${key}` });
    }
  }

  const data: Record<string, unknown> = {};
  for (const field of entity.fields) {
    const result = validateField(field, input[field.key]);
    if (!result.ok) {
      issues.push({ field: field.key, message: result.message });
    } else if (result.value !== null && result.value !== undefined) {
      data[field.key] = result.value;
    }
  }

  return { ok: issues.length === 0, issues, data };
}

export function getEntityOrThrow(
  definition: BusmoFeatureDefinition,
  entityKey: string
): EntityDefinition {
  const entity = definition.entities.find((e) => e.key === entityKey);
  if (!entity) throw new Error(`Unknown entity: ${entityKey}`);
  return entity;
}

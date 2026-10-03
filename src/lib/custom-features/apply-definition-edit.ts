/**
 * Apply owner NL edit requests to an existing draft definition.
 * Stays within controlled field types — never generates code.
 */
import type { BusmoFeatureDefinition, FieldDefinition, FieldType } from './types';
import { validateFeatureDefinition } from './validate';

export type ApplyEditResult =
  | { ok: true; definition: BusmoFeatureDefinition; note?: string }
  | { ok: false; message: string };

function slugKey(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) || 'field'
  );
}

function inferType(label: string): FieldType {
  const pl = label.toLowerCase();
  if (/amount|price|cost|fee|paid|balance|owe|payment/.test(pl)) return 'currency';
  if (/weight|kg|quantity|qty|count|number|materials?/.test(pl)) return 'number';
  if (/date|day/.test(pl)) return 'date';
  if (/phone|mobile|whatsapp/.test(pl)) return 'phone';
  if (/email/.test(pl)) return 'email';
  if (/note|notes|description|location|address/.test(pl)) return 'textarea';
  if (/status/.test(pl)) return 'status';
  return 'text';
}

function cloneDef(def: BusmoFeatureDefinition): BusmoFeatureDefinition {
  return JSON.parse(JSON.stringify(def)) as BusmoFeatureDefinition;
}

/**
 * Heuristic NL edits on the primary entity.
 */
export function applyDefinitionEdit(
  current: BusmoFeatureDefinition,
  editMessage: string
): ApplyEditResult {
  const text = String(editMessage || '').trim();
  if (!text) return { ok: false, message: 'What would you like to change?' };

  if (/whatsapp|sms|notification|webhook|javascript|sql|code/i.test(text)) {
    return {
      ok: false,
      message:
        'I can add that as a tracked field, but automated WhatsApp notifications and custom code aren’t available in this builder yet.',
    };
  }

  const def = cloneDef(current);
  const entity = def.entities[0];
  if (!entity) return { ok: false, message: 'This feature has no entity to edit.' };

  const lower = text.toLowerCase();

  // Remove field
  const removeMatch =
    text.match(/remove\s+(?:the\s+)?([a-z0-9\s_-]{2,40})/i) ||
    text.match(/delete\s+(?:the\s+)?([a-z0-9\s_-]{2,40})/i);
  if (removeMatch) {
    const label = removeMatch[1].trim();
    const key = slugKey(label);
    const before = entity.fields.length;
    entity.fields = entity.fields.filter(
      (f) =>
        f.key !== key &&
        !f.label.toLowerCase().includes(label.toLowerCase()) &&
        f.key !== label.toLowerCase().replace(/\s+/g, '_')
    );
    if (entity.fields.length === before) {
      return { ok: false, message: `I couldn’t find a field matching “${label}”.` };
    }
    // Clean views
    for (const v of def.views || []) {
      if (v.columns) v.columns = v.columns.filter((c) => entity.fields.some((f) => f.key === c.field));
      if (v.formFields)
        v.formFields = v.formFields.filter((k) => entity.fields.some((f) => f.key === k));
      if (v.metricFields)
        v.metricFields = v.metricFields.filter((k) => entity.fields.some((f) => f.key === k));
    }
    def.status = 'draft';
    const v = validateFeatureDefinition(def);
    if (!v.ok) return { ok: false, message: 'Update failed validation' };
    return { ok: true, definition: def, note: `Removed ${label}` };
  }

  // Add field(s)
  const addMatch =
    text.match(/add\s+(?:a\s+|the\s+)?(.+)/i) ||
    text.match(/include\s+(?:a\s+|the\s+)?(.+)/i) ||
    text.match(/also\s+(?:want\s+to\s+)?record\s+(.+)/i) ||
    text.match(/i\s+also\s+want\s+(.+)/i);

  if (addMatch || /add |include |also /.test(lower)) {
    let payload = addMatch ? addMatch[1] : text;
    payload = payload
      .replace(/\.?$/,'')
      .replace(/^(?:field|column)\s+/i, '')
      .trim();
    // strip trailing 
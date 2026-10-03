import type { BusmoFeatureDefinition, FieldDefinition } from './types';

export type DefinitionChangeSummary = {
  addedFields: string[];
  removedFields: string[];
  changedFields: string[];
  nameChanged?: { from: string; to: string };
  descriptionChanged?: boolean;
};

function fieldMap(def: BusmoFeatureDefinition): Map<string, FieldDefinition> {
  const m = new Map<string, FieldDefinition>();
  for (const e of def.entities || []) {
    for (const f of e.fields || []) {
      m.set(`${e.key}.${f.key}`, f);
    }
  }
  return m;
}

/** Lightweight diff for UI change summaries (not a full JSON diff). */
export function summarizeDefinitionChanges(
  before: BusmoFeatureDefinition | null | undefined,
  after: BusmoFeatureDefinition
): DefinitionChangeSummary {
  if (!before) {
    const added: string[] = [];
    for (const e of after.entities || []) {
      for (const f of e.fields || []) added.push(f.label || f.key);
    }
    return {
      addedFields: added,
      removedFields: [],
      changedFields: [],
    };
  }

  const a = fieldMap(before);
  const b = fieldMap(after);
  const addedFields: string[] = [];
  const removedFields: string[] = [];
  const changedFields: string[] = [];

  for (const [k, f] of b) {
    if (!a.has(k)) addedFields.push(f.label || f.key);
    else {
      const prev = a.get(k)!;
      if (
        prev.type !== f.type ||
        prev.label !== f.label ||
        prev.required !== f.required ||
        JSON.stringify(prev.options || []) !== JSON.stringify(f.options || [])
      ) {
        changedFields.push(f.label || f.key);
      }
    }
  }
  for (const [k, f] of a) {
    if (!b.has(k)) removedFields.push(f.label || f.key);
  }

  const summary: DefinitionChangeSummary = {
    addedFields,
    removedFields,
    changedFields,
  };
  if (before.name !== after.name) {
    summary.nameChanged = { from: before.name, to: after.name };
  }
  if ((before.description || '') !== (after.description || '')) {
    summary.descriptionChanged = true;
  }
  return summary;
}

export function formatChangeSummary(s: DefinitionChangeSummary): string[] {
  const lines: string[] = [];
  for (const f of s.addedFields) lines.push(`Added: ${f}`);
  for (const f of s.removedFields) lines.push(`Removed: ${f}`);
  for (const f of s.changedFields) lines.push(`Updated: ${f}`);
  if (s.nameChanged) {
    lines.push(`Renamed: ${s.nameChanged.from} → ${s.nameChanged.to}`);
  }
  if (s.descriptionChanged) lines.push('Updated description');
  if (!lines.length) lines.push('No structural field changes detected');
  return lines;
}

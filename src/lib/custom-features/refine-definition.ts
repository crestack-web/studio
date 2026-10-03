/**
 * Flexible refine: owner text → process-aware update of an existing definition.
 * Used when simple field heuristics are not enough.
 * Still declarative only — never arbitrary code.
 */

import type { BusmoFeatureDefinition, FieldDefinition } from './types';
import { validateFeatureDefinition } from './validate';
import { planBusinessProcess } from './process-planner';
import {
  businessProcessPlanToDefinition,
  formatProcessExplanation,
} from './plan-to-definition';
import { applyDefinitionEdit, type ApplyEditResult } from './apply-definition-edit';

function featureSeedText(def: BusmoFeatureDefinition): string {
  const ent = def.entities?.[0];
  const fields = (ent?.fields || [])
    .map((f) => f.label)
    .filter(Boolean)
    .join(', ');
  return [
    def.name,
    def.description || '',
    ent ? `Tracks ${ent.label}: ${fields}` : '',
    (def.actions || []).map((a) => a.label).join(', '),
  ]
    .filter(Boolean)
    .join('\n');
}

function mergeFields(
  previous: FieldDefinition[],
  next: FieldDefinition[]
): FieldDefinition[] {
  const byKey = new Map<string, FieldDefinition>();
  for (const f of previous) byKey.set(f.key, { ...f });
  for (const f of next) {
    const old = byKey.get(f.key);
    if (old) {
      byKey.set(f.key, {
        ...old,
        ...f,
        // Prefer new computed if provided
        computed: f.computed || old.computed,
        relationTarget: f.relationTarget || old.relationTarget,
        options: f.options || old.options,
      });
    } else {
      byKey.set(f.key, f);
    }
  }
  // Keep previous-only fields the owner already had (don't wipe custom adds)
  return Array.from(byKey.values());
}

function mergeDefinitions(
  current: BusmoFeatureDefinition,
  generated: BusmoFeatureDefinition
): BusmoFeatureDefinition {
  const curEnt = current.entities[0];
  const genEnt = generated.entities[0];
  if (!curEnt || !genEnt) return generated;

  const fields = mergeFields(curEnt.fields, genEnt.fields);
  const entity = {
    ...genEnt,
    key: curEnt.key || genEnt.key,
    label: genEnt.label || curEnt.label,
    labelPlural: genEnt.labelPlural || curEnt.labelPlural,
    fields,
    primaryField: genEnt.primaryField || curEnt.primaryField || fields[0]?.key,
  };

  // Views: prefer generated structure (process-driven), ensure form covers all fields
  const views = (generated.views || []).map((v) => {
    if (v.type === 'form') {
      return {
        ...v,
        formFields: fields.map((f) => f.key).filter((k) => {
          const fdef = fields.find((x) => x.key === k);
          return fdef && !fdef.hidden && !fdef.autoFromAuth;
        }),
      };
    }
    return v;
  });

  // Actions: prefer generated business labels
  const actions =
    generated.actions && generated.actions.length
      ? generated.actions.map((a) => ({ ...a, entity: entity.key }))
      : current.actions;

  return {
    ...generated,
    id: current.id,
    slug: current.slug,
    businessId: current.businessId,
    version: current.version,
    status: 'draft',
    name: generated.name || current.name,
    navLabel: generated.navLabel || generated.name || current.navLabel,
    description: generated.description || current.description,
    entities: [entity],
    views,
    actions,
  };
}

/**
 * Primary flexible entry: try precise edits first, then process replan + merge.
 */
export function refineDefinitionFromNaturalLanguage(
  current: BusmoFeatureDefinition,
  message: string,
  opts?: { conversation?: string }
): ApplyEditResult & { explanation?: string } {
  const text = String(message || '').trim();
  if (!text) return { ok: false, message: 'What would you like to change?' };

  // 1) Structured / calculation / field heuristics
  const precise = applyDefinitionEdit(current, text);
  if (precise.ok) {
    return precise;
  }
  if (
    !precise.ok &&
    /custom code|WhatsApp|webhook|javascript|typescript|\bsql\b/i.test(
      precise.message
    )
  ) {
    return precise;
  }

  // 2) Process-level replan from current tool + owner message (+ optional thread)
  const seed = [
    featureSeedText(current),
    opts?.conversation || '',
    `Owner update: ${text}`,
  ]
    .filter(Boolean)
    .join('\n');

  const planned = planBusinessProcess(seed, { preferClarification: false });
  if (planned.kind === 'unsupported') {
    return { ok: false, message: planned.message };
  }
  if (planned.kind === 'clarification') {
    return { ok: false, message: planned.question };
  }

  const generated = businessProcessPlanToDefinition(planned.plan);
  const merged = mergeDefinitions(current, generated);
  const v = validateFeatureDefinition(merged);
  if (!v.ok) {
    // Fall back to precise failure message if merge invalid
    return {
      ok: false,
      message:
        precise.ok === false
          ? precise.message
          : 'Could not apply that change safely. Try describing the fields or calculation more clearly.',
    };
  }

  return {
    ok: true,
    definition: merged,
    note:
      planned.plan.summary ||
      'Updated how this tool works based on your description.',
    explanation: formatProcessExplanation(planned.plan),
  };
}

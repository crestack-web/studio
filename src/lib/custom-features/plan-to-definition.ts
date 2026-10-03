/**
 * Translate BusinessProcessPlan → BusmoFeatureDefinition.
 * Does not validate; caller must run validateFeatureDefinition.
 */

import type { BusinessProcessPlan, ProcessFieldHint } from './business-process-types';
import type {
  ActionDefinition,
  BusmoFeatureDefinition,
  EntityDefinition,
  FieldDefinition,
  FieldType,
  ViewDefinition,
} from './types';

function newId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `feat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(name: string): string {
  return (
    String(name || 'feature')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'feature'
  );
}

function mapField(h: ProcessFieldHint): FieldDefinition {
  const type = (h.type || 'text') as FieldType;
  return {
    key: h.key,
    label: h.label,
    type,
    required: h.required,
    options: h.options,
  };
}

function pickPrimaryEvent(plan: BusinessProcessPlan) {
  return plan.events.find((e) => e.primary) || plan.events[0];
}

function buildDescription(plan: BusinessProcessPlan): string {
  const lines: string[] = [];
  if (plan.goal) lines.push(plan.goal);
  if (plan.assumptions.length) {
    lines.push('Assumptions: ' + plan.assumptions.join(' '));
  }
  if (plan.businessQuestions.length) {
    lines.push(
      'Helps answer: ' + plan.businessQuestions.slice(0, 4).join(' · ')
    );
  }
  return lines.join('\n');
}

export function businessProcessPlanToDefinition(
  plan: BusinessProcessPlan
): BusmoFeatureDefinition {
  const primaryEvent = pickPrimaryEvent(plan);
  const fieldHints =
    primaryEvent?.fieldHints?.length
      ? primaryEvent.fieldHints
      : plan.entities.find((e) => e.primary)?.fieldHints ||
        plan.entities[0]?.fieldHints || [
          { key: 'name', label: 'Name', type: 'text' as const, required: true },
          { key: 'date', label: 'Date', type: 'date' as const },
        ];

  const fields = fieldHints.map(mapField);
  // Ensure calculation output fields exist as regular fields (no executable formulas)
  for (const calc of plan.calculations) {
    if (!fields.some((f) => f.key === calc.outputField)) {
      fields.push({
        key: calc.outputField,
        label: calc.label,
        type: 'currency',
      });
    }
  }

  const entityKey = primaryEvent?.key || plan.entities[0]?.key || 'record';
  const entityLabel =
    primaryEvent?.label || plan.entities[0]?.label || 'Record';
  const entityLabelPlural =
    entityLabel.endsWith('y') && !entityLabel.endsWith('ey')
      ? entityLabel.slice(0, -1) + 'ies'
      : entityLabel.endsWith('s')
        ? entityLabel
        : entityLabel + 's';

  const entity: EntityDefinition = {
    key: entityKey.replace(/[^a-z0-9_]/gi, '_').toLowerCase() || 'record',
    label: entityLabel,
    labelPlural: entityLabelPlural,
    fields,
    primaryField: fields[0]?.key,
  };

  const hasStatus = fields.some((f) => f.type === 'status');
  const moneyKeys = fields
    .filter((f) => f.type === 'currency' || f.type === 'number')
    .map((f) => f.key);

  const views: ViewDefinition[] = [];
  const viewSpecs =
    plan.suggestedViews.length > 0
      ? plan.suggestedViews
      : [
          {
            key: 'overview',
            title: 'Overview',
            type: 'metrics' as const,
            answersQuestion: '',
          },
          {
            key: 'list',
            title: entityLabelPlural,
            type: 'table' as const,
            answersQuestion: '',
          },
          {
            key: 'add',
            title: `Add ${entityLabel.toLowerCase()}`,
            type: 'form' as const,
            answersQuestion: '',
          },
        ];

  for (const v of viewSpecs) {
    if (v.type === 'metrics') {
      views.push({
        key: v.key || 'overview',
        type: 'metrics',
        title: v.title,
        entity: entity.key,
        metricFields: moneyKeys.slice(0, 4),
      });
    } else if (v.type === 'table') {
      views.push({
        key: v.key || 'list',
        type: 'table',
        title: v.title,
        entity: entity.key,
        columns: fields.slice(0, 8).map((f) => ({ field: f.key, label: f.label })),
      });
    } else if (v.type === 'cards' && hasStatus) {
      views.push({
        key: v.key || 'board',
        type: 'cards',
        title: v.title,
        entity: entity.key,
        columns: fields.slice(0, 4).map((f) => ({ field: f.key, label: f.label })),
      });
    } else if (v.type === 'form') {
      views.push({
        key: v.key || 'create',
        type: 'form',
        title: v.title,
        entity: entity.key,
        formFields: fields.map((f) => f.key),
      });
    }
  }

  // Always ensure form exists
  if (!views.some((v) => v.type === 'form')) {
    views.push({
      key: 'create',
      type: 'form',
      title:
        plan.suggestedActions.find((a) => a.type === 'create')?.label ||
        `Add ${entityLabel.toLowerCase()}`,
      entity: entity.key,
      formFields: fields.map((f) => f.key),
    });
  }
  if (!views.some((v) => v.type === 'table')) {
    views.push({
      key: 'list',
      type: 'table',
      title: entityLabelPlural,
      entity: entity.key,
      columns: fields.slice(0, 8).map((f) => ({ field: f.key, label: f.label })),
    });
  }
  if (hasStatus && !views.some((v) => v.type === 'cards')) {
    views.push({
      key: 'board',
      type: 'cards',
      title: 'By status',
      entity: entity.key,
      columns: fields.slice(0, 4).map((f) => ({ field: f.key, label: f.label })),
    });
  }

  const actions: ActionDefinition[] = (plan.suggestedActions.length
    ? plan.suggestedActions
    : [
        { key: 'create', label: `Add ${entityLabel.toLowerCase()}`, type: 'create' as const },
        { key: 'update', label: 'Update', type: 'update' as const },
        { key: 'delete', label: 'Remove', type: 'delete' as const },
      ]
  ).map((a) => ({
    key: a.key,
    type: a.type,
    label: a.label,
    entity: entity.key,
  }));

  const name = plan.suggestedName || `${entityLabel} Tracker`;
  return {
    id: newId(),
    slug: slugify(name),
    name,
    description: buildDescription(plan),
    entities: [entity],
    views,
    actions,
    version: 1,
    status: 'draft',
    navLabel: name,
    iconKey: 'business-builder',
  };
}

/** Owner-facing explanation of what Busmo understood. */
export function formatProcessExplanation(plan: BusinessProcessPlan): string {
  const lines: string[] = [];
  lines.push('What Busmo understood');
  lines.push('');
  if (plan.businessContext) lines.push(`Context: ${plan.businessContext}`);
  if (plan.goal) lines.push(`Goal: ${plan.goal}`);
  lines.push('');
  lines.push("You're tracking:");
  const track: string[] = [];
  for (const a of plan.actors) track.push(a.label);
  for (const e of plan.events) track.push(e.label);
  if (!track.length) track.push(plan.suggestedName);
  for (const t of [...new Set(track)].slice(0, 8)) lines.push(`• ${t}`);
  if (plan.calculations.length) {
    lines.push('');
    lines.push('Busmo will help you work out:');
    for (const c of plan.calculations.slice(0, 4)) {
      lines.push(`• ${c.label} (${c.formula})`);
    }
  }
  if (plan.businessQuestions.length) {
    lines.push('');
    lines.push('You will be able to see answers to:');
    for (const q of plan.businessQuestions.slice(0, 5)) lines.push(`• ${q}`);
  }
  if (plan.assumptions.length) {
    lines.push('');
    lines.push('Assumptions:');
    for (const a of plan.assumptions.slice(0, 4)) lines.push(`• ${a}`);
  }
  lines.push('');
  lines.push('Looks good? Publish when you are ready.');
  return lines.join('\n');
}

/**
 * Single source of truth for what MO may propose as a Busmo feature.
 * Derived from the same vocabulary as validate.ts / FeatureRenderer.
 */
import {
  ALLOWED_FIELD_TYPES,
  ALLOWED_VIEW_TYPES,
  type FieldType,
  type ViewType,
} from './types';

export const FEATURE_BUILDER_ACTIONS = ['create', 'update', 'delete'] as const;

/** Platform entities features may *mention* or relation-link (no inventing tables). */
export const PLATFORM_ENTITY_HINTS = [
  'Customer',
  'Product',
  'Sale',
  'Expense',
  'Payment',
  'Inventory',
  'Staff',
  'Supplier',
  'Job',
  'Task',
] as const;

export function getFeatureBuilderContext() {
  return {
    name: 'BUSMO FEATURE BUILDER',
    availableFieldTypes: [...ALLOWED_FIELD_TYPES] as FieldType[],
    availableViewTypes: [...ALLOWED_VIEW_TYPES] as ViewType[],
    availableActions: [...FEATURE_BUILDER_ACTIONS],
    availablePlatformEntities: [...PLATFORM_ENTITY_HINTS],
    availableComponents: [
      'table',
      'form',
      'cards',
      'metrics',
      'timeline',
      'status chip',
    ],
    limitations: [
      'no arbitrary React',
      'no arbitrary JavaScript',
      'no arbitrary SQL',
      'no custom CSS',
      'no workflow runtime execution (definitions may declare workflows but they do not run yet)',
      'no executable generated code',
      'AI may only create status=draft; owner must publish',
      'relation fields are labels only in Phase C (no join resolution)',
    ],
    lifecycle: ['draft', 'testing', 'published', 'archived'] as const,
  };
}

/** Prompt block for MO / feature-builder LLM calls. */
export function formatFeatureBuilderContextForPrompt(): string {
  const c = getFeatureBuilderContext();
  return [
    c.name,
    `AVAILABLE FIELD TYPES: ${c.availableFieldTypes.join(', ')}`,
    `AVAILABLE VIEWS: ${c.availableViewTypes.join(', ')}`,
    `AVAILABLE ACTIONS: ${c.availableActions.join(', ')}`,
    `PLATFORM ENTITIES (link only): ${c.availablePlatformEntities.join(', ')}`,
    `COMPONENTS: ${c.availableComponents.join(', ')}`,
    'CURRENT LIMITATIONS:',
    ...c.limitations.map((l) => `- ${l}`),
    '',
    'OUTPUT RULES:',
    '- Produce a BusmoFeatureDefinition JSON object only when enough detail exists.',
    '- Prefer the smallest useful feature (one primary entity).',
    '- Use field type "status" or "select" with options[] for enums.',
    '- Always include table + form views for the primary entity.',
    '- status must be "draft". Never set published.',
    '- slug: lowercase kebab-case.',
    '- id: generate a uuid-like string if unknown.',
    '- If the request is arbitrary code, SQL, or custom JS: refuse.',
    '- If the request is ambiguous: ask one concise clarifying question instead of inventing.',
  ].join('\n');
}

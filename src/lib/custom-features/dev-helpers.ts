import type { BusmoFeatureDefinition } from './types';
import { validateFeatureDefinition } from './validate';

/** Developer / future AI entry: validate only (no DB). */
export function validateCustomFeature(definition: unknown) {
  return validateFeatureDefinition(definition);
}

/** Attach business scope fields before persistence. */
export function prepareCustomFeatureDefinition(
  definition: BusmoFeatureDefinition,
  businessId: string
): BusmoFeatureDefinition {
  return {
    ...definition,
    businessId,
    status: definition.status || 'draft',
    version: definition.version || 1,
  };
}

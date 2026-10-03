/**
 * Internal evaluation helper for Business Builder intelligence.
 * Development/testing only — not shown to customers.
 */

import type { BusinessProcessPlan } from './business-process-types';
import type { BusmoFeatureDefinition } from './types';
import { validateFeatureDefinition } from './validate';

export interface IntelligenceQualityScore {
  businessUnderstanding: number;
  schemaCompleteness: number;
  calculationCorrectness: number;
  viewUsefulness: number;
  clarificationNecessity: number;
  unsupportedRisk: number;
  overall: number;
  notes: string[];
}

export function scoreBusinessIntelligence(opts: {
  plan?: BusinessProcessPlan | null;
  definition?: BusmoFeatureDefinition | null;
  wasClarification?: boolean;
  wasUnsupported?: boolean;
}): IntelligenceQualityScore {
  const notes: string[] = [];
  let businessUnderstanding = 0.3;
  let schemaCompleteness = 0.3;
  let calculationCorrectness = 0.5;
  let viewUsefulness = 0.3;
  let clarificationNecessity = opts.wasClarification ? 0.8 : 0.4;
  let unsupportedRisk = opts.wasUnsupported ? 1 : 0;

  const plan = opts.plan;
  if (plan) {
    if (plan.actors.length) businessUnderstanding += 0.15;
    if (plan.events.length) businessUnderstanding += 0.2;
    if (plan.businessQuestions.length >= 2) businessUnderstanding += 0.15;
    if (plan.patternId) businessUnderstanding += 0.1;
    if (plan.confidence >= 0.7) businessUnderstanding += 0.1;
    businessUnderstanding = Math.min(1, businessUnderstanding);

    if (plan.calculations.length) {
      const high = plan.calculations.filter((c) => c.confidence === 'high').length;
      calculationCorrectness = Math.min(
        1,
        0.5 + high * 0.2 + plan.calculations.length * 0.05
      );
    }
    if (plan.suggestedViews.some((v) => v.answersQuestion)) {
      viewUsefulness += 0.3;
    }
    if (plan.suggestedViews.length >= 3) viewUsefulness += 0.2;
    viewUsefulness = Math.min(1, viewUsefulness);
  }

  const def = opts.definition;
  if (def) {
    const v = validateFeatureDefinition(def);
    if (v.ok) schemaCompleteness += 0.4;
    else notes.push('Definition failed validation');
    const fields = def.entities?.[0]?.fields?.length || 0;
    if (fields >= 4) schemaCompleteness += 0.15;
    if (def.views?.length >= 3) schemaCompleteness += 0.1;
    if (def.actions?.some((a) => /record|create job|delivery/i.test(a.label))) {
      schemaCompleteness += 0.05;
    }
    schemaCompleteness = Math.min(1, schemaCompleteness);
  }

  const overall =
    businessUnderstanding * 0.3 +
    schemaCompleteness * 0.25 +
    calculationCorrectness * 0.15 +
    viewUsefulness * 0.15 +
    (1 - unsupportedRisk) * 0.1 +
    clarificationNecessity * 0.05;

  return {
    businessUnderstanding: round(businessUnderstanding),
    schemaCompleteness: round(schemaCompleteness),
    calculationCorrectness: round(calculationCorrectness),
    viewUsefulness: round(viewUsefulness),
    clarificationNecessity: round(clarificationNecessity),
    unsupportedRisk: round(unsupportedRisk),
    overall: round(overall),
    notes,
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

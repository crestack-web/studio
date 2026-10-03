/**
 * Internal intermediate representation for Business Builder intelligence.
 * Planner reasons in process terms; definition generator translates to BusmoFeatureDefinition.
 * Never executed as code — declarative only.
 */

export type ProcessActorRole =
  | 'customer'
  | 'supplier'
  | 'employee'
  | 'driver'
  | 'distributor'
  | 'worker'
  | 'contractor'
  | 'agent'
  | 'owner'
  | 'other';

export type ProcessEntityKind = 'actor' | 'resource' | 'document' | 'other';

export type ProcessEventKind =
  | 'purchase'
  | 'sale'
  | 'payment'
  | 'delivery'
  | 'job'
  | 'expense'
  | 'production'
  | 'receipt'
  | 'other';

export interface ProcessActor {
  key: string;
  role: ProcessActorRole;
  label: string;
}

export interface ProcessFieldHint {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'currency'
    | 'date'
    | 'phone'
    | 'email'
    | 'textarea'
    | 'status'
    | 'select'
    | 'boolean';
  required?: boolean;
  options?: string[];
}

export interface ProcessEntity {
  key: string;
  label: string;
  labelPlural?: string;
  kind: ProcessEntityKind;
  /** Primary tracked record if this is the main entity. */
  primary?: boolean;
  fieldHints?: ProcessFieldHint[];
}

export interface ProcessEvent {
  key: string;
  label: string;
  kind: ProcessEventKind;
  /** Entity keys involved in this event. */
  relatedEntityKeys: string[];
  fieldHints?: ProcessFieldHint[];
  /** Prefer modeling this as the main record entity. */
  primary?: boolean;
}

export interface ProcessRelationship {
  from: string;
  to: string;
  type: 'one_to_many' | 'many_to_one' | 'refers_to';
  label?: string;
}

export interface ProcessCalculation {
  key: string;
  label: string;
  /** Human-readable formula, e.g. "quantity_kg × price_per_kg". */
  formula: string;
  inputFields: string[];
  outputField: string;
  /** How confident we are this is correct. */
  confidence: 'high' | 'medium' | 'low';
}

export interface ProcessStatusModel {
  key: string;
  fieldKey: string;
  label: string;
  options: string[];
}

export interface ProcessSuggestedView {
  key: string;
  title: string;
  type: 'metrics' | 'table' | 'cards' | 'form' | 'timeline';
  /** Business question this view answers. */
  answersQuestion: string;
}

export interface ProcessSuggestedAction {
  key: string;
  label: string;
  type: 'create' | 'update' | 'delete';
}

export interface BusinessProcessPlan {
  businessContext: string;
  goal: string;
  /** Matched pattern id when applicable. */
  patternId?: string;
  actors: ProcessActor[];
  entities: ProcessEntity[];
  events: ProcessEvent[];
  relationships: ProcessRelationship[];
  calculations: ProcessCalculation[];
  statuses: ProcessStatusModel[];
  businessQuestions: string[];
  suggestedViews: ProcessSuggestedView[];
  suggestedActions: ProcessSuggestedAction[];
  missingInformation: string[];
  assumptions: string[];
  /** 0–1 internal confidence. */
  confidence: number;
  /** Short name suggestion for the feature. */
  suggestedName: string;
  /** One-line summary for the owner. */
  summary: string;
}

export type ProcessPlanResult =
  | { kind: 'plan'; plan: BusinessProcessPlan }
  | { kind: 'clarification'; question: string; partial?: BusinessProcessPlan }
  | { kind: 'unsupported'; message: string };

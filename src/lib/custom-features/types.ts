/**
 * Busmo Feature Definition model — controlled vocabulary for future AI builder.
 * AI proposes definitions; Busmo validates and renders via approved primitives only.
 */

export type FeatureStatus = 'draft' | 'testing' | 'published' | 'archived';

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'status'
  | 'relation'
  | 'phone'
  | 'email'
  | 'textarea';

export type ViewType = 'table' | 'form' | 'cards' | 'metrics' | 'timeline';

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'assign'
  | 'notify'
  | 'export'
  | 'custom';

export type WorkflowTriggerType =
  | 'record_created'
  | 'record_updated'
  | 'status_changed'
  | 'manual'
  | 'schedule';

export type WorkflowActionType =
  | 'create_record'
  | 'update_record'
  | 'notify'
  | 'assign'
  | 'set_status';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relationEntity?: string;
  defaultValue?: string | number | boolean | null;
}

export interface EntityDefinition {
  key: string;
  label: string;
  labelPlural?: string;
  fields: FieldDefinition[];
  primaryField?: string;
}

export interface ViewColumn {
  field: string;
  label?: string;
  width?: 'sm' | 'md' | 'lg';
}

export interface ViewDefinition {
  key: string;
  type: ViewType;
  title: string;
  entity: string;
  columns?: ViewColumn[];
  metricFields?: string[];
  formFields?: string[];
}

export interface ActionDefinition {
  key: string;
  type: ActionType;
  label: string;
  entity?: string;
  /** Restricted to controlled action types — never arbitrary code. */
}

export interface WorkflowStep {
  type: WorkflowActionType;
  entity?: string;
  status?: string;
  message?: string;
}

export interface WorkflowDefinition {
  key: string;
  name: string;
  trigger: {
    type: WorkflowTriggerType;
    entity?: string;
    status?: string;
  };
  condition?: {
    field: string;
    equals?: string | number | boolean;
  };
  steps: WorkflowStep[];
}

export interface PermissionDefinition {
  role: 'owner' | 'manager' | 'staff' | 'viewer';
  canRead: boolean;
  canWrite: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
}

export interface BusmoFeatureDefinition {
  id: string;
  /** Prototype may use placeholder; runtime always scopes by session business. */
  businessId?: string;
  slug: string;
  name: string;
  description?: string;
  entities: EntityDefinition[];
  views: ViewDefinition[];
  actions?: ActionDefinition[];
  workflows?: WorkflowDefinition[];
  permissions?: PermissionDefinition[];
  version: number;
  status: FeatureStatus;
  navLabel?: string;
  iconKey?: string;
}

export const ALLOWED_FIELD_TYPES: FieldType[] = [
  'text',
  'number',
  'currency',
  'date',
  'datetime',
  'boolean',
  'select',
  'status',
  'relation',
  'phone',
  'email',
  'textarea',
];

export const ALLOWED_VIEW_TYPES: ViewType[] = [
  'table',
  'form',
  'cards',
  'metrics',
  'timeline',
];

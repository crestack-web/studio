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

/** Canonical Busmo entities a field may reference (tenant-scoped). */
export type BusmoRelationTarget =
  | 'supplier'
  | 'customer'
  | 'product'
  | 'material'
  | 'staff'
  | 'custom';

/** Safe computed expression — whitelist only, never arbitrary JS. */
export type ComputedOperator = 'multiply' | 'add' | 'subtract' | 'divide';

export interface ComputedValueDef {
  op: ComputedOperator;
  /** Field keys on the same record used as inputs (left-to-right). */
  inputs: string[];
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  /** Legacy: key of another entity in this feature definition. */
  relationEntity?: string;
  /**
   * Reference to a canonical Busmo entity (supplier, customer, product, staff, …).
   * When set with type 'relation', the renderer shows a tenant-scoped lookup.
   */
  relationTarget?: BusmoRelationTarget;
  /** Safe declarative calculation; field is read-only in forms when set. */
  computed?: ComputedValueDef;
  /** Hide from create form (e.g. auto staff). */
  hidden?: boolean;
  /** Auto-fill with authenticated staff/user when creating a record. */
  autoFromAuth?: 'staff' | 'user';
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

export const ALLOWED_RELATION_TARGETS: BusmoRelationTarget[] = [
  'supplier',
  'customer',
  'product',
  'material',
  'staff',
  'custom',
];

export const ALLOWED_COMPUTED_OPS: ComputedOperator[] = [
  'multiply',
  'add',
  'subtract',
  'divide',
];

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

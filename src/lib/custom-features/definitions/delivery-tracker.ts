import type { BusmoFeatureDefinition } from '../types';

/**
 * Hardcoded internal prototype definition.
 * Not user-facing product surface — proves Definition → Validate → Render.
 */
export const DELIVERY_TRACKER_DEFINITION: BusmoFeatureDefinition = {
  id: 'proto-delivery-tracker',
  slug: 'delivery-tracker',
  name: 'Delivery Tracker',
  description:
    'Internal prototype: track customer deliveries with driver, status, and amount.',
  version: 1,
  status: 'testing',
  navLabel: 'Deliveries',
  iconKey: 'truck',
  entities: [
    {
      key: 'delivery',
      label: 'Delivery',
      labelPlural: 'Deliveries',
      primaryField: 'customerName',
      fields: [
        { key: 'customerName', label: 'Customer', type: 'text', required: true },
        { key: 'orderRef', label: 'Order', type: 'text', required: true },
        { key: 'driverName', label: 'Driver', type: 'text' },
        {
          key: 'status',
          label: 'Status',
          type: 'status',
          required: true,
          options: ['Pending', 'Out for Delivery', 'Delivered', 'Failed'],
          defaultValue: 'Pending',
        },
        { key: 'deliveryDate', label: 'Delivery date', type: 'date' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'notes', label: 'Delivery notes', type: 'textarea' },
      ],
    },
  ],
  views: [
    {
      key: 'list',
      type: 'table',
      title: 'Deliveries',
      entity: 'delivery',
      columns: [
        { field: 'customerName', label: 'Customer' },
        { field: 'orderRef', label: 'Order' },
        { field: 'driverName', label: 'Driver' },
        { field: 'status', label: 'Status' },
        { field: 'deliveryDate', label: 'Date' },
        { field: 'amount', label: 'Amount' },
      ],
    },
    {
      key: 'create',
      type: 'form',
      title: 'New delivery',
      entity: 'delivery',
      formFields: [
        'customerName',
        'orderRef',
        'driverName',
        'status',
        'deliveryDate',
        'amount',
        'notes',
      ],
    },
    {
      key: 'summary',
      type: 'metrics',
      title: 'Delivery summary',
      entity: 'delivery',
      metricFields: ['status', 'amount'],
    },
  ],
  actions: [
    { key: 'create', type: 'create', label: 'Add delivery', entity: 'delivery' },
    { key: 'update', type: 'update', label: 'Update', entity: 'delivery' },
  ],
  workflows: [
    {
      key: 'notify_on_delivered',
      name: 'Notify when delivered',
      trigger: { type: 'status_changed', entity: 'delivery', status: 'Delivered' },
      steps: [{ type: 'notify', message: 'Delivery completed' }],
    },
  ],
  permissions: [
    { role: 'owner', canRead: true, canWrite: true, canDelete: true },
    { role: 'manager', canRead: true, canWrite: true },
    { role: 'staff', canRead: true, canWrite: true },
    { role: 'viewer', canRead: true, canWrite: false },
  ],
};

/** Sample in-memory rows for prototype UI (not persisted). */
export const DELIVERY_TRACKER_SAMPLE_ROWS: Record<string, unknown>[] = [
  {
    id: 'd1',
    customerName: 'Adaobi Okeke',
    orderRef: 'ORD-1042',
    driverName: 'Tunde',
    status: 'Out for Delivery',
    deliveryDate: '2026-10-03',
    amount: 18500,
    notes: 'Call on arrival',
  },
  {
    id: 'd2',
    customerName: 'Ibrahim Musa',
    orderRef: 'ORD-1048',
    driverName: 'Chidi',
    status: 'Pending',
    deliveryDate: '2026-10-04',
    amount: 9200,
    notes: '',
  },
  {
    id: 'd3',
    customerName: 'Fatima Bello',
    orderRef: 'ORD-1039',
    driverName: 'Tunde',
    status: 'Delivered',
    deliveryDate: '2026-10-02',
    amount: 24100,
    notes: 'Left with security',
  },
];

/**
 * Reusable business-process patterns — not hardcoded single features.
 * Patterns seed a BusinessProcessPlan; planner adapts to owner language.
 */

import type { BusinessProcessPlan, ProcessCalculation } from './business-process-types';

export type BusinessPatternId =
  | 'supplier_purchase'
  | 'credit_sales'
  | 'job_work'
  | 'delivery'
  | 'production'
  | 'service_job'
  | 'pet_recycling'
  | 'generic_tracker';

export interface BusinessPattern {
  id: BusinessPatternId;
  name: string;
  /** Keywords that suggest this pattern. */
  signals: RegExp;
  seed: (ctx: { text: string }) => Partial<BusinessProcessPlan>;
}

function calc(
  key: string,
  label: string,
  formula: string,
  inputs: string[],
  output: string,
  confidence: ProcessCalculation['confidence'] = 'high'
): ProcessCalculation {
  return {
    key,
    label,
    formula,
    inputFields: inputs,
    outputField: output,
    confidence,
  };
}

export const BUSINESS_PATTERNS: BusinessPattern[] = [
  {
    id: 'pet_recycling',
    name: 'PET / recycling material intake',
    signals: /\b(pet|recycl|bottle|scrap|kg)\b/i,
    seed: () => ({
      patternId: 'pet_recycling',
      businessContext: 'Recycling / material collection',
      goal: 'Track material brought in, weight, and supplier payments',
      actors: [
        { key: 'supplier', role: 'supplier', label: 'Supplier' },
        { key: 'owner', role: 'owner', label: 'Owner' },
      ],
      entities: [
        {
          key: 'supplier',
          label: 'Supplier',
          labelPlural: 'Suppliers',
          kind: 'actor',
          fieldHints: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'location', label: 'Location', type: 'text' },
          ],
        },
      ],
      events: [
        {
          key: 'delivery',
          label: 'Material delivery',
          kind: 'receipt',
          primary: true,
          relatedEntityKeys: ['supplier'],
          fieldHints: [
            { key: 'supplier_name', label: 'Supplier', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'material', label: 'Material', type: 'text', required: true },
            { key: 'quantity_kg', label: 'Weight (kg)', type: 'number', required: true },
            { key: 'price_per_kg', label: 'Price per kg', type: 'currency', required: true },
            { key: 'total_amount', label: 'Total amount', type: 'currency' },
            { key: 'amount_paid', label: 'Amount paid', type: 'currency' },
            { key: 'balance', label: 'Balance owed', type: 'currency' },
            {
              key: 'payment_status',
              label: 'Payment status',
              type: 'status',
              options: ['Unpaid', 'Partial', 'Paid'],
            },
            { key: 'delivery_date', label: 'Date', type: 'date', required: true },
            { key: 'notes', label: 'Notes', type: 'textarea' },
          ],
        },
      ],
      calculations: [
        calc(
          'total',
          'Total payment',
          'quantity_kg × price_per_kg',
          ['quantity_kg', 'price_per_kg'],
          'total_amount',
          'high'
        ),
        calc(
          'balance',
          'Balance owed',
          'total_amount − amount_paid',
          ['total_amount', 'amount_paid'],
          'balance',
          'high'
        ),
      ],
      statuses: [
        {
          key: 'payment',
          fieldKey: 'payment_status',
          label: 'Payment status',
          options: ['Unpaid', 'Partial', 'Paid'],
        },
      ],
      businessQuestions: [
        'How many kg did I receive today?',
        'How much have I paid in total?',
        'How much have I paid each supplier?',
        'Which suppliers bring the most material?',
        'What do I still owe?',
      ],
      suggestedViews: [
        {
          key: 'overview',
          title: 'Overview',
          type: 'metrics',
          answersQuestion: 'How is material intake and payment looking?',
        },
        {
          key: 'list',
          title: 'Deliveries',
          type: 'table',
          answersQuestion: 'What was delivered and paid recently?',
        },
        {
          key: 'by_status',
          title: 'By payment status',
          type: 'cards',
          answersQuestion: 'What is unpaid or partial?',
        },
        {
          key: 'add',
          title: 'Record delivery',
          type: 'form',
          answersQuestion: 'Log a new supplier delivery',
        },
      ],
      suggestedActions: [
        { key: 'create', label: 'Record supplier delivery', type: 'create' },
        { key: 'update', label: 'Update delivery', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: [
        'Total payment is calculated as weight (kg) × price per kg.',
        'Balance owed is total amount minus amount paid.',
      ],
      suggestedName: 'Material Delivery Tracker',
      summary: 'Track supplier deliveries, weight, price/kg, and payments.',
      confidence: 0.85,
    }),
  },
  {
    id: 'supplier_purchase',
    name: 'Supplier purchasing',
    signals: /\b(supplier|vendor|purchase|stock in|bought from|buy from)\b/i,
    seed: () => ({
      patternId: 'supplier_purchase',
      businessContext: 'Purchasing from suppliers',
      goal: 'Track purchases, payables, and supplier history',
      actors: [{ key: 'supplier', role: 'supplier', label: 'Supplier' }],
      entities: [
        {
          key: 'supplier',
          label: 'Supplier',
          kind: 'actor',
          fieldHints: [
            { key: 'name', label: 'Supplier name', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
          ],
        },
      ],
      events: [
        {
          key: 'purchase',
          label: 'Purchase',
          kind: 'purchase',
          primary: true,
          relatedEntityKeys: ['supplier'],
          fieldHints: [
            { key: 'supplier_name', label: 'Supplier', type: 'text', required: true },
            { key: 'item', label: 'Item / description', type: 'text', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unit_cost', label: 'Unit cost', type: 'currency' },
            { key: 'total_cost', label: 'Total cost', type: 'currency', required: true },
            { key: 'amount_paid', label: 'Amount paid', type: 'currency' },
            { key: 'balance', label: 'Outstanding', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Unpaid', 'Partial', 'Paid'],
            },
            { key: 'purchase_date', label: 'Date', type: 'date', required: true },
          ],
        },
      ],
      calculations: [
        calc(
          'line_total',
          'Line total',
          'quantity × unit_cost',
          ['quantity', 'unit_cost'],
          'total_cost',
          'medium'
        ),
        calc(
          'balance',
          'Outstanding',
          'total_cost − amount_paid',
          ['total_cost', 'amount_paid'],
          'balance',
          'high'
        ),
      ],
      businessQuestions: [
        'What do I owe suppliers?',
        'What did I buy recently?',
        'Who is my top supplier by spend?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Record purchase', type: 'create' },
        { key: 'update', label: 'Update purchase', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: ['Outstanding balance = total cost − amount paid.'],
      suggestedName: 'Supplier Purchase Tracker',
      summary: 'Track purchases from suppliers and what you still owe.',
      confidence: 0.8,
    }),
  },
  {
    id: 'credit_sales',
    name: 'Credit sales',
    signals: /\b(credit|owes? me|receivable|pay later|on account)\b/i,
    seed: () => ({
      patternId: 'credit_sales',
      businessContext: 'Selling on credit',
      goal: 'Track who owes money and collections',
      actors: [{ key: 'customer', role: 'customer', label: 'Customer' }],
      events: [
        {
          key: 'credit_sale',
          label: 'Credit sale',
          kind: 'sale',
          primary: true,
          relatedEntityKeys: ['customer'],
          fieldHints: [
            { key: 'customer_name', label: 'Customer', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'items', label: 'What they bought', type: 'textarea' },
            { key: 'amount', label: 'Amount owed', type: 'currency', required: true },
            { key: 'amount_paid', label: 'Amount paid', type: 'currency' },
            { key: 'balance', label: 'Balance', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Pending', 'Partial', 'Paid', 'Overdue'],
            },
            { key: 'due_date', label: 'Due date', type: 'date' },
            { key: 'sale_date', label: 'Sale date', type: 'date', required: true },
          ],
        },
      ],
      calculations: [
        calc(
          'balance',
          'Balance',
          'amount − amount_paid',
          ['amount', 'amount_paid'],
          'balance',
          'high'
        ),
      ],
      businessQuestions: [
        'Who owes me?',
        'How much is outstanding?',
        'Who paid recently?',
        'What is overdue?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Record credit sale', type: 'create' },
        { key: 'update', label: 'Update payment', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: ['Balance = amount owed − amount paid.'],
      suggestedName: 'Credit Tracker',
      summary: 'Track credit sales, payments, and who still owes you.',
      confidence: 0.85,
    }),
  },
  {
    id: 'job_work',
    name: 'Customer jobs',
    signals:
      /\b(roofing|job|project|contract|installation|repair shop|workshop|tailor|alteration|furniture|printing)\b/i,
    seed: ({ text }) => ({
      patternId: 'job_work',
      businessContext: 'Job / project work',
      goal: 'Track jobs, costs, payments, and status',
      actors: [
        { key: 'customer', role: 'customer', label: 'Customer' },
        { key: 'worker', role: 'worker', label: 'Worker' },
      ],
      events: [
        {
          key: 'job',
          label: 'Job',
          kind: 'job',
          primary: true,
          relatedEntityKeys: ['customer', 'worker'],
          fieldHints: [
            { key: 'customer_name', label: 'Customer', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'job_title', label: 'Job / description', type: 'text', required: true },
            { key: 'worker_name', label: 'Worker', type: 'text' },
            { key: 'material_cost', label: 'Material cost', type: 'currency' },
            { key: 'labour_cost', label: 'Labour cost', type: 'currency' },
            { key: 'job_cost', label: 'Total job cost', type: 'currency' },
            { key: 'agreed_amount', label: 'Agreed amount', type: 'currency' },
            { key: 'amount_paid', label: 'Amount paid', type: 'currency' },
            { key: 'balance', label: 'Balance', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Quoted', 'Active', 'Completed', 'Overdue', 'Cancelled'],
            },
            { key: 'start_date', label: 'Start date', type: 'date' },
            { key: 'due_date', label: 'Due date', type: 'date' },
          ],
        },
      ],
      calculations: [
        calc(
          'job_cost',
          'Job cost',
          'material_cost + labour_cost',
          ['material_cost', 'labour_cost'],
          'job_cost',
          'medium'
        ),
        calc(
          'balance',
          'Balance',
          'agreed_amount − amount_paid',
          ['agreed_amount', 'amount_paid'],
          'balance',
          'high'
        ),
      ],
      businessQuestions: [
        'How much did this job cost?',
        'How much has the customer paid?',
        'What remains?',
        'Which jobs are still active?',
        'Which jobs are overdue?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Create job', type: 'create' },
        { key: 'update', label: 'Update job', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: [
        'Job cost can be material + labour when both are entered.',
        'Balance = agreed amount − amount paid.',
      ],
      suggestedName: /roof/i.test(text) ? 'Roofing Job Tracker' : 'Job Tracker',
      summary: 'Track customer jobs, costs, payments, and status.',
      confidence: 0.8,
    }),
  },
  {
    id: 'delivery',
    name: 'Order delivery',
    signals: /\b(deliver|driver|dispatch|shipment|courier)\b/i,
    seed: () => ({
      patternId: 'delivery',
      businessContext: 'Delivering orders to customers',
      goal: 'Track orders, drivers, and delivery status',
      actors: [
        { key: 'customer', role: 'customer', label: 'Customer' },
        { key: 'driver', role: 'driver', label: 'Driver' },
      ],
      events: [
        {
          key: 'delivery',
          label: 'Delivery',
          kind: 'delivery',
          primary: true,
          relatedEntityKeys: ['customer', 'driver'],
          fieldHints: [
            { key: 'customer_name', label: 'Customer', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'order_ref', label: 'Order reference', type: 'text' },
            { key: 'driver_name', label: 'Driver', type: 'text' },
            { key: 'address', label: 'Delivery address', type: 'textarea' },
            { key: 'amount', label: 'Amount', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Pending', 'Out for delivery', 'Delivered', 'Failed', 'Returned'],
            },
            { key: 'delivery_date', label: 'Delivery date', type: 'date' },
          ],
        },
      ],
      businessQuestions: [
        'Which deliveries are still pending?',
        'Which driver handled this order?',
        'How many deliveries completed today?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Record delivery', type: 'create' },
        { key: 'update', label: 'Update delivery', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: [],
      suggestedName: 'Delivery Tracker',
      summary: 'Track customer deliveries, drivers, and status.',
      confidence: 0.8,
    }),
  },
  {
    id: 'production',
    name: 'Production batch',
    signals: /\b(production|batch|manufactur|waste|yield|poultry|farm)\b/i,
    seed: () => ({
      patternId: 'production',
      businessContext: 'Production / batch processing',
      goal: 'Track inputs, output quantity, waste, and cost',
      events: [
        {
          key: 'batch',
          label: 'Production batch',
          kind: 'production',
          primary: true,
          relatedEntityKeys: [],
          fieldHints: [
            { key: 'batch_name', label: 'Batch / product', type: 'text', required: true },
            { key: 'input_materials', label: 'Input materials', type: 'textarea' },
            { key: 'quantity_in', label: 'Quantity in', type: 'number' },
            { key: 'quantity_out', label: 'Quantity produced', type: 'number', required: true },
            { key: 'waste', label: 'Waste', type: 'number' },
            { key: 'cost', label: 'Batch cost', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Planned', 'In progress', 'Completed'],
            },
            { key: 'batch_date', label: 'Date', type: 'date', required: true },
          ],
        },
      ],
      calculations: [
        calc(
          'waste_calc',
          'Waste',
          'quantity_in − quantity_out',
          ['quantity_in', 'quantity_out'],
          'waste',
          'medium'
        ),
      ],
      businessQuestions: [
        'How much did this batch produce?',
        'How much waste occurred?',
        'What did production cost?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Record batch', type: 'create' },
        { key: 'update', label: 'Update batch', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: ['Waste may be quantity in minus quantity produced when both are known.'],
      suggestedName: 'Production Tracker',
      summary: 'Track production batches, yield, waste, and cost.',
      confidence: 0.75,
    }),
  },
  {
    id: 'service_job',
    name: 'Service work',
    signals:
      /\b(laundry|dry clean|phone repair|car repair|mechanic|salon|barber|cleaning service)\b/i,
    seed: () => ({
      patternId: 'service_job',
      businessContext: 'Service business',
      goal: 'Track customer jobs, workers, status, and payment',
      actors: [
        { key: 'customer', role: 'customer', label: 'Customer' },
        { key: 'worker', role: 'worker', label: 'Worker' },
      ],
      events: [
        {
          key: 'service',
          label: 'Service job',
          kind: 'job',
          primary: true,
          relatedEntityKeys: ['customer', 'worker'],
          fieldHints: [
            { key: 'customer_name', label: 'Customer', type: 'text', required: true },
            { key: 'phone', label: 'Phone', type: 'phone' },
            { key: 'service', label: 'Service', type: 'text', required: true },
            { key: 'worker_name', label: 'Handled by', type: 'text' },
            { key: 'amount', label: 'Charge', type: 'currency', required: true },
            { key: 'amount_paid', label: 'Paid', type: 'currency' },
            { key: 'balance', label: 'Balance', type: 'currency' },
            {
              key: 'status',
              label: 'Status',
              type: 'status',
              options: ['Received', 'In progress', 'Ready', 'Collected', 'Cancelled'],
            },
            { key: 'received_date', label: 'Date in', type: 'date', required: true },
            { key: 'due_date', label: 'Due / ready date', type: 'date' },
          ],
        },
      ],
      calculations: [
        calc(
          'balance',
          'Balance',
          'amount − amount_paid',
          ['amount', 'amount_paid'],
          'balance',
          'high'
        ),
      ],
      businessQuestions: [
        'Which jobs are still in progress?',
        'Who handled this job?',
        'What is outstanding to collect?',
      ],
      suggestedActions: [
        { key: 'create', label: 'Create service job', type: 'create' },
        { key: 'update', label: 'Update job', type: 'update' },
        { key: 'delete', label: 'Remove', type: 'delete' },
      ],
      assumptions: ['Balance = charge − amount paid.'],
      suggestedName: 'Service Job Tracker',
      summary: 'Track service jobs, workers, status, and payments.',
      confidence: 0.8,
    }),
  },
];

export function matchBusinessPatterns(text: string): BusinessPattern[] {
  return BUSINESS_PATTERNS.filter((p) => p.signals.test(text));
}

/**
 * Per-solution discovery fields for Busmo onboarding.
 * Answers are stored on the business profile so the product can tailor
 * dashboards, features, and MO recommendations.
 */

export type SolutionFieldType = 'single' | 'multi' | 'text' | 'number';

export type SolutionFieldOption = { id: string; label: string };

export type SolutionField = {
  id: string;
  label: string;
  type: SolutionFieldType;
  options?: SolutionFieldOption[];
  required?: boolean;
  help?: string;
  placeholder?: string;
};

export type SolutionIntakeProfile = {
  headline: string;
  sub: string;
  /** What Busmo will configure from these answers */
  outcomes: string[];
  fields: SolutionField[];
};

const YES_NO: SolutionFieldOption[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

const PAYMENT_OPTS: SolutionFieldOption[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Bank transfer' },
  { id: 'pos', label: 'POS / card terminal' },
  { id: 'credit', label: 'Customer credit / tab' },
  { id: 'split', label: 'Split payments' },
];

const CHANNEL_OPTS: SolutionFieldOption[] = [
  { id: 'walk_in', label: 'Walk-in / counter' },
  { id: 'whatsapp', label: 'WhatsApp orders' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'online', label: 'Online / website' },
  { id: 'b2b', label: 'B2B / accounts' },
];

export const SOLUTION_INTAKE: Record<string, SolutionIntakeProfile> = {
  retail: {
    headline: 'How does your shop run day to day?',
    sub: 'We use this to set up sales, stock, and staff tools that match how you actually sell.',
    outcomes: ['Checkout defaults', 'Inventory layout', 'Staff sale permissions'],
    fields: [
      { id: 'sku_volume', label: 'About how many products do you sell?', type: 'single', required: true, options: [
        { id: 'under_50', label: 'Under 50' }, { id: '50_200', label: '50–200' }, { id: '200_1000', label: '200–1,000' }, { id: '1000_plus', label: '1,000+' },
      ]},
      { id: 'uses_barcodes', label: 'Do products have barcodes or SKUs?', type: 'single', required: true, options: [
        { id: 'yes_barcodes', label: 'Yes — barcodes' }, { id: 'sku_only', label: 'SKU / codes only' }, { id: 'neither', label: 'Neither yet' },
      ]},
      { id: 'payment_methods', label: 'How do customers pay?', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'sales_channels', label: 'Where do sales come from?', type: 'multi', required: true, options: CHANNEL_OPTS },
      { id: 'staff_count_selling', label: 'How many people take sales?', type: 'single', options: [
        { id: '1', label: 'Just me' }, { id: '2_5', label: '2–5' }, { id: '6_plus', label: '6+' },
      ]},
      { id: 'track_credit', label: 'Do you sell on credit / “pay later”?', type: 'single', options: YES_NO },
    ],
  },
  restaurant: {
    headline: 'Tell us about your kitchen & service',
    sub: 'Restaurants need menu, ingredients, and order flow — not a generic shop layout.',
    outcomes: ['Menu & dishes', 'Ingredient stock', 'Floor vs kitchen roles'],
    fields: [
      { id: 'service_style', label: 'How do guests order?', type: 'multi', required: true, options: [
        { id: 'dine_in', label: 'Dine-in' }, { id: 'takeaway', label: 'Takeaway' }, { id: 'delivery', label: 'Delivery' }, { id: 'catering', label: 'Catering' },
      ]},
      { id: 'menu_size', label: 'Rough menu size', type: 'single', required: true, options: [
        { id: 'under_20', label: 'Under 20 items' }, { id: '20_50', label: '20–50' }, { id: '50_plus', label: '50+' },
      ]},
      { id: 'track_ingredients', label: 'Track ingredients / recipes?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_methods', label: 'How do guests pay?', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'peak_hours', label: 'Busiest time of day', type: 'single', options: [
        { id: 'morning', label: 'Morning' }, { id: 'lunch', label: 'Lunch' }, { id: 'evening', label: 'Evening' }, { id: 'late', label: 'Late night' },
      ]},
    ],
  },
  cafe: {
    headline: 'How does your café operate?',
    sub: 'Quick service needs fast checkout and simple inventory for drinks & pastries.',
    outcomes: ['Fast checkout', 'Menu items', 'Expiry for perishables'],
    fields: [
      { id: 'service_style', label: 'Service style', type: 'multi', required: true, options: [
        { id: 'counter', label: 'Counter order' }, { id: 'table', label: 'Table service' }, { id: 'takeaway', label: 'Takeaway' }, { id: 'delivery', label: 'Delivery' },
      ]},
      { id: 'menu_focus', label: 'Main focus', type: 'multi', required: true, options: [
        { id: 'coffee', label: 'Coffee / drinks' }, { id: 'pastry', label: 'Pastries' }, { id: 'meals', label: 'Light meals' }, { id: 'retail_goods', label: 'Retail goods' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'track_ingredients', label: 'Track milk, syrups, ingredients?', type: 'single', options: YES_NO },
    ],
  },
  grocery: {
    headline: 'Grocery operations details',
    sub: 'Groceries need expiry control, high SKU counts, and fast restocking.',
    outcomes: ['Expiry alerts', 'Stock receiving', 'Fast barcode checkout'],
    fields: [
      { id: 'sku_volume', label: 'Product count (approx.)', type: 'single', required: true, options: [
        { id: 'under_200', label: 'Under 200' }, { id: '200_1000', label: '200–1,000' }, { id: '1000_plus', label: '1,000+' },
      ]},
      { id: 'uses_barcodes', label: 'Barcode scanning at checkout?', type: 'single', required: true, options: YES_NO },
      { id: 'perishables', label: 'Sell perishables / cold items?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'suppliers_count', label: 'How many regular suppliers?', type: 'single', options: [
        { id: '1_3', label: '1–3' }, { id: '4_10', label: '4–10' }, { id: '10_plus', label: '10+' },
      ]},
    ],
  },
  supermarket: {
    headline: 'Supermarket setup',
    sub: 'Multi-aisle stores need branches, staff shifts, and bulk receiving.',
    outcomes: ['Multi-staff sales', 'Stock receiving', 'Branch-ready layout'],
    fields: [
      { id: 'locations', label: 'Number of locations', type: 'single', required: true, options: [
        { id: '1', label: '1 store' }, { id: '2_5', label: '2–5' }, { id: '6_plus', label: '6+' },
      ]},
      { id: 'sku_volume', label: 'SKU count (approx.)', type: 'single', required: true, options: [
        { id: 'under_1000', label: 'Under 1,000' }, { id: '1000_5000', label: '1,000–5,000' }, { id: '5000_plus', label: '5,000+' },
      ]},
      { id: 'uses_barcodes', label: 'Barcode / POS checkout?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'shifts', label: 'Run staff shifts?', type: 'single', options: YES_NO },
    ],
  },
  fashion: {
    headline: 'Fashion & apparel details',
    sub: 'Variants (size/colour) and seasonality change how inventory should work.',
    outcomes: ['Variant-aware stock', 'Online storefront option', 'Season tracking'],
    fields: [
      { id: 'variants', label: 'Sell size / colour variants?', type: 'single', required: true, options: YES_NO },
      { id: 'sales_channels', label: 'Sales channels', type: 'multi', required: true, options: CHANNEL_OPTS },
      { id: 'online_store', label: 'Need an online storefront?', type: 'single', options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'sku_volume', label: 'Styles / SKUs (approx.)', type: 'single', options: [
        { id: 'under_50', label: 'Under 50' }, { id: '50_200', label: '50–200' }, { id: '200_plus', label: '200+' },
      ]},
    ],
  },
  electronics: {
    headline: 'Electronics retail details',
    sub: 'High-value items often need serial tracking and careful stock control.',
    outcomes: ['Serial / warranty aware stock', 'Credit sales', 'Supplier tracking'],
    fields: [
      { id: 'serial_tracking', label: 'Track serial / IMEI numbers?', type: 'single', required: true, options: YES_NO },
      { id: 'warranty', label: 'Offer warranties?', type: 'single', options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'track_credit', label: 'Sell on installment / credit?', type: 'single', options: YES_NO },
      { id: 'sales_channels', label: 'Sales channels', type: 'multi', options: CHANNEL_OPTS },
    ],
  },
  manufacturing: {
    headline: 'Production & manufacturing',
    sub: 'We need to know if you make to stock, to order, or both.',
    outcomes: ['Production tracking', 'Raw material stock', 'Finished goods'],
    fields: [
      { id: 'make_mode', label: 'How do you produce?', type: 'single', required: true, options: [
        { id: 'to_stock', label: 'Make to stock' }, { id: 'to_order', label: 'Make to order' }, { id: 'both', label: 'Both' },
      ]},
      { id: 'raw_materials', label: 'Track raw materials separately?', type: 'single', required: true, options: YES_NO },
      { id: 'finished_skus', label: 'Finished product count', type: 'single', options: [
        { id: 'under_20', label: 'Under 20' }, { id: '20_100', label: '20–100' }, { id: '100_plus', label: '100+' },
      ]},
      { id: 'payment_methods', label: 'How do buyers pay?', type: 'multi', options: PAYMENT_OPTS },
      { id: 'b2b_credit', label: 'Offer buyer credit terms?', type: 'single', options: YES_NO },
    ],
  },
  wholesale: {
    headline: 'Wholesale operations',
    sub: 'Credit, bulk pricing, and warehouses drive the right Busmo layout.',
    outcomes: ['Credit ledger', 'Bulk sales', 'Warehouse stock'],
    fields: [
      { id: 'customer_type', label: 'Who do you sell to?', type: 'multi', required: true, options: [
        { id: 'retailers', label: 'Retailers' }, { id: 'distributors', label: 'Other distributors' }, { id: 'institutions', label: 'Institutions' }, { id: 'walk_in', label: 'Walk-in bulk' },
      ]},
      { id: 'credit_terms', label: 'Offer credit terms?', type: 'single', required: true, options: YES_NO },
      { id: 'warehouses', label: 'Storage locations', type: 'single', required: true, options: [
        { id: '1', label: '1 warehouse / store' }, { id: '2_5', label: '2–5' }, { id: '6_plus', label: '6+' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'delivery', label: 'Deliver to customers?', type: 'single', options: YES_NO },
    ],
  },
  distributor: {
    headline: 'Distribution network',
    sub: 'Routes, credit, and multi-location stock matter for distributors.',
    outcomes: ['Multi-location stock', 'Credit management', 'Bulk order sales'],
    fields: [
      { id: 'coverage', label: 'Coverage area', type: 'single', required: true, options: [
        { id: 'city', label: 'One city' }, { id: 'state', label: 'State / region' }, { id: 'national', label: 'National' },
      ]},
      { id: 'credit_terms', label: 'Dealer credit terms?', type: 'single', required: true, options: YES_NO },
      { id: 'warehouses', label: 'Depots / warehouses', type: 'single', required: true, options: [
        { id: '1', label: '1' }, { id: '2_5', label: '2–5' }, { id: '6_plus', label: '6+' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'fleet', label: 'Own delivery vehicles?', type: 'single', options: YES_NO },
    ],
  },
  pharmacy: {
    headline: 'Pharmacy requirements',
    sub: 'Expiry control and regulated items need stricter inventory defaults.',
    outcomes: ['Expiry alerts', 'Batch-aware stock', 'Prescription-safe sales logging'],
    fields: [
      { id: 'prescription', label: 'Dispense prescription medicines?', type: 'single', required: true, options: YES_NO },
      { id: 'uses_barcodes', label: 'Scan barcodes at sale?', type: 'single', required: true, options: YES_NO },
      { id: 'expiry_critical', label: 'Need expiry / batch tracking?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'sku_volume', label: 'SKU count (approx.)', type: 'single', options: [
        { id: 'under_200', label: 'Under 200' }, { id: '200_1000', label: '200–1,000' }, { id: '1000_plus', label: '1,000+' },
      ]},
    ],
  },
  healthcare: {
    headline: 'Healthcare practice details',
    sub: 'Clinics and practices differ from retail — we focus on services and records.',
    outcomes: ['Service sales', 'Patient/customer records', 'Expense tracking'],
    fields: [
      { id: 'practice_type', label: 'Practice type', type: 'single', required: true, options: [
        { id: 'clinic', label: 'Clinic' }, { id: 'lab', label: 'Lab / diagnostics' }, { id: 'therapy', label: 'Therapy' }, { id: 'other', label: 'Other' },
      ]},
      { id: 'bill_services', label: 'Bill for services / consultations?', type: 'single', required: true, options: YES_NO },
      { id: 'sell_products', label: 'Also sell products / consumables?', type: 'single', options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'appointments', label: 'Use appointments?', type: 'single', options: YES_NO },
    ],
  },
  education: {
    headline: 'Education / training business',
    sub: 'Fees, cohorts, and materials — not retail SKUs.',
    outcomes: ['Fee collection', 'Student/customer records', 'Expense control'],
    fields: [
      { id: 'model', label: 'Business model', type: 'single', required: true, options: [
        { id: 'school', label: 'School / academy' }, { id: 'tutoring', label: 'Tutoring' }, { id: 'training', label: 'Corporate training' }, { id: 'other', label: 'Other' },
      ]},
      { id: 'fee_cycle', label: 'How are fees collected?', type: 'single', required: true, options: [
        { id: 'term', label: 'Per term' }, { id: 'monthly', label: 'Monthly' }, { id: 'per_course', label: 'Per course' }, { id: 'one_off', label: 'One-off' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'sell_materials', label: 'Sell books / materials?', type: 'single', options: YES_NO },
    ],
  },
  services: {
    headline: 'Service business details',
    sub: 'Time, jobs, and clients matter more than product shelves.',
    outcomes: ['Service sales', 'Client tracking', 'Staff jobs'],
    fields: [
      { id: 'service_type', label: 'Main service type', type: 'text', required: true, placeholder: 'e.g. cleaning, repairs, consulting' },
      { id: 'pricing_model', label: 'How do you price?', type: 'single', required: true, options: [
        { id: 'fixed', label: 'Fixed package' }, { id: 'hourly', label: 'Hourly' }, { id: 'project', label: 'Per project' }, { id: 'retainer', label: 'Retainer' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'field_team', label: 'Field / on-site team?', type: 'single', options: YES_NO },
      { id: 'recurring', label: 'Recurring clients?', type: 'single', options: YES_NO },
    ],
  },
  jobs: {
    headline: 'Jobs & projects',
    sub: 'Project-based work needs quotes, progress, and materials tracking.',
    outcomes: ['Job/project sales', 'Materials used', 'Client balances'],
    fields: [
      { id: 'job_type', label: 'Typical jobs', type: 'text', required: true, placeholder: 'e.g. electrical, construction, maintenance' },
      { id: 'materials', label: 'Buy materials per job?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_schedule', label: 'How clients pay', type: 'single', required: true, options: [
        { id: 'upfront', label: 'Upfront' }, { id: 'milestone', label: 'Milestones' }, { id: 'on_complete', label: 'On completion' }, { id: 'mixed', label: 'Mixed' },
      ]},
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'crew_size', label: 'Crew size', type: 'single', options: [
        { id: 'solo', label: 'Solo' }, { id: '2_5', label: '2–5' }, { id: '6_plus', label: '6+' },
      ]},
    ],
  },
  recycling_material_collection: {
    headline: 'Recycling & material collection',
    sub: 'Pricing by weight/type and supplier/buyer flows are different from retail.',
    outcomes: ['Material types', 'Weight-based intake', 'Buyer/seller ledger'],
    fields: [
      { id: 'materials', label: 'Materials you handle', type: 'multi', required: true, options: [
        { id: 'pet', label: 'PET plastic' }, { id: 'metal', label: 'Metal' }, { id: 'paper', label: 'Paper / carton' }, { id: 'glass', label: 'Glass' }, { id: 'other', label: 'Other' },
      ]},
      { id: 'role', label: 'Your role in the chain', type: 'single', required: true, options: [
        { id: 'collector', label: 'Collector' }, { id: 'aggregator', label: 'Aggregator / depot' }, { id: 'processor', label: 'Processor' }, { id: 'trader', label: 'Trader' },
      ]},
      { id: 'pricing_basis', label: 'How do you price?', type: 'single', required: true, options: [
        { id: 'per_kg', label: 'Per kg' }, { id: 'per_unit', label: 'Per unit / bag' }, { id: 'negotiated', label: 'Negotiated loads' },
      ]},
      { id: 'payment_methods', label: 'How do you pay collectors / get paid?', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'weighing', label: 'Have a scale on site?', type: 'single', options: YES_NO },
    ],
  },
  other: {
    headline: 'Tell us how your business works',
    sub: 'A few details help Busmo recommend the right starting layout.',
    outcomes: ['Recommended tools', 'Sales defaults', 'Stock optional'],
    fields: [
      { id: 'sells_products', label: 'Do you sell physical products?', type: 'single', required: true, options: YES_NO },
      { id: 'sells_services', label: 'Do you sell services?', type: 'single', required: true, options: YES_NO },
      { id: 'payment_methods', label: 'Payment methods', type: 'multi', required: true, options: PAYMENT_OPTS },
      { id: 'priority', label: 'What matters most right now?', type: 'single', required: true, options: [
        { id: 'sales', label: 'Recording sales' }, { id: 'stock', label: 'Stock control' }, { id: 'money', label: 'Cash & profit clarity' }, { id: 'staff', label: 'Staff accountability' },
      ]},
      { id: 'notes', label: 'Anything else we should know?', type: 'text', placeholder: 'Optional — seasonality, multiple brands, etc.' },
    ],
  },
};

export function getSolutionIntake(categoryId: string | undefined | null): SolutionIntakeProfile {
  if (!categoryId) return SOLUTION_INTAKE.retail;
  return SOLUTION_INTAKE[categoryId] || SOLUTION_INTAKE.other;
}

export function validateSolutionDetails(
  categoryId: string | undefined,
  details: Record<string, string | string[] | undefined> | undefined
): string | null {
  const profile = getSolutionIntake(categoryId);
  const d = details || {};
  for (const field of profile.fields) {
    if (!field.required) continue;
    const v = d[field.id];
    if (field.type === 'multi') {
      if (!Array.isArray(v) || v.length === 0) return `Please answer: ${field.label}`;
    } else if (v == null || String(v).trim() === '') {
      return `Please answer: ${field.label}`;
    }
  }
  return null;
}

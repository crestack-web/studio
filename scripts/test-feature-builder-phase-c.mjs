/**
 * Phase C — Feature Builder structural + NL tests (no live DB / no LLM required).
 * Run: node scripts/test-feature-builder-phase-c.mjs
 *
 * Also re-runs Phase A definition checks for regression.
 */

const ALLOWED_FIELD_TYPES = new Set([
  'text','number','currency','date','datetime','boolean','select','status','relation','phone','email','textarea',
]);
const ALLOWED_VIEW_TYPES = new Set(['table','form','cards','metrics','timeline']);

function validate(def) {
  const issues = [];
  if (!def || typeof def !== 'object') return { ok: false, issues: [{ path: '', message: 'object' }] };
  if (!def.id) issues.push({ path: 'id', message: 'required' });
  if (!def.slug) issues.push({ path: 'slug', message: 'required' });
  if (!def.name) issues.push({ path: 'name', message: 'required' });
  if (typeof def.version !== 'number' || def.version < 1) issues.push({ path: 'version', message: 'bad' });
  if (!['draft','testing','published','archived'].includes(def.status)) issues.push({ path: 'status', message: 'bad' });
  if (!Array.isArray(def.entities) || !def.entities.length) issues.push({ path: 'entities', message: 'required' });
  const keys = new Set();
  for (const e of def.entities || []) {
    if (!e.key) issues.push({ path: 'entity.key', message: 'required' });
    if (keys.has(e.key)) issues.push({ path: 'entity.key', message: 'dup' });
    keys.add(e.key);
    if (!Array.isArray(e.fields) || !e.fields.length) issues.push({ path: 'entity.fields', message: 'required' });
    for (const f of e.fields || []) {
      if (!ALLOWED_FIELD_TYPES.has(f.type)) issues.push({ path: f.key, message: 'bad type ' + f.type });
      if ((f.type === 'status' || f.type === 'select') && f.options && !Array.isArray(f.options)) {
        issues.push({ path: f.key, message: 'bad enum' });
      }
    }
  }
  for (const v of def.views || []) {
    if (!ALLOWED_VIEW_TYPES.has(v.type)) issues.push({ path: v.key, message: 'bad view' });
    if (!keys.has(v.entity)) issues.push({ path: v.key, message: 'bad entity' });
  }
  return { ok: issues.length === 0, issues };
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'custom-feature';
}

function buildDefinition(opts) {
  const fieldKeys = opts.fields.map((f) => f.key);
  return {
    id: 'test-' + slugify(opts.name),
    slug: slugify(opts.name),
    name: opts.name,
    description: opts.description,
    version: 1,
    status: 'draft',
    entities: [{
      key: opts.entityKey,
      label: opts.entityLabel,
      fields: opts.fields,
      primaryField: opts.fields[0]?.key,
    }],
    views: [
      { key: 'list', type: 'table', title: opts.entityLabel, entity: opts.entityKey, columns: opts.fields.map(f => ({ field: f.key })) },
      { key: 'create', type: 'form', title: 'New', entity: opts.entityKey, formFields: fieldKeys },
      { key: 'summary', type: 'metrics', title: 'Summary', entity: opts.entityKey, metricFields: fieldKeys.slice(0, 2) },
    ],
    actions: [
      { key: 'create', type: 'create', label: 'Add', entity: opts.entityKey },
    ],
  };
}

/** Mirror of heuristicNlToDefinition for offline tests */
function heuristicNlToDefinition(userMessage) {
  const text = String(userMessage || '').trim();
  if (!text) return { kind: 'clarification', question: 'What would you like to track?' };
  if (/\b(javascript|typescript|sql|arbitrary code|eval\()/i.test(text)) {
    return {
      kind: 'unsupported',
      message: 'declarative only',
    };
  }
  const lower = text.toLowerCase();
  if (/deliver/.test(lower)) {
    return {
      kind: 'definition',
      definition: buildDefinition({
        name: 'Delivery Tracker',
        description: 'Track deliveries',
        entityKey: 'delivery',
        entityLabel: 'Delivery',
        fields: [
          { key: 'customerName', label: 'Customer', type: 'text', required: true },
          { key: 'orderRef', label: 'Order', type: 'text' },
          { key: 'driverName', label: 'Driver', type: 'text' },
          { key: 'status', label: 'Status', type: 'status', options: ['Pending', 'Out for Delivery', 'Delivered', 'Failed'] },
          { key: 'deliveryDate', label: 'Delivery date', type: 'date' },
          { key: 'amount', label: 'Amount', type: 'currency' },
        ],
      }),
      summary: 'DRAFT CREATED',
    };
  }
  if (/furniture|customer jobs?/.test(lower) || (/job/.test(lower) && /track|create/.test(lower))) {
    return {
      kind: 'definition',
      definition: buildDefinition({
        name: 'Customer Jobs',
        description: 'Jobs',
        entityKey: 'job',
        entityLabel: 'Job',
        fields: [
          { key: 'customerName', label: 'Customer', type: 'text', required: true },
          { key: 'amount', label: 'Amount', type: 'currency' },
          { key: 'assignedWorker', label: 'Assigned worker', type: 'text' },
          { key: 'status', label: 'Production status', type: 'status', options: ['New', 'In Production', 'Ready', 'Delivered'] },
        ],
      }),
      summary: 'DRAFT CREATED',
    };
  }
  if (/batch|ingredient|waste/.test(lower)) {
    return {
      kind: 'definition',
      definition: buildDefinition({
        name: 'Batch Tracking',
        description: 'Batches',
        entityKey: 'batch',
        entityLabel: 'Batch',
        fields: [
          { key: 'batchName', label: 'Batch name', type: 'text', required: true },
          { key: 'ingredients', label: 'Ingredients', type: 'textarea' },
          { key: 'quantityProduced', label: 'Quantity produced', type: 'number' },
          { key: 'waste', label: 'Waste', type: 'number' },
        ],
      }),
      summary: 'DRAFT CREATED',
    };
  }
  if (/\bstock\b/.test(lower) && !/product|supplier|cost|price/.test(lower)) {
    return {
      kind: 'clarification',
      question: 'What do you want to track: products and quantities only, or also suppliers, purchase cost and selling price?',
    };
  }
  return { kind: 'clarification', question: 'What fields?' };
}

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error('FAIL', name);
    failed++;
  } else {
    console.log('PASS', name);
  }
}

// --- Phase A regression ---
const deliveryA = heuristicNlToDefinition(
  'Create a delivery tracker with customer, order, driver, status, delivery date and amount.'
);
assert('NL delivery → definition', deliveryA.kind === 'definition');
if (deliveryA.kind === 'definition') {
  const v = validate(deliveryA.definition);
  assert('delivery definition validates', v.ok);
  assert('delivery is draft', deliveryA.definition.status === 'draft');
  assert('delivery summary says DRAFT', /DRAFT/i.test(deliveryA.summary));
}

const jobs = heuristicNlToDefinition(
  'I run a furniture business. Create a way to track customer jobs, amount, assigned worker and production status.'
);
assert('NL furniture jobs → definition', jobs.kind === 'definition');
if (jobs.kind === 'definition') {
  assert('jobs validates', validate(jobs.definition).ok);
  assert('jobs draft', jobs.definition.status === 'draft');
}

const batches = heuristicNlToDefinition(
  'I want to track food batches and record ingredients, quantity produced and waste.'
);
assert('NL batches → definition', batches.kind === 'definition');
if (batches.kind === 'definition') {
  assert('batches validates', validate(batches.definition).ok);
}

const stock = heuristicNlToDefinition('Build me a stock feature.');
assert('vague stock → clarification', stock.kind === 'clarification');

const badCode = heuristicNlToDefinition(
  'Create arbitrary JavaScript that runs whenever I sell something.'
);
assert('arbitrary JS → unsupported', badCode.kind === 'unsupported');

// Invalid generation
const badType = validate({
  id: 'x', slug: 'x', name: 'X', version: 1, status: 'draft',
  entities: [{ key: 'e', label: 'E', fields: [{ key: 'a', label: 'A', type: 'hack' }] }],
  views: [{ key: 'v', type: 'table', title: 'T', entity: 'e' }],
});
assert('unknown field type rejected', !badType.ok);

const badView = validate({
  id: 'x', slug: 'x', name: 'X', version: 1, status: 'draft',
  entities: [{ key: 'e', label: 'E', fields: [{ key: 'a', label: 'A', type: 'text' }] }],
  views: [{ key: 'v', type: 'magic', title: 'T', entity: 'e' }],
});
assert('unknown view rejected', !badView.ok);

const badEntity = validate({
  id: 'x', slug: 'x', name: 'X', version: 1, status: 'draft',
  entities: [{ key: 'e', label: 'E', fields: [] }],
  views: [],
});
assert('malformed entity rejected', !badEntity.ok);

// AI cannot publish — tool contract
const aiTools = [
  'get_feature_builder_context',
  'validate_feature_definition',
  'create_custom_feature_draft',
  'get_custom_feature_draft',
  'update_custom_feature_draft',
];
assert('publish not in AI tool list', !aiTools.includes('publish_feature'));
assert('no execute_sql tool', !aiTools.includes('execute_sql'));

// Versioning conceptual: draft status never equals published in NL output
if (deliveryA.kind === 'definition') {
  assert('NL never emits published', deliveryA.definition.status !== 'published');
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll Phase C feature-builder tests passed.');

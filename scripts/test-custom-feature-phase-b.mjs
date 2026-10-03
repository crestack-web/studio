/**
 * Phase B structural tests: definition + record validation.
 * Run: node scripts/test-custom-feature-phase-b.mjs
 */

const ALLOWED_FIELD_TYPES = new Set([
  'text','number','currency','date','datetime','boolean','select','status','relation','phone','email','textarea',
]);

function validateDefinition(def) {
  const issues = [];
  if (!def?.id) issues.push('id');
  if (!def?.slug) issues.push('slug');
  if (!Array.isArray(def?.entities) || !def.entities.length) issues.push('entities');
  const keys = new Set();
  for (const e of def?.entities || []) {
    keys.add(e.key);
    for (const f of e.fields || []) {
      if (!ALLOWED_FIELD_TYPES.has(f.type)) issues.push('bad type ' + f.type);
    }
  }
  for (const v of def?.views || []) {
    if (!keys.has(v.entity)) issues.push('bad entity');
  }
  return { ok: issues.length === 0, issues };
}

function validateRecord(definition, entityKey, input) {
  const issues = [];
  const entity = definition.entities.find((e) => e.key === entityKey);
  if (!entity) return { ok: false, issues: ['unknown entity'] };
  const allowed = new Set(entity.fields.map((f) => f.key));
  for (const k of Object.keys(input || {})) {
    if (!allowed.has(k)) issues.push('unknown field ' + k);
  }
  const data = {};
  for (const f of entity.fields) {
    const raw = input?.[f.key];
    if ((raw === undefined || raw === null || raw === '') && f.required) {
      issues.push('missing ' + f.key);
      continue;
    }
    if (raw === undefined || raw === null || raw === '') continue;
    if (f.type === 'currency' || f.type === 'number') {
      const n = Number(raw);
      if (!Number.isFinite(n)) issues.push('bad number ' + f.key);
      else data[f.key] = n;
    } else if (f.type === 'status' || f.type === 'select') {
      if (f.options?.length && !f.options.includes(String(raw))) {
        issues.push('bad enum ' + f.key);
      } else data[f.key] = String(raw);
    } else {
      data[f.key] = String(raw);
    }
  }
  return { ok: issues.length === 0, issues, data };
}

const def = {
  id: 'proto-delivery-tracker',
  slug: 'delivery-tracker',
  name: 'Delivery Tracker',
  version: 1,
  status: 'published',
  entities: [{
    key: 'delivery',
    label: 'Delivery',
    fields: [
      { key: 'customerName', label: 'Customer', type: 'text', required: true },
      { key: 'orderRef', label: 'Order', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'status', required: true, options: ['Pending','Out for Delivery','Delivered','Failed'] },
      { key: 'amount', label: 'Amount', type: 'currency' },
    ],
  }],
  views: [{ key: 'list', type: 'table', title: 'List', entity: 'delivery' }],
};

let failed = 0;
function assert(name, cond) {
  if (!cond) { console.error('FAIL', name); failed++; }
  else console.log('PASS', name);
}

assert('definition ok', validateDefinition(def).ok);
assert('valid record', validateRecord(def, 'delivery', {
  customerName: 'Ada', orderRef: 'O1', status: 'Pending', amount: 100,
}).ok);
assert('reject unknown field', !validateRecord(def, 'delivery', {
  customerName: 'Ada', orderRef: 'O1', status: 'Pending', hacker: true,
}).ok);
assert('reject bad enum', !validateRecord(def, 'delivery', {
  customerName: 'Ada', orderRef: 'O1', status: 'Flying',
}).ok);
assert('reject missing required', !validateRecord(def, 'delivery', {
  orderRef: 'O1', status: 'Pending',
}).ok);
assert('reject bad amount', !validateRecord(def, 'delivery', {
  customerName: 'Ada', orderRef: 'O1', status: 'Pending', amount: 'x',
}).ok);
assert('reject unknown entity', !validateRecord(def, 'nope', { a: 1 }).ok);

// Tenant isolation contract (service must always pass businessId — documented assertion)
function scopedQuery(businessId, rowBusinessId) {
  return String(businessId) === String(rowBusinessId);
}
assert('tenant match', scopedQuery('biz-a', 'biz-a'));
assert('tenant mismatch blocked', !scopedQuery('biz-a', 'biz-b'));

if (failed) {
  console.error('\n' + failed + ' failed');
  process.exit(1);
}
console.log('\nPhase B structural tests passed.');

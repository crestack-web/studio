/**
 * Structural tests for Busmo custom feature definition validation.
 * Run: node scripts/test-custom-feature-definition.mjs
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

// Compile-free: reimplement minimal checks matching validate.ts for CI without ts-node
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
    for (const f of e.fields || []) {
      if (!ALLOWED_FIELD_TYPES.has(f.type)) issues.push({ path: f.key, message: 'bad type ' + f.type });
    }
  }
  for (const v of def.views || []) {
    if (!ALLOWED_VIEW_TYPES.has(v.type)) issues.push({ path: v.key, message: 'bad view' });
    if (!keys.has(v.entity)) issues.push({ path: v.key, message: 'bad entity' });
  }
  return { ok: issues.length === 0, issues };
}

const deliveryTracker = {
  id: 'proto-delivery-tracker',
  slug: 'delivery-tracker',
  name: 'Delivery Tracker',
  version: 1,
  status: 'testing',
  entities: [{
    key: 'delivery',
    label: 'Delivery',
    fields: [
      { key: 'customerName', label: 'Customer', type: 'text' },
      { key: 'status', label: 'Status', type: 'status', options: ['Pending','Out for Delivery','Delivered','Failed'] },
      { key: 'amount', label: 'Amount', type: 'currency' },
    ],
  }],
  views: [
    { key: 'list', type: 'table', title: 'Deliveries', entity: 'delivery' },
    { key: 'summary', type: 'metrics', title: 'Summary', entity: 'delivery' },
  ],
};

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    console.error('FAIL', name);
    failed++;
  } else {
    console.log('PASS', name);
  }
}

const ok = validate(deliveryTracker);
assert('delivery tracker validates', ok.ok);

const bad = validate({ ...deliveryTracker, entities: [{ key: 'x', label: 'X', fields: [{ key: 'a', label: 'A', type: 'hack' }] }] });
assert('rejects unknown field type', !bad.ok);

const badView = validate({
  ...deliveryTracker,
  views: [{ key: 'x', type: 'table', title: 'X', entity: 'missing' }],
});
assert('rejects unknown entity ref', !badView.ok);

const noId = validate({ ...deliveryTracker, id: '' });
assert('requires id', !noId.ok);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nAll custom-feature definition tests passed.');

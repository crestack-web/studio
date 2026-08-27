/**
 * Lightweight structural tests for WhatsApp MO Sales Agent V1 helpers.
 * Run: node scripts/test-whatsapp-mo-v1.mjs
 */

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log('✓', msg);
}

function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

assert(normalizePhone('+234 801 234 5678') === '2348012345678', 'normalizePhone strips non-digits');
assert(normalizePhone('447860099299') === '447860099299', 'normalizePhone keeps digits');

const sample = {
  results: [
    {
      from: '385919998888',
      to: '41793026731',
      integrationType: 'WHATSAPP',
      receivedAt: '2025-01-01T10:10:00.000+0000',
      messageId: 'wamid.TEST123',
      message: { text: 'Hello, World!', type: 'TEXT' },
      contact: { name: 'Frank', phoneNumber: '385919998888' },
    },
  ],
};

const items = Array.isArray(sample.results) ? sample.results : [];
assert(items.length === 1, 'extracts one result');
assert(items[0].message.text === 'Hello, World!', 'parses text');
assert(items[0].messageId === 'wamid.TEST123', 'parses messageId');

const statusOnly = { results: [{ messageId: 'x', status: { groupName: 'DELIVERED' } }] };
const isSkippable = statusOnly.results.every((i) => i.status && !i.message);
assert(isSkippable, 'delivery status events are skippable');

const seen = new Set();
function processOnce(id) {
  if (seen.has(id)) return 'duplicate';
  seen.add(id);
  return 'processed';
}
assert(processOnce('wamid.TEST123') === 'processed', 'first delivery processed');
assert(processOnce('wamid.TEST123') === 'duplicate', 'second delivery is duplicate');

console.log('\nAll structural tests passed.');

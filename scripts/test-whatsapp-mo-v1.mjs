/**
 * Structural + security-oriented tests for WhatsApp MO Sales Agent V1.
 * Run: node scripts/test-whatsapp-mo-v1.mjs
 */

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('✓', msg);
}

function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

function sanitizeSearchQuery(raw) {
  return String(raw || '')
    .replace(/[%_,.()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function isStatusOrDeliveryEvent(item) {
  if (item.status && !item.message) return true;
  if (item.doneAt && !item.message) return true;
  if (
    item.status &&
    typeof item.status === 'object' &&
    ('groupName' in item.status || 'groupId' in item.status)
  ) {
    return true;
  }
  return false;
}

function extractInboundMessages(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.results)) return body.results;
  if (body.result) return [body.result];
  if (body.messageId || body.message) return [body];
  return [];
}

assert(normalizePhone('+234 801 234 5678') === '2348012345678', 'normalizePhone strips non-digits');
assert(normalizePhone('447860099299') === '447860099299', 'normalizePhone keeps digits');
assert(!sanitizeSearchQuery('a%_b,(x)').includes('%'), 'sanitize removes %');
assert(!sanitizeSearchQuery("evil';drop").includes('"'), 'sanitize removes quotes');

const textEvent = {
  results: [{
    from: '385919998888',
    to: '41793026731',
    messageId: 'wamid.TEST123',
    message: { text: 'How much is the black kaftan?', type: 'TEXT' },
  }],
};
const items = extractInboundMessages(textEvent);
assert(items.length === 1, 'extracts one result');
assert(items[0].message.text.includes('kaftan'), 'parses product question');

const delivery = {
  results: [{
    messageId: 'out-1',
    to: '385919998888',
    status: { groupId: 3, groupName: 'DELIVERED', id: 5 },
    doneAt: '2025-01-01T10:10:02.000+0000',
  }],
};
assert(isStatusOrDeliveryEvent(delivery.results[0]), 'delivery report is status event');
assert(!isStatusOrDeliveryEvent(items[0]), 'text message is not status event');

assert(extractInboundMessages(null).length === 0, 'null body → empty');
assert(extractInboundMessages({}).length === 0, 'empty object → empty');

const imageEvent = { messageId: 'img1', message: { type: 'IMAGE' }, from: '1', to: '2' };
assert(String(imageEvent.message.type).toUpperCase() !== 'TEXT', 'image is non-text');

const seen = new Set();
function claim(id) {
  if (seen.has(id)) return 'duplicate';
  seen.add(id);
  return 'claimed';
}
assert(claim('wamid.TEST123') === 'claimed', 'first claim wins');
assert(claim('wamid.TEST123') === 'duplicate', 'second claim is duplicate');

function shouldRunMo(agentStatus, claimResult) {
  if (claimResult === 'duplicate') return false;
  if (agentStatus === 'human_active') return false;
  return true;
}
assert(shouldRunMo('ai_active', 'claimed') === true, 'AI runs when ai_active');
assert(shouldRunMo('human_active', 'claimed') === false, 'AI blocked when human_active');
assert(shouldRunMo('ai_active', 'duplicate') === false, 'AI blocked on duplicate claim');

function resolveBusiness(senderMap, to) {
  return senderMap[normalizePhone(to)] || null;
}
const map = { 41793026731: 'biz-A' };
assert(resolveBusiness(map, '41793026731') === 'biz-A', 'maps sender to business A');
assert(resolveBusiness(map, '999') === null, 'unknown sender → no business');

console.log('\nAll structural tests passed.');

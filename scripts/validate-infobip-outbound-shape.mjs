/**
 * Validates Infobip free-form outbound request shape WITHOUT calling the API
 * and WITHOUT requiring/exposing the API key.
 *
 * Run: node scripts/validate-infobip-outbound-shape.mjs
 */

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('✓', msg);
}

function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

function buildOutboundRequest({ baseUrl, apiKeyPresent, from, to, text, messageId }) {
  const base = String(baseUrl || '').replace(/\/$/, '');
  const url = `${base}/whatsapp/1/message/text`;
  const headers = {
    Authorization: 'App <REDACTED>',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  // Prove header form only — never print real key
  const authScheme = 'App';
  const body = {
    from: normalizePhone(from),
    to: normalizePhone(to),
    content: { text: String(text || '').trim().slice(0, 4096) },
  };
  if (messageId) body.messageId = messageId;
  return { url, headers, authScheme, body, apiKeyPresent: Boolean(apiKeyPresent) };
}

const sample = buildOutboundRequest({
  baseUrl: 'https://3d44zw.api.infobip.com',
  apiKeyPresent: true,
  from: '447860088970',
  to: '+234 801 234 5678',
  text: 'Hi! Thanks for messaging us.',
  messageId: 'busmo-out-test-1',
});

assert(sample.url === 'https://3d44zw.api.infobip.com/whatsapp/1/message/text', 'URL uses free-form text endpoint');
assert(!sample.url.includes('template'), 'URL is not template API');
assert(sample.authScheme === 'App', 'Authorization scheme is App');
assert(sample.headers.Authorization.startsWith('App '), 'Authorization header prefix is App ');
assert(sample.body.from === '447860088970', 'from is trial sender digits');
assert(sample.body.to === '2348012345678', 'to is normalized customer digits');
assert(sample.body.content && typeof sample.body.content.text === 'string', 'body.content.text present');
assert(sample.body.messageId === 'busmo-out-test-1', 'optional messageId set');

// Inbound payload shape expected from Infobip trial
const inbound = {
  results: [
    {
      from: '2348012345678',
      to: '447860088970',
      integrationType: 'WHATSAPP',
      receivedAt: '2026-08-27T14:00:00.000+0000',
      messageId: 'wamid.TEST_TRIAL_1',
      message: { type: 'TEXT', text: 'Hi, do you have black sneakers?' },
      contact: { name: 'Test', phoneNumber: '2348012345678' },
    },
  ],
};

function extractInboundMessages(body) {
  if (!body || typeof body !== 'object') return [];
  if (Array.isArray(body.results)) return body.results;
  if (body.result) return [body.result];
  if (body.messageId || body.message) return [body];
  return [];
}

const items = extractInboundMessages(inbound);
assert(items.length === 1, 'inbound results[] parsed');
assert(items[0].to === '447860088970', 'inbound to is trial sender');
assert(items[0].from === '2348012345678', 'inbound from is customer');
assert(items[0].messageId === 'wamid.TEST_TRIAL_1', 'messageId present');
assert(String(items[0].message.type).toUpperCase() === 'TEXT', 'message.type TEXT');
assert(items[0].message.text.includes('sneakers'), 'message.text present');

console.log('\nOutbound request shape (redacted):\n', JSON.stringify({
  method: 'POST',
  url: sample.url,
  headers: sample.headers,
  body: sample.body,
}, null, 2));

console.log('\nAll Infobip shape checks passed.');

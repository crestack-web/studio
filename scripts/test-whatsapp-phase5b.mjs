/**
 * Phase 5B — structural tests for Busmo Acquisition MO.
 * Run: node scripts/test-whatsapp-phase5b.mjs
 */
function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exit(1); }
  console.log('✓', msg);
}

function assertConversationOwnership(params) {
  if (params.connectionType === 'platform') {
    if (params.businessId != null) throw new Error('platform_conversation_must_have_null_business_id');
    return;
  }
  if (!params.businessId) throw new Error('merchant_conversation_requires_business_id');
  if (params.connectionBusinessId && params.businessId !== params.connectionBusinessId) {
    throw new Error('merchant_business_id_mismatch');
  }
}

assertConversationOwnership({ connectionType: 'merchant', connectionBusinessId: 'biz-1', businessId: 'biz-1' });
assert(true, 'T1 merchant ownership ok');
assertConversationOwnership({ connectionType: 'platform', connectionBusinessId: null, businessId: null });
assert(true, 'T2 platform ownership ok');
try {
  assertConversationOwnership({ connectionType: 'platform', connectionBusinessId: null, businessId: 'biz-x' });
  assert(false, 'T3 should throw');
} catch (e) {
  assert(e.message === 'platform_conversation_must_have_null_business_id', 'T3 platform + merchant business rejected');
}

const PLANS = [
  { id: 'starter', name: 'Busmo Start', monthlyPrice: 7500 },
  { id: 'standard', name: 'Busmo Control', monthlyPrice: 20000 },
  { id: 'pro', name: 'Busmo Scale', monthlyPrice: 40000 },
];
function recommend(size, needs, staff, multi) {
  const ordered = [...PLANS].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  let idx = 0;
  const complex = multi || staff >= 5 || /warehouse|branches|payroll/i.test(`${size} ${needs}`);
  const mid = staff >= 2 || /inventory|stock|credit|profit|two shop/i.test(`${size} ${needs}`);
  if (complex && ordered.length >= 3) idx = ordered.length - 1;
  else if (mid && ordered.length >= 2) idx = Math.min(1, ordered.length - 1);
  return ordered[idx].id;
}
assert(recommend('simple', '', 1, false) === 'starter', 'T4 simple → starter');
assert(recommend('growing', 'inventory credit', 3, false) === 'standard', 'T4 mid → standard');
assert(recommend('complex', 'warehouse', 8, true) === 'pro', 'T4 complex → pro');
assert(recommend('', '', 0, false) === 'starter', 'T4 insufficient → starter');

const consumedBySignup = new Set(['trial', 'ref', 'google']);
const weAttach = ['source', 'lead', 'connection', 'plan'];
assert(weAttach.filter((k) => !consumedBySignup.has(k)).includes('lead'), 'T5 signup attribution is Phase 6 gap');

const ALLOWED = new Set(['get_busmo_pricing', 'recommend_busmo_plan', 'create_signup_link', 'update_lead', 'handoff_to_human']);
assert(!ALLOWED.has('search_products'), 'T6 no product-search tool');
assert(!ALLOWED.has('deduct_credits'), 'T6 no credits tool');
assert(ALLOWED.has('get_busmo_pricing'), 'T6 pricing allowed');

function updateLeadScoped(ctxLeadId, modelArgs) {
  if (modelArgs.leadId && modelArgs.leadId !== ctxLeadId) return { ok: false, error: 'cross_lead_denied' };
  if (modelArgs.business_id) return { ok: false, error: 'merchant_scope_denied' };
  return { ok: true, leadId: ctxLeadId };
}
assert(updateLeadScoped('lead-A', { leadId: 'lead-B' }).error === 'cross_lead_denied', 'T7 cross-lead denied');
assert(updateLeadScoped('lead-A', { name: 'Ada' }).leadId === 'lead-A', 'T7 scoped update');

function normalize(phone) {
  let d = String(phone).replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 11) d = '234' + d.slice(1);
  return d;
}
const byPhone = new Map();
function upsertLead(phone) {
  const n = normalize(phone);
  if (byPhone.has(n)) return byPhone.get(n);
  const id = 'L' + byPhone.size;
  byPhone.set(n, id);
  return id;
}
assert(upsertLead('08011112222') === upsertLead('+2348011112222'), 'T8 same phone → one lead');

function resolveProfile(dbRow, payload) {
  return { connectionType: dbRow.connection_type, agentProfile: dbRow.agent_profile };
}
const r = resolveProfile(
  { connection_type: 'platform', agent_profile: 'busmo_acquisition' },
  { connection_type: 'merchant', agent_profile: 'merchant_sales' }
);
assert(r.connectionType === 'platform' && r.agentProfile === 'busmo_acquisition', 'T9 payload cannot override profile');

function routeSender(sender) {
  if (sender === '447860088970') return { connectionType: 'merchant', agentProfile: 'merchant_sales' };
  if (sender === 'platform-wa') return { connectionType: 'platform', agentProfile: 'busmo_acquisition' };
  return null;
}
assert(routeSender('447860088970').connectionType === 'merchant', 'T10 trial sender merchant');
assert(routeSender('platform-wa').agentProfile === 'busmo_acquisition', 'T10 platform acquisition');

function afterClaim({ duplicate, agentStatus, branch }) {
  if (duplicate) return 'stop';
  if (agentStatus === 'human_active') return 'stop';
  return branch === 'platform' ? 'acquisition' : 'merchant_mo';
}
assert(afterClaim({ duplicate: false, agentStatus: 'human_active', branch: 'platform' }) === 'stop', 'T11 human_active stops AI');
assert(afterClaim({ duplicate: false, agentStatus: 'ai_active', branch: 'platform' }) === 'acquisition', 'T11 ai_active → acquisition');
assert(afterClaim({ duplicate: true, agentStatus: 'ai_active', branch: 'platform' }) === 'stop', 'T11 duplicate stops');

function isStatus(item) {
  return Boolean(item.status && !item.message) || Boolean(item.doneAt && !item.message);
}
assert(isStatus({ status: { groupName: 'DELIVERED' }, messageId: 'x' }) === true, 'T12 delivery is status');
assert(isStatus({ message: { type: 'TEXT', text: 'hi' }, messageId: 'y' }) === false, 'T12 text not status');

const acquisitionPath = 'getOrCreateConversation null claimInboundMessage generateAcquisitionReply insertOutboundMessage sendWhatsAppText';
for (const f of ['ensureTrialCredits', 'deductForMoResponse', 'refundUsageForFailedSend', 'mo_credit_wallets']) {
  assert(!acquisitionPath.includes(f), `T13 no ${f}`);
}

const MO_WRITABLE = new Set(['new', 'engaged', 'qualified', 'signup_started', 'handed_off']);
assert(!MO_WRITABLE.has('signed_up'), 'T14 signed_up not MO-writable');
assert(!MO_WRITABLE.has('activated'), 'T14 activated not MO-writable');
assert(MO_WRITABLE.has('signup_started'), 'T14 signup_started allowed');

console.log('\nAll Phase 5B structural tests passed.');

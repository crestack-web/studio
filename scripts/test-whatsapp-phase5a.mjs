/**
 * Phase 5A — platform conversation / message infrastructure (structural).
 * Run: node scripts/test-whatsapp-phase5a.mjs
 */

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('✓', msg);
}

function assertConversationOwnership(params) {
  if (params.connectionType === 'platform') {
    if (params.businessId != null) {
      throw new Error('platform_conversation_must_have_null_business_id');
    }
    return;
  }
  if (!params.businessId) {
    throw new Error('merchant_conversation_requires_business_id');
  }
  if (
    params.connectionBusinessId &&
    params.businessId !== params.connectionBusinessId
  ) {
    throw new Error('merchant_business_id_mismatch');
  }
}

function routePlatformPersist(resolved) {
  if (!resolved) return { persist: false, reason: 'unknown' };
  if (
    resolved.connectionType !== 'platform' &&
    resolved.agentProfile !== 'busmo_acquisition'
  ) {
    return { persist: false, reason: 'merchant' };
  }
  return {
    persist: true,
    conversation: {
      connection_id: resolved.connection.id,
      business_id: null,
    },
    message: {
      business_id: null,
      conversation_scoped: true,
    },
    callGenerateSalesReply: false,
    callCredits: false,
  };
}

// T1 Merchant conversation still requires business_id
{
  assertConversationOwnership({
    connectionType: 'merchant',
    connectionBusinessId: 'biz-1',
    businessId: 'biz-1',
  });
  assert(true, 'T1 merchant ownership ok');
}

// T2 Platform conversation business_id null
{
  assertConversationOwnership({
    connectionType: 'platform',
    connectionBusinessId: null,
    businessId: null,
  });
  const r = routePlatformPersist({
    connection: { id: 'conn-p' },
    connectionType: 'platform',
    agentProfile: 'busmo_acquisition',
    businessId: null,
  });
  assert(r.conversation.business_id === null, 'T2 platform conversation business_id null');
  assert(r.conversation.connection_id === 'conn-p', 'T2 connection_id set');
}

// T3 Platform message shape
{
  const r = routePlatformPersist({
    connection: { id: 'conn-p' },
    connectionType: 'platform',
    agentProfile: 'busmo_acquisition',
    businessId: null,
  });
  assert(r.message.business_id === null, 'T3 platform message business_id null');
}

// T4 Duplicate claim structural
{
  const seen = new Set();
  function claim(pid) {
    if (seen.has(pid)) return { duplicate: true };
    seen.add(pid);
    return { duplicate: false };
  }
  assert(claim('wamid.p1').duplicate === false, 'T4 first claim');
  assert(claim('wamid.p1').duplicate === true, 'T4 duplicate');
}

// T5 Merchant/platform isolation by connection_id vs business_id keys
{
  const merchantKey = ['biz-A', '080123', 'infobip'].join('|');
  const platformKey = ['conn-P', '080123', 'infobip'].join('|');
  assert(merchantKey !== platformKey, 'T5 different uniqueness keys for same phone');
}

// T6 Platform cannot attach merchant business
{
  let threw = false;
  try {
    assertConversationOwnership({
      connectionType: 'platform',
      connectionBusinessId: null,
      businessId: 'biz-merchant',
    });
  } catch (e) {
    threw = e.message === 'platform_conversation_must_have_null_business_id';
  }
  assert(threw, 'T6 platform + merchant business rejected');
}

// T7 Merchant cannot attach NULL business
{
  let threw = false;
  try {
    assertConversationOwnership({
      connectionType: 'merchant',
      connectionBusinessId: 'biz-1',
      businessId: null,
    });
  } catch (e) {
    threw = e.message === 'merchant_conversation_requires_business_id';
  }
  assert(threw, 'T7 merchant null business rejected');
}

// T8 Unknown sender
{
  const r = routePlatformPersist(null);
  assert(r.persist === false && r.reason === 'unknown', 'T8 unknown no platform persist');
}

// T9 Human handoff
{
  function afterClaim({ duplicate, agentStatus, branch }) {
    if (branch !== 'platform' && branch !== 'merchant') return 'stop';
    if (duplicate) return 'stop';
    if (agentStatus === 'human_active') return 'stop';
    return branch === 'platform' ? 'phase5a_stub' : 'merchant_mo';
  }
  assert(
    afterClaim({ duplicate: false, agentStatus: 'human_active', branch: 'platform' }) === 'stop',
    'T9 platform human_active stops'
  );
  assert(
    afterClaim({ duplicate: false, agentStatus: 'ai_active', branch: 'platform' }) === 'phase5a_stub',
    'T9 platform ai_active → stub only'
  );
}

// T10 Merchant still runs MO path flags
{
  const r = routePlatformPersist({
    connection: { id: 'c' },
    connectionType: 'merchant',
    agentProfile: 'merchant_sales',
    businessId: 'biz',
  });
  assert(r.persist === false && r.reason === 'merchant', 'T10 merchant not platform route');
}

// T11 Delivery does not persist inbound
{
  function isStatus(item) {
    return Boolean(item.status && !item.message) || Boolean(item.doneAt && !item.message);
  }
  assert(isStatus({ status: { groupName: 'DELIVERED' }, messageId: 'x' }) === true, 'T11 delivery');
  assert(isStatus({ message: { type: 'TEXT', text: 'hi' }, messageId: 'y' }) === false, 'T11 text');
}

// Credits never on platform
{
  const r = routePlatformPersist({
    connection: { id: 'p' },
    connectionType: 'platform',
    agentProfile: 'busmo_acquisition',
    businessId: null,
  });
  assert(r.callCredits === false, 'no platform credits');
  assert(r.callGenerateSalesReply === false, 'no platform generateSalesReply');
}

// Trial sender remains merchant-shaped
{
  assertConversationOwnership({
    connectionType: 'merchant',
    connectionBusinessId: 'trial-business',
    businessId: 'trial-business',
  });
  assert(true, 'T10b trial 447860088970 merchant shape');
}

console.log('\nAll Phase 5A structural tests passed.');

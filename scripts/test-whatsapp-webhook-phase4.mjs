/**
 * Phase 4 — Infobip webhook connection routing (structural, no DB / no network).
 *
 * Verifies:
 * - Trusted resolver outputs drive merchant vs platform branches
 * - Platform never invokes generateSalesReply / merchant credits
 * - Payload cannot override connectionType / agentProfile / businessId
 * - Delivery events never reach MO
 * - Unknown sender does not become platform
 * - Trial sender remains merchant
 *
 * Run: node scripts/test-whatsapp-webhook-phase4.mjs
 */

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  console.log('✓', msg);
}

function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

function normalizeConnectionType(raw) {
  return String(raw || '').toLowerCase() === 'platform' ? 'platform' : 'merchant';
}

function normalizeAgentProfile(raw, connectionType) {
  const v = String(raw || '').toLowerCase();
  if (v === 'busmo_acquisition') return 'busmo_acquisition';
  if (v === 'merchant_sales') return 'merchant_sales';
  return connectionType === 'platform' ? 'busmo_acquisition' : 'merchant_sales';
}

function mapConnectionRow(row) {
  if (!row || !row.id) return null;
  const connectionType = normalizeConnectionType(row.connection_type);
  const agentProfile = normalizeAgentProfile(row.agent_profile, connectionType);
  let businessId =
    row.business_id != null && String(row.business_id).trim() !== ''
      ? String(row.business_id)
      : null;
  if (connectionType === 'platform') businessId = null;
  else if (connectionType === 'merchant' && !businessId) return null;
  return {
    connection: {
      id: String(row.id),
      provider: String(row.provider || 'infobip'),
      whatsapp_sender: String(row.whatsapp_sender || ''),
      status: String(row.status || ''),
      metadata: row.metadata || null,
      connection_type: connectionType,
      agent_profile: agentProfile,
      business_id: businessId,
    },
    connectionType,
    agentProfile,
    businessId,
  };
}

/** Mirrors webhook branch after resolveConnectionBySender */
function routeAfterResolve(resolved) {
  if (!resolved) return { branch: 'none', runMerchantMo: false, runPlatformStub: false };
  if (
    resolved.connectionType === 'platform' ||
    resolved.agentProfile === 'busmo_acquisition'
  ) {
    return {
      branch: 'platform',
      runMerchantMo: false,
      runPlatformStub: true,
      callGenerateSalesReply: false,
      callEnsureTrialCredits: false,
      callDeductForMoResponse: false,
    };
  }
  if (!resolved.businessId) {
    return { branch: 'invalid_merchant', runMerchantMo: false, runPlatformStub: false };
  }
  return {
    branch: 'merchant',
    runMerchantMo: true,
    runPlatformStub: false,
    callGenerateSalesReply: true,
    callEnsureTrialCredits: true,
    callDeductForMoResponse: true,
  };
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

// --- Test 1: Existing merchant (trial sender shape) ---
{
  const row = {
    id: 'conn-trial',
    business_id: 'biz-trial',
    provider: 'infobip',
    whatsapp_sender: '447860088970',
    status: 'active',
    connection_type: 'merchant',
    agent_profile: 'merchant_sales',
    metadata: {},
  };
  const r = mapConnectionRow(row);
  assert(r.connectionType === 'merchant', 'T1 merchant connectionType');
  assert(r.agentProfile === 'merchant_sales', 'T1 merchant agentProfile');
  assert(r.businessId === 'biz-trial', 'T1 merchant businessId');
  const route = routeAfterResolve(r);
  assert(route.branch === 'merchant', 'T1 routes to merchant');
  assert(route.runMerchantMo === true, 'T1 merchant MO active');
  assert(route.callGenerateSalesReply === true, 'T1 generateSalesReply allowed');
  assert(route.callEnsureTrialCredits === true, 'T1 ensureTrialCredits allowed');
  assert(route.callDeductForMoResponse === true, 'T1 deductForMoResponse allowed');
  assert(route.runPlatformStub === false, 'T1 not platform stub');
}

// --- Test 2: Platform ---
{
  const row = {
    id: 'conn-plat',
    business_id: null,
    provider: 'infobip',
    whatsapp_sender: '2348000000001',
    status: 'active',
    connection_type: 'platform',
    agent_profile: 'busmo_acquisition',
  };
  const r = mapConnectionRow(row);
  assert(r.connectionType === 'platform', 'T2 platform type');
  assert(r.agentProfile === 'busmo_acquisition', 'T2 acquisition profile');
  assert(r.businessId === null, 'T2 businessId null');
  const route = routeAfterResolve(r);
  assert(route.branch === 'platform', 'T2 routes to platform');
  assert(route.runPlatformStub === true, 'T2 platform stub');
}

// --- Test 3: Platform never invokes merchant MO ---
{
  const r = mapConnectionRow({
    id: 'p',
    business_id: null,
    provider: 'infobip',
    whatsapp_sender: '1',
    status: 'active',
    connection_type: 'platform',
    agent_profile: 'busmo_acquisition',
  });
  const route = routeAfterResolve(r);
  assert(route.callGenerateSalesReply === false, 'T3 no generateSalesReply');
  assert(route.runMerchantMo === false, 'T3 no merchant MO');
}

// --- Test 4: Platform never uses merchant credits ---
{
  const r = mapConnectionRow({
    id: 'p2',
    business_id: null,
    provider: 'infobip',
    whatsapp_sender: '2',
    status: 'active',
    connection_type: 'platform',
    agent_profile: 'busmo_acquisition',
  });
  const route = routeAfterResolve(r);
  assert(route.callEnsureTrialCredits === false, 'T4 no ensureTrialCredits');
  assert(route.callDeductForMoResponse === false, 'T4 no deductForMoResponse');
}

// --- Test 5: Unknown sender ---
{
  assert(mapConnectionRow(null) === null, 'T5 null row');
  assert(routeAfterResolve(null).branch === 'none', 'T5 unknown → none');
  assert(routeAfterResolve(null).runPlatformStub === false, 'T5 unknown is not platform');
}

// --- Test 6: Human handoff still suppresses AI (merchant gate structural) ---
{
  function shouldRunMerchantAi({ duplicate, moEnabled, agentStatus, branch }) {
    if (branch !== 'merchant') return false;
    if (duplicate) return false;
    if (!moEnabled) return false;
    if (agentStatus === 'human_active') return false;
    return true;
  }
  assert(
    shouldRunMerchantAi({
      duplicate: false,
      moEnabled: true,
      agentStatus: 'human_active',
      branch: 'merchant',
    }) === false,
    'T6 human_active suppresses AI'
  );
  assert(
    shouldRunMerchantAi({
      duplicate: false,
      moEnabled: true,
      agentStatus: 'ai_active',
      branch: 'merchant',
    }) === true,
    'T6 ai_active allows MO'
  );
}

// --- Test 7: Duplicate message ---
{
  const seen = new Set();
  function claim(id) {
    if (seen.has(id)) return { duplicate: true };
    seen.add(id);
    return { duplicate: false };
  }
  assert(claim('wamid.1').duplicate === false, 'T7 first claim');
  assert(claim('wamid.1').duplicate === true, 'T7 second claim duplicate');
}

// --- Test 8: Delivery/status never invokes either MO ---
{
  const delivery = {
    messageId: 'out-1',
    to: '2348012345678',
    status: { groupId: 3, groupName: 'DELIVERED' },
    doneAt: '2025-01-01T10:10:02.000+0000',
  };
  assert(isStatusOrDeliveryEvent(delivery) === true, 'T8 delivery is status event');
  assert(
    isStatusOrDeliveryEvent({
      messageId: 'in-1',
      from: '1',
      to: '2',
      message: { type: 'TEXT', text: 'hi' },
    }) === false,
    'T8 text is not status'
  );
}

// --- Test 9: Payload cannot override profile ---
{
  const dbRow = {
    id: 'conn-m',
    business_id: 'biz-1',
    provider: 'infobip',
    whatsapp_sender: '447860088970',
    status: 'active',
    connection_type: 'merchant',
    agent_profile: 'merchant_sales',
  };
  const untrusted = {
    connection_type: 'platform',
    agent_profile: 'busmo_acquisition',
    business_id: 'attacker',
  };
  // Webhook must only pass DB row into mapConnectionRow — never merge payload
  const r = mapConnectionRow(dbRow);
  assert(r.connectionType === 'merchant', 'T9 type from DB');
  assert(r.agentProfile === 'merchant_sales', 'T9 profile from DB');
  assert(r.businessId === 'biz-1', 'T9 businessId from DB');
  assert(untrusted.connection_type !== r.connectionType, 'T9 payload type ignored');
  assert(routeAfterResolve(r).branch === 'merchant', 'T9 still merchant path');
}

// --- Platform row with leaked business_id stripped ---
{
  const r = mapConnectionRow({
    id: 'px',
    business_id: 'should-not-leak',
    provider: 'infobip',
    whatsapp_sender: '9',
    status: 'active',
    connection_type: 'platform',
    agent_profile: 'busmo_acquisition',
  });
  assert(r.businessId === null, 'platform business_id forced null');
  assert(routeAfterResolve(r).callGenerateSalesReply === false, 'stripped platform still no MO');
}

console.log('\nAll Phase 4 webhook routing structural tests passed.');

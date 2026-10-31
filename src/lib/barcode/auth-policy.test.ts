/**
 * Authorization policy unit tests (no network).
 * Run: npx tsx src/lib/barcode/auth-policy.test.ts
 *
 * Documents expected assertBusinessAccess rules for regression review.
 */

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

/** Mirror of allow rules (logic only) */
function wouldAllow(params: {
  userId: string;
  businessId: string;
  ownerId?: string | null;
  profileBusinessId?: string | null;
  role?: string | null;
  staffMember?: boolean;
}): boolean {
  if (!params.businessId) return false;
  if (params.businessId === params.userId) return true;
  if (params.ownerId && String(params.ownerId) === String(params.userId)) return true;
  if (params.profileBusinessId && String(params.profileBusinessId) === String(params.businessId))
    return true;
  const role = String(params.role || '').toLowerCase();
  if (['admin', 'superadmin'].includes(role)) return true;
  if (params.staffMember) return true;
  return false;
}

const owner = 'owner-1';
const bizA = 'biz-a';
const bizB = 'biz-b';
const staff = 'staff-1';

assert(wouldAllow({ userId: owner, businessId: bizA, ownerId: owner }) === true, 'owner of A');
assert(wouldAllow({ userId: owner, businessId: bizB, ownerId: owner }) === false, 'owner of A not B');
assert(
  wouldAllow({ userId: staff, businessId: bizA, profileBusinessId: bizA }) === true,
  'staff profile biz'
);
assert(
  wouldAllow({ userId: staff, businessId: bizB, profileBusinessId: bizA }) === false,
  'cross-business blocked'
);
assert(
  wouldAllow({ userId: 'attacker', businessId: bizA, ownerId: owner }) === false,
  'random user blocked'
);
assert(
  wouldAllow({ userId: 'admin-1', businessId: bizA, role: 'admin' }) === true,
  'admin allowed'
);
assert(
  wouldAllow({ userId: staff, businessId: bizA, staffMember: true }) === true,
  'staff roster'
);
assert(wouldAllow({ userId: owner, businessId: '' }) === false, 'empty businessId');

console.log('auth-policy.test.ts OK');

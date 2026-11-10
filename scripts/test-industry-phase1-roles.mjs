/**
 * Phase 1 smoke: role helpers (no network).
 * Run: node scripts/test-industry-phase1-roles.mjs
 */
import {
  normalizeSolutionRole,
  canAccessOwnerConsole,
  canMutateOwnerData,
  canAccessDesk,
  canMutateDesk,
} from '../src/lib/industries/roles.ts';

const checks = [
  [normalizeSolutionRole('owner') === 'owner', 'owner'],
  [normalizeSolutionRole('staff') === 'desk', 'staff'],
  [canAccessOwnerConsole('desk') === false, 'desk blocked from owner console'],
  [canMutateOwnerData('readonly') === false, 'readonly no owner write'],
  [canMutateDesk('desk') === true, 'desk can mutate desk'],
  [canMutateDesk('readonly') === false, 'readonly cannot mutate desk'],
];

let failed = 0;
for (const [ok, name] of checks) {
  if (!ok) {
    console.error('FAIL', name);
    failed++;
  } else console.log('OK', name);
}
if (failed) process.exit(1);
console.log('phase1 roles smoke: passed');

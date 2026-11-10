import {
  normalizeSolutionRole,
  canAccessOwnerConsole,
  canMutateOwnerData,
  canAccessDesk,
  canMutateDesk,
} from './roles';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(normalizeSolutionRole('owner') === 'owner', 'owner');
assert(normalizeSolutionRole('admin') === 'owner', 'admin→owner');
assert(normalizeSolutionRole('desk') === 'desk', 'desk');
assert(normalizeSolutionRole('staff') === 'desk', 'staff→desk');
assert(normalizeSolutionRole('readonly') === 'readonly', 'readonly');
assert(normalizeSolutionRole('nope') === null, 'invalid');

assert(canAccessOwnerConsole('owner') === true, 'owner console');
assert(canAccessOwnerConsole('desk') === false, 'desk no console');
assert(canAccessOwnerConsole('readonly') === true, 'readonly console');

assert(canMutateOwnerData('owner') === true, 'owner mutate');
assert(canMutateOwnerData('desk') === false, 'desk no owner mutate');
assert(canMutateOwnerData('readonly') === false, 'readonly no mutate');

assert(canAccessDesk('desk') === true, 'desk access');
assert(canMutateDesk('desk') === true, 'desk mutate');
assert(canMutateDesk('readonly') === false, 'readonly no desk mutate');
assert(canMutateDesk('owner') === true, 'owner desk mutate');

console.log('roles.test.ts: OK');

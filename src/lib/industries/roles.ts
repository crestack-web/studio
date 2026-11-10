/**
 * Industry solution roles (Phase 1).
 * owner — full console + desk
 * desk — staff portal / front desk only (mutations on desk APIs)
 * readonly — view only
 */

export type SolutionRole = 'owner' | 'desk' | 'readonly';

export const SOLUTION_ROLES: SolutionRole[] = ['owner', 'desk', 'readonly'];

export function canAccessOwnerConsole(role: SolutionRole | null | undefined): boolean {
  return role === 'owner' || role === 'readonly';
}

export function canMutateOwnerData(role: SolutionRole | null | undefined): boolean {
  return role === 'owner';
}

export function canAccessDesk(role: SolutionRole | null | undefined): boolean {
  return role === 'owner' || role === 'desk' || role === 'readonly';
}

export function canMutateDesk(role: SolutionRole | null | undefined): boolean {
  return role === 'owner' || role === 'desk';
}

export function normalizeSolutionRole(raw: unknown): SolutionRole | null {
  const s = String(raw || '')
    .toLowerCase()
    .trim();
  if (s === 'owner' || s === 'admin') return 'owner';
  if (s === 'desk' || s === 'staff' || s === 'front_desk' || s === 'front-desk') return 'desk';
  if (s === 'readonly' || s === 'read_only' || s === 'viewer') return 'readonly';
  return null;
}

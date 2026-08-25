'use client';

/**
 * Staff workspace context — single source of truth for the logged-in staff member
 * and the owner business they belong to. Fixes cross-business data leaks caused by
 * each page re-resolving identity with Firebase Auth (null after Supabase migration).
 */

import React, { createContext, useContext, useMemo } from 'react';
import type { Permissions, StaffUser } from './types';

export interface StaffWorkspace {
  staff: StaffUser;
  permissions: Permissions;
  /** Auth user id (Supabase) */
  userId: string;
  /** Owner business this staff was added to — ALL queries must use this */
  businessId: string;
  businessName: string;
  currency: string;
  email: string | null;
  staffId: string;
}

const StaffContext = createContext<StaffWorkspace | null>(null);

export function StaffProvider({
  value,
  children,
}: {
  value: StaffWorkspace;
  children: React.ReactNode;
}) {
  const memo = useMemo(() => value, [
    value.userId,
    value.businessId,
    value.businessName,
    value.currency,
    value.staff.id,
    value.staff.name,
    value.staff.role,
    value.email,
    value.staffId,
    // permissions object — stringify keys that matter
    value.permissions.sale,
    value.permissions.inv,
    value.permissions.hist,
    value.permissions.atd,
    value.permissions.msg,
    value.permissions.earn,
  ]);

  return <StaffContext.Provider value={memo}>{children}</StaffContext.Provider>;
}

export function useStaffWorkspace(): StaffWorkspace {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error('useStaffWorkspace must be used within StaffProvider');
  }
  return ctx;
}

/** Safe hook when component may render outside provider (returns null). */
export function useStaffWorkspaceOptional(): StaffWorkspace | null {
  return useContext(StaffContext);
}

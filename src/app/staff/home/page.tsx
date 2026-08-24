'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { StaffDashboard } from './StaffDashboard';
import { StaffProvider, type StaffWorkspace } from './StaffContext';
import type { Permissions, StaffUser } from './types';
import { getSupabase } from '@/lib/supabase';
import { ensureFirebaseAuth } from '@/lib/ensure-firebase-auth';
import { initializeFirebase } from '@/firebase';
import './busmo.css';

const DEFAULT_PERMISSIONS: Permissions = {
  sale: true,
  inv: false,
  hist: false,
  atd: false,
  msg: false,
  earn: false,
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Resolve the single owner business this staff member belongs to.
 * Source of truth: users/{uid}.businessId, verified against an *active*
 * businesses/{id}/staff/{uid} doc. Staff may only belong to one business.
 */
async function resolveStaffBusinessId(
  firestore: ReturnType<typeof initializeFirebase>['firestore'],
  userId: string,
  email: string | null | undefined,
  metaBusinessId?: string | null
): Promise<{
  businessId: string | null;
  businessName: string;
  currency: string;
  role: string;
  displayName: string | null;
  permissions: Permissions | null;
  mustChange: boolean;
  staffId: string | null;
}> {
  let businessId: string | null = null;
  let businessName = 'Business';
  let currency = '₦';
  let role = 'Staff';
  let displayName: string | null = null;
  let permissions: Permissions | null = null;
  let mustChange = false;
  let staffId: string | null = null;

  const userSnap = await getDoc(doc(firestore, 'users', userId));
  if (userSnap.exists()) {
    const data = userSnap.data() || {};
    const roleLc = String(data.role || '').toLowerCase();
    // Ignore removed accounts
    if (roleLc !== 'removed' && data.businessId) {
      businessId = String(data.businessId);
    }
    if (data.role && roleLc !== 'removed') role = String(data.role);
    displayName = data.displayName || data.fullName || data.name || null;
    if (data.permissions && typeof data.permissions === 'object') {
      permissions = { ...DEFAULT_PERMISSIONS, ...data.permissions };
    }
    if (data.mustChangePassword === true) mustChange = true;
    if (data.staffId) staffId = String(data.staffId);
  }

  // Auth metadata only if user doc has no business yet
  if (!businessId && metaBusinessId) {
    businessId = String(metaBusinessId);
  }

  // Verify active staff membership under the claimed business
  if (businessId) {
    try {
      const staffSnap = await getDoc(
        doc(firestore, 'businesses', businessId, 'staff', userId)
      );
      if (staffSnap.exists()) {
        const sd = staffSnap.data() || {};
        const status = String(sd.status || 'active').toLowerCase();
        if (status === 'removed') {
          // Stale user.businessId — clear so we do not load the wrong business
          console.warn(
            '[staff/home] staff status is removed for',
            businessId,
            '— clearing scope'
          );
          businessId = null;
        } else {
          if (sd.role) role = String(sd.role);
          if (sd.name) displayName = String(sd.name);
          if (sd.permissions && typeof sd.permissions === 'object') {
            permissions = { ...DEFAULT_PERMISSIONS, ...sd.permissions };
          }
          if (sd.mustChangePassword === true) mustChange = true;
          if (sd.staffId) staffId = String(sd.staffId);
          // Prefer staff doc businessId if present (single assignment)
          if (sd.businessId) businessId = String(sd.businessId);
        }
      } else {
        // User points at a business where they are not on the staff roster
        console.warn(
          '[staff/home] no staff doc under claimed business',
          businessId
        );
        businessId = null;
      }
    } catch (e) {
      console.warn('[staff/home] staff doc lookup failed', e);
    }
  }

  if (businessId) {
    try {
      const bizSnap = await getDoc(doc(firestore, 'businesses', businessId));
      if (bizSnap.exists()) {
        const bd = bizSnap.data() || {};
        businessName =
          bd.businessName || bd.name || bd.ownerName || businessName;
        currency =
          bd.currency || bd.businessCurrency || bd.defaultCurrency || currency;
      }
    } catch (e) {
      console.warn('[staff/home] business doc lookup failed', e);
    }
  }

  // Do NOT fall back to invitations or other businesses — prevents
  // cross-business leakage when an email was invited more than once.

  return {
    businessId,
    businessName,
    currency,
    role,
    displayName,
    permissions,
    mustChange,
    staffId,
  };
}

export default function StaffHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspace, setWorkspace] = useState<StaffWorkspace | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const supabase = getSupabase();
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('[staff/home] session error', sessionError);
        }

        let user = sessionData.session?.user;

        if (!user) {
          await new Promise((r) => setTimeout(r, 400));
          const retry = await supabase.auth.getSession();
          user = retry.data.session?.user;
        }

        if (!user) {
          if (!cancelled) router.replace('/login/staff');
          return;
        }

        const meta = user.user_metadata || {};
        let role = String(meta.role || '').trim();
        let displayName = String(
          meta.full_name || meta.name || user.email?.split('@')[0] || 'Staff Member'
        ).trim();
        let perms: Permissions = { ...DEFAULT_PERMISSIONS };
        let hasStaffProfile = Boolean(meta.staffId || meta.businessId);
        let mustChange =
          meta.must_change_password === true ||
          meta.must_change_password === 'true';

        // Firestore rules require Firebase Auth — link from Supabase session
        await ensureFirebaseAuth();

        const { firestore } = initializeFirebase();
        if (!firestore) {
          throw new Error('Data service unavailable. Please refresh.');
        }

        const resolved = await resolveStaffBusinessId(
          firestore,
          user.id,
          user.email,
          meta.businessId
        );

        if (resolved.role) role = resolved.role;
        if (resolved.displayName) displayName = resolved.displayName;
        if (resolved.permissions) perms = resolved.permissions;
        if (resolved.mustChange) mustChange = true;
        if (resolved.businessId) hasStaffProfile = true;

        const roleLc = role.toLowerCase();
        const isOwnerOnly =
          (roleLc === 'owner' || roleLc === 'admin') && !hasStaffProfile;

        if (isOwnerOnly) {
          if (!cancelled) {
            await supabase.auth.signOut().catch(() => {});
            router.replace('/login');
          }
          return;
        }

        if (mustChange) {
          if (!cancelled) router.replace('/staff/set-password');
          return;
        }

        if (!resolved.businessId) {
          if (!cancelled) {
            setError(
              'Your staff account is not linked to a business. Ask the owner to re-invite you.'
            );
            setIsLoading(false);
          }
          return;
        }

        const firstName = displayName.split(/\s+/)[0] || 'Staff';
        if (cancelled) return;

        const staffUser: StaffUser = {
          id: user.id,
          initials: initialsFromName(displayName),
          name: displayName,
          firstName,
          role: role || 'Staff',
          businessId: resolved.businessId,
        };

        setWorkspace({
          staff: staffUser,
          permissions: perms,
          userId: user.id,
          businessId: resolved.businessId,
          businessName: resolved.businessName,
          currency: resolved.currency,
          email: user.email ?? null,
          staffId: resolved.staffId || user.id,
        });
        setIsLoading(false);
      } catch (err: any) {
        console.error('[staff/home] bootstrap failed', err);
        if (!cancelled) {
          setError(err?.message || 'Could not load your workspace.');
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm"
            onClick={() => {
              window.location.href = '/login/staff';
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 mb-4 text-sm">
            Session expired or incomplete. Please sign in again.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold text-sm"
            onClick={() => {
              window.location.href = '/login/staff';
            }}
          >
            Staff login
          </button>
        </div>
      </div>
    );
  }

  return (
    <StaffProvider value={workspace}>
      <StaffDashboard
        staff={workspace.staff}
        permissions={workspace.permissions}
        businessId={workspace.businessId}
        businessName={workspace.businessName}
        currency={workspace.currency}
        onLogout={async () => {
          try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
          } catch {
            /* ignore */
          }
          window.location.href = '/login/staff';
        }}
      />
    </StaffProvider>
  );
}

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
  customers: false,
  credit: false,
  returns: false,
  receive: false,
  expenses: false,
  shift: false,
  expiry: false,
  production: false,
  menu: false,
  transfers: false,
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Resolve the single owner business this staff member belongs to.
 * Priority (invite is Supabase-first):
 *   1) Auth user_metadata.businessId from invite
 *   2) Supabase users / staff rows
 *   3) Firestore users + staff (legacy enrichment only)
 * Do not clear a valid invite businessId just because Firestore is missing —
 * that caused "ask owner to re-invite" after password reset.
 */
async function resolveStaffBusinessId(
  firestore: ReturnType<typeof initializeFirebase>['firestore'] | null,
  userId: string,
  email: string | null | undefined,
  meta?: {
    businessId?: string | null;
    staffId?: string | null;
    role?: string | null;
    permissions?: Permissions | null;
    mustChangePassword?: boolean;
    fullName?: string | null;
  } | string | null
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
  // Support legacy call signature (metaBusinessId string) and new object form
  const metaObj =
    typeof meta === 'string' || meta == null
      ? { businessId: meta || null }
      : meta;

  let businessId: string | null = metaObj.businessId ? String(metaObj.businessId) : null;
  let businessName = 'Business';
  let currency = '₦';
  let role = metaObj.role ? String(metaObj.role) : 'Staff';
  let displayName: string | null = metaObj.fullName || null;
  let permissions: Permissions | null = metaObj.permissions
    ? { ...DEFAULT_PERMISSIONS, ...metaObj.permissions }
    : null;
  let mustChange = Boolean(metaObj.mustChangePassword);
  let staffId: string | null = metaObj.staffId ? String(metaObj.staffId) : null;

  // ── Supabase (primary) ───────────────────────────────────────────────
  try {
    const supabase = getSupabase();
    const { data: sbUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (sbUser) {
      const roleLc = String(sbUser.role || '').toLowerCase();
      if (roleLc !== 'removed') {
        if (!businessId && (sbUser.businessId || sbUser.business_id)) {
          businessId = String(sbUser.businessId || sbUser.business_id);
        }
        if (sbUser.role) role = String(sbUser.role);
        displayName =
          displayName ||
          sbUser.displayName ||
          sbUser.display_name ||
          sbUser.fullName ||
          sbUser.full_name ||
          sbUser.name ||
          null;
        if (sbUser.permissions && typeof sbUser.permissions === 'object') {
          permissions = { ...DEFAULT_PERMISSIONS, ...(sbUser.permissions as object) };
        }
        if (sbUser.mustChangePassword === true || sbUser.must_change_password === true) {
          mustChange = true;
        }
        if (sbUser.staffId || sbUser.staff_id) {
          staffId = String(sbUser.staffId || sbUser.staff_id);
        }
      } else {
        businessId = null;
      }
    }

    let staffRow: any = null;
    const byUser = await supabase.from('staff').select('*').eq('user_id', userId).limit(5);
    if (byUser.data?.length) {
      staffRow =
        byUser.data.find((r: any) => String(r.status || 'active').toLowerCase() !== 'removed') ||
        byUser.data[0];
    }
    if (!staffRow && email) {
      const byEmail = await supabase
        .from('staff')
        .select('*')
        .ilike('email', email)
        .limit(5);
      if (byEmail.data?.length) {
        staffRow =
          byEmail.data.find((r: any) => String(r.status || 'active').toLowerCase() !== 'removed') ||
          byEmail.data[0];
      }
    }
    if (staffRow) {
      const st = String(staffRow.status || 'active').toLowerCase();
      if (st === 'removed') {
        businessId = null;
      } else {
        const rowBiz = staffRow.business_id || staffRow.businessId;
        if (rowBiz) businessId = String(rowBiz);
        if (staffRow.role) role = String(staffRow.role);
        if (staffRow.name) displayName = String(staffRow.name);
        if (staffRow.permissions && typeof staffRow.permissions === 'object') {
          permissions = { ...DEFAULT_PERMISSIONS, ...staffRow.permissions };
        }
        if (staffRow.staff_id || staffRow.staffId || staffRow.id) {
          staffId = String(staffRow.staff_id || staffRow.staffId || staffRow.id);
        }
      }
    }

    if (businessId) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      if (biz) {
        businessName =
          biz.businessName || biz.business_name || biz.name || businessName;
        currency =
          biz.currency || biz.businessCurrency || biz.default_currency || currency;
      }
    }
  } catch (e) {
    console.warn('[staff/home] Supabase resolve failed', e);
  }

  // ── Firestore enrichment only (never revoke invite/metadata businessId) ─
  if (firestore) {
    try {
      const userSnap = await getDoc(doc(firestore, 'users', userId));
      if (userSnap.exists()) {
        const data = userSnap.data() || {};
        const roleLc = String(data.role || '').toLowerCase();
        if (roleLc !== 'removed') {
          if (!businessId && data.businessId) businessId = String(data.businessId);
          if (data.role) role = String(data.role);
          displayName =
            displayName || data.displayName || data.fullName || data.name || null;
          if (data.permissions && typeof data.permissions === 'object') {
            permissions = { ...DEFAULT_PERMISSIONS, ...data.permissions };
          }
          if (data.mustChangePassword === true) mustChange = true;
          if (data.staffId) staffId = String(data.staffId);
        }
      }
    } catch (e) {
      console.warn('[staff/home] Firestore users lookup failed', e);
    }

    if (businessId) {
      try {
        const staffSnap = await getDoc(
          doc(firestore, 'businesses', businessId, 'staff', userId)
        );
        if (staffSnap.exists()) {
          const sd = staffSnap.data() || {};
          const status = String(sd.status || 'active').toLowerCase();
          if (status === 'removed' && !metaObj.businessId) {
            // Explicit removal and no invite metadata — clear
            businessId = null;
          } else if (status !== 'removed') {
            if (sd.role) role = String(sd.role);
            if (sd.name) displayName = String(sd.name);
            if (sd.permissions && typeof sd.permissions === 'object') {
              permissions = { ...DEFAULT_PERMISSIONS, ...sd.permissions };
            }
            if (sd.mustChangePassword === true) mustChange = true;
            if (sd.staffId) staffId = String(sd.staffId);
            if (sd.businessId) businessId = String(sd.businessId);
          }
        }
        // Missing Firestore staff doc: keep businessId from metadata/Supabase
      } catch (e) {
        console.warn('[staff/home] Firestore staff doc lookup failed', e);
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
          console.warn('[staff/home] Firestore business lookup failed', e);
        }
      }
    }
  }

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

        // Best-effort Firebase link for legacy Firestore reads (not required)
        await ensureFirebaseAuth().catch(() => false);
        let firestore = null as ReturnType<typeof initializeFirebase>['firestore'] | null;
        try {
          firestore = initializeFirebase().firestore;
        } catch {
          firestore = null;
        }

        const resolved = await resolveStaffBusinessId(
          firestore,
          user.id,
          user.email,
          {
            businessId: meta.businessId || null,
            staffId: meta.staffId || null,
            role: meta.role || null,
            mustChangePassword:
              meta.must_change_password === true ||
              meta.must_change_password === 'true',
            fullName: meta.full_name || meta.name || null,
          }
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

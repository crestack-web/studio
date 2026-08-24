'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { StaffDashboard } from './StaffDashboard';
import type { StaffUser, Permissions } from './types';
import { getSupabase } from '@/lib/supabase';
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

export default function StaffHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const supabase = getSupabase();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[staff/home] session error', sessionError);
        }

        let user = sessionData.session?.user;

        // Session can lag right after login redirect — retry once
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
        let displayName =
          String(meta.full_name || meta.name || user.email?.split('@')[0] || 'Staff Member').trim();
        let perms: Permissions = { ...DEFAULT_PERMISSIONS };
        let hasStaffProfile = Boolean(meta.staffId || meta.businessId);
        let mustChange =
          meta.must_change_password === true || meta.must_change_password === 'true';

        try {
          const { firestore } = initializeFirebase();
          if (firestore) {
            const userSnap = await getDoc(doc(firestore, 'users', user.id));
            if (userSnap.exists()) {
              const data = userSnap.data() || {};
              if (data.role) role = String(data.role);
              displayName =
                data.displayName ||
                data.fullName ||
                data.name ||
                displayName;
              if (data.permissions && typeof data.permissions === 'object') {
                perms = { ...DEFAULT_PERMISSIONS, ...data.permissions };
              }
              if (data.staffId || data.businessId) hasStaffProfile = true;
              if (data.mustChangePassword === true) mustChange = true;

              const businessId = data.businessId || meta.businessId;
              if (businessId) {
                try {
                  const staffSnap = await getDoc(
                    doc(firestore, 'businesses', String(businessId), 'staff', user.id)
                  );
                  if (staffSnap.exists()) {
                    hasStaffProfile = true;
                    const sd = staffSnap.data() || {};
                    if (sd.role) role = String(sd.role);
                    if (sd.name) displayName = String(sd.name);
                    if (sd.permissions && typeof sd.permissions === 'object') {
                      perms = { ...DEFAULT_PERMISSIONS, ...sd.permissions };
                    }
                    if (sd.mustChangePassword === true) mustChange = true;
                  }
                } catch (staffErr) {
                  console.warn('[staff/home] staff doc lookup failed', staffErr);
                }
              }
            }
          }
        } catch (fsErr) {
          console.warn('[staff/home] Firestore enrich failed — using auth metadata', fsErr);
        }

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

        const firstName = displayName.split(/\s+/)[0] || 'Staff';
        if (cancelled) return;

        setStaffUser({
          id: user.id,
          initials: initialsFromName(displayName),
          name: displayName,
          firstName,
          role: role || 'Staff',
        });
        setPermissions(perms);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
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

  if (!staffUser || !permissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 mb-4">Session expired or incomplete. Please sign in again.</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold"
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
    <StaffDashboard
      staff={staffUser}
      permissions={permissions}
      onLogout={async () => {
        try {
          const supabase = getSupabase();
          await supabase.auth.signOut();
        } catch { /* ignore */ }
        window.location.href = '/login/staff';
      }}
    />
  );
}

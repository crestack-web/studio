'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StaffDashboard } from './StaffDashboard';
import type { StaffUser, Permissions } from './types';
import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import './busmo.css';

export default function StaffHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login/staff');
        return;
      }

      const user = session.user;
      const role = (user.user_metadata?.role as string) || 'Staff';

      if (['Owner', 'Admin'].includes(role)) {
        router.push('/login');
        return;
      }

      // Try Firestore for extra staff data (permissions, etc.)
      let permissionsLoaded = false;
      try {
        const { firestore } = initializeFirebase();
        const { doc, getDoc } = require('firebase/firestore');
        getDoc(doc(firestore, 'users', user.id)).then((userDoc: any) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setStaffUser({
              id: user.id,
              initials: data.initials || user.user_metadata?.full_name?.substring(0, 2) || 'ST',
              name: data.displayName || user.user_metadata?.full_name || 'Staff Member',
              firstName: data.firstName || user.user_metadata?.full_name?.split(' ')[0] || 'Staff',
              role: data.role || role,
            });
            setPermissions(data.permissions || {
              sale: true, inv: false, hist: false, atd: false, msg: false, earn: false,
            });
            permissionsLoaded = true;
          }
        }).catch(() => {});
      } catch { /* Firebase not available */ }

      // Fallback: set staff user from Supabase metadata if Firestore didn't load in time
      setTimeout(() => {
        if (!permissionsLoaded) {
          setStaffUser({
            id: user.id,
            initials: user.user_metadata?.full_name?.substring(0, 2) || 'ST',
            name: user.user_metadata?.full_name || 'Staff Member',
            firstName: user.user_metadata?.full_name?.split(' ')[0] || 'Staff',
            role,
          });
          setPermissions({
            sale: true, inv: false, hist: false, atd: false, msg: false, earn: false,
          });
        }
      }, 1500);

      setIsLoading(false);
    }).catch(() => {
      router.push('/login/staff');
      setIsLoading(false);
    });
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (!staffUser || !permissions) {
    return null;
  }

  return (
    <StaffDashboard
      staff={staffUser}
      permissions={permissions}
      onLogout={async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        router.push('/login/staff');
      }}
    />
  );
}

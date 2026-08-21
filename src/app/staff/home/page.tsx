'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StaffDashboard } from './StaffDashboard';
import type { StaffUser, Permissions } from './types';
import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './busmo.css';

export default function StaffHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    const { firestore } = initializeFirebase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login/staff');
        return;
      }

      const user = session.user;

      getDoc(doc(firestore, 'users', user.id)).then((userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (['Owner', 'Admin'].includes(data.role)) {
            router.push('/login');
            return;
          }

          setStaffUser({
            id: user.id,
            initials: data.initials || user.user_metadata?.full_name?.substring(0, 2) || 'ST',
            name: data.displayName || user.user_metadata?.full_name || 'Staff Member',
            firstName: data.firstName || user.user_metadata?.full_name?.split(' ')[0] || 'Staff',
            role: data.role || 'Staff',
          });

          setPermissions(data.permissions || {
            sale: true,
            inv: false,
            hist: false,
            atd: false,
            msg: false,
            earn: false,
          });
        } else {
          router.push('/login/staff');
        }
      }).catch((error) => {
        console.error('Error fetching staff data:', error);
        router.push('/login/staff');
      }).finally(() => {
        setIsLoading(false);
      });
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

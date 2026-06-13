'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StaffDashboard } from './StaffDashboard';
import type { StaffUser, Permissions } from './types';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './busmo.css';

export default function StaffHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login/staff');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.role !== 'Staff') {
            router.push('/login');
            return;
          }

          setStaffUser({
            id: user.uid,
            initials: data.initials || user.displayName?.substring(0, 2) || 'ST',
            name: data.displayName || user.displayName || 'Staff Member',
            firstName: data.firstName || user.displayName?.split(' ')[0] || 'Staff',
            role: data.role || 'Staff',
          });

          // Get permissions from Firestore
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
      } catch (error) {
        console.error('Error fetching staff data:', error);
        router.push('/login/staff');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
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
        const { auth } = initializeFirebase();
        await auth.signOut();
        router.push('/login/staff');
      }}
    />
  );
}

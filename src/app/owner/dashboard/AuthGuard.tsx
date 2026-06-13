'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Owner' | 'Staff';
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole = 'Owner' }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not authenticated - redirect to login
        router.replace('/login');
        return;
      }

      try {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        
        if (!userDoc.exists()) {
          // User document doesn't exist - redirect to login
          console.error('User document not found');
          router.replace('/login');
          return;
        }

        const userData = userDoc.data();
        const role = userData?.role || 'Owner';
        setUserRole(role);

        // Check if user has the required role
        if (requiredRole === 'Owner' && role !== 'Owner') {
          // Staff trying to access owner area
          router.replace('/staff/home');
          return;
        }

        if (requiredRole === 'Staff' && role !== 'Staff') {
          // Owner trying to access staff area
          router.replace('/owner/dashboard');
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth guard error:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, requiredRole]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0]">
        <div className="text-center">
          <BusmoLogoLoadingSpinner size={120} />
          <h2 className="text-xl font-semibold text-[#0A0A0F] mb-2 mt-4">Loading Dashboard</h2>
          <p className="text-[#555568]">Please wait while we secure your session...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

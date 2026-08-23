'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
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
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const user = session.user;
      // Read role from Supabase user_metadata (not Firestore)
      const role = (user.user_metadata?.role as string) || 'Owner';
      setUserRole(role);

      if (requiredRole === 'Owner' && ['Staff', 'Cashier', 'Manager', 'Store manager', 'Seller'].includes(role)) {
        router.replace('/staff/home');
        return;
      }

      if (requiredRole === 'Staff' && ['Owner', 'Admin'].includes(role)) {
        router.replace('/owner/dashboard');
        return;
      }

      setIsAuthorized(true);
    }).catch(() => {
      router.replace('/login');
    }).finally(() => {
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0]">
        <BusmoLogoLoadingSpinner size={200} />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

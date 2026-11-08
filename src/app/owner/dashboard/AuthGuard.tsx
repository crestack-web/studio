'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'Owner' | 'Staff';
}

/**
 * Owner dashboard guard.
 * Industry product edition is resolved from the organization via /api/industries/session
 * (not user_metadata alone). Industry users are sent to their product dashboard.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requiredRole = 'Owner' }) => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session?.user) {
          router.replace('/login');
          return;
        }

        const user = session.user;
        const role = (user.user_metadata?.role as string) || 'Owner';

        if (
          requiredRole === 'Owner' &&
          ['Staff', 'Cashier', 'Manager', 'Store manager', 'Seller'].includes(role)
        ) {
          router.replace('/staff/home');
          return;
        }

        if (requiredRole === 'Staff' && ['Owner', 'Admin'].includes(role)) {
          router.replace('/owner/dashboard');
          return;
        }

        if (requiredRole === 'Owner') {
          try {
            const res = await fetch('/api/industries/session', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const json = await res.json();
              const edition = json.session?.productEdition as string | undefined;
              if (edition === 'hospitality') {
                router.replace('/industries/hospitality/dashboard');
                return;
              }
              if (edition === 'professional') {
                router.replace('/industries/professional/dashboard');
                return;
              }
            }
          } catch {
            /* fall through to SME dashboard if session API unavailable */
          }
        }

        setIsAuthorized(true);
      })
      .catch(() => {
        router.replace('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

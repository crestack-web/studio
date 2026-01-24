'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    role?: string;
    businessId?: string;
}

interface Business {
    onboardingCompleted?: boolean;
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return doc(firestore, 'businesses', businessId);
  }, [firestore, businessId]);
  const { data: business, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'redirecting'>('loading');
  
  useEffect(() => {
    const isLoading = isUserLoading || isProfileLoading || (user && !userProfile) || (userProfile?.role === 'Owner' && businessId && isBusinessLoading);

    if (isLoading) {
      setAuthStatus('loading');
      return;
    }

    if (!user) {
      router.replace('/login');
      setAuthStatus('redirecting');
      return;
    }
    
    // Redirect if user is not Owner or Staff
    if (userProfile?.role !== 'Owner' && userProfile?.role !== 'Staff') {
        router.replace('/login');
        setAuthStatus('redirecting');
        return;
    }

    // Specific checks for Owner role
    if (userProfile.role === 'Owner') {
        // If owner has no business or onboarding is not marked as complete, redirect to start of onboarding.
        if (!businessId || !business?.onboardingCompleted) {
            router.replace('/business-info');
            setAuthStatus('redirecting');
            return;
        }
    }
    
    // If all checks pass, user is authorized.
    setAuthStatus('authorized');
    
  }, [user, userProfile, business, isUserLoading, isProfileLoading, isBusinessLoading, businessId, router]);

  if (authStatus !== 'authorized') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

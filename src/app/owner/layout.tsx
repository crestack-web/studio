'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    role?: string;
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
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  
  useEffect(() => {
    // Wait until all authentication and profile data is fully loaded.
    if (isUserLoading || isProfileLoading) {
      setAuthStatus('loading');
      return;
    }

    if (!user) {
      // If there's no user, they are unauthorized.
      setAuthStatus('unauthorized');
      router.replace('/login');
    } else if (userProfile?.role === 'Owner' || userProfile?.role === 'Staff') {
      // If the user has the correct role, they are authorized.
      setAuthStatus('authorized');
    } else {
      // If the user is logged in but does not have the correct role, they are unauthorized.
      setAuthStatus('unauthorized');
      router.replace('/market'); // Redirect non-owners/staff to a safe page.
    }
    
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  // While loading or redirecting, show a full-screen loader.
  if (authStatus !== 'authorized') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If authorized, render the protected owner/staff content.
  return <>{children}</>;
}

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
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authCheckCompleted, setAuthCheckCompleted] = useState(false);
  
  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Still loading, do nothing
    }

    if (user && (userProfile?.role === 'Owner' || userProfile?.role === 'Staff')) {
      setIsAuthorized(true);
    } else if (user) {
        // User is logged in but not an owner/staff, redirect to a safe page
        router.replace('/market');
    }
    else {
      // User is not logged in
      router.replace('/login');
    }
    setAuthCheckCompleted(true);
    
  }, [user, userProfile, isUserLoading, isProfileLoading, router]);

  if (!authCheckCompleted || !isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If authorized, render the children.
  return <>{children}</>;
}

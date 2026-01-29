'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { redirect, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AppUser {
  displayName?: string;
  businessId?: string;
  role?: string;
}

interface Business {
  businessName?: string;
  businessType?: string;
  plan?: string;
}

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [profileLoadTimedOut, setProfileLoadTimedOut] = useState(false);

  // 1. Get user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  // 2. Get business data
  const businessId = userProfile?.businessId;
  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

  // 3. Set a timeout for profile loading to handle replication lag.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // If we've finished the initial auth check, are logged in,
    // and the profile is still not found, start a timer.
    if (!isUserLoading && authUser && !userProfile) {
      timer = setTimeout(() => {
        // If after 5 seconds the profile is STILL not there, we assume an error.
        if (!userProfile) {
          setProfileLoadTimedOut(true);
        }
      }, 5000); // 5-second timeout
    }
    return () => clearTimeout(timer);
  }, [isUserLoading, authUser, userProfile]);

  // --- Start checks ---
  
  // Show loader during initial auth check
  if (isUserLoading) {
    return <LoadingScreen />;
  }

  // User is not logged in, redirect.
  if (!authUser) {
    if (!pathname.startsWith('/login')) {
      redirect('/login');
    }
    return <LoadingScreen />;
  }

  // User is logged in, but profile is still loading OR hasn't appeared yet (and we haven't timed out).
  // This gracefully handles replication lag by continuing to show the loader.
  if (isProfileLoading || (!userProfile && !profileLoadTimedOut)) {
    return <LoadingScreen />;
  }

  // At this point, the profile should have loaded, OR the timeout has been reached.
  if (!userProfile) {
    // This block now only runs after the 5-second timeout has failed.
    console.error("User profile not found after timeout. Redirecting to login.");
    if (!pathname.startsWith('/login')) {
      redirect('/login');
    }
    return <LoadingScreen />;
  }
  
  // We have a user profile, now check roles.
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) return redirect('/staff/home');
    if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) return redirect('/admin/dashboard');
    
    if (!pathname.startsWith('/login')) redirect('/login');
    return <LoadingScreen />;
  }

  // Now we know user is an Owner. Check onboarding steps.
  // We need businessData for these checks. If it's still loading, show spinner.
  if (isBusinessLoading) {
      return <LoadingScreen />;
  }

  if (!businessId || !businessData) {
      console.error("Owner profile is missing a businessId or business data. This is an invalid state.");
      if (!pathname.startsWith('/login')) redirect('/login');
      return <LoadingScreen />;
  }
  
  const isBusinessInfoIncomplete = !businessData?.businessName || !businessData?.businessType;
  if (isBusinessInfoIncomplete) {
    if (pathname !== '/business-info') {
      redirect('/business-info');
    }
    return <>{children}</>;
  }
  
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') {
      redirect('/owner/pricing');
    }
    return <>{children}</>;
  }
  
  // All good, user is fully onboarded.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}

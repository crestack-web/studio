'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { redirect, usePathname } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // 1. Get user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  // 2. Get business data if businessId exists
  const businessId = userProfile?.businessId;
  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

  // --- Start checks ---
  
  // Show a loading screen while auth or initial profile fetch is in progress.
  if (isUserLoading || (authUser && isProfileLoading)) {
    return <LoadingScreen />;
  }

  // 1. Not authenticated: User must log in.
  if (!authUser) {
    if (!pathname.startsWith('/login')) {
      redirect('/login');
    }
    return <LoadingScreen />; // Show loader during redirect
  }
  
  // From here, we know the user is authenticated.

  // 2. Self-Healing: Authenticated, but no profile found. Create it.
  if (!userProfile && !isProfileLoading) {
    // This can happen if the signup process was interrupted after auth creation
    // but before Firestore documents were written.
    console.warn("User profile document not found. Attempting to create recovery documents.");

    const createRecoveryDocs = async () => {
        if (!firestore || !authUser) return;
        
        try {
            const userDocRef = doc(firestore, 'users', authUser.uid);
            
            // Double-check it doesn't exist before writing to avoid race conditions.
            const userDocSnap = await import('firebase/firestore').then(m => m.getDoc(userDocRef));
            if (userDocSnap.exists()) {
                // This means the useDoc hook just needed another render cycle.
                // The component will re-render and this block won't be hit again.
                return;
            }

            const batch = writeBatch(firestore);

            const businessDocRef = doc(collection(firestore, 'businesses'));
            const businessData = {
                id: businessDocRef.id,
                ownerId: authUser.uid,
                businessName: `${authUser.email?.split('@')[0] || 'My'}'s Business`,
                createdAt: serverTimestamp()
            };
            batch.set(businessDocRef, businessData);

            const userData = {
                id: authUser.uid,
                displayName: authUser.displayName || authUser.email?.split('@')[0] || 'New User',
                email: authUser.email,
                phoneNumber: authUser.phoneNumber || '',
                role: 'Owner',
                businessId: businessDocRef.id
            };
            batch.set(userDocRef, userData);
            
            await batch.commit();
            toast({ title: "Account Finalized", description: "Please complete your business setup." });
            // The `useDoc` hook will automatically pick up the new document on the next render.
        } catch (err: any) {
            console.error("Critical error during account recovery:", err);
            toast({
                variant: 'destructive',
                title: "Account Setup Failed",
                description: `We couldn't set up your account profile. Please contact support. Error: ${err.message}`,
                duration: 10000,
            });
            // If recovery fails, log out and redirect to login to prevent loops.
            const auth = await import('firebase/auth').then(m => m.getAuth());
            await import('firebase/auth').then(m => m.signOut(auth));
            redirect('/login');
        }
    };
    
    // Trigger the recovery and show a loading screen while it runs.
    createRecoveryDocs();
    return <LoadingScreen />;
  }

  // 3. User has a profile, check their role.
  if (userProfile && userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) return redirect('/staff/home');
    if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) return redirect('/admin/dashboard');
    
    if (!pathname.startsWith('/login')) redirect('/login');
    return <LoadingScreen />;
  }
  
  // --- From here, we know the user is an Owner and has a profile ---

  // Show loading screen while business data is being fetched.
  if (isBusinessLoading) {
    return <LoadingScreen />;
  }

  // Onboarding Step 1: Business Info check.
  const isBusinessInfoIncomplete = !businessId || !businessData || !businessData.businessName || !businessData.businessType;
  if (isBusinessInfoIncomplete) {
    if (pathname !== '/business-info') {
      redirect('/business-info');
    }
    return <>{children}</>;
  }
  
  // Onboarding Step 2: Pricing Plan check.
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') {
      redirect('/owner/pricing');
    }
    return <>{children}</>;
  }
  
  // All checks passed. User is a fully onboarded owner.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}

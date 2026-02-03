
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

interface AppUser {
  role?: string;
}

const ProtectedDeliveryLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const isLoading = isUserLoading || (user && isProfileLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
        if (!pathname.startsWith('/delivery-agent/login') && pathname !== '/delivery-agent/finish-signin') {
            router.replace('/delivery-agent/login');
        }
        return;
    }
    
    if (userProfile?.role !== 'Delivery Agent') {
      router.replace('/login');
    }

  }, [isLoading, user, userProfile, pathname, router]);

  // Allow access to login/finish-signin pages even while loading or if not an agent yet
  if (pathname.startsWith('/delivery-agent/login') || pathname === '/delivery-agent/finish-signin') {
      return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (user && userProfile?.role === 'Delivery Agent') {
    return <>{children}</>;
  }
  
  return <LoadingScreen />;
};

export default function DeliveryAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedDeliveryLayout>{children}</ProtectedDeliveryLayout>;
}

    

    
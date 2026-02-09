
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { EmailVerificationRequired } from '@/components/auth/email-verification-required';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

interface AppUser {
  role?: string;
}

interface DeliveryAgentDoc {
  status?: 'available' | 'on-delivery' | 'unavailable';
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

  const agentRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `deliveryAgents/${user.uid}`);
  }, [firestore, user]);
  const { data: agentDoc, isLoading: isLoadingAgentDoc } = useDoc<DeliveryAgentDoc>(agentRef);

  const isLoading = isUserLoading || (user && (isProfileLoading || isLoadingAgentDoc));

  const isAgent = !!agentDoc || userProfile?.role === 'Delivery Agent';

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
        if (!pathname.startsWith('/delivery-agent/login') && pathname !== '/delivery-agent/finish-signin') {
            router.replace('/delivery-agent/login');
        }
        return;
    }
    
    if (!isAgent) {
      router.replace('/login');
      return;
    }

  }, [isLoading, user, isAgent, pathname, router]);

  // Allow access to login/finish-signin pages even while loading or if not an agent yet
  if (pathname.startsWith('/delivery-agent/login') || pathname === '/delivery-agent/finish-signin') {
      return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user && !user.emailVerified) {
    return <EmailVerificationRequired dashboardLabel="Agent" />;
  }
  
  if (user && isAgent) {
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

    

    
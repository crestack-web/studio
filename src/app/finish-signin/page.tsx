
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';


export default function FinishSignInPage() {
  return (
    <FirebaseClientProvider>
      <FinishSignInPageContent />
    </FirebaseClientProvider>
  );
}

function FinishSignInPageContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = useState('Verifying your login link...');
    const [error, setError] = useState<string | null>(null);
    const auth = useAuth();
    const firestore = useFirestore();

    useEffect(() => {
        const finishSignIn = async () => {
            if (!auth || !firestore) return;

            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    setError("Could not find email for sign-in. Please try the link again from the same device and browser.");
                    return;
                }

                try {
                    const userCredential = await signInWithEmailLink(auth, email, window.location.href);
                    const user = userCredential.user;
                    
                    if (user && user.email) {
                        const invitationRef = doc(firestore, 'invitations', user.email);
                        const invitationSnap = await getDoc(invitationRef);

                        if (invitationSnap.exists() && invitationSnap.data().status === 'pending') {
                            const invitationData = invitationSnap.data();
                            const { businessId, businessName } = invitationData;
                            
                            const batch = writeBatch(firestore);
                            
                            const userRef = doc(firestore, 'users', user.uid);
                            batch.set(userRef, {
                                id: user.uid,
                                displayName: user.displayName || user.email.split('@')[0],
                                email: user.email,
                                role: 'Staff',
                                businessId: businessId,
                                branchId: invitationData.branchId || null,
                                createdAt: serverTimestamp()
                            }, { merge: true });

                            const businessInvitationRef = doc(firestore, `businesses/${businessId}/invitations`, user.email);
                            batch.delete(invitationRef);
                            batch.delete(businessInvitationRef);

                            await batch.commit();

                            toast({ title: `Welcome to ${businessName}!`, description: 'You have successfully joined the business.' });
                        }
                    }
                    
                    window.localStorage.removeItem('emailForSignIn');
                    toast({ title: "Sign-in successful!" });
                    router.replace('/staff/home');

                } catch (e: any) {
                    console.error(e);
                    setError("Failed to sign in. The link may be expired or invalid, or there was an issue joining the business.");
                    toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'The link may be expired or invalid.' });
                }
            } else {
                setError("This is not a valid sign-in link.");
            }
        };

        if (auth && firestore) {
            finishSignIn();
        }
    }, [auth, firestore, router, toast]);

    if (error) {
         return (
            <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 text-center p-4">
                <p className="text-destructive">{error}</p>
                <Button asChild variant="outline">
                    <Link href="/login/staff">Return to Login</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 text-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

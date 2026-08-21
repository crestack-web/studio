'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';


export default function FinishSignInPage() {
  return (
    <FinishSignInPageContent />
  );
}

function FinishSignInPageContent() {
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = useState('Verifying your login link...');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const finishSignIn = async () => {
            let supabase;
            try {
                supabase = getSupabase();
            } catch (e) {
                setError("Authentication is not configured. Please contact support.");
                return;
            }
            
            // Supabase handles email link sign-in via the URL hash
            // The session is automatically set when the user clicks the link
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                setError("Could not verify your login link. Please try the link again from the same device and browser.");
                return;
            }

            const user = session.user;
            if (!user || !user.email) {
                setError("Could not find email for sign-in. Please try the link again from the same device and browser.");
                return;
            }

            try {
                const { firestore } = initializeFirebase();
                const invitationRef = doc(firestore, 'invitations', user.email);
                const invitationSnap = await getDoc(invitationRef);

                if (invitationSnap.exists() && invitationSnap.data().status === 'pending') {
                    const invitationData = invitationSnap.data();
                    const { businessId, businessName } = invitationData;
                    
                    const batch = writeBatch(firestore);
                    
                    const userRef = doc(firestore, 'users', user.id);
                    batch.set(userRef, {
                        id: user.id,
                        displayName: user.user_metadata?.full_name || user.email.split('@')[0],
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
                
                window.localStorage.removeItem('emailForSignIn');
                toast({ title: "Sign-in successful!" });
                router.replace('/staff/home');

            } catch (e: any) {
                console.error(e);
                setError("Failed to sign in. The link may be expired or invalid, or there was an issue joining the business.");
                toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'The link may be expired or invalid.' });
            }
        };

        finishSignIn();
    }, [router, toast]);

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

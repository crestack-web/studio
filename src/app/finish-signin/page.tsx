'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

export default function FinishSignInPage() {
    const router = useRouter();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [message, setMessage] = useState('Verifying your login link...');

    useEffect(() => {
        const completeSignIn = async () => {
            if (!auth || !firestore || !window.location.href) return;

            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    // This can happen if the user opens the link on a different device.
                    // We can ask them for their email again.
                    email = window.prompt('Please provide your email for confirmation');
                }
                
                if (!email) {
                    setMessage('Could not complete sign-in. Email is missing.');
                    toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'Your email is required to complete the sign-in.'});
                    router.push('/login');
                    return;
                }

                try {
                    setMessage('Signing you in...');
                    const result = await signInWithEmailLink(auth, email, window.location.href);
                    window.localStorage.removeItem('emailForSignIn');

                    const userDocRef = doc(firestore, 'users', result.user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists() && userDocSnap.data().role === 'Staff') {
                        toast({ title: 'Login Successful', description: 'Welcome back!'});
                        router.replace('/staff/home');
                    } else {
                        // This case is unlikely if invites are handled correctly, but it's a good safeguard.
                        await auth.signOut();
                        toast({ variant: 'destructive', title: 'Authorization Failed', description: 'This account is not authorized for staff access.'});
                        router.replace('/login');
                    }
                } catch (error: any) {
                    setMessage(`Sign-in failed: ${error.message}`);
                    toast({ variant: 'destructive', title: 'Sign-in Failed', description: error.message });
                    router.push('/login');
                }
            } else {
                setMessage('This is not a valid sign-in link.');
                router.push('/login');
            }
        };

        completeSignIn();
    }, [auth, firestore, router, toast]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { isSignInWithEmailLink, signInWithEmailLink, updateProfile } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
                    email = window.prompt('To complete your sign-in, please provide your email address.');
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
                    const user = result.user;

                    const userDocRef = doc(firestore, 'users', user.uid);
                    let userDocSnap = await getDoc(userDocRef);
                    let userProfile;

                    // If the user profile doesn't exist, it's their first time logging in as staff.
                    if (!userDocSnap.exists()) {
                        const invitationRef = doc(firestore, 'invitations', email);
                        const invitationSnap = await getDoc(invitationRef);

                        if (invitationSnap.exists()) {
                            const invitationData = invitationSnap.data();
                            // Prompt for name on first login
                            const displayName = window.prompt("Welcome! Please enter your full name to create your profile.");
                            if (!displayName) {
                                throw new Error("Full name is required to create your profile.");
                            }

                            // Update Auth profile
                            await updateProfile(user, { displayName });
                            
                            // Create Firestore profile
                            userProfile = {
                                id: user.uid,
                                displayName: displayName,
                                email: user.email,
                                role: 'Staff',
                                businessId: invitationData.businessId,
                            };
                            await setDoc(userDocRef, userProfile);
                            
                            // Update invitation status
                            await updateDoc(invitationRef, { status: 'accepted' });
                        } else {
                             throw new Error("No pending invitation found for this email address.");
                        }
                    } else {
                        userProfile = userDocSnap.data();
                    }

                    if (userProfile && userProfile.role === 'Staff') {
                        toast({ title: 'Login Successful', description: 'Welcome back!'});
                        router.replace('/staff/home');
                    } else {
                        await auth.signOut();
                        toast({ variant: "destructive", title: "Authorization Failed", description: "This account is not authorized for staff access."});
                        router.replace('/login');
                    }
                } catch (error: any) {
                    setMessage(`Sign-in failed: ${error.message}`);
                    toast({ variant: 'destructive', title: 'Sign-in Failed', description: error.message });
                    if (auth.currentUser) await auth.signOut();
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

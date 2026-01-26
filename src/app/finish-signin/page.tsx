'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

export default function FinishSignInPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [message, setMessage] = useState('Verifying your login link...');
    const [error, setError] = useState<string | null>(null);
    const auth = useAuth();

    useEffect(() => {
        const finishSignIn = async () => {
            if (isSignInWithEmailLink(auth, window.location.href)) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    setError("Could not find email for sign-in. Please try the link again from the same device and browser.");
                    return;
                }

                try {
                    await signInWithEmailLink(auth, email, window.location.href);
                    window.localStorage.removeItem('emailForSignIn');
                    toast({ title: "Sign-in successful!" });
                    router.replace('/staff/home');
                } catch (e: any) {
                    console.error(e);
                    setError("Failed to sign in. The link may be expired or invalid.");
                    toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'The link may be expired or invalid.' });
                }
            } else {
                setError("This is not a valid sign-in link.");
            }
        };
        finishSignIn();
    }, [auth, router, toast]);

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

'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getFunctionUrl } from '@/lib/api';
import { useEffect } from 'react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('r');
    if (ref && ref.trim()) {
      window.localStorage.setItem('pendingReferralCode', ref.trim().toUpperCase());
    }
  }, []);

  const claimReferralIfPresent = async (user: any) => {
    if (typeof window === 'undefined') return;
    const code = window.localStorage.getItem('pendingReferralCode');
    if (!code) return;

    try {
      const token = await user.getIdToken();
      const resp = await fetch(getFunctionUrl('claimReferral'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (resp.ok) {
        window.localStorage.removeItem('pendingReferralCode');
      }
    } catch (error) {
      console.warn('Failed to claim referral (non-blocking):', error);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);

    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Weak Password",
            description: "Your password must be at least 6 characters long.",
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (user && firestore) {
            // Create user and business docs in a non-blocking batch
            const newBusinessRef = doc(collection(firestore, 'businesses'));
            const userDocRef = doc(firestore, 'users', user.uid);

            const batch = writeBatch(firestore);

            // Create business doc
            batch.set(newBusinessRef, {
                ownerId: user.uid,
                businessName: name, // Use user's full name as a placeholder
                createdAt: serverTimestamp(),
                onboardingCompleted: false,
            });

            // Create user doc and link to business
            batch.set(userDocRef, {
                id: user.uid,
                displayName: name,
                email: user.email,
                phoneNumber: phoneNumber,
                role: 'Owner',
                businessId: newBusinessRef.id,
                createdAt: serverTimestamp(),
            }, { merge: true });

            // Commit in the background without blocking navigation
            batch.commit().catch(error => {
                console.error("Error creating user/business documents:", error);
            });
        }

        // Non-blocking: claim referral after account creation if present.
        if (user) {
          claimReferralIfPresent(user);
        }

        toast({ title: "Account Created!", description: "Let's set up your business." });
        router.push('/business-info');

    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already in use. Please log in or use a different email.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'Please enter a valid email address.';
        }
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !name || !email || !password || !phoneNumber;

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create your Account</CardTitle>
          <CardDescription>Sign up to start your business.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="e.g., Tunde Oladipo" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+234 800 000 0000" className="h-12 text-base" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Must be at least 6 characters" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>
          <Button className="w-full h-14 text-lg" onClick={handleSignUp} disabled={isButtonDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Owner Account
          </Button>
           <p className="text-sm text-center text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link href="/login/form" className="underline font-medium text-primary">
                  Log In
              </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

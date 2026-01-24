
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
    role?: 'Owner' | 'Staff';
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
        if (!auth || !firestore) {
            throw new Error("Firebase services not available");
        }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      toast({
          title: "Login Successful",
          description: "Redirecting...",
      });

      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
          router.push(redirectUrl);
          return;
      }

      // Check the user's role and redirect
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        if (userProfile.role === 'Owner') {
            router.push('/owner/home');
        } else if (userProfile.role === 'Staff') {
            router.push('/staff/home');
        } else {
            // Fallback for users with no role or other roles
            router.push('/owner/home');
        }
      } else {
        // This case should ideally not happen if profiles are created on signup.
        // Defaulting to owner dashboard.
        router.push('/owner/home');
      }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Log In</CardTitle>
          <CardDescription>Enter your email and password to log in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || !email || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
            </Button>
            <p className="text-sm text-center text-muted-foreground pt-2">
                Don't have an account?{' '}
                <Link href="/signup" className="underline font-medium text-primary">
                    Sign Up
                </Link>
            </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

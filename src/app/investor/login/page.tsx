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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
    role?: 'Owner' | 'Staff' | 'Admin' | 'Investor';
}

export default function InvestorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleLogin = async () => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Services not ready. Please try again." });
        setIsLoading(false);
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists() && userDocSnap.data().role === 'Investor') {
        toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });
        router.replace('/investor/dashboard');
      } else {
        await auth.signOut();
        toast({
            variant: "destructive",
            title: "Authorization Failed",
            description: "This account is not authorized for investor access.",
        });
      }

    } catch (error: any) {
        let title = 'Login Failed';
        let description = 'An unexpected error occurred. Please try again.';

        if (error.code) {
            switch(error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    title = 'Invalid Credentials';
                    description = 'The email or password you entered is incorrect. Please check your credentials and try again.';
                    break;
                case 'auth/invalid-email':
                    title = 'Invalid Email';
                    description = 'The email address you entered is not valid. Please check and try again.';
                    break;
                case 'auth/network-request-failed':
                    title = 'Network Error';
                    description = 'Could not connect to our services. Please check your internet connection and try again.';
                    break;
                default:
                    description = error.message || 'Please check your credentials and try again.';
            }
        }
        
        toast({
            variant: "destructive",
            title: title,
            description: description,
        });
        if (auth.currentUser) {
            await auth.signOut();
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Investor Log In</CardTitle>
          <CardDescription>Enter your credentials to access your portfolio.</CardDescription>
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
                Don't have an investor account?{' '}
                <Link href="/investor/signup" className="underline font-medium text-primary">
                    Sign Up
                </Link>
            </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

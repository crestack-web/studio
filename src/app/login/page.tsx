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
    role?: 'Owner' | 'Staff' | 'Admin' | 'Investor' | 'Buyer';
}

// This is the primary login for BUSINESS users (Owners, Staff, Admins).
export default function LoginPage() {
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
      
      toast({ title: "Login Successful", description: "Redirecting to your dashboard..." });

      // Fetch user profile to determine role
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        // Role-based redirection logic
        switch(userProfile.role) {
            case 'Admin':
                router.push('/admin/dashboard');
                break;
            case 'Owner':
                router.push('/owner/home');
                break;
            case 'Staff':
                router.push('/staff/home');
                break;
            case 'Investor':
                router.push('/investor/dashboard');
                break;
            case 'Buyer': // Fallback for buyers using the wrong form
                router.push('/market');
                break;
            default: // Default to owner home if role is missing but profile exists
                router.push('/owner/home');
                break;
        }
      } else {
        // This case would happen for a brand new user who somehow didn't get a profile doc.
        // Sending them to onboarding is a safe default.
        router.push('/business-info');
      }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "Please check your credentials and try again.",
        });
        setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Business Log In</CardTitle>
          <CardDescription>Log in to manage your business.</CardDescription>
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

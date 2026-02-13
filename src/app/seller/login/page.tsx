'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

import OnboardingLayout from '@/components/app/onboarding-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SellerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Redirecting to Seller Central...' });

      const params = new URLSearchParams(window.location.search);
      const continueParam = params.get('continue');
      const safeContinue = continueParam && continueParam.startsWith('/') ? continueParam : null;
      router.replace(safeContinue || '/seller/dashboard');
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/invalid-email') {
        description = 'Please enter a valid email address.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        description = 'Invalid email or password. Please try again.';
      }

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Seller Log In</CardTitle>
          <CardDescription>Access your Seller Central dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-12 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-12 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex justify-end">
              <Link href="/reset-password" className="text-sm underline text-muted-foreground">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || !email || !password}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>

          <p className="text-sm text-center text-muted-foreground pt-2">
            New seller?{' '}
            <Link href="/sell" className="underline font-medium text-primary">
              See how it works
            </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

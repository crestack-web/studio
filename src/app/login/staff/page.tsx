'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getFunctionUrl } from '@/lib/api';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    if (!isReady) {
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Page is still loading. Please try again in a moment.',
      });
      setIsLoading(false);
      return;
    }
    try {
      window.localStorage.setItem('emailForSignIn', email);

      const res = await fetch(getFunctionUrl('sendStaffSignInLink'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !result?.success) {
        const msg = result?.error || result?.message || 'Could not send login link. Please try again.';
        throw new Error(String(msg));
      }

      setIsEmailSent(true);
      toast({
          title: "Check your email",
          description: `A sign-in link has been sent to ${email}.`,
      });
    } catch(error: any) {
      console.error("Failed to send sign-in link:", error);
      const description = String(error?.message || error || 'Could not send login link. Please check the email and try again.');
      toast({
          variant: "destructive",
          title: "Login Failed",
          description: description,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Staff Log In</CardTitle>
          <CardDescription>
            {isEmailSent 
                ? "A login link has been sent to your email address." 
                : "Enter your email to receive a secure login link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEmailSent ? (
             <div className="text-center text-muted-foreground">
                <p>Click the link in the email to complete your sign-in. You can close this tab.</p>
             </div>
          ) : (
            <>
                <div className="space-y-2">
                    <Label htmlFor="email">Work Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                </div>
                <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || !email}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Login Link
                </Button>
            </>
          )}
          <p className="text-sm text-center text-muted-foreground pt-2">
              Not a staff member?{' '}
              <Link href="/login/form" className="underline font-medium text-primary">
                  Log in as a business owner
              </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();

  const actionCodeSettings = {
    url: `${window.location.origin}/finish-signin`, // URL to redirect to after email verification
    handleCodeInApp: true,
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      window.localStorage.setItem('emailForSignIn', email);
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      setIsEmailSent(true);
      toast({
          title: "Check your email",
          description: `A sign-in link has been sent to ${email}.`,
      });
    } catch(error: any) {
      let description = "Could not send login link. Please check the email and try again.";
      if (error.code === 'auth/invalid-email') {
          description = 'Please enter a valid email address.';
      }
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

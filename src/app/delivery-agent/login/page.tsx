
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
import { getFunctionUrl } from '@/lib/api';

export default function DeliveryAgentLoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getFunctionUrl('sendOtpLogin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'Agent' }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to send OTP');
      setStep('otp');
      toast({ title: 'OTP Sent', description: 'Check your email for the one-time code.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getFunctionUrl('verifyOtpLogin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Invalid OTP');
      toast({ title: 'Login Successful', description: 'You are now logged in.' });
      // TODO: Redirect to agent dashboard or set session
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'OTP verification failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Delivery Agent Log In</CardTitle>
          <CardDescription>Sign in with a one-time code sent to your email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'email' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Your Email Address</Label>
                <Input id="email" type="email" placeholder="agent@example.com" className="h-12 text-base" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <Button className="w-full h-14 text-lg" onClick={handleSendOtp} disabled={isLoading || !email}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send OTP
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" type="text" placeholder="6-digit code" className="h-12 text-base" value={otp} onChange={e => setOtp(e.target.value)} disabled={isLoading} />
              </div>
              <Button className="w-full h-14 text-lg" onClick={handleVerifyOtp} disabled={isLoading || !otp}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Verify OTP
              </Button>
            </>
          )}
          <p className="text-sm text-center text-muted-foreground pt-2">
            Not an agent?{' '}
            <Link href="/login" className="underline font-medium text-primary">
              Log in as a business owner or staff
            </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

    

    
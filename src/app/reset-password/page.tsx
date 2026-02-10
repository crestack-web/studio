'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getFunctionUrl } from '@/lib/api';

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getFunctionUrl('sendPasswordReset'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !result?.success) {
        const msg = result?.error || result?.message || 'Could not send password reset email.';
        toast({ title: 'Request failed', description: String(msg), variant: 'destructive' });
        return;
      }

      toast({
        title: 'Check your email',
        description: `If an account exists for ${email}, a reset link has been sent.`,
      });
    } catch (err: any) {
      toast({
        title: 'Request failed',
        description: String(err?.message || err || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
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

          <Button className="w-full h-14 text-lg" onClick={handleSend} disabled={isLoading || !email}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>

          <p className="text-sm text-center text-muted-foreground pt-2">
            <Link href="/login/form" className="underline font-medium text-primary">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}

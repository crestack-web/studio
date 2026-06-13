'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { getFunctionUrl } from '@/lib/api';

export function EmailVerificationRequired({
  dashboardLabel,
}: {
  dashboardLabel: string;
}) {
  const { toast } = useToast();
  const { user } = useUser();

  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const hasAutoCheckedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (hasAutoCheckedRef.current) return;
    hasAutoCheckedRef.current = true;

    const run = async () => {
      setIsChecking(true);
      try {
        await user.reload();
        await user.getIdToken(true);

        if (user.emailVerified) {
          window.location.reload();
        }
      } finally {
        setIsChecking(false);
      }
    };

    run();
  }, [user]);

  const handleSend = async () => {
    if (!user) return;

    setIsSending(true);
    try {
      const token = await user.getIdToken();
      const continueUrl = `${window.location.pathname}${window.location.search}`;
      const res = await fetch(getFunctionUrl('sendEmailVerification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ continueUrl }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !result?.success) {
        const msg = result?.error || result?.message || 'Could not send verification email.';
        toast({ title: 'Verification email failed', description: String(msg), variant: 'destructive' });
        return;
      }

      if (result?.alreadyVerified) {
        toast({ title: 'Already verified', description: 'Your email is already verified.' });
        return;
      }

      toast({
        title: 'Verification email sent',
        description: `Check ${user.email || 'your inbox'} for the verification link.`,
      });
    } catch (err: any) {
      toast({
        title: 'Verification email failed',
        description: String(err?.message || err || 'Unknown error'),
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    setIsRefreshing(true);
    try {
      await user.reload();
      await user.getIdToken(true);
      if (user.emailVerified) {
        window.location.reload();
      } else {
        toast({
          title: 'Not verified yet',
          description: 'Please open the verification link in your email, then try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Email verification required</CardTitle>
          <CardDescription>
            Verify your email to access the {dashboardLabel} dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>
              We’ll send a verification link to {user?.email || 'your email'}.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleSend} disabled={isSending || !user}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send verification email
          </Button>
          <Button variant="secondary" onClick={handleRefresh} disabled={isRefreshing || !user}>
            {(isRefreshing || isChecking) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I’ve verified
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

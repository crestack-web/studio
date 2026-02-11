'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function normalizeContinuePath(raw: string | null): string {
  if (!raw) return '/owner/home';

  // If Firebase ever hands us a full URL, only accept same-site relative paths.
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('/')) return decoded;

    const asUrl = new URL(decoded);
    const candidate = `${asUrl.pathname}${asUrl.search}${asUrl.hash}`;
    return candidate.startsWith('/') ? candidate : '/owner/home';
  } catch {
    return raw.startsWith('/') ? raw : '/owner/home';
  }
}

function pickLoginRoute(continuePath: string): string {
  if (continuePath.startsWith('/admin')) return '/admin/login';
  if (continuePath.startsWith('/investor')) return '/investor/login';
  if (continuePath.startsWith('/delivery-agent')) return '/delivery-agent/login';
  return `/login/form?continue=${encodeURIComponent(continuePath)}`;
}

export default function FinishEmailVerificationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const continuePath = useMemo(() => normalizeContinuePath(params.get('continue')), [params]);
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      // If we have an action code, complete verification directly (branded flow).
      if (oobCode && (!mode || mode === 'verifyEmail')) {
        try {
          await applyActionCode(auth, oobCode);

          if (auth.currentUser) {
            await auth.currentUser.reload();
            await auth.currentUser.getIdToken(true);
          }

          setStatus('success');
          return;
        } catch (err: any) {
          setErrorMessage(String(err?.message || err || 'Verification failed.'));
          setStatus('error');
          return;
        }
      }

      // Otherwise, attempt to confirm the signed-in user's verification status.
      if (isUserLoading) return;

      if (!user) {
        setErrorMessage('You may need to sign in to continue.');
        setStatus('error');
        return;
      }

      try {
        await user.reload();
        await user.getIdToken(true);
        if (user.emailVerified) {
          setStatus('success');
          return;
        }

        setErrorMessage('Email not verified yet. Please use the link from your email.');
        setStatus('error');
      } catch (err: any) {
        setErrorMessage(String(err?.message || err || 'Could not confirm verification status.'));
        setStatus('error');
      }
    };

    run();
  }, [auth, isUserLoading, mode, oobCode, user]);

  const handleContinue = () => {
    window.location.href = continuePath;
  };

  const handleLogin = () => {
    router.push(pickLoginRoute(continuePath));
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>
            {status === 'verifying'
              ? 'Finishing your email verification…'
              : status === 'success'
                ? 'Your email is verified.'
                : 'We couldn’t verify your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying…</span>
            </div>
          )}
          {status === 'success' && (
            <Alert>
              <AlertTitle>Verified</AlertTitle>
              <AlertDescription>Continue back to your dashboard.</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTitle>Verification issue</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handleContinue} disabled={status !== 'success'}>
            Continue
          </Button>
          <Button variant="secondary" onClick={handleLogin}>
            Sign in
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

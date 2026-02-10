'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';

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

export default function FinishEmailVerificationPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  const [continuePath, setContinuePath] = useState('/owner/home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromContinue = params.get('continue');
    setContinuePath(normalizeContinuePath(fromContinue));
  }, []);

  useEffect(() => {
    if (isUserLoading) return;

    const run = async () => {
      if (!user) {
        router.replace(`/login/form?continue=${encodeURIComponent(continuePath)}`);
        return;
      }

      try {
        await user.reload();
      } catch {
        // ignore
      }

      router.replace(continuePath);
    };

    run();
  }, [continuePath, isUserLoading, router, user]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 text-center p-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">Finishing email verification…</p>
    </div>
  );
}

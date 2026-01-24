'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and redirects to the main signup page.
export default function MarketSignUpPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/signup');
  }, [router]);
  return null;
}

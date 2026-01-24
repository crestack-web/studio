'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and redirects to the main login page.
export default function MarketLoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login');
  }, [router]);
  return null;
}

'use client';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function InvestorSignUpPage() {
  useEffect(() => {
    redirect('/signup');
  }, []);
  return null;
}

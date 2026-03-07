'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect old /staff/login URL to new /login/staff
export default function StaffLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login/staff');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to staff login...</p>
      </div>
    </div>
  );
}

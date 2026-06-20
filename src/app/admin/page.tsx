'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { requireAdmin } from '@/lib/adminAuth';
import AdminLayout from './components/AdminLayout';
import DashboardOverview from './components/DashboardOverview';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await requireAdmin();
        setAuthorized(true);
      } catch (error) {
        console.error('Admin access denied:', error);
        router.push('/owner/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <AdminLayout>
      <DashboardOverview />
    </AdminLayout>
  );
}

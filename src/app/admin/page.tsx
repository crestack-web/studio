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
        // Check if current user email is whitelisted
        const ADMIN_EMAILS = [
          'taheeratorganic@gmail.com',
          'admin@busmo.io',
          'majnuncode@gmail.com',
          'sxeedtxheer@gmail.com',
          'ahmedusmus@gmail.com',
          'majnun@busmo.io'
        ];
        
        // For whitelisted users, allow access even without admin session
        // This connects the admin route with user accounts
        const userEmail = localStorage.getItem('admin_user');
        if (userEmail) {
          try {
            const parsed = JSON.parse(userEmail);
            if (ADMIN_EMAILS.includes(parsed.email)) {
              setAuthorized(true);
              return;
            }
          } catch (e) {
            console.error('Error parsing admin_user:', e);
          }
        }
        
        router.push('/admin/login');
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <DashboardOverview />
    </AdminLayout>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { requireAdmin } from '@/lib/adminAuth';
import AdminLayout from './components/AdminLayout';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Admin page: Starting auth check...');
      try {
        await requireAdmin();
        console.log('Admin page: requireAdmin passed, setting authorized to true');
        setAuthorized(true);
      } catch (error) {
        console.error('Admin page: Admin access denied:', error);
        setAuthError('Access denied. Redirecting to owner dashboard...');
        setTimeout(() => {
          router.push('/owner/dashboard');
        }, 2000);
      } finally {
        console.log('Admin page: Setting loading to false');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-20"></div>
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Verifying admin access...</p>
          <p className="text-gray-500 text-sm mt-2">Loading dashboard components</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <div className="animate-pulse text-gray-500">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout />
  );
}

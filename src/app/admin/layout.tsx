// src/app/admin/layout.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAdminAuth();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href="/admin"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/admin/support"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Support
              </Link>
            </li>
            <li>
              <Link
                href="/customer"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Customer Portal
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/admin/settings"
                className="block p-2 rounded hover:bg-gray-700"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* User profile section */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-2 bg-gray-700 rounded">
            <div className="font-medium">{user?.name}</div>
            <div className="text-sm text-gray-300 mb-2">{user?.role}</div>
            <button
              onClick={handleLogout}
              className="w-full text-left text-sm text-gray-300 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
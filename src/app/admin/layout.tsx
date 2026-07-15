// src/app/admin/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';
import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAdminAuth();
  
  // Check authentication when component mounts
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/admin/login');
    }
  }, [isAuthenticated, router]);
  
  // Sidebar navigation items
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Support', href: '/admin/support', icon: '💬' },
    { name: 'Users', href: '/admin/users', icon: '👥' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' }
  ];
  
  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }
  
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {/* Sidebar component */}
          <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-white text-xl font-bold">Busmo Admin</h1>
              </div>
              <nav className="mt-5 flex-1 px-2">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="bg-gray-900 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-300">{user?.email || 'admin@busmo.com'}</p>
              </div>
              <button
                onClick={logout}
                className="ml-auto text-gray-400 hover:text-white"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div className={sidebarOpen ? 'fixed inset-0 flex z-40' : 'hidden'}>
        <div className="flex-1 bg-gray-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-white text-xl font-bold">Busmo Admin</h1>
          </div>
          <nav className="mt-5 px-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="bg-gray-900 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 w-14">
          {/* Dummy element to force sidebar to shrink */}
        </div>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center h-full px-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <span>{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </a>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span>Open sidebar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Busmo Admin</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700 mr-4"
              >
                Logout
              </button>
              <div className="text-sm font-medium text-gray-700">
                {user?.name || 'Admin'}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
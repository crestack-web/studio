"use client";
import { Sidebar } from '@/components/seller/Sidebar';
import { TopHeader } from '@/components/seller/TopHeader';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar - Fixed on left, 240px wide */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden ml-60">
        {/* Top Header - Flows naturally */}
        <TopHeader />

        {/* Page content - Scrollable, full width */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

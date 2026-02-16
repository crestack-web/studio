"use client";
import { Sidebar } from '@/components/seller/Sidebar';
import { TopHeader } from '@/components/seller/TopHeader';

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-60">
        <TopHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

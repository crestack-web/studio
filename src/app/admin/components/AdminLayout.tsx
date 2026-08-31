'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DashboardOverview = dynamic(() => import('./DashboardOverview'), { ssr: false });
const UserManagement = dynamic(() => import('./UserManagement'), { ssr: false });
const BusinessTimeline = dynamic(() => import('./BusinessTimeline'), { ssr: false });
const SupportInbox = dynamic(() => import('./SupportInbox'), { ssr: false });
const ChurnDetection = dynamic(() => import('./ChurnDetection'), { ssr: false });
const MoSalesConnections = dynamic(() => import('./MoSalesConnections'), { ssr: false });
const MoSellActivity = dynamic(() => import('./MoSellActivity'), { ssr: false });
const AdminOperations = dynamic(() => import('./AdminOperations'), { ssr: false });
const AdminRevenue = dynamic(() => import('./AdminRevenue'), { ssr: false });

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const TABS: Array<{ id: string; label: string; short: string }> = [
  { id: 'overview', label: 'Growth', short: 'Growth' },
  { id: 'users', label: 'Users', short: 'Users' },
  { id: 'businesses', label: 'Businesses', short: 'Biz' },
  { id: 'operations', label: 'Operations', short: 'Ops' },
  { id: 'revenue', label: 'Revenue', short: 'Revenue' },
  { id: 'churn', label: 'Churn', short: 'Churn' },
  { id: 'mo-sales', label: 'MO Sales', short: 'MO' },
  { id: 'mo-sell', label: 'Mo-sell', short: 'Sell' },
  { id: 'support', label: 'Support', short: 'Support' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardOverview />
          </Suspense>
        );
      case 'users':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <UserManagement />
          </Suspense>
        );
      case 'businesses':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <BusinessTimeline />
          </Suspense>
        );
      case 'operations':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdminOperations />
          </Suspense>
        );
      case 'revenue':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdminRevenue />
          </Suspense>
        );
      case 'churn':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ChurnDetection />
          </Suspense>
        );
      case 'mo-sales':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MoSalesConnections />
          </Suspense>
        );
      case 'mo-sell':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MoSellActivity />
          </Suspense>
        );
      case 'support':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SupportInbox />
          </Suspense>
        );
      default:
        return (
          children || (
            <Suspense fallback={<LoadingFallback />}>
              <DashboardOverview />
            </Suspense>
          )
        );
    }
  };

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src="/sidebar-logo.png"
              alt="Busmo"
              className="h-8 w-8 object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                t.onerror = null;
                t.src = '/favicon.png';
              }}
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">Busmo Admin</h1>
              <p className="hidden text-[11px] text-slate-500 sm:block">Live Supabase · company intelligence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/owner/dashboard')}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:text-sm"
          >
            Exit
          </button>
        </div>

        <div className="border-t border-slate-100">
          <nav
            className="mx-auto max-w-7xl overflow-x-auto overscroll-x-contain px-2 py-2 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            aria-label="Admin sections"
          >
            <ul className="flex w-max max-w-none flex-nowrap gap-1.5 sm:gap-2">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <li key={tab.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:px-3.5 sm:text-sm ${
                        active
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="sm:hidden">{tab.short}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl min-w-0 px-3 py-4 sm:px-6 sm:py-6">{renderContent()}</main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
    </div>
  );
}

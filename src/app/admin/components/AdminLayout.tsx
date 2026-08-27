'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import components to improve initial load performance
const DashboardOverview = dynamic(() => import('./DashboardOverview'), { ssr: false });
const UserManagement = dynamic(() => import('./UserManagement'), { ssr: false });
const BusinessTimeline = dynamic(() => import('./BusinessTimeline'), { ssr: false });
const SupportInbox = dynamic(() => import('./SupportInbox'), { ssr: false });
const FeatureRequests = dynamic(() => import('./FeatureRequests'), { ssr: false });
const ProductAdoption = dynamic(() => import('./ProductAdoption'), { ssr: false });
const ChurnDetection = dynamic(() => import('./ChurnDetection'), { ssr: false });
const AskMOAnalytics = dynamic(() => import('./AskMOAnalytics'), { ssr: false });
const NotificationCenter = dynamic(() => import('./NotificationCenter'), { ssr: false });
const AdminTeam = dynamic(() => import('./AdminTeam'), { ssr: false });
const UserActivityAnalytics = dynamic(() => import('./UserActivityAnalytics'), { ssr: false }); // Added UserActivityAnalytics
const WaitlistManagement = dynamic(() => import('./WaitlistManagement'), { ssr: false });
const MoSalesConnections = dynamic(() => import('./MoSalesConnections'), { ssr: false });

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'businesses', label: 'Businesses', icon: '🏢' },
    { id: 'analytics', label: 'Activity Analytics', icon: '📈' }, // Updated label
    { id: 'team', label: 'Admin Team', icon: '👔' },
    { id: 'support', label: 'Support', icon: '💬' },
    { id: 'features', label: 'Feature Requests', icon: '💡' },
    { id: 'product-analytics', label: 'Product Adoption Analytics', icon: '📈', 'aria-label': 'View Product Adoption Analytics' },
    { id: 'churn', label: 'Churn Detection', icon: '⚠️' },
    { id: 'askmo', label: 'Ask MO', icon: '🤖' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'waitlist', label: 'Waitlist', icon: '📝' },
    { id: 'mo-sales', label: 'MO Sales WA', icon: '💬' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Suspense fallback={<LoadingFallback />}><DashboardOverview /></Suspense>;
      case 'users':
        return <Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>;
      case 'businesses':
        return <Suspense fallback={<LoadingFallback />}><BusinessTimeline /></Suspense>;
      case 'analytics': // Added new case
        return <Suspense fallback={<LoadingFallback />}><UserActivityAnalytics /></Suspense>;
      case 'team':
        return <Suspense fallback={<LoadingFallback />}><AdminTeam /></Suspense>;
      case 'support':
        return <Suspense fallback={<LoadingFallback />}><SupportInbox /></Suspense>;
      case 'features':
        return <Suspense fallback={<LoadingFallback />}><FeatureRequests /></Suspense>;
      case 'product-analytics':
        // Render Product Adoption Analytics component
        return <Suspense fallback={<LoadingFallback />}><ProductAdoption /></Suspense>;
      case 'churn':
        return <Suspense fallback={<LoadingFallback />}><ChurnDetection /></Suspense>;
      case 'askmo':
        return <Suspense fallback={<LoadingFallback />}><AskMOAnalytics /></Suspense>;
      case 'notifications':
        return <Suspense fallback={<LoadingFallback />}><NotificationCenter /></Suspense>;
      case 'waitlist':
        return <Suspense fallback={<LoadingFallback />}><WaitlistManagement /></Suspense>;
      case 'mo-sales':
        return <Suspense fallback={<LoadingFallback />}><MoSalesConnections /></Suspense>;
      default:
        return children || <Suspense fallback={<LoadingFallback />}><DashboardOverview /></Suspense>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img 
                    src="/sidebar-logo.png" 
                    alt="Busmo Logo" 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/favicon.png";
                    }}
                  />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Busmo Admin
                </h1>
              </div>
              <span className="hidden sm:block px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-200">
                Founder Dashboard
              </span>
            </div>
            <button
              onClick={() => router.push('/owner/dashboard')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Exit Admin
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <ul className="space-y-2">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
}

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
    { id: 'team', label: 'Admin Team', icon: '👔' },
    { id: 'support', label: 'Support', icon: '💬' },
    { id: 'features', label: 'Feature Requests', icon: '💡' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'churn', label: 'Churn Detection', icon: '⚠️' },
    { id: 'askmo', label: 'Ask MO', icon: '🤖' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Suspense fallback={<LoadingFallback />}><DashboardOverview /></Suspense>;
      case 'users':
        return <Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>;
      case 'businesses':
        return <Suspense fallback={<LoadingFallback />}><BusinessTimeline /></Suspense>;
      case 'team':
        return <Suspense fallback={<LoadingFallback />}><AdminTeam /></Suspense>;
      case 'support':
        return <Suspense fallback={<LoadingFallback />}><SupportInbox /></Suspense>;
      case 'features':
        return <Suspense fallback={<LoadingFallback />}><FeatureRequests /></Suspense>;
      case 'analytics':
        return <Suspense fallback={<LoadingFallback />}><ProductAdoption /></Suspense>;
      case 'churn':
        return <Suspense fallback={<LoadingFallback />}><ChurnDetection /></Suspense>;
      case 'askmo':
        return <Suspense fallback={<LoadingFallback />}><AskMOAnalytics /></Suspense>;
      case 'notifications':
        return <Suspense fallback={<LoadingFallback />}><NotificationCenter /></Suspense>;
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
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <nav className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderContent()}
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
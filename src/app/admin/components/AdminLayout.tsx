'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardOverview from './DashboardOverview';
import UserManagement from './UserManagement';
import BusinessTimeline from './BusinessTimeline';
import SupportInbox from './SupportInbox';
import FeatureRequests from './FeatureRequests';
import ProductAdoption from './ProductAdoption';
import ChurnDetection from './ChurnDetection';
import AskMOAnalytics from './AskMOAnalytics';
import NotificationCenter from './NotificationCenter';
import AdminTeam from './AdminTeam';

interface AdminLayoutProps {
  children: React.ReactNode;
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
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'businesses':
        return <BusinessTimeline />;
      case 'team':
        return <AdminTeam />;
      case 'support':
        return <SupportInbox />;
      case 'features':
        return <FeatureRequests />;
      case 'analytics':
        return <ProductAdoption />;
      case 'churn':
        return <ChurnDetection />;
      case 'askmo':
        return <AskMOAnalytics />;
      case 'notifications':
        return <NotificationCenter />;
      default:
        return children;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Busmo Admin</h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                Founder Dashboard
              </span>
            </div>
            <button
              onClick={() => router.push('/owner/dashboard')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
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

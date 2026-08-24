'use client';

/**
 * StaffDashboard
 * --------------
 * Busmo staff portal dashboard component.
 */

import React, { useState, useEffect } from 'react';
import type { PageId, Permissions, StaffUser } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast, BottomNav, LockedPage } from './components/shared';
import { HomePage } from './HomePage';
import { SalePage } from './pages/SalePage';
import { InventoryPage, HistoryPage, AttendancePage, MessagesPage, SettingsPage } from './OtherPages';
import './busmo.css';

interface StaffDashboardProps {
  staff?: StaffUser;
  permissions?: Permissions;
  onLogout?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  staff,
  permissions,
  onLogout,
}) => {
  const [page, setPage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const navigate = (newPage: PageId) => {
    setPage(newPage);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = getGreeting();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('staff-theme') as 'light' | 'dark' | 'system') || 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      localStorage.setItem('staff-theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme to document when theme changes
  useEffect(() => {
    const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
      let actualTheme: 'light' | 'dark';
      
      if (themeValue === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        actualTheme = themeValue;
      }
      
      document.documentElement.setAttribute('data-theme', actualTheme);
      document.body.setAttribute('data-theme', actualTheme);
    };

    applyTheme(theme);

    // Listen for system theme changes when in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(theme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <div className="app">
      <div className={`mob-ov${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <Sidebar page={page} onChangePage={navigate} permissions={permissions!} open={sidebarOpen} />

      <div className="main">
        <Topbar 
          staff={staff!} 
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
        />

        <div className="main-scroll">
          {page === 'home' && (
            <HomePage
              greeting={greeting}
              salesTotal={0}
              transactions={0}
              itemsSold={0}
              permissions={permissions!}
              shiftElapsed='0h 0m'
              onNav={navigate}
              onToast={showToast}
              staffId={staff?.id}
            />
          )}
          {page === 'sale' && (permissions!.sale ? <SalePage onComplete={() => showToast('Sale completed!')} /> : <LockedPage pageName="Record Sale" />)}
          {page === 'inv' && <InventoryPage hasAccess={permissions!.inv} />}
          {page === 'hist' && <HistoryPage hasAccess={permissions!.hist} sessionSales={[]} />}
          {page === 'atd' && <AttendancePage hasAccess={permissions!.atd} />}
          {page === 'msg' && <MessagesPage hasAccess={permissions!.msg} />}
          {page === 'settings' && (
            <SettingsPage
              staff={staff!}
              theme={theme}
              onToggleTheme={toggleTheme}
              onLogout={onLogout}
              onToast={showToast}
            />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        page={page}
        permissions={permissions!}
        onNav={navigate}
        onToast={showToast}
        hasMessage={true}
      />

      <Toast message={toast.message} visible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default StaffDashboard;

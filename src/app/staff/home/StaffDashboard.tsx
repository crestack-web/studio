'use client';

/**
 * StaffDashboard — Busmo staff portal shell.
 * All feature pages receive businessId from StaffContext / props so data
 * is always scoped to the owner business that invited this staff member.
 */

import React, { useState, useEffect } from 'react';
import type { PageId, Permissions, StaffUser } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Toast, BottomNav, LockedPage } from './components/shared';
import { HomePage } from './HomePage';
import { SalePage } from './pages/SalePage';
import {
  InventoryPage,
  HistoryPage,
  AttendancePage,
  MessagesPage,
  SettingsPage,
} from './OtherPages';
import {
  CustomersPage,
  CreditPage,
  ReturnsPage,
  ReceiveStockPage,
  ExpensesPage,
  ShiftClosePage,
  ExpiryPage,
  ProductionPage,
  MenuAssistPage,
  TransfersPage,
} from './pages/ExtraFeaturePages';
import { useStaffWorkspaceOptional } from './StaffContext';
import './busmo.css';
import { NetworkStatus, NetworkStatusStyles } from '@/components/app/NetworkStatus';

interface StaffDashboardProps {
  staff?: StaffUser;
  permissions?: Permissions;
  businessId?: string;
  businessName?: string;
  currency?: string;
  onLogout?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  staff: staffProp,
  permissions: permissionsProp,
  businessId: businessIdProp,
  businessName: businessNameProp,
  currency: currencyProp,
  onLogout,
}) => {
  const workspace = useStaffWorkspaceOptional();
  const staff = staffProp || workspace?.staff;
  const permissions = permissionsProp || workspace?.permissions;
  const businessId = businessIdProp || workspace?.businessId || staff?.businessId || '';
  const businessName = businessNameProp || workspace?.businessName || 'Business';
  const currency = currencyProp || workspace?.currency || '₦';

  const [page, setPage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  });
  const [shiftStart] = useState(() => Date.now());
  const [shiftElapsed, setShiftElapsed] = useState('0h 0m');

  useEffect(() => {
    const tick = () => {
      const mins = Math.floor((Date.now() - shiftStart) / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      setShiftElapsed(`${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [shiftStart]);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const navigate = (newPage: PageId) => {
    setPage(newPage);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = staff?.firstName || staff?.name?.split(' ')[0] || 'there';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem('staff-theme') as 'light' | 'dark' | 'system') ||
        'light'
      );
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme =
        prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light';
      localStorage.setItem('staff-theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
      let actualTheme: 'light' | 'dark';
      if (themeValue === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      } else {
        actualTheme = themeValue;
      }
      document.documentElement.setAttribute('data-theme', actualTheme);
      document.body.setAttribute('data-theme', actualTheme);
    };

    applyTheme(theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme(theme);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  if (!staff || !permissions || !businessId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <p className="text-gray-600 text-sm">
          Workspace incomplete. Please sign in again.
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <div
        className={`mob-ov${sidebarOpen ? ' show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        page={page}
        onChangePage={navigate}
        permissions={permissions}
        open={sidebarOpen}
      />

      <div className="main">
        <Topbar
          staff={staff}
          onToggleSidebar={toggleSidebar}
          onLogout={onLogout}
          businessName={businessName}
        />

        {/* Business scope badge — confirms correct owner business */}
        <div
          style={{
            padding: '8px 16px',
            fontSize: '0.75rem',
            color: 'var(--t2, #3D6652)',
            borderBottom: '1px solid var(--bdrS, #eee)',
            background: 'var(--brand-lt, #dcfce7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>
            Linked business:{' '}
            <strong style={{ color: 'var(--brand, #16A34A)' }}>{businessName}</strong>
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--t3)', opacity: 0.9 }}>
            Sales & stock stay on this business only
          </span>
        </div>

        <div className="main-scroll">
          {page === 'home' && (
            <HomePage
              greeting={getGreeting()}
              salesTotal={0}
              transactions={0}
              itemsSold={0}
              permissions={permissions}
              shiftElapsed={shiftElapsed}
              onNav={navigate}
              onToast={showToast}
              staffId={staff.id}
              businessId={businessId}
              currency={currency}
            />
          )}
          {page === 'sale' &&
            (permissions.sale ? (
              <SalePage
                businessId={businessId}
                staffId={staff.id}
                staffName={staff.name}
                staffRole={staff.role}
                currency={currency}
                onComplete={() => showToast('✅ Sale recorded for ' + businessName)}
              />
            ) : (
              <LockedPage pageName="Record Sale" />
            ))}
          {page === 'inv' && (
            <InventoryPage hasAccess={permissions.inv} businessId={businessId} currency={currency} staffId={staff?.id} staffName={staff?.name} />
          )}
          {page === 'hist' && (
            <HistoryPage
              hasAccess={permissions.hist}
              sessionSales={[]}
              businessId={businessId}
              staffId={staff.id}
              currency={currency}
            />
          )}
          {page === 'atd' && (
            <AttendancePage
              hasAccess={permissions.atd}
              businessId={businessId}
              staffId={staff.id}
              staffName={staff.name}
            />
          )}
          {page === 'msg' && (
            <MessagesPage
              hasAccess={permissions.msg}
              businessId={businessId}
              staffId={staff.id}
            />
          )}

          {page === 'customers' && (
            <CustomersPage hasAccess={!!permissions.customers} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'credit' && (
            <CreditPage hasAccess={!!permissions.credit} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'returns' && (
            <ReturnsPage hasAccess={!!permissions.returns} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'receive' && (
            <ReceiveStockPage hasAccess={!!permissions.receive} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'expenses' && (
            <ExpensesPage hasAccess={!!permissions.expenses} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'shift' && (
            <ShiftClosePage hasAccess={!!permissions.shift} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'expiry' && (
            <ExpiryPage hasAccess={!!permissions.expiry} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'production' && (
            <ProductionPage hasAccess={!!permissions.production} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'menu' && (
            <MenuAssistPage hasAccess={!!permissions.menu} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'transfers' && (
            <TransfersPage hasAccess={!!permissions.transfers} businessId={businessId} staffId={staff.id} staffName={staff.name} />
          )}
          {page === 'settings' && (
            <SettingsPage
              staff={staff}
              theme={theme}
              onToggleTheme={toggleTheme}
              onLogout={onLogout}
              onToast={showToast}
              businessName={businessName}
            />
          )}
        </div>
      </div>

      <BottomNav
        page={page}
        permissions={permissions}
        onNav={navigate}
        onToast={showToast}
        hasMessage={true}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
      <NetworkStatusStyles />
      <NetworkStatus />
    </div>
  );
};

export default StaffDashboard;

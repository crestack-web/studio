'use client';

import React, { useEffect } from 'react';
import { useApp } from './AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { HomePage }        from './HomePage';
import { RecordSalePage }  from './RecordSalePage';
import { ServicesPage }    from './ServicesPage';
import { AddProductPage }  from './Addproductpage';
import { AddExpensePage }  from './Addexpensepage';
import Cashflowpage    from './Cashflowpage';
import { StatementPage }   from './Statementpage';
import StaffPage       from './StaffPage';
import { ReferralsPage }   from './ReferralsPage';
import CapitalPage from './CapitalPage';
import InventoryPage       from './InventoryPage';
import SettingsPage        from './SettingsPage';
import { BranchesPage }    from './BranchesPage';
import { ReportsPage }     from './ReportsPage';
import { BankReconciliationPage } from './BankReconciliationPage';
import MoneyControlPage from './MoneyControlPage';
import BankStatementImportPage from './BankStatementImportPage';
import CashReconciliationPage from './CashReconciliationPage';
import StaffAccountabilityPage from './StaffAccountabilityPage';
import MoneyLeakagePage from './MoneyLeakagePage';
import PaymentTraceabilityPage from './PaymentTraceabilityPage';
import { MobileAskMOPage } from './MobileAskMOPage';
import { InlineAIChat } from './InlineAIChat';
import { CreditTrackingPage } from './CreditTrackingPage';
import { AvatarModal }     from './AvatarModal';
import { Toast }           from './Toast';
import { NotificationBar } from './NotificationBar';
import { NotificationsPanel } from './NotificationsPanel';
import { DeviceNotificationsBridge } from './DeviceNotificationsBridge';
import MenuManagementPage from './MenuManagementPage';
import IngredientsPage from './IngredientsPage';
import ExpiryAlertsPage from './ExpiryAlertsPage';
import ProductionPage from './ProductionPage';
import PayrollPage from './PayrollPage';
import CustomersPage from './CustomersPage';
import SuppliersPage from './SuppliersPage';
import { WarehousePage } from './WarehousePage';
import { StockTransfersPage } from './StockTransfersPage';
import { usePageTracking } from '@/hooks/usePageTracking'; // Import the page tracking hook
import styles from './AppShell.module.css';

// ═══════════════════════════════════════════
//  AppShell — composes the full layout
//  Add new pages to PAGE_MAP below
// ═══════════════════════════════════════════

/** Component map — render a fresh element per navigation so pages remount cleanly. */
const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  home: HomePage,
  sale: RecordSalePage,
  inventory: InventoryPage,
  'add-product': AddProductPage,
  'add-expense': AddExpensePage,
  cashflow: Cashflowpage,
  statement: StatementPage,
  reports: ReportsPage,
  'bank-reconciliation': BankReconciliationPage,
  'money-control': MoneyControlPage,
  'bank-statement-import': BankStatementImportPage,
  'cash-reconciliation': CashReconciliationPage,
  'staff-accountability': StaffAccountabilityPage,
  'money-leakage': MoneyLeakagePage,
  'payment-traceability': PaymentTraceabilityPage,
  'credit-tracking': CreditTrackingPage,
  services: ServicesPage,
  staff: StaffPage,
  settings: SettingsPage,
  referrals: ReferralsPage,
  capital: CapitalPage,
  branches: BranchesPage,
  'mo-mobile': MobileAskMOPage,
  mo: InlineAIChat,
  'menu-management': MenuManagementPage,
  'ingredient-tracking': IngredientsPage,
  'expiry-alerts': ExpiryAlertsPage,
  'production-tracking': ProductionPage,
  payroll: PayrollPage,
  'customer-management': CustomersPage,
  'supplier-management': SuppliersPage,
  warehouse: WarehousePage,
  'stock-transfers': StockTransfersPage,
};

const FULL_HEIGHT_PAGES = new Set<string>(['mo', 'mo-mobile']);

export function AppShell() {
  const { activePage } = useApp();
  const router = typeof window !== 'undefined' ? null : null;
  const isMobileAskMO = activePage === 'mo-mobile';

  // Use the page tracking hook to track user activity
  usePageTracking();

  // MO Sell is a standalone dashboard at mo-sell.store
  useEffect(() => {
    if (activePage === 'mo-sell') {
      window.location.href = 'https://mo-sell.store/';
    }
  }, [activePage]);

  const PageComponent = PAGE_COMPONENTS[activePage];
  const currentPage = PageComponent ? (
    <PageComponent key={activePage} />
  ) : (
    <div className={styles.placeholder}>
      <h2>Coming Soon</h2>
      <p>This page is under construction.</p>
    </div>
  );

  const isFullHeight = FULL_HEIGHT_PAGES.has(activePage);

  return (
    <div className={styles.shell}>
      {!isMobileAskMO && <Sidebar />}

      <div className={styles.main}>
        {!isMobileAskMO && <Topbar />}
        {!isMobileAskMO && <NotificationsPanel />}

        <div className={[styles.pageArea, isFullHeight ? styles.fullHeight : '', isMobileAskMO ? styles.mobileAskMOPageArea : ''].join(' ')}>
          <div className={[styles.page, isFullHeight ? styles.pageFullHeight : ''].join(' ')}>
            {currentPage}
          </div>
        </div>

        <MobileBottomNav />
      </div>

      <AvatarModal />
      <Toast />
      <DeviceNotificationsBridge />
    </div>
  );
}

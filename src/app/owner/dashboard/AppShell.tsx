'use client';

import React from 'react';
import { useApp } from './AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { HomePage }        from './HomePage';
import { RecordSalePage }  from './RecordSalePage';
import { ServicesPage }    from './ServicesPage';
import { AddProductPage }  from './Addproductpage';
import { AddExpensePage }  from './Addexpensepage';
import { CashflowPage }    from './Cashflowpage';
import { StatementPage }   from './Statementpage';
import { StaffPage }       from './StaffPage';
import { ReferralsPage }   from './ReferralsPage';
import { CapitalPage }     from './CapitalPage';
import InventoryPage       from './InventoryPage';
import SettingsPage        from './SettingsPage';
import { BranchesPage }    from './BranchesPage';
import { ReportsPage }     from './ReportsPage';
import { BankReconciliationPage } from './BankReconciliationPage';
import MoneyControlPage    from './MoneyControlPage';
import BankStatementImportPage from './BankStatementImportPage';
import CashReconciliationPage from './CashReconciliationPage';
import StaffAccountabilityPage from './StaffAccountabilityPage';
import MoneyLeakagePage from './MoneyLeakagePage';
import PaymentTraceabilityPage from './PaymentTraceabilityPage';
import { MobileAskMOPage } from './MobileAskMOPage';
import { AvatarModal }     from './AvatarModal';
import { Toast }           from './Toast';
import { NotificationBar } from './NotificationBar';
import styles from './AppShell.module.css';

// ═══════════════════════════════════════════
//  AppShell — composes the full layout
//  Add new pages to PAGE_MAP below
// ═══════════════════════════════════════════

const PAGE_MAP: Record<string, React.ReactNode> = {
  home:         <HomePage />,
  sale:         <RecordSalePage />,
  inventory:    <InventoryPage />,
  'add-product': <AddProductPage />,
  'add-expense': <AddExpensePage />,
  cashflow:      <CashflowPage />,
  statement:     <StatementPage />,
  reports:       <ReportsPage />,
  'bank-reconciliation': <BankReconciliationPage />,
  'money-control': <MoneyControlPage />,
  'bank-statement-import': <BankStatementImportPage />,
  'cash-reconciliation': <CashReconciliationPage />,
  'staff-accountability': <StaffAccountabilityPage />,
  'money-leakage': <MoneyLeakagePage />,
  'payment-traceability': <PaymentTraceabilityPage />,
  services:     <ServicesPage />,
  staff:        <StaffPage />,
  settings:     <SettingsPage />,
  referrals:    <ReferralsPage />,
  capital:      <CapitalPage />,
  branches:     <BranchesPage />,
  'mo-mobile':  <MobileAskMOPage />,
};

const FULL_HEIGHT_PAGES = new Set<string>([]);

export function AppShell() {
  const { activePage } = useApp();

  const currentPage = PAGE_MAP[activePage] ?? (
    <div className={styles.placeholder}>
      <h2>Coming Soon</h2>
      <p>This page is under construction.</p>
    </div>
  );

  const isFullHeight = FULL_HEIGHT_PAGES.has(activePage);

  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.main}>
        <NotificationBar />
        <Topbar />

        <div className={[styles.pageArea, isFullHeight ? styles.fullHeight : ''].join(' ')}>
          <div className={[styles.page, isFullHeight ? styles.pageFullHeight : ''].join(' ')}>
            {currentPage}
          </div>
        </div>

        <MobileBottomNav />
      </div>

      <AvatarModal />
      <Toast />
    </div>
  );
}

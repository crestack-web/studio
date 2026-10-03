'use client';

import React from 'react';
import { useApp } from './AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { HomePage } from './HomePage';
import { RecordSalePage } from './RecordSalePage';
import { ServicesPage } from './ServicesPage';
import { AddProductPage } from './Addproductpage';
import { AddExpensePage } from './Addexpensepage';
import Cashflowpage from './Cashflowpage';
import { StatementPage } from './Statementpage';
import StaffPage from './StaffPage';
import { ReferralsPage } from './ReferralsPage';
import CapitalPage from './CapitalPage';
import InventoryPage from './InventoryPage';
import SettingsPage from './SettingsPage';
import MoSellPage from './MoSellPage';
import { BranchesPage } from './BranchesPage';
import { ReportsPage } from './ReportsPage';
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
import { AvatarModal } from './AvatarModal';
import { Toast } from './Toast';
import { NotificationsPanel } from './NotificationsPanel';
import { DeviceNotificationsBridge } from './DeviceNotificationsBridge';
import { NetworkStatus, NetworkStatusStyles } from '@/components/app/NetworkStatus';
import MenuManagementPage from './MenuManagementPage';
import MarginCalculatorPage from './MarginCalculatorPage';
import CanIBuyThisPage from './CanIBuyThisPage';
import IngredientsPage from './IngredientsPage';
import ExpiryAlertsPage from './ExpiryAlertsPage';
import ProductionPage from './ProductionPage';
import PayrollPage from './PayrollPage';
import WalletPage from './WalletPage';
import CustomersPage from './CustomersPage';
import SuppliersPage from './SuppliersPage';
import { WarehousePage } from './WarehousePage';
import { StockTransfersPage } from './StockTransfersPage';
import MoSalesPage from './MoSalesPage';
import JobsPage from './JobsPage';
import InternalFeaturePrototypePage from './InternalFeaturePrototypePage';
import RecyclingPage from './RecyclingPage';
import BusinessBuilderPage from './BusinessBuilderPage';
import CustomFeaturePage from './CustomFeaturePage';
import { usePageTracking } from '@/hooks/usePageTracking';
import styles from './AppShell.module.css';

const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  home: HomePage,
  jobs: JobsPage,
  recycling: RecyclingPage,
  'feature-prototype': InternalFeaturePrototypePage,
  'business-builder': BusinessBuilderPage,
  'custom-feature': CustomFeaturePage,
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
  'margin-calculator': MarginCalculatorPage,
  'can-i-buy': CanIBuyThisPage,
  'ingredient-tracking': IngredientsPage,
  'expiry-alerts': ExpiryAlertsPage,
  'production-tracking': ProductionPage,
  payroll: PayrollPage,
  wallet: WalletPage,
  'customer-management': CustomersPage,
  'supplier-management': SuppliersPage,
  warehouse: WarehousePage,
  'stock-transfers': StockTransfersPage,
  'mo-sales': MoSalesPage,
  'mo-sell': MoSellPage,
};

const FULL_HEIGHT_PAGES = new Set<string>(['mo', 'mo-mobile']);

export default function AppShell() {
  const { activePage } = useApp();
  const isMobileAskMO = activePage === 'mo-mobile';
  usePageTracking(String(activePage || 'home'));

  const PageComponent = PAGE_COMPONENTS[activePage];

  const isFullHeight = FULL_HEIGHT_PAGES.has(activePage);

  return (
    <div className={styles.shell}>
      <NetworkStatusStyles />
      <NetworkStatus />
      <Sidebar />
      <div className={styles.main}>
        {!isMobileAskMO && <Topbar />}
        <div className={[styles.content, isFullHeight ? styles.fullHeight : ''].join(' ')}>
          {PageComponent ? <PageComponent key={activePage} /> : <HomePage />}
        </div>
      </div>
      <MobileBottomNav />
      <AvatarModal />
      <Toast />
      <NotificationsPanel />
      <DeviceNotificationsBridge />
    </div>
  );
}

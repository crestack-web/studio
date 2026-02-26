'use client';

import React from 'react';
import { useApp } from './AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { HomePage }        from './HomePage';
import { RecordSalePage }  from './RecordSalePage';
import { AskMOPage }       from './AskMOPage';
import { ServicesPage }    from './ServicesPage';
import { AddProductPage }  from './Addproductpage';
import { AddExpensePage }  from './Addexpensepage';
import { CashflowPage }    from './Cashflowpage';
import { StatementPage }   from './Statementpage';
import { StaffPage }       from './StaffPage';
import { ReferralsPage }   from './ReferralsPage';
import { CapitalPage }     from './CapitalPage';
import { AvatarModal }     from './AvatarModal';
import { Toast }           from './Toast';
import styles from './AppShell.module.css';

// ═══════════════════════════════════════════
//  AppShell — composes the full layout
//  Add new pages to PAGE_MAP below
// ═══════════════════════════════════════════

const PAGE_MAP: Record<string, React.ReactNode> = {
  home:         <HomePage />,
  sale:         <RecordSalePage />,
  mo:           <AskMOPage />,
  services:     <ServicesPage />,
  staff:        <StaffPage />,
  referrals:    <ReferralsPage />,
  capital:      <CapitalPage />,
  update:       <StatementPage />,
  'add-product': <AddProductPage />,
  'add-expense': <AddExpensePage />,
  cashflow:      <CashflowPage />,
  statement:     <StatementPage />,
};

const FULL_HEIGHT_PAGES = new Set(['mo']);

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

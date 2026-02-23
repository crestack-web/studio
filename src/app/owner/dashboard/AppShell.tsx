import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { HomePage }        from '../pages/HomePage';
import { RecordSalePage }  from '../pages/RecordSalePage';
import { AskMOPage }       from '../pages/AskMOPage';
import { ServicesPage }    from '../pages/ServicesPage';
import { StaffPage }       from '../pages/StaffPage';
import { ReferralsPage }   from '../pages/ReferralsPage';
import { CapitalPage }     from '../pages/CapitalPage';
import { AvatarModal }     from '../modals/AvatarModal';
import { Toast }           from '../shared/Toast';
import styles from './AppShell.module.css';

// ═══════════════════════════════════════════
//  AppShell
//  Composes the full application layout:
//  Sidebar + Topbar + Page Area + Mobile Nav
//  Add new pages to the PAGE_MAP below.
// ═══════════════════════════════════════════

// Map page IDs → components.
// Add your new pages here and they'll be
// automatically rendered by the router.
const PAGE_MAP: Record<string, React.ReactNode> = {
  home:      <HomePage />,
  sale:      <RecordSalePage />,
  mo:        <AskMOPage />,
  services:  <ServicesPage />,
  staff:     <StaffPage />,
  referrals: <ReferralsPage />,
  capital:   <CapitalPage />,
};

// Pages where we want the AI chat layout (full height, no scroll)
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

      {/* Global overlays */}
      <AvatarModal />
      <Toast />
    </div>
  );
}

'use client';

import React from 'react';
import { useSell } from '../context/SellContext';
import { SellSidebar } from './SellSidebar';
import { SellTopbar } from './SellTopbar';
import styles from './SellShell.module.css';

import { StoreSetupWizard }       from './StoreSetupWizard';
import { SellOverview }           from '../pages/SellOverview';
import { SellProductsPage }       from '../pages/SellProductsPage';
import { SellCollectionsPage }    from '../pages/SellCollectionsPage';
import { SellOrdersPage }         from '../pages/SellOrdersPage';
import { SellShippingPage }       from '../pages/SellShippingPage';
import { SellSettingsPage }       from '../pages/SellSettingsPage';
import { SellAnalyticsPage }      from '../pages/SellAnalyticsPage';
import { ThemeEditorPage }        from '../pages/ThemeEditorPage';
import { SellEarningsPage }       from '../pages/SellEarningsPage';

function renderPage(page: string): React.ReactNode {
  switch (page) {
    case 'overview':       return <SellOverview />;
    case 'products':       return <SellProductsPage />;
    case 'collections':    return <SellCollectionsPage />;
    case 'orders':         return <SellOrdersPage />;
    case 'shipping':       return <SellShippingPage />;
    case 'analytics':      return <SellAnalyticsPage />;
    case 'earnings':       return <SellEarningsPage />;
    case 'settings':       return <SellSettingsPage />;
    case 'theme-editor':   return <ThemeEditorPage />;
    default: return (
      <div className={styles.placeholder}>
        <h2>Coming Soon</h2>
        <p>This section is under construction.</p>
      </div>
    );
  }
}

const FULL_BLEED_PAGES = new Set(['theme-editor']);

export function SellShell() {
  const { activePage, toast, storeConfig, storeConfigLoading, navigateTo } = useSell();
  const [wizardDismissed, setWizardDismissed] = React.useState(false);

  const showWizard =
    (!storeConfigLoading && !storeConfig && !wizardDismissed) ||
    activePage === 'setup-wizard';

  function handleWizardClose() {
    if (storeConfig) {
      navigateTo('overview');
    } else {
      setWizardDismissed(true);
      navigateTo('overview');
    }
  }

  const isFullBleed = FULL_BLEED_PAGES.has(activePage);

  return (
    <div className={styles.shell}>
      {showWizard && (
        <StoreSetupWizard onClose={handleWizardClose} />
      )}

      <SellSidebar />

      <div className={styles.main}>
        <SellTopbar />

        <div className={isFullBleed ? styles.pageAreaFullBleed : styles.pageArea}>
          <div className={isFullBleed ? styles.pageFullBleed : styles.page}>
            {activePage === 'setup-wizard'
              ? null
              : renderPage(activePage)}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.visible && (
        <div className={styles.toastWrap}>
          <div className={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess :
            toast.type === 'error'   ? styles.toastError   : styles.toastInfo,
          ].join(' ')}>
            {toast.type === 'success' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

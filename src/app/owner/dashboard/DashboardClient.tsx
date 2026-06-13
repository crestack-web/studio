'use client';

import { AppProvider } from './AppContext';
import { CurrencyProvider } from './CurrencyContext';
import { BranchProvider } from '@/context/BranchContext';
import { AppShell }   from './AppShell';
import { TrialGuard } from './TrialGuard';
import './tokens.css';

// ═══════════════════════════════════════════
//  DashboardClient
//
//  'use client' boundary — everything below
//  this line runs in the browser.
//
//  AppProvider supplies: theme, navigation,
//  toast, and user state to the whole tree.
//  AppShell renders: Sidebar + Topbar + Pages
//  + MobileNav + AvatarModal + Toast.
// ═══════════════════════════════════════════

export function DashboardClient() {
  return (
    <TrialGuard>
      <CurrencyProvider>
        <AppProvider>
          <BranchProvider>
            <AppShell />
          </BranchProvider>
        </AppProvider>
      </CurrencyProvider>
    </TrialGuard>
  );
}

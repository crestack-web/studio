'use client';

import { AppProvider } from './AppContext';
import { AppShell }   from './AppShell';
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
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

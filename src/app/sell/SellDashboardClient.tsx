'use client';

import React from 'react';
import { SellShell } from './components/SellShell';

/**
 * SellDashboardClient
 * Root client component for the /sell route.
 * SellProvider + SellAuthGuard are applied by layout.tsx.
 * This file just mounts the shell.
 */
export function SellDashboardClient() {
  return <SellShell />;
}

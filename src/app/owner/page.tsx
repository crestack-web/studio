import type { Metadata } from 'next';
import { DashboardClient } from './dashboard/DashboardClient';

// ═══════════════════════════════════════════
//  /app/owner/dashboard/page.tsx
// ═══════════════════════════════════════════

export const metadata: Metadata = {
  title: 'Busmo – Owner Dashboard',
  description: 'Manage your business with Busmo',
};

export default function DashboardPage() {
  return <DashboardClient />;
}

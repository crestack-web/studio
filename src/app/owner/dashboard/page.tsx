import type { Metadata } from 'next';
import { DashboardClient } from './DashboardClient';

// ═══════════════════════════════════════════
//  /app/owner/dashboard/page.tsx
// ═══════════════════════════════════════════

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Busmo – Owner Dashboard',
  description: 'Manage your business with Busmo',
};

export default function DashboardPage() {
  return <DashboardClient />;
}


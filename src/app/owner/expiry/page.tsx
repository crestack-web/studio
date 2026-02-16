import { Calendar, Filter, Download, AlertTriangle, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { ExpiryDashboard } from '@/components/owner/ExpiryDashboard';
import { ExpiryAlert } from '@/lib/expiryAlert';

// Dummy data for demonstration
const alerts: ExpiryAlert[] = [
  {
    id: '1',
    productId: 'p1',
    productName: 'Bottled Water',
    batchId: 'BW-001',
    quantity: 15,
    expiryDate: new Date('2026-02-13'),
    daysUntilExpiry: -2,
    alertType: 'expired',
    status: 'active',
    notificationsSent: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    productId: 'p2',
    productName: 'Yogurt',
    batchId: 'YG-042',
    quantity: 8,
    expiryDate: new Date('2026-02-17'),
    daysUntilExpiry: 2,
    alertType: 'critical',
    status: 'active',
    notificationsSent: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    productId: 'p3',
    productName: 'Fresh Milk',
    batchId: 'FM-010',
    quantity: 12,
    expiryDate: new Date('2026-02-20'),
    daysUntilExpiry: 5,
    alertType: 'warning',
    status: 'active',
    notificationsSent: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ExpiryManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Expiry Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track, monitor, and manage product expiration dates
          </p>
        </div>
      </div>
      <ExpiryDashboard alerts={alerts} />
    </div>
  );
}

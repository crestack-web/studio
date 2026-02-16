import { Calendar, Filter, Download, AlertTriangle, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { ExpiryDashboard } from '@/components/owner/ExpiryDashboard';
import { ExpiryAlert } from '@/lib/expiryAlert';
import { useUser, useFirestore } from '@/firebase/provider';
import { collection, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

export default function ExpiryManagementPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const businessId = user?.businessId;

  // Memoize the query for expiry alerts
  const expiryAlertsQuery = useMemo(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, `businesses/${businessId}/expiryAlerts`));
  }, [firestore, businessId]);

  const { data: alerts, isLoading, error } = useCollection<ExpiryAlert>(expiryAlertsQuery);

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
      {isLoading ? (
        <div>Loading expiry alerts...</div>
      ) : error ? (
        <div className="text-red-600">Error loading expiry alerts.</div>
      ) : (
        <ExpiryDashboard alerts={alerts || []} />
      )}
    </div>
  );
}

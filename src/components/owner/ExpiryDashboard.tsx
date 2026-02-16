import { AlertTriangle, Clock, XCircle, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, format } from 'date-fns';
import { ExpiryAlert } from '@/lib/expiryAlert';

export function ExpiryDashboard({ alerts }: { alerts: ExpiryAlert[] }) {
  const expired = alerts.filter(a => a.alertType === 'expired');
  const critical = alerts.filter(a => a.alertType === 'critical');
  const warning = alerts.filter(a => a.alertType === 'warning');

  const totalWasteThisMonth = expired.reduce((sum, alert) => sum + (alert.action?.type === 'disposed' ? alert.quantity * 100 : 0), 0); // Placeholder calculation

  const getDaysText = (expiryDate: Date) => {
    const days = differenceInDays(expiryDate, new Date());
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expiry Alerts
          </h2>
        </div>
        <Link
          href="/owner/expiry"
          className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400"
        >
          View All
        </Link>
      </div>
      <div className="space-y-6">
        {/* Expired Products */}
        {expired.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                EXPIRED ({expired.length})
              </h3>
            </div>
            <div className="space-y-3">
              {expired.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {alert.productName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Batch #{alert.batchId} • {alert.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">
                        {getDaysText(alert.expiryDate)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {/* Loss calculation placeholder */}
                        Loss: ₦{(alert.quantity * 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
                      Mark as Disposed
                    </button>
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-amber-600 text-sm font-medium text-white hover:bg-amber-700">
                      Sold at Discount
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Critical Products */}
        {critical.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                CRITICAL ({critical.length})
              </h3>
            </div>
            <div className="space-y-3">
              {critical.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {alert.productName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Batch #{alert.batchId} • {alert.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {getDaysText(alert.expiryDate)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Value: ₦{(alert.quantity * 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-purple-600 text-sm font-medium text-white hover:bg-purple-700">
                      Discount Sale
                    </button>
                    <button className="flex-1 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
                      Mark as Priority
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Warning Products */}
        {warning.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                WARNING ({warning.length})
              </h3>
            </div>
            <div className="space-y-2">
              {warning.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {alert.productName}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      • {alert.quantity} units • {getDaysText(alert.expiryDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* No alerts */}
        {expired.length === 0 && critical.length === 0 && warning.length === 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-3">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No expiring products. All stock is fresh! ✨
            </p>
          </div>
        )}
        {/* Waste summary */}
        {totalWasteThisMonth > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Waste This Month
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  ₦{totalWasteThisMonth.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {/* Placeholder: 8 products expired */}
                  8 products expired
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Calendar, AlertTriangle, Package } from 'lucide-react';
import { useState } from 'react';

export function ProductForm() {
  const [hasExpiryDate, setHasExpiryDate] = useState(false);
  const [expiryTracking, setExpiryTracking] = useState<'batch' | 'individual' | 'none'>('none');
  const [defaultShelfLife, setDefaultShelfLife] = useState<number>(30);
  const [alertDaysBefore, setAlertDaysBefore] = useState(7);
  const [criticalDaysBefore, setCriticalDaysBefore] = useState(3);

  return (
    <div className="space-y-6">
      {/* Existing product fields */}
      {/* ...existing code... */}
      {/* Expiry Tracking Section */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expiry Tracking
          </h3>
        </div>
        {/* Enable expiry tracking */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={hasExpiryDate}
            onChange={(e) => setHasExpiryDate(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            This product has an expiry date
          </span>
        </label>
        {hasExpiryDate && (
          <div className="space-y-6 pl-7">
            {/* Tracking method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tracking Method
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="expiryTracking"
                    value="batch"
                    checked={expiryTracking === 'batch'}
                    onChange={() => setExpiryTracking('batch')}
                    className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Track by batch
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Different batches expire at different times (Recommended for most products)
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="expiryTracking"
                    value="individual"
                    checked={expiryTracking === 'individual'}
                    onChange={() => setExpiryTracking('individual')}
                    className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Track individually
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Each unit has its own expiry date (For high-value items like medications)
                    </div>
                  </div>
                </label>
              </div>
            </div>
            {/* Default shelf life */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Shelf Life (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={defaultShelfLife}
                  onChange={(e) => setDefaultShelfLife(Number(e.target.value))}
                  min="1"
                  className="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Auto-calculate expiry date when adding stock
              </p>
            </div>
            {/* Alert settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Alert Settings
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alert me</span>
                  <input
                    type="number"
                    value={alertDaysBefore}
                    onChange={(e) => setAlertDaysBefore(Number(e.target.value))}
                    min="1"
                    className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">days before expiry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Critical alert</span>
                  <input
                    type="number"
                    value={criticalDaysBefore}
                    onChange={(e) => setCriticalDaysBefore(Number(e.target.value))}
                    min="1"
                    className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">days before expiry</span>
                </div>
              </div>
            </div>
            {/* Additional options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Allow sales after expiry date (for discounted sales)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically mark as expired when date passes
                </span>
              </label>
            </div>
            {/* Helpful examples */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex gap-3">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    Examples of products with expiry dates:
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Dairy products, beverages, baked goods, medications, cosmetics, 
                    supplements, perishable foods, packaged snacks, etc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Save button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
          Save Product
        </button>
      </div>
    </div>
  );
}

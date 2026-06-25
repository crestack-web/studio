'use client';

import React from 'react';
import { Check, Package, TrendingUp, DollarSign } from 'lucide-react';

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

interface SaleConfirmationCardProps {
  items: SaleItem[];
  totalRevenue: number;
  totalProfit?: number;
  timestamp?: Date;
}

export function SaleConfirmationCard({ items, totalRevenue, totalProfit, timestamp }: SaleConfirmationCardProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-2xl p-5 shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Sale Recorded</h3>
          {timestamp && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 px-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                ×{item.quantity} — ₦{(item.price * item.quantity).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ₦{item.price.toLocaleString()} each
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white/70 dark:bg-white/10 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Total Revenue</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            ₦{totalRevenue.toLocaleString()}
          </span>
        </div>
        
        {totalProfit !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Profit</span>
            </div>
            <span className="font-bold text-green-600 dark:text-green-400">
              ₦{totalProfit.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Items</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-green-200 dark:border-green-800">
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <Package className="w-3 h-3" />
          <span>Inventory Updated</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <TrendingUp className="w-3 h-3" />
          <span>Sales Logged</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
          <DollarSign className="w-3 h-3" />
          <span>Profit Updated</span>
        </div>
      </div>
    </div>
  );
}

"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerOrdersPage() {
  // TODO: Fetch and display seller's orders
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage your incoming marketplace orders.</p>
      </div>
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-4 px-6">
            {['All', 'Pending', 'Processing', 'Shipped'].map((tab, i) => (
              <button
                key={tab}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${i === 0 ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[1,2,3,4,5,6,7,8,9,10].map((i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">BUS-00{i+1234}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">Jane Doe</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">2</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">₦{i*10000}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">2026-02-15</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-6">
        <a href="/seller/dashboard" className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">Back to Dashboard</a>
      </div>
    </>
  );
}

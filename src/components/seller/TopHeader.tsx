'use client';
import { ThemeToggle } from './ThemeToggle';
import { Bell } from 'lucide-react';

export function TopHeader() {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <input
          type="search"
          placeholder="Search products, orders..."
          className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-purple-500"
        />
      </div>
      {/* Right side actions */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center text-white">
            S
          </div>
          <span className="text-gray-900 dark:text-white">Seller</span>
        </div>
      </div>
    </div>
  );
}

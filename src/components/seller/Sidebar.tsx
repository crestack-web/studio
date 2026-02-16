'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Store, 
  CreditCard, 
  Truck, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import Image from 'next/image';

const navigation = [
  { name: 'Overview', href: '/seller/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingCart },
  { name: 'Storefront', href: '/seller/storefront', icon: Store },
  { name: 'Payments', href: '/seller/payments', icon: CreditCard },
  { name: 'Delivery & Dispatch', href: '/seller/delivery', icon: Truck },
  { name: 'Analytics', href: '/seller/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/seller/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/seller/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Busmo" width={32} height={32} />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Busmo
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* View Storefront Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/store/your-store"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Store className="h-4 w-4" />
          View Storefront
        </a>
      </div>
    </aside>
  );
}

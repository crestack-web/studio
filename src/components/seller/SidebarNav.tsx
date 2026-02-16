'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingCart, Store, CreditCard, Truck, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { href: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/seller/products', label: 'Products', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/seller/storefront', label: 'Storefront', icon: Store },
  { href: '/seller/payments', label: 'Payments', icon: CreditCard },
  { href: '/seller/delivery', label: 'Delivery & Dispatch', icon: Truck },
  { href: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-8 px-4 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-2 rounded-lg transition-all
              ${isActive 
                ? 'bg-purple-500 text-white shadow-lg' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
            `}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

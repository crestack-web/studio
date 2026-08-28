import React from 'react';
import {
  Home,
  ShoppingCart,
  Package,
  History,
  Calendar,
  MessageSquare,
  Settings,
  Users,
  CreditCard,
  Undo2,
  PackagePlus,
  Receipt,
  Calculator,
  AlertTriangle,
  Factory,
  Utensils,
  ArrowLeftRight,
} from 'lucide-react';
import type { PageId, Permissions } from '../types';
import { STAFF_PERMISSION_DEFS } from '@/lib/staffPermissions';

interface SidebarProps {
  page: PageId;
  onChangePage: (page: PageId) => void;
  permissions: Permissions;
  open?: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  home: <Home size={20} />,
  sale: <ShoppingCart size={20} />,
  inv: <Package size={20} />,
  hist: <History size={20} />,
  atd: <Calendar size={20} />,
  msg: <MessageSquare size={20} />,
  customers: <Users size={20} />,
  credit: <CreditCard size={20} />,
  returns: <Undo2 size={20} />,
  receive: <PackagePlus size={20} />,
  expenses: <Receipt size={20} />,
  shift: <Calculator size={20} />,
  expiry: <AlertTriangle size={20} />,
  production: <Factory size={20} />,
  menu: <Utensils size={20} />,
  transfers: <ArrowLeftRight size={20} />,
  settings: <Settings size={20} />,
};

const LABELS: Record<string, string> = {
  sale: 'Sale',
  inv: 'Inventory',
  hist: 'History',
  atd: 'Attendance',
  msg: 'Messages',
  customers: 'Customers',
  credit: 'Credit',
  returns: 'Returns',
  receive: 'Receive',
  expenses: 'Expenses',
  shift: 'Shift close',
  expiry: 'Expiry',
  production: 'Production',
  menu: 'Menu',
  transfers: 'Transfers',
};

export function Sidebar({ page, onChangePage, permissions, open = false }: SidebarProps) {
  const featureItems = STAFF_PERMISSION_DEFS.filter((d) => permissions[d.key]).map((d) => ({
    id: d.page as PageId,
    label: LABELS[d.key] || d.label,
    icon: ICONS[d.key] || <Package size={20} />,
    class: `ni-${d.key}`,
  }));

  const navItems = [
    { id: 'home' as PageId, label: 'Home', icon: ICONS.home, class: 'ni-home' },
    ...featureItems,
    { id: 'settings' as PageId, label: 'Settings', icon: ICONS.settings, class: 'ni-set' },
  ];

  // Dedupe by id (sale appears once)
  const seen = new Set<string>();
  const unique = navItems.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  return (
    <aside className={`sb${open ? ' open' : ''}`}>
      <div className="sb-top">
        <div className="logo-w">
          <div className="logo-ic">
            <img
              src="/sidebar-logo.png"
              alt="Busmo Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/email-logo.png';
              }}
            />
          </div>
          <div className="logo-txt">
            <span>Busmo</span>
            <span className="logo-sub">Staff Portal</span>
          </div>
        </div>
      </div>
      <nav className="sb-scroll">
        <ul className="sb-nav">
          {unique.map((item) => (
            <li key={item.id}>
              <button
                className={`nl ${page === item.id ? 'act' : ''}`}
                onClick={() => onChangePage(item.id)}
              >
                <span className={`nic ${item.class}`}>{item.icon}</span>
                <span className="nlbl">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sb-user">
        <div className="sb-user-in">
          <div className="s-av">ST</div>
        </div>
      </div>
    </aside>
  );
}

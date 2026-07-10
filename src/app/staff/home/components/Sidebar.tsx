import React from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  History, 
  Calendar, 
  MessageSquare, 
  Settings,
  Box,
  Users,
  BarChart3,
  Receipt,
  Truck,
  CreditCard
} from 'lucide-react';
import type { PageId, Permissions } from '../types';

interface SidebarProps {
  page: PageId;
  onChangePage: (page: PageId) => void;
  permissions: Permissions;
  open?: boolean;
}

export function Sidebar({ page, onChangePage, permissions, open = false }: SidebarProps) {
  const navItems = [
    { id: 'home' as PageId, label: 'Home', icon: <Home size={20} />, class: 'ni-home' },
    { id: 'sale' as PageId, label: 'Sale', icon: <ShoppingCart size={20} />, class: 'ni-sale' },
    ...(permissions.inv ? [{ id: 'inv' as PageId, label: 'Inventory', icon: <Package size={20} />, class: 'ni-inv' }] : []),
    ...(permissions.hist ? [{ id: 'hist' as PageId, label: 'History', icon: <History size={20} />, class: 'ni-hist' }] : []),
    ...(permissions.atd ? [{ id: 'atd' as PageId, label: 'Attendance', icon: <Calendar size={20} />, class: 'ni-atd' }] : []),
    ...(permissions.msg ? [{ id: 'msg' as PageId, label: 'Messages', icon: <MessageSquare size={20} />, class: 'ni-msg' }] : []),
    { id: 'settings' as PageId, label: 'Settings', icon: <Settings size={20} />, class: 'ni-set' },
  ];

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
                target.src = "/email-logo.png";
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
          {navItems.map(item => (
            <li key={item.id}>
              <button
                className={`nl ${page === item.id ? 'act' : ''}`}
                onClick={() => onChangePage(item.id)}
              >
                <span className={`nic ${item.class}`}>
                  {item.icon}
                </span>
                <span className="nlbl">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sb-user">
        <div className="sb-user-in">
          <div className="s-av">JD</div>
        </div>
      </div>
    </aside>
  );
}

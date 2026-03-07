import React from 'react';
import type { PageId, Permissions } from '../types';

interface SidebarProps {
  page: PageId;
  onChangePage: (page: PageId) => void;
  permissions: Permissions;
  open?: boolean;
}

export function Sidebar({ page, onChangePage, permissions, open = false }: SidebarProps) {
  const navItems = [
    { id: 'home' as PageId, label: 'Home', icon: '🏠', class: 'ni-home' },
    { id: 'sale' as PageId, label: 'Sale', icon: '🛒', class: 'ni-sale' },
    ...(permissions.inv ? [{ id: 'inv' as PageId, label: 'Inventory', icon: '📦', class: 'ni-inv' }] : []),
    ...(permissions.hist ? [{ id: 'hist' as PageId, label: 'History', icon: '📜', class: 'ni-hist' }] : []),
    ...(permissions.atd ? [{ id: 'atd' as PageId, label: 'Attendance', icon: '📍', class: 'ni-atd' }] : []),
    ...(permissions.msg ? [{ id: 'msg' as PageId, label: 'Messages', icon: '💬', class: 'ni-msg' }] : []),
    { id: 'settings' as PageId, label: 'Settings', icon: '⚙️', class: 'ni-set' },
  ];

  return (
    <aside className={`sb${open ? ' open' : ''}`}>
      <div className="sb-top">
        <div className="logo-w">
          <div className="logo-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
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

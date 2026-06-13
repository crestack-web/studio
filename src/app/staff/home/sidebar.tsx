import React from 'react';
import type { PageId, Permissions, StaffUser } from '../types';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  page: PageId;
  onNav: (p: PageId) => void;
  permissions: Permissions;
  staff: StaffUser;
  shiftElapsed: string;
  onToast: (msg: string) => void;
}

interface NavItem {
  page: PageId;
  label: string;
  tip: string;
  permKey?: keyof Permissions;
  iconClass: string;
  icon: React.ReactNode;
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    page: 'home', label: 'Dashboard', tip: 'Home', iconClass: 'ni-home',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    page: 'sale', label: 'Record Sale', tip: 'Record Sale', permKey: 'sale', iconClass: 'ni-sale',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>,
  },
  {
    page: 'inventory', label: 'Inventory', tip: 'Inventory', permKey: 'inv', iconClass: 'ni-inv',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  },
  {
    page: 'history', label: 'Sale History', tip: 'Sale History', permKey: 'hist', iconClass: 'ni-hist',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    page: 'attendance', label: 'Attendance', tip: 'Attendance', permKey: 'atd', iconClass: 'ni-atd',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    page: 'messages', label: 'Messages', tip: 'Messages', permKey: 'msg', iconClass: 'ni-msg',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  {
    page: 'settings', label: 'Settings', tip: 'Settings', iconClass: 'ni-set',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, isCollapsed, onToggleCollapse, onClose,
  page, onNav, permissions, staff, shiftElapsed, onToast,
}) => {
  const handleNav = (item: NavItem) => {
    if (item.permKey && !permissions[item.permKey]) {
      onToast('🔒 Access blocked by owner');
      return;
    }
    onNav(item.page);
    onClose(); // close drawer on mobile after nav
  };

  const sbClass = ['sb', isCollapsed ? 'col' : '', isOpen ? 'open' : ''].filter(Boolean).join(' ');

  return (
    <aside className={sbClass} id="sb">
      {/* Header */}
      <div className="sb-top">
        <div className="logo-w">
          <div className="logo-ic">
            <img 
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1780960538/Graphic_Designing_Workshop_Instagram_Promotional_Post_1_q7mhgo.png" 
              alt="Busmo Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '9px' }}
            />
          </div>
          <div>
            <div className="logo-txt">Busmo</div>
            <div className="logo-sub">Staff Portal</div>
          </div>
        </div>
        <button className="tog" onClick={onToggleCollapse} aria-label="Collapse sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      {/* Shift banner */}
      <div className={`shift-banner${isCollapsed ? ' col' : ''}`}>
        <div className="shift-dot"/>
        <div className="shift-txt">
          <div className="shift-lbl">Shift Active</div>
          <div className="shift-time">{shiftElapsed}</div>
        </div>
      </div>

      {/* Nav */}
      <div className="sb-scroll">
        <ul className="sb-nav">
          {NAV_ITEMS.map((item) => {
            const isLocked = !!(item.permKey && !permissions[item.permKey]);
            const isActive = page === item.page;
            return (
              <li key={item.page}>
                <button
                  className={`nl${isActive ? ' act' : ''}${isLocked ? ' locked' : ''}`}
                  data-tip={item.tip}
                  onClick={() => handleNav(item)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`nic ${item.iconClass}`}>{item.icon}</span>
                  <span className="nlbl">{item.label}</span>
                  {isLocked && (
                    <span className="lock-ic"><LockIcon/></span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User */}
      <div className="sb-user">
        <div className="sb-user-in">
          <div className="s-av">{staff.initials}</div>
          <div className="s-uinfo">
            <div className="s-uname">{staff.name}</div>
            <div className="s-urole">{staff.role}</div>
          </div>
          <div className="online-dot"/>
        </div>
      </div>
    </aside>
  );
};

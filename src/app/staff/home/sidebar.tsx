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
  CreditCard,
  RotateCcw,
  Percent
} from 'lucide-react';
import type { PageId, Permissions, StaffUser } from './types';

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
    icon: <Home size={20} />,
  },
  {
    page: 'sale', label: 'Record Sale', tip: 'Record Sale', permKey: 'sale', iconClass: 'ni-sale',
    icon: <ShoppingCart size={20} />,
  },
  {
    page: 'inv', label: 'Inventory', tip: 'Inventory', permKey: 'inv', iconClass: 'ni-inv',
    icon: <Package size={20} />,
  },
  {
    page: 'hist', label: 'Sale History', tip: 'Sale History', permKey: 'hist', iconClass: 'ni-hist',
    icon: <History size={20} />,
  },
  {
    page: 'atd', label: 'Attendance', tip: 'Attendance', permKey: 'atd', iconClass: 'ni-atd',
    icon: <Calendar size={20} />,
  },
  {
    page: 'msg', label: 'Messages', tip: 'Messages', permKey: 'msg', iconClass: 'ni-msg',
    icon: <MessageSquare size={20} />,
  },
  {
    page: 'products', label: 'Products', tip: 'Manage Products', permKey: 'products', iconClass: 'ni-products',
    icon: <Box size={20} />,
  },
  {
    page: 'customers', label: 'Customers', tip: 'Manage Customers', permKey: 'customers', iconClass: 'ni-customers',
    icon: <Users size={20} />,
  },
  {
    page: 'reports', label: 'Reports', tip: 'View Reports', permKey: 'reports', iconClass: 'ni-reports',
    icon: <BarChart3 size={20} />,
  },
  {
    page: 'expenses', label: 'Expenses', tip: 'Record Expenses', permKey: 'expenses', iconClass: 'ni-expenses',
    icon: <Receipt size={20} />,
  },
  {
    page: 'suppliers', label: 'Suppliers', tip: 'Manage Suppliers', permKey: 'suppliers', iconClass: 'ni-suppliers',
    icon: <Truck size={20} />,
  },
  {
    page: 'credit', label: 'Credit', tip: 'Credit Management', permKey: 'credit', iconClass: 'ni-credit',
    icon: <CreditCard size={20} />,
  },
  {
    page: 'settings', label: 'Settings', tip: 'Settings', iconClass: 'ni-set',
    icon: <Settings size={20} />,
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

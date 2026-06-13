import React from 'react';
import type { PageId, Permissions } from '../types';

/* ═══════════════════════════════
   BOTTOM NAV
═══════════════════════════════ */
interface BottomNavProps {
  page: PageId;
  permissions: Permissions;
  onNav: (p: PageId) => void;
  onToast: (msg: string) => void;
  hasMessage?: boolean;
}

interface BNItem {
  id: PageId;
  label: string;
  permKey?: keyof Permissions;
  dot?: boolean;
  icon: React.ReactNode;
}

const BN_ITEMS: BNItem[] = [
  {
    id: 'home', label: 'Home',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'sale', label: 'Sale', permKey: 'sale',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>,
  },
  {
    id: 'inventory', label: 'Stock', permKey: 'inv',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  },
  {
    id: 'attendance', label: 'Shift', permKey: 'atd',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    id: 'messages', label: 'Chat', permKey: 'msg', dot: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  page, permissions, onNav, onToast, hasMessage = true,
}) => {
  const handleClick = (item: BNItem) => {
    if (item.permKey && !permissions[item.permKey]) {
      onToast('🔒 Access blocked by owner');
      return;
    }
    onNav(item.id);
  };

  return (
    <nav className="bot-nav" aria-label="Mobile navigation">
      {BN_ITEMS.map((item) => {
        const isLocked = !!(item.permKey && !permissions[item.permKey]);
        return (
          <button
            key={item.id}
            className={`bn-item${page === item.id ? ' act' : ''}${isLocked ? ' locked-nav' : ''}`}
            onClick={() => handleClick(item)}
            aria-label={item.label}
            aria-current={page === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.dot && hasMessage && <span className="bn-dot"/>}
          </button>
        );
      })}
    </nav>
  );
};

/* ═══════════════════════════════
   TOAST
═══════════════════════════════ */
interface ToastProps {
  visible: boolean;
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ visible, message }) => (
  <div className={`toast${visible ? ' show' : ''}`} role="status" aria-live="polite">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>{message}</span>
  </div>
);

/* ═══════════════════════════════
   LOCKED PAGE OVERLAY
═══════════════════════════════ */
export const LockedPage: React.FC<{ pageName: string }> = ({ pageName }) => (
  <div className="locked-pg">
    <div className="lock-circle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    </div>
    <h2>Access Restricted</h2>
    <p>You don't have permission to view <strong>{pageName}</strong>. Contact your business owner to request access.</p>
  </div>
);

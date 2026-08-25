import React from 'react';
import {
  Home,
  ShoppingCart,
  Package,
  Clock,
  MessageSquare,
} from 'lucide-react';
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

type BnItem = {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  permKey?: keyof Permissions;
  dot?: boolean;
};

export const BottomNav: React.FC<BottomNavProps> = ({
  page,
  permissions,
  onNav,
  onToast,
  hasMessage = true,
}) => {
  const BN_ITEMS: BnItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home strokeWidth={2.25} aria-hidden />,
    },
    {
      id: 'sale',
      label: 'Sale',
      permKey: 'sale',
      icon: <ShoppingCart strokeWidth={2.25} aria-hidden />,
    },
    ...(permissions.inv
      ? [
          {
            id: 'inv' as PageId,
            label: 'Stock',
            icon: <Package strokeWidth={2.25} aria-hidden />,
          },
        ]
      : []),
    {
      id: 'atd',
      label: 'Shift',
      permKey: 'atd',
      icon: <Clock strokeWidth={2.25} aria-hidden />,
    },
    ...(permissions.msg
      ? [
          {
            id: 'msg' as PageId,
            label: 'Chat',
            dot: hasMessage,
            icon: <MessageSquare strokeWidth={2.25} aria-hidden />,
          },
        ]
      : []),
  ];

  const handleNav = (item: BnItem) => {
    if (item.permKey && !permissions[item.permKey]) {
      onToast('🔒 Access blocked by owner');
      return;
    }
    onNav(item.id);
  };

  return (
    <nav className="bot-nav" aria-label="Mobile navigation">
      {BN_ITEMS.map((item) => {
        const locked = !!(item.permKey && !permissions[item.permKey]);
        const active = page === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bn-item${active ? ' act' : ''}${locked ? ' locked-nav' : ''}`}
            onClick={() => handleNav(item)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="bn-icon">{item.icon}</span>
            <span className="bn-label">{item.label}</span>
            {item.dot && !locked ? <span className="bn-dot" /> : null}
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
  message: string;
  visible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onClose }) => (
  <div className={`toast${visible ? ' show' : ''}`} role="status" onClick={onClose}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
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
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    </div>
    <h2>Access Restricted</h2>
    <p>
      You don&apos;t have permission to view <strong>{pageName}</strong>. Contact
      your business owner to request access.
    </p>
  </div>
);

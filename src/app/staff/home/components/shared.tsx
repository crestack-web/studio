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

export const BottomNav: React.FC<BottomNavProps> = ({
  page, permissions, onNav, onToast, hasMessage = true,
}) => {
  const BN_ITEMS = [
    { id: 'home' as PageId, label: 'Home', icon: '🏠' },
    { id: 'sale' as PageId, label: 'Sale', permKey: 'sale' as keyof Permissions, icon: '🛒' },
    ...(permissions.inv ? [{ id: 'inv' as PageId, label: 'Stock', icon: '📦' }] : []),
    { id: 'attendance' as PageId, label: 'Shift', permKey: 'atd' as keyof Permissions, icon: '📍' },
    ...(permissions.msg ? [{ id: 'messages' as PageId, label: 'Chat', dot: hasMessage, icon: '💬' }] : []),
  ];

  return (
    <nav className="bot-nav" aria-label="Mobile navigation">
      {BN_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`bn-item${page === item.id ? ' act' : ''}`}
          onClick={() => onNav(item.id)}
        >
          <span className="bn-icon">{item.icon}</span>
          <span>{item.label}</span>
          {(item as any).dot && <span className="bn-dot"/>}
        </button>
      ))}
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

import React from 'react';
import { useApp } from './AppContext';
import styles from './Toast.module.css';

// ═══════════════════════════════════════════
//  Toast — global notification overlay
//  Rendered once at the app root
// ═══════════════════════════════════════════

export function Toast() {
  const { toast } = useApp();

  return (
    <div
      className={`${styles.toast} ${toast.visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{toast.message}</span>
    </div>
  );
}

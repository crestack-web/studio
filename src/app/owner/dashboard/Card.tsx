import React, { ReactNode, CSSProperties } from 'react';
import styles from './Card.module.css';

// ═══════════════════════════════════════════
//  Card
//  Base surface component used throughout
// ═══════════════════════════════════════════

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  return (
    <div
      className={`${styles.card} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// ── Card Header ───────────────────────────────
interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ children, action, className = '' }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div className={styles.title}>{children}</div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

// ── Card Icon ────────────────────────────────
interface CardIconProps {
  bg: string;
  children: ReactNode;
}

export function CardIcon({ bg, children }: CardIconProps) {
  return (
    <span className={styles.icon} style={{ background: bg }}>
      {children}
    </span>
  );
}

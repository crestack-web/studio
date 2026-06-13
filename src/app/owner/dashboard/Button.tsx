import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

// ═══════════════════════════════════════════
//  Button
//  All button variants in one component
// ═══════════════════════════════════════════

export type ButtonVariant =
  | 'primary'   // purple fill
  | 'ghost'     // border, transparent
  | 'subtle'    // bg fill ghost
  | 'danger'    // red
  | 'success';  // green

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

export function Button({
  variant = 'ghost',
  size = 'md',
  fullWidth = false,
  children,
  icon,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...rest}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}

// ── Action link (styled like a button) ───────
interface ActionLinkProps {
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function ActionLink({ onClick, children, className = '' }: ActionLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.actionLink} ${className}`}
    >
      {children}
    </button>
  );
}

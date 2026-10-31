'use client';

import React from 'react';
import {
  ShoppingCart,
  Home,
  Package,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import type { PageId, Permissions } from '../types';

interface TerminalBottomNavProps {
  page: PageId;
  permissions: Permissions;
  onChange: (p: PageId) => void;
  cartCount?: number;
}

const ITEMS: {
  id: PageId;
  label: string;
  need?: keyof Permissions;
  icon: React.ReactNode;
}[] = [
  {
    id: 'terminal',
    label: 'Sale',
    need: 'sale',
    icon: <ShoppingCart size={22} strokeWidth={2.25} aria-hidden />,
  },
  {
    id: 'home',
    label: 'Home',
    icon: <Home size={22} strokeWidth={2.25} aria-hidden />,
  },
  {
    id: 'inv',
    label: 'Stock',
    need: 'inv',
    icon: <Package size={22} strokeWidth={2.25} aria-hidden />,
  },
  {
    id: 'atd',
    label: 'Check-in',
    need: 'atd',
    icon: <Clock size={22} strokeWidth={2.25} aria-hidden />,
  },
  {
    id: 'settings',
    label: 'More',
    icon: <MoreHorizontal size={22} strokeWidth={2.25} aria-hidden />,
  },
];

export function TerminalBottomNav({
  page,
  permissions,
  onChange,
  cartCount = 0,
}: TerminalBottomNavProps) {
  const visible = ITEMS.filter((it) => {
    if (!it.need) return true;
    if (it.id === 'terminal') return Boolean(permissions.sale || permissions.terminal);
    return Boolean(permissions[it.need]);
  });

  return (
    <nav className="b1-nav" aria-label="Terminal">
      {visible.map((it) => {
        const active =
          page === it.id || (it.id === 'terminal' && page === 'sale');
        return (
          <button
            key={it.id}
            type="button"
            className={active ? 'active' : ''}
            onClick={() => onChange(it.id)}
            aria-label={it.label}
          >
            {it.icon}
            <span>
              {it.label}
              {it.id === 'terminal' && cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

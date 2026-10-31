'use client';

import React from 'react';
import {
  ShoppingCart,
  Home,
  Package,
  UserCheck,
  MoreHorizontal,
} from 'lucide-react';
import type { PageId, Permissions } from '../types';

interface TerminalBottomNavProps {
  page: PageId;
  permissions: Permissions;
  onChange: (p: PageId) => void;
  cartCount?: number;
  onLocked?: (msg: string) => void;
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
    icon: <UserCheck size={22} strokeWidth={2.25} aria-hidden />,
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
  onLocked,
}: TerminalBottomNavProps) {
  return (
    <nav className="b1-nav" aria-label="Terminal">
      {ITEMS.map((it) => {
        const locked =
          !!it.need &&
          !(it.id === 'terminal'
            ? permissions.sale || permissions.terminal
            : permissions[it.need]);
        const active =
          page === it.id || (it.id === 'terminal' && page === 'sale');
        return (
          <button
            key={it.id}
            type="button"
            className={`${active ? 'active' : ''}${locked ? ' locked' : ''}`}
            onClick={() => {
              if (locked) {
                onLocked?.('🔒 Access blocked by owner');
                return;
              }
              onChange(it.id);
            }}
            aria-label={it.label}
            aria-disabled={locked}
            style={locked ? { opacity: 0.35 } : undefined}
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

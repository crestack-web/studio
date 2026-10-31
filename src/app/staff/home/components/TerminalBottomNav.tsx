'use client';

import React from 'react';
import type { PageId, Permissions } from '../types';

interface TerminalBottomNavProps {
  page: PageId;
  permissions: Permissions;
  onChange: (p: PageId) => void;
  cartCount?: number;
}

const ITEMS: { id: PageId; label: string; need?: keyof Permissions }[] = [
  { id: 'terminal', label: 'Sale' },
  { id: 'home', label: 'Home' },
  { id: 'inv', label: 'Stock', need: 'inv' },
  { id: 'shift', label: 'Shift', need: 'shift' },
  { id: 'settings', label: 'More' },
];

export function TerminalBottomNav({
  page,
  permissions,
  onChange,
  cartCount = 0,
}: TerminalBottomNavProps) {
  const visible = ITEMS.filter((it) => {
    if (!it.need) return true;
    if (it.id === 'terminal') return permissions.sale || permissions.terminal;
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
          >
            <span aria-hidden>
              {it.id === 'terminal'
                ? '▣'
                : it.id === 'home'
                  ? '⌂'
                  : it.id === 'inv'
                    ? '▤'
                    : it.id === 'shift'
                      ? '◷'
                      : '☰'}
            </span>
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

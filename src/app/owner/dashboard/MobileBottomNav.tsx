'use client';

import React from 'react';
import { useApp } from './AppContext';
import { NavIcons, MoIcon } from './NavIcons';
import type { PageId } from 'c:/firebase/studio/src/app/owner/dashboard/types';
import styles from './MobileBottomNav.module.css';

interface BottomNavItem { id: PageId; label: string; isMO?: boolean; }

const ITEMS: BottomNavItem[] = [
  { id: 'home' as PageId,     label: 'Home'     },
  { id: 'sale' as PageId,     label: 'Sale'     },
  { id: 'mo' as PageId,       label: 'Ask MO',  isMO: true },
  { id: 'cashflow' as PageId, label: 'Cashflow' },
  { id: 'staff' as PageId,    label: 'Staff'    },
];

export function MobileBottomNav() {
  const { activePage, navigateTo } = useApp();

  return (
    <nav className={styles.nav} aria-label="Mobile navigation">
      {ITEMS.map(item =>
        item.isMO ? (
          <button key={item.id} className={styles.moBtn} onClick={() => navigateTo(item.id)}>
            <div className={styles.moIcon}><MoIcon size={32} /></div>
            <span className={styles.moLabel}>Ask MO</span>
          </button>
        ) : (
          <button
            key={item.id}
            className={[styles.item, activePage === item.id ? styles.active : ''].join(' ')}
            onClick={() => navigateTo(item.id as PageId)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <NavIcons id={item.id} size={20} />
            <span>{item.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

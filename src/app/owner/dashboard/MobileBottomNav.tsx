import React from 'react';
import { useApp, PageId } from './AppContext';
import { NavIcons, MoIcon } from './NavIcons';
import styles from './MobileBottomNav.module.css';

// ═══════════════════════════════════════════
//  MobileBottomNav
//  Fixed bottom nav shown on ≤768px screens
// ═══════════════════════════════════════════

interface BottomNavItem {
  id: PageId;
  label: string;
  isMO?: boolean;
}

const ITEMS: BottomNavItem[] = [
  { id: 'home',     label: 'Home'     },
  { id: 'sale',     label: 'Sale'     },
  { id: 'mo',       label: 'Ask MO',  isMO: true },
  { id: 'staff',    label: 'Staff'    },
  { id: 'services', label: 'Services' },
];

export function MobileBottomNav() {
  const { activePage, navigateTo } = useApp();

  return (
    <nav className={styles.nav} aria-label="Mobile navigation">
      {ITEMS.map(item =>
        item.isMO ? (
          <button
            key={item.id}
            className={styles.moBtn}
            onClick={() => navigateTo(item.id)}
            aria-label="Ask MO"
          >
            <div className={styles.moIcon}>
              <MoIcon size={20} />
            </div>
            <span className={styles.moLabel}>Ask MO</span>
          </button>
        ) : (
          <button
            key={item.id}
            className={[styles.item, activePage === item.id ? styles.active : ''].join(' ')}
            onClick={() => navigateTo(item.id)}
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

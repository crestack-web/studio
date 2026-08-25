'use client';

import React, { useMemo } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NavIcons, MoIcon } from './NavIcons';
import type { PageId } from './index';
import type { TranslationDict } from './translations';
import styles from './MobileBottomNav.module.css';

interface BottomNavItem {
  id: PageId;
  labelKey: keyof TranslationDict;
  isMO?: boolean;
}

const ITEMS: BottomNavItem[] = [
  { id: 'home' as PageId, labelKey: 'nav.home' },
  { id: 'sale' as PageId, labelKey: 'nav.sale' },
  { id: 'mo' as PageId, labelKey: 'nav.askMO', isMO: true },
  { id: 'cashflow' as PageId, labelKey: 'nav.cashflow' },
  { id: 'staff' as PageId, labelKey: 'nav.staff' },
];

export function MobileBottomNav() {
  const { activePage, navigateTo } = useApp();
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      ITEMS.map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [t]
  );

  return (
    <nav className={styles.nav} aria-label={t('nav.mobileAria')}>
      {items.map((item) =>
        item.isMO ? (
          <button
            key={item.id}
            type="button"
            className={styles.moBtn}
            onClick={() => navigateTo('mo-mobile')}
            aria-label={item.label}
          >
            <div className={styles.moIcon}>
              <MoIcon size={40} />
            </div>
            <span className={styles.moLabel}>{item.label}</span>
          </button>
        ) : (
          <button
            key={item.id}
            type="button"
            className={[styles.item, activePage === item.id ? styles.active : ''].join(' ')}
            onClick={() => navigateTo(item.id as PageId)}
            aria-current={activePage === item.id ? 'page' : undefined}
            aria-label={item.label}
          >
            <NavIcons id={item.id} size={20} />
            <span>{item.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

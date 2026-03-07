'use client';

import React from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NAV_SECTIONS } from './navItems';
import type { PageId } from './types';
import { MoIcon, NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const {
    sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar,
    activePage, navigateTo, user, openAvatarModal,
  } = useApp();
  const { t } = useTranslation();

  // Translation map for nav items
  const translateNav = (key: string): string => {
    const map: { [key: string]: string } = {
      'Main': t('nav.section.main'),
      'Growth': t('nav.section.grow'),
      'Account': t('nav.section.account'),
      'Home': t('nav.home'),
      'Record Sale': t('nav.recordSale'),
      'Inventory': t('nav.inventory'),
      'Add Product': t('nav.addProduct'),
      'Add Expense': t('nav.addExpense'),
      'Cashflow': t('nav.cashflow'),
      'Statement': t('nav.statement'),
      'My Market': t('nav.market'),
      'Access Capital': t('nav.capital'),
      'Referrals': t('nav.referrals'),
      'Ask MO': t('nav.askMO'),
      'Business Services': t('nav.services'),
      'Staff': t('nav.staff'),
      'Branches': t('nav.branches'),
      'Settings': t('nav.settings'),
    };
    return map[key] || key;
  };

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      <aside
        className={[styles.sidebar, sidebarCollapsed ? styles.collapsed : '', sidebarOpen ? styles.open : ''].join(' ')}
        aria-label="Main navigation"
      >
        <div className={styles.top}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <img src="/email-logo.png" alt="Busmo Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            </div>
            <span className={styles.logoText}>Busmo</span>
          </div>
          <button className={styles.collapseBtn} onClick={toggleSidebar} aria-label="Toggle sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <div className={styles.scroll}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className={styles.sectionWrap}>
                <span className={styles.sectionLabel} suppressHydrationWarning>
                  {translateNav(section.label)}
                </span>
              </div>
              <ul className={styles.navList} role="list">
                {section.items.map(item => {
                  const isActive = activePage === item.id;
                  return (
                    <li key={item.id} className={styles.navItem}>
                      <button
                        className={[styles.navLink, isActive ? styles.active : ''].join(' ')}
                        data-tip={translateNav(item.tip)}
                        onClick={() => navigateTo(item.id as PageId)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className={`${styles.navIcon} ${styles[item.iconClass]}`}>
                          <NavIcons id={item.id} />
                        </span>
                        <span className={styles.navLabel} suppressHydrationWarning>
                          {translateNav(item.label)}
                        </span>
                        {item.badge != null && <span className={styles.badge}>{item.badge}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.userArea}>
          <button className={styles.userInner} onClick={openAvatarModal}>
            <div className={styles.avatar} style={user.avatarStyle}>{user.avatarContent}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{user.role} · {user.plan}</div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

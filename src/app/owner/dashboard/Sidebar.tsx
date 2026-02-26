'use client';

import React from 'react';
import { useApp } from './AppContext';
import { NAV_SECTIONS } from './navItems';
import type { PageId } from './types';
import { MoIcon, NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';
import { DashboardLogo } from './DashboardLogo';

export function Sidebar() {
  const {
    sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar,
    activePage, navigateTo, user, openAvatarModal,
  } = useApp();

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
              <img src="C:\\Users\\sd\\Downloads\\logo png.png" alt="Downloads" style={{ width: '40px', height: '40px' }} />
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
                <span className={styles.sectionLabel}>{section.label}</span>
              </div>
              <ul className={styles.navList} role="list">
                {section.items.map(item => {
                  const isActive = activePage === item.id;
                  return (
                    <li key={item.id} className={styles.navItem}>
                      <button
                        className={[styles.navLink, isActive ? styles.active : ''].join(' ')}
                        data-tip={item.tip}
                        onClick={() => navigateTo(item.id as PageId)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className={`${styles.navIcon} ${styles[item.iconClass]}`}>
                          <NavIcons id={item.id} />
                        </span>
                        <span className={styles.navLabel}>{item.label}</span>
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

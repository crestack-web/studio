import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { NAV_SECTIONS } from '../../constants/navItems';
import { PageId } from '../../types';
import { NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';

// ═══════════════════════════════════════════
//  Sidebar
//  Collapsible desktop sidebar + mobile drawer
// ═══════════════════════════════════════════

export function Sidebar() {
  const {
    sidebarCollapsed,
    sidebarOpen,
    toggleSidebar,
    closeSidebar,
    activePage,
    navigateTo,
    user,
    openAvatarModal,
  } = useApp();

  const collapsed = sidebarCollapsed;

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      <aside
        className={[
          styles.sidebar,
          collapsed ? styles.collapsed : '',
          sidebarOpen ? styles.open : '',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Logo + collapse toggle */}
        <div className={styles.top}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 17 17" fill="none">
                <text
                  x="8.5"
                  y="12.5"
                  textAnchor="middle"
                  fill="white"
                  fontSize="10.5"
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  ₦
                </text>
              </svg>
            </div>
            <span className={styles.logoText}>Busmo</span>
          </div>
          <button
            className={styles.collapseBtn}
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Nav sections */}
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
                        {item.badge != null && (
                          <span className={styles.badge}>{item.badge}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* User profile footer */}
        <div className={styles.userArea}>
          <button className={styles.userInner} onClick={openAvatarModal}>
            <div className={styles.avatar} style={user.avatarStyle}>
              {user.avatarContent}
            </div>
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

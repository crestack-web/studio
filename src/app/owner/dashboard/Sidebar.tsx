'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NAV_SECTIONS } from './navItems';
import type { PageId } from './index';
import { MoIcon, NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, getFirestore, doc, getDoc } from 'firebase/firestore';

export function Sidebar() {
  const {
    sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar,
    activePage, navigateTo, user, openAvatarModal,
  } = useApp();
  const { t } = useTranslation();
  const [staffCount, setStaffCount] = useState(0);

  // Load staff count from Firestore
  useEffect(() => {
    const loadStaffCount = async () => {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        
        if (!currentUserId) {
          return;
        }

        // Get owner's business ID
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const businessId = ownerDoc.data()?.businessId || 'default';

        // Load staff from Firestore
        const staffCollection = collection(firestore, 'businesses', businessId, 'staff');
        const staffSnapshot = await getDocs(staffCollection);
        
        // Count only active staff (not banned or removed)
        const activeStaffCount = staffSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.status !== 'banned' && data.status !== 'removed';
        }).length;

        setStaffCount(activeStaffCount);
      } catch (error) {
        console.error('Error loading staff count:', error);
        // Fallback to localStorage
        const savedStaff = localStorage.getItem('staff-members');
        if (savedStaff) {
          try {
            const parsedStaff = JSON.parse(savedStaff);
            setStaffCount(parsedStaff.length);
          } catch (e) {
            console.error('Failed to load staff count from localStorage');
          }
        }
      }
    };

    loadStaffCount();
  }, []);

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
      'Reports': t('nav.reports'),
      'Bank Reconciliation': t('nav.bankReconciliation'),
      'Money Control': t('nav.moneyControl'),
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

  const handleNavigate = (pageId: PageId) => {
    // On mobile, navigate to mo-mobile instead of mo
    if (isMobile && pageId === 'mo') {
      navigateTo('mo-mobile');
    } else {
      navigateTo(pageId);
    }
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
                        onClick={() => handleNavigate(item.id as PageId)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className={`${styles.navIcon} ${styles[item.iconClass]}`}>
                          <NavIcons id={item.id} />
                        </span>
                        <span className={styles.navLabel} suppressHydrationWarning>
                          {translateNav(item.label)}
                        </span>
                        {item.id === 'staff' && staffCount > 0 && <span className={styles.badge}>{staffCount}</span>}
                        {item.badge != null && item.id !== 'staff' && <span className={styles.badge}>{item.badge}</span>}
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

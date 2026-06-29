'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NAV_SECTIONS, NAV_ITEM_REQUIREMENTS } from './navItems';
import type { PageId, NavSection } from './index';
import { MoIcon, NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, getFirestore, doc, getDoc } from 'firebase/firestore';
import { checkFeatureAccess as checkRegistryAccess } from '@/lib/featureRegistry';
import { Plan, BusinessCategory } from '@/lib/featureRegistry';

export function Sidebar() {
  const {
    sidebarCollapsed, sidebarOpen, toggleSidebar, closeSidebar,
    activePage, navigateTo, user, openAvatarModal,
  } = useApp();
  const { t } = useTranslation();
  const [staffCount, setStaffCount] = useState(0);
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featurePreferences, setFeaturePreferences] = useState<Record<string, boolean>>({});
  const [userPlan, setUserPlan] = useState<string>('starter');
  const [isInTrial, setIsInTrial] = useState(false);

  // Normalize feature name to registry format (legacy names → kebab-case)
  const normalizeFeatureName = (name: string): string => {
    const nameMap: Record<string, string> = {
      'Sales Recording': 'sales-recording',
      'Inventory Tracking': 'inventory-tracking',
      'Expense Management': 'expense-management',
      'Cash Flow Analysis': 'cashflow-tracking',
      'Profit/Loss Reports': 'reports-analytics',
      'Business Analytics': 'reports-analytics',
      'Credit Tracking': 'credit-tracking',
      'Ask MO AI Assistant': 'ask-mo-ai-assistant',
      'Staff Management': 'staff-management',
      'Menu Management': 'menu-management',
      'Ingredient Tracking': 'ingredient-tracking',
      'Expiry Alerts': 'expiry-alerts',
      'Production Tracking': 'production-tracking',
      'E-commerce Storefront': 'ecommerce-storefront',
      'Payroll Management': 'payroll-management',
      'Customer Management': 'customer-management',
      'Supplier Management': 'supplier-management',
      'Multi-branch Support': 'multi-branch-support',
      'Warehouse Management': 'warehouse-management',
      'Bank Reconciliation': 'bank-reconciliation',
      'Money Control': 'money-control',
      'Invoice Verification': 'invoice-verification',
    };
    return nameMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  // Load staff count, category, features, and plan from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { auth, firestore } = initializeFirebase();
        const currentUserId = auth.currentUser?.uid || '';
        
        if (!currentUserId) {
          return;
        }

        // Get owner's business ID and user data
        const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
        const businessId = ownerDoc.data()?.businessId || 'default';
        const category = ownerDoc.data()?.category || ownerDoc.data()?.selectedCategory || 'retail';
        const features = ownerDoc.data()?.selectedFeatures || [];
        const prefs = ownerDoc.data()?.featurePreferences || {};
        const plan = ownerDoc.data()?.plan || 'starter';
        const subscriptionStatus = ownerDoc.data()?.subscriptionStatus;
        const trialEndDate = ownerDoc.data()?.trialEndDate?.toDate();
        
        setUserCategory(category.toLowerCase());
        // Normalize feature names to registry format (kebab-case) for proper matching
        const normalizedFeatures = Array.isArray(features) 
          ? features.map(f => normalizeFeatureName(f))
          : [];
        setSelectedFeatures(normalizedFeatures);
        setFeaturePreferences(prefs);
        setUserPlan(plan);
        
        // Check if user is in trial
        const now = new Date();
        const inTrial = subscriptionStatus === 'trial' && trialEndDate && trialEndDate > now;
        setIsInTrial(inTrial);

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
        console.error('Error loading user data:', error);
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

    loadUserData();
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
      'Suppliers': t('nav.suppliers'),
      'Customers': t('nav.customers'),
      'Menu Management': t('nav.menuManagement'),
      'Ingredients': t('nav.ingredients'),
      'Expiry Alerts': t('nav.expiryAlerts'),
      'Production': t('nav.production'),
      'E-commerce': t('nav.ecommerce'),
      'Payroll': t('nav.payroll'),
      'Settings': t('nav.settings'),
    };
    return map[key] || key;
  };

  // Check if a nav item should be visible based on user's category, features, and plan
  const isNavItemVisible = (itemId: string): boolean => {
    const requirements = NAV_ITEM_REQUIREMENTS[itemId];
    if (!requirements) return true; // No restrictions

    // Normalize user data
    const normalizedPlan = userPlan as Plan;
    const normalizedCategory = (userCategory || 'other') as BusinessCategory;
    
    // Combine selectedFeatures (onboarding) and featurePreferences (settings page)
    // During trial, use selectedFeatures. After trial, use featurePreferences
    const enabledFeaturesSet = new Set(
      isInTrial ? selectedFeatures : 
      Object.keys(featurePreferences).filter(key => featurePreferences[key])
    );

    // Check feature requirements using registry
    if (requirements.requiredFeatures) {
      for (const featureName of requirements.requiredFeatures) {
        // Normalize feature name to registry format
        const normalizedFeatureName = normalizeFeatureName(featureName);
        const access = checkRegistryAccess(
          normalizedFeatureName,
          normalizedPlan,
          normalizedCategory,
          enabledFeaturesSet
        );
        
        // During trial, allow if feature was selected in onboarding
        if (isInTrial && !enabledFeaturesSet.has(normalizedFeatureName)) {
          return false;
        }
        
        // After trial, use registry access check which considers featurePreferences
        if (!isInTrial && !access.eligible) {
          return false;
        }
      }
    }

    // During trial, skip plan requirements if feature was selected
    if (!isInTrial) {
      // Check plan requirements (only enforced outside trial)
      if (requirements.requiredPlan) {
        const planHierarchy = { 'starter': 1, 'standard': 2, 'pro': 3 };
        const userPlanLevel = planHierarchy[normalizedPlan] || 1;
        const requiredPlanLevel = planHierarchy[requirements.requiredPlan] || 1;
        if (userPlanLevel < requiredPlanLevel) return false;
      }
    }

    // Check category requirements
    if (requirements.requiredCategories && userCategory) {
      if (!requirements.requiredCategories.includes(userCategory)) return false;
    }

    // Check category exclusions
    if (requirements.excludedCategories && userCategory) {
      if (requirements.excludedCategories.includes(userCategory)) return false;
    }

    return true;
  };

  // Filter nav sections based on visibility
  const filteredNavSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => isNavItemVisible(item.id))
  })).filter(section => section.items.length > 0);

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
          {filteredNavSections.map(section => (
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
            <div 
              className={styles.avatar} 
              style={{
                background: user.photoURL 
                  ? `url(${user.photoURL}) center/cover` 
                  : user.avatarStyle?.background,
                color: user.photoURL ? 'transparent' : user.avatarStyle?.color,
              }}
            >
              {!user.photoURL && user.avatarContent}
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


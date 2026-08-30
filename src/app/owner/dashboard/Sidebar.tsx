'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { NAV_SECTIONS, NAV_ITEM_REQUIREMENTS } from './navItems';
import type { PageId, NavSection } from './index';
import { MoIcon, NavIcons } from './NavIcons';
import styles from './Sidebar.module.css';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { getSupabase } from '@/lib/supabase';
import { fetchDocs } from '@/lib/supabase-client-data';
import { checkFeatureAccess as checkRegistryAccess } from '@/lib/featureRegistry';
import { Plan, BusinessCategory } from '@/lib/featureRegistry';

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

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
  /** True during trial OR post-trial grace extension — unlocks Standard-tier nav */
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
      'Payroll Management': 'payroll-management',
      'Customer Management': 'customer-management',
      'Supplier Management': 'supplier-management',
      'Multi-branch Support': 'multi-branch-support',
      'Warehouse Management': 'warehouse-management',
      'Bank Reconciliation': 'bank-reconciliation',
      'Money Control': 'money-control',
      'Document Templates': 'document-templates',
      'E-commerce Storefront': 'ecommerce-storefront',
    };
    return nameMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  /** Map onboarding label or id → canonical category id used by nav filters */
  const normalizeCategoryId = (raw?: string | null): string => {
    if (!raw) return 'other';
    const v = String(raw).trim().toLowerCase();
    const ids = [
      'retail', 'restaurant', 'grocery', 'fashion', 'electronics', 'manufacturing',
      'services', 'pharmacy', 'supermarket', 'cafe', 'wholesale', 'distributor',
      'healthcare', 'education', 'other',
    ];
    if (ids.includes(v)) return v;
    const labelMap: Record<string, string> = {
      'retail shop': 'retail',
      'retail store': 'retail',
      'restaurant': 'restaurant',
      'grocery store': 'grocery',
      'fashion': 'fashion',
      'electronics': 'electronics',
      'manufacturing': 'manufacturing',
      'services': 'services',
      'pharmacy': 'pharmacy',
      'supermarket': 'supermarket',
      'cafe': 'cafe',
      'wholesale': 'wholesale',
      'distributor': 'distributor',
      'healthcare': 'healthcare',
      'education': 'education',
      'other': 'other',
      'food service': 'restaurant',
    };
    for (const [key, id] of Object.entries(labelMap)) {
      if (v === key || v.includes(key)) return id;
    }
    return 'other';
  };

  // Load staff count, category, features, and plan from Supabase (not Firebase)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUserId = getAuthCurrentUser()?.uid || user?.id || '';
        if (!currentUserId) return;

        const supabase = getSupabase();
        const { data: ownerDoc, error } = await supabase
          .from('users')
          .select(
            'business_id, businessId, plan, role, subscription_status, trial_end_date, grace_end_date, subscription_end_date, lifetime_access, selected_category, category, selected_features, selectedFeatures, feature_preferences, featurePreferences, metadata'
          )
          .eq('id', currentUserId)
          .maybeSingle();

        if (error) {
          console.warn('[Sidebar] Supabase user load failed:', error.message);
        }

        const meta =
          ownerDoc?.metadata && typeof ownerDoc.metadata === 'object'
            ? (ownerDoc.metadata as Record<string, any>)
            : {};

        const businessId =
          ownerDoc?.business_id ||
          (ownerDoc as any)?.businessId ||
          meta.businessId ||
          user?.businessId ||
          '';

        const rawCategory =
          ownerDoc?.selected_category ||
          (ownerDoc as any)?.selectedCategory ||
          ownerDoc?.category ||
          meta.selectedCategory ||
          meta.category ||
          'retail';

        const featuresRaw =
          ownerDoc?.selected_features ||
          (ownerDoc as any)?.selectedFeatures ||
          meta.selectedFeatures ||
          meta.selected_features ||
          [];
        const features = Array.isArray(featuresRaw) ? featuresRaw : [];

        const prefsRaw =
          ownerDoc?.feature_preferences ||
          (ownerDoc as any)?.featurePreferences ||
          meta.featurePreferences ||
          meta.feature_preferences ||
          {};
        const prefs =
          prefsRaw && typeof prefsRaw === 'object' && !Array.isArray(prefsRaw)
            ? (prefsRaw as Record<string, boolean>)
            : {};

        const plan =
          (ownerDoc?.plan as string) ||
          (meta.plan as string) ||
          (user as any)?.plan ||
          'starter';

        const subscriptionStatus =
          (ownerDoc?.subscription_status as string) ||
          (meta.subscriptionStatus as string) ||
          (meta.subscription_status as string) ||
          '';

        const trialEndDate =
          asDate(ownerDoc?.trial_end_date) ||
          asDate(meta.trialEndDate) ||
          asDate(meta.trial_end_date);
        const graceEndDate =
          asDate(ownerDoc?.grace_end_date) ||
          asDate(meta.graceEndDate) ||
          asDate(meta.grace_end_date);
        const subscriptionEndDate =
          asDate(ownerDoc?.subscription_end_date) ||
          asDate(meta.subscriptionEndDate);
        const lifetimeAccess =
          (ownerDoc as any)?.lifetime_access === true || meta.lifetimeAccess === true;

        setUserCategory(normalizeCategoryId(rawCategory));
        const normalizedFeatures = features.map((f: string) => normalizeFeatureName(String(f)));
        setSelectedFeatures(normalizedFeatures);
        setFeaturePreferences(prefs);
        setUserPlan(plan);

        // Trial OR grace extension → treat as in-trial for Standard-tier nav visibility
        // Active paid subscription also keeps full access via plan field
        const now = new Date();
        const inTrialWindow =
          (subscriptionStatus === 'trial' && trialEndDate && trialEndDate > now) ||
          (!subscriptionStatus && trialEndDate && trialEndDate > now);
        const inGraceWindow =
          subscriptionStatus === 'grace' ||
          ((subscriptionStatus === 'expired' || subscriptionStatus === 'pending_payment') &&
            graceEndDate &&
            graceEndDate > now) ||
          (trialEndDate &&
            trialEndDate <= now &&
            graceEndDate &&
            graceEndDate > now);
        const isActivePaid =
          lifetimeAccess ||
          (subscriptionStatus === 'active' &&
            (!subscriptionEndDate || subscriptionEndDate > now));

        setIsInTrial(Boolean(inTrialWindow || inGraceWindow || isActivePaid));

        // Staff count from Supabase business staff collection
        if (businessId) {
          try {
            const staffRows = await fetchDocs(`businesses/${businessId}/staff`);
            const activeStaffCount = (staffRows || []).filter((row: any) => {
              const status = String(row.status || '').toLowerCase();
              return status !== 'banned' && status !== 'removed';
            }).length;
            setStaffCount(activeStaffCount);
          } catch (staffErr) {
            console.warn('[Sidebar] staff count load failed', staffErr);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        try {
          const savedStaff = localStorage.getItem('staff-members');
          if (savedStaff) {
            const parsedStaff = JSON.parse(savedStaff);
            setStaffCount(parsedStaff.length);
          }
        } catch {
          /* ignore */
        }
      }
    };

    loadUserData();
  }, [user?.id, user?.businessId]);

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
      'Warehouse': 'Warehouse',
      'Stock Transfers': 'Stock Transfers',
      'Menu Management': t('nav.menuManagement'),
      'Ingredients': t('nav.ingredients'),
      'Expiry Alerts': t('nav.expiryAlerts'),
      'Production': t('nav.production'),
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
    // During trial/grace/active: prefer selectedFeatures when prefs empty
    const enabledFeaturesSet = new Set(
      isInTrial
        ? (selectedFeatures.length
            ? selectedFeatures
            : Object.keys(featurePreferences).filter((key) => featurePreferences[key]))
        : Object.keys(featurePreferences).filter((key) => featurePreferences[key]).length
          ? Object.keys(featurePreferences).filter((key) => featurePreferences[key])
          : selectedFeatures
    );

    // Trial / grace users get at least Standard-tier visibility so onboarding is not blocked
    const planHierarchy = { starter: 1, standard: 2, pro: 3 } as const;
    const effectivePlan: Plan = isInTrial
      ? normalizedPlan === 'pro'
        ? 'pro'
        : 'standard'
      : normalizedPlan;

    // requiredFeatures is OR: any matching selected/enabled feature unlocks the item
    if (requirements.requiredFeatures && requirements.requiredFeatures.length > 0) {
      const normalizedRequired = requirements.requiredFeatures.map(normalizeFeatureName);
      const hasAnySelected = normalizedRequired.some((f) => enabledFeaturesSet.has(f));

      if (isInTrial) {
        // During trial/grace: show if selected in onboarding OR allowed on effective trial plan
        if (!hasAnySelected) {
          let anyEligible = false;
          for (const featureName of requirements.requiredFeatures) {
            const normalizedFeatureName = normalizeFeatureName(featureName);
            const access = checkRegistryAccess(
              normalizedFeatureName,
              effectivePlan,
              normalizedCategory,
              new Set([normalizedFeatureName, ...enabledFeaturesSet])
            );
            if (access.eligible) {
              anyEligible = true;
              break;
            }
          }
          if (!anyEligible) return false;
        }
      } else {
        let anyEligible = false;
        for (const featureName of requirements.requiredFeatures) {
          const normalizedFeatureName = normalizeFeatureName(featureName);
          if (enabledFeaturesSet.has(normalizedFeatureName)) {
            anyEligible = true;
            break;
          }
          const access = checkRegistryAccess(
            normalizedFeatureName,
            effectivePlan,
            normalizedCategory,
            enabledFeaturesSet
          );
          if (access.eligible) {
            anyEligible = true;
            break;
          }
        }
        if (!anyEligible) return false;
      }
    }

    // Plan requirements: use effectivePlan so trial/grace is not blocked as starter
    if (requirements.requiredPlan) {
      const userPlanLevel = planHierarchy[effectivePlan] || 1;
      const requiredPlanLevel = planHierarchy[requirements.requiredPlan] || 1;
      if (userPlanLevel < requiredPlanLevel) return false;
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
  const filteredNavSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavItemVisible(item.id)),
  })).filter((section) => section.items.length > 0);

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
        className={[
          styles.sidebar,
          sidebarCollapsed ? styles.collapsed : '',
          sidebarOpen ? styles.open : '',
        ].join(' ')}
        aria-label="Main navigation"
      >
        <div className={styles.top}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}>
              <img
                src="/email-logo.png"
                alt="Busmo Logo"
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
              />
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
          {filteredNavSections.map((section) => (
            <div key={section.label}>
              <div className={styles.sectionWrap}>
                <span className={styles.sectionLabel} suppressHydrationWarning>
                  {translateNav(section.label)}
                </span>
              </div>
              <ul className={styles.navList} role="list">
                {section.items.map((item) => {
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
                        {item.id === 'staff' && staffCount > 0 && (
                          <span className={styles.badge}>{staffCount}</span>
                        )}
                        {item.badge != null && item.id !== 'staff' && (
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
              <div className={styles.userRole}>
                {user.role} · {user.plan}
              </div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}

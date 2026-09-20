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
import { CATEGORY_FEATURES } from '@/app/welcome/signup/onboarding-constants';
import { isRestaurantBusiness, resolveBusinessCategoryId } from './utils/restaurantHelpers';
import { resolveUserAccess, USER_ACCESS_SELECT } from '@/lib/subscription/resolve-access';

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
      'Margin Calculator': 'margin-calculator',
      'Can I Buy This?': 'can-i-buy',
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
      'Material Collection': 'material-collection',
      'Jobs Management': 'jobs-management',
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
      'healthcare', 'education', 'jobs', 'recycling_material_collection', 'other',
    ];
    if (ids.includes(v)) return v;
    // Fuzzy restaurant / cafe first (common mis-labels after migration)
    if (
      v.includes('restaurant') ||
      v.includes('resturant') ||
      v.includes('food service') ||
      v.includes('catering') ||
      v === 'food' ||
      v.includes('food &')
    ) {
      return 'restaurant';
    }
    if (v.includes('cafe') || v.includes('café') || v.includes('coffee')) {
      return 'cafe';
    }
    if (
      v.includes('recycling') ||
      v.includes('material_collection') ||
      v.includes('material collection') ||
      v.includes('pet collection')
    ) {
      return 'recycling_material_collection';
    }
    if (v === 'jobs' || v.includes('jobs &') || v.includes('jobs and projects')) {
      return 'jobs';
    }
    const labelMap: Record<string, string> = {
      'retail shop': 'retail',
      'retail store': 'retail',
      'grocery store': 'grocery',
      'fashion': 'fashion',
      'electronics': 'electronics',
      'manufacturing': 'manufacturing',
      'services': 'services',
      'pharmacy': 'pharmacy',
      'supermarket': 'supermarket',
      'wholesale': 'wholesale',
      'distributor': 'distributor',
      'healthcare': 'healthcare',
      'education': 'education',
      'jobs & projects': 'jobs',
      'recycling & material collection': 'recycling_material_collection',
      'other': 'other',
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
          .select(USER_ACCESS_SELECT)
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
          meta.selectedCategory ||
          meta.category ||
          meta.categoryLabel ||
          meta.businessType ||
          meta.businessCategory ||
          '';

        const parseFeatureList = (raw: unknown): string[] => {
          if (Array.isArray(raw)) return raw.map(String);
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
              return raw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            }
          }
          return [];
        };

        let features = parseFeatureList(
          meta.selectedFeatures ??
            meta.selected_features ??
            (ownerDoc as any)?.selected_features ??
            (ownerDoc as any)?.selectedFeatures
        );

        const prefsRaw =
          meta.featurePreferences ||
          meta.feature_preferences ||
          {};
        const prefs =
          prefsRaw && typeof prefsRaw === 'object' && !Array.isArray(prefsRaw)
            ? (prefsRaw as Record<string, boolean>)
            : {};

        // Collect category signals from user + business
        const candidates: string[] = [];
        const pushCandidate = (v: unknown) => {
          if (v == null) return;
          const s = String(v).trim();
          if (s) candidates.push(s);
        };
        pushCandidate(rawCategory);
        pushCandidate(meta.selectedCategory);
        pushCandidate(meta.category);
        pushCandidate(meta.categoryLabel);
        pushCandidate(meta.businessType);

        if (businessId) {
          try {
            const { data: biz } = await supabase
              .from('businesses')
              .select('category, industry, metadata, name')
              .eq('id', businessId)
              .maybeSingle();
            const bizMeta =
              biz?.metadata && typeof biz.metadata === 'object'
                ? (biz.metadata as Record<string, any>)
                : {};
            pushCandidate(biz?.category);
            pushCandidate(biz?.industry);
            pushCandidate(biz?.name);
            pushCandidate(bizMeta.selectedCategory);
            pushCandidate(bizMeta.category);
            pushCandidate(bizMeta.categoryLabel);
            pushCandidate(bizMeta.businessType);
            pushCandidate(bizMeta.businessCategory);
          } catch (bizErr) {
            console.warn('[Sidebar] business category load failed', bizErr);
          }
        }

        // Prefer explicit specialty categories, then restaurant/cafe
        let resolvedCategory = 'other';
        const normalizedCandidates = candidates.map((c) => normalizeCategoryId(c));
        if (normalizedCandidates.includes('recycling_material_collection')) {
          resolvedCategory = 'recycling_material_collection';
        } else if (normalizedCandidates.includes('jobs')) {
          resolvedCategory = 'jobs';
        } else if (normalizedCandidates.includes('restaurant')) {
          resolvedCategory = 'restaurant';
        } else if (normalizedCandidates.includes('cafe')) {
          resolvedCategory = 'cafe';
        } else if (normalizedCandidates.length) {
          resolvedCategory =
            normalizedCandidates.find((c) => c !== 'other') || normalizedCandidates[0] || 'other';
        }

        if (businessId) {
          try {
            const fromBiz = await resolveBusinessCategoryId(businessId);
            if (fromBiz && fromBiz !== 'other') {
              resolvedCategory = fromBiz;
            } else if (
              resolvedCategory !== 'recycling_material_collection' &&
              resolvedCategory !== 'jobs'
            ) {
              const restaurant = await isRestaurantBusiness(businessId);
              if (restaurant && resolvedCategory !== 'cafe') {
                resolvedCategory = 'restaurant';
              }
            }
          } catch (_) {
            /* ignore */
          }
        }

        setUserCategory(resolvedCategory);
        console.info('[Sidebar] resolved category', {
          resolvedCategory,
          candidates: candidates.slice(0, 8),
          businessId: businessId ? String(businessId).slice(0, 8) + '…' : null,
        });

        // Always union category default features for specialty categories so gated nav stays available
        const categoryDefaults = CATEGORY_FEATURES[resolvedCategory] || CATEGORY_FEATURES.other || [];
        const forceCategoryDefaults = [
          'restaurant', 'cafe', 'jobs', 'recycling_material_collection',
        ].includes(resolvedCategory);
        if (!features.length || forceCategoryDefaults) {
          const merged = new Set([
            ...features.map(String),
            ...categoryDefaults.map(String),
          ]);
          features = Array.from(merged);
        }

        const normalizedFeatures = features.map((f: string) => normalizeFeatureName(String(f)));
        setSelectedFeatures(normalizedFeatures);
        setFeaturePreferences(prefs);
        const access = resolveUserAccess(ownerDoc || { metadata: meta, plan: (user as any)?.plan });
        setUserPlan(access.effectivePlanForNav);
        setIsInTrial(access.hasFullAccess);
        console.info('[Sidebar] access', {
          plan: access.plan,
          effectivePlanForNav: access.effectivePlanForNav,
          status: access.subscriptionStatus || null,
          hasFullAccess: access.hasFullAccess,
          trialEnd: access.trialEndDate?.toISOString?.() || null,
        });

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
      'Material Collection': 'Material Collection',
      'Jobs & Projects': 'Jobs & Projects',
    };
    return map[key] || key;
  };

  // Check if a nav item should be visible based on user's category, features, and plan
  const isNavItemVisible = (itemId: string): boolean => {
    const requirements = NAV_ITEM_REQUIREMENTS[itemId];
    if (!requirements) return true;

    const normalizedPlan = userPlan as Plan;
    const normalizedCategory = (userCategory || 'other') as BusinessCategory;

    const categoryDefaults = (
      CATEGORY_FEATURES[normalizedCategory] ||
      CATEGORY_FEATURES.other ||
      []
    ).map((f) => normalizeFeatureName(f));

    const prefEnabled = Object.keys(featurePreferences)
      .filter((key) => featurePreferences[key])
      .map((key) => normalizeFeatureName(key));

    const enabledFeaturesSet = new Set<string>([
      ...(isInTrial || selectedFeatures.length === 0 ? categoryDefaults : []),
      ...selectedFeatures,
      ...prefEnabled,
    ]);

    const planHierarchy = { starter: 1, standard: 2, pro: 3 } as const;
    const effectivePlan: Plan = isInTrial
      ? normalizedPlan === 'pro'
        ? 'pro'
        : 'standard'
      : normalizedPlan;

    if (requirements.requiredFeatures && requirements.requiredFeatures.length > 0) {
      const normalizedRequired = requirements.requiredFeatures.map(normalizeFeatureName);
      const hasAnySelected = normalizedRequired.some((f) => enabledFeaturesSet.has(f));

      if (!hasAnySelected) {
        if (isInTrial) {
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
        } else {
          return false;
        }
      }
    }

    if (requirements.requiredPlan) {
      const userPlanLevel = planHierarchy[effectivePlan] || 1;
      const requiredPlanLevel = planHierarchy[requirements.requiredPlan] || 1;
      if (userPlanLevel < requiredPlanLevel) return false;
    }

    const restaurantNavIds = new Set(['menu-management', 'ingredient-tracking', 'expiry-alerts']);
    const isRestaurantLike =
      normalizedCategory === 'restaurant' ||
      normalizedCategory === 'cafe' ||
      categoryDefaults.includes('menu-management') ||
      categoryDefaults.includes('ingredient-tracking');

    if ((itemId === 'warehouse' || itemId === 'stock-transfers') && isRestaurantLike) {
      return false;
    }

    if (restaurantNavIds.has(itemId) && isRestaurantLike) {
      if (requirements.requiredPlan) {
        const userPlanLevel = planHierarchy[effectivePlan] || 1;
        const requiredPlanLevel = planHierarchy[requirements.requiredPlan] || 1;
        if (userPlanLevel < requiredPlanLevel) return false;
      }
      return true;
    }

    if (requirements.requiredCategories && userCategory) {
      if (!requirements.requiredCategories.includes(userCategory)) return false;
    }

    if (requirements.excludedCategories && userCategory) {
      if (requirements.excludedCategories.includes(userCategory)) return false;
    }

    return true;
  };

  const filteredNavSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavItemVisible(item.id)),
  })).filter((section) => section.items.length > 0);

  const handleNavigate = (pageId: PageId) => {
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
            {!sidebarCollapsed && <span className={styles.logoText}>Busmo</span>}
          </div>
          <button type="button" className={styles.collapseBtn} onClick={toggleSidebar} aria-label="Collapse sidebar">
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>

        <div className={styles.scroll}>
          {filteredNavSections.map((section) => (
            <div key={String(section.label)} className={styles.sectionWrap}>
              {!sidebarCollapsed && (
                <div className={styles.sectionLabel}>{translateNav(section.label)}</div>
              )}
              <ul className={styles.navList}>
                {section.items.map((item) => {
                  const isActive =
                    activePage === item.id ||
                    (item.id === 'mo' && activePage === 'mo-mobile');
                  const badge =
                    item.id === 'staff' && staffCount > 0 ? staffCount : item.badge;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={[styles.navItem, isActive ? styles.active : ''].join(' ')}
                        onClick={() => {
                          handleNavigate(item.id as PageId);
                          closeSidebar();
                        }}
                        title={item.tip}
                      >
                        <span className={styles.navIcon}>
                          {item.iconClass === 'mo' ? (
                            <MoIcon />
                          ) : (
                            (NavIcons as any)[item.iconClass] || null
                          )}
                        </span>
                        {!sidebarCollapsed && (
                          <span className={styles.navLabel}>{translateNav(item.label)}</span>
                        )}
                        {!sidebarCollapsed && badge != null && badge !== '' && (
                          <span className={styles.badge}>{badge}</span>
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
          <button type="button" className={styles.userInner} onClick={openAvatarModal}>
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
            {!sidebarCollapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.name}</div>
                <div className={styles.userRole}>
                  {user.role} · {user.plan}
                </div>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

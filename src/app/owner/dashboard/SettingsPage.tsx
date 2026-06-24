'use client';

// ═══════════════════════════════════════════
//  BUSMO — Settings Page (with Currency)
//  Sections:
//   1. Language (10 languages)
//   2. Currency (60+ currencies + country picker)
//   3. Appearance (theme)
//   4. Business Profile
//   5. Notifications
//   6. Privacy & Data
// ═══════════════════════════════════════════

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { LANGUAGES, LangCode } from './translations';
import { CURRENCIES_SORTED, COUNTRY_LIST, formatMoney } from './currencies';
import { initializeFirebase } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ReceiptThemeConfig } from './ReceiptThemeConfig';
import { isAdmin } from '@/lib/adminAuth';
import { 
  getAllFeatures, 
  getFeaturesByPlan, 
  checkFeatureAccess, 
  Plan, 
  BusinessCategory,
  Feature as RegistryFeature,
  getRecommendedFeatures,
} from '@/lib/featureRegistry';
import { Settings, Globe, DollarSign, Palette, User, Building, FileText, Bell, Lock, Sun, Moon, Search, Eye, ArrowRight, ShieldAlert, LogOut, Zap, LayoutDashboard, Package, CheckCircle2, XCircle, Layers, TrendingUp, Truck, ShoppingCart, ChefHat, Wrench, ShoppingBag, Mail, Briefcase, Gift, Sparkles, ClipboardList, AlertTriangle, UserCircle, Activity, UserCheck, UserCheck2, Landmark, RefreshCw, Upload, FileCheck, Menu } from 'lucide-react';
import styles from './SettingsPage.module.css';

// ── Icon Mapping ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  'inventory-tracking': <Package size={20} />,
  'warehouse-management': <Layers size={20} />,
  'stock-transfers': <ArrowRight size={20} />,
  'sales-recording': <ShoppingCart size={20} />,
  'multi-payment': <DollarSign size={20} />,
  'reports-analytics': <LayoutDashboard size={20} />,
  'cashflow-tracking': <TrendingUp size={20} />,
  'statement-history': <FileText size={20} />,
  'ask-mo-ai-assistant': <Zap size={20} />,
  'supplier-management': <Truck size={20} />,
  'multi-branch-support': <Building size={20} />,
  'expense-management': <FileText size={20} />,
  'credit-tracking': <UserCheck size={20} />,
  'money-control': <ShieldAlert size={20} />,
  'bank-accounts': <Landmark size={20} />,
  'bank-reconciliation': <RefreshCw size={20} />,
  'bank-statement-import': <Upload size={20} />,
  'invoice-verification': <FileCheck size={20} />,
  'staff-management': <User size={20} />,
  'staff-activity-tracking': <Activity size={20} />,
  'staff-accountability': <UserCheck2 size={20} />,
  'payroll-management': <DollarSign size={20} />,
  'menu-management': <Menu size={20} />,
  'ingredient-tracking': <ChefHat size={20} />,
  'production-tracking': <Wrench size={20} />,
  'ecommerce-storefront': <ShoppingBag size={20} />,
  'email-campaigns': <Mail size={20} />,
  'audit-trail': <ClipboardList size={20} />,
  'expiry-alerts': <AlertTriangle size={20} />,
  'customer-management': <UserCircle size={20} />,
  'access-capital': <Briefcase size={20} />,
  'referrals': <Gift size={20} />,
  'business-services': <Sparkles size={20} />,
};

// ── Toggle ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: {
  checked: boolean; onChange: (v: boolean) => void; id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

// ════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { theme, toggleTheme, showToast, user } = useApp();
  const { t, lang, setLang } = useTranslation();
  const {
    currency,
    currencyCode,
    setCurrencyCode,
    setCurrencyByCountry,
    formatMoney: fmt,
  } = useCurrency();

  // Section visibility state
  const [activeSection, setActiveSection] = useState('general');
  const [sectionVisibility, setSectionVisibility] = useState({
    language: true,
    currency: true,
    appearance: true,
    account: true,
    business: true,
    receipt: true,
    notifications: true,
    privacy: true,
    features: true,
  });

  const sections = [
    { id: 'general', label: 'General', icon: <Settings size={18} /> },
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
    { id: 'currency', label: 'Currency', icon: <DollarSign size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'business', label: 'Business', icon: <Building size={18} /> },
    { id: 'receipt', label: 'Receipt', icon: <FileText size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={18} /> },
    { id: 'features', label: 'Features', icon: <Package size={18} /> },
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      const { auth } = initializeFirebase();
      await signOut(auth);
      showToast('Logged out successfully');
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Failed to logout');
    }
  };

  // ── Currency section state ─────────────────────────────
  const [currencySearch, setCurrencySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('NG');

  const filteredCurrencies = useMemo(() => {
    const q = currencySearch.toLowerCase();
    if (!q) return CURRENCIES_SORTED;
    return CURRENCIES_SORTED.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    );
  }, [currencySearch]);

  // ── Notification toggles ───────────────────────────────
  const [notif, setNotif] = useState({
    sales: true, expenses: true, lowStock: true, weekly: false, marketing: false,
  });

  // Load notification preferences from Firestore
  useEffect(() => {
    const loadNotifPreferences = async () => {
      try {
        const { firestore } = initializeFirebase();
        const user = getAuth().currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const emailPrefs = userDoc.data().emailPreferences;
            if (emailPrefs) {
              setNotif(emailPrefs);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };

    loadNotifPreferences();
  }, []);

  // Save notification preferences to Firestore
  const handleNotifChange = async (key: string, value: boolean) => {
    setNotif(prev => ({ ...prev, [key]: value }));
    try {
      const { firestore } = initializeFirebase();
      const user = getAuth().currentUser;
      if (user) {
        await updateDoc(doc(firestore, 'users', user.uid), {
          emailPreferences: {
            ...notif,
            [key]: value,
          }
        });
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  };

  // ── Privacy ────────────────────────────────────────────
  const [analytics, setAnalytics] = useState(true);

  // ── Business profile ───────────────────────────────────
  const [biz, setBiz] = useState({
    name: '',
    category: '',
    phone: '',
    email: '',
    address: '',
  });

  // ── Subscription info ───────────────────────────────────
  const [subscription, setSubscription] = useState({
    status: '',
    plan: '',
    endDate: null as Date | null,
    lastPaymentAmount: 0,
  });
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // ── Feature Preferences ───────────────────────────────────
  const [featurePreferences, setFeaturePreferences] = useState<Record<string, boolean>>({});
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState<RegistryFeature[]>([]);

  // Load feature preferences from Firestore using registry
  useEffect(() => {
    const loadFeaturePreferences = async () => {
      try {
        const { firestore } = initializeFirebase();
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const prefs = data.featurePreferences || {};
            const userPlan = (data.plan || 'starter') as Plan;
            const businessCategory = (data.category || data.businessType || 'other') as BusinessCategory;
            const selectedFeatures = data.selectedFeatures || [];
            
            // Get features available for user's plan
            const planFeatures = getFeaturesByPlan(userPlan);
            
            // Filter by business category - only show features that are relevant
            const categoryFeatures = planFeatures.filter(feature => {
              // If feature has no category restrictions at all, it's a general feature - show it
              if (!feature.requiredCategories && !feature.excludedCategories) return true;
              
              // If feature is explicitly excluded for this category, don't show it
              if (feature.excludedCategories?.includes(businessCategory)) return false;
              
              // If feature requires specific categories, only show if user's category is in the list
              if (feature.requiredCategories && !feature.requiredCategories.includes(businessCategory)) return false;
              
              // If feature has excluded categories but user's category is not excluded, show it
              // This means the feature is available for this category
              return true;
            });
            
            setAvailableFeatures(categoryFeatures);
            
            // Initialize preferences based on selected features from onboarding
            const initialPrefs: Record<string, boolean> = {};
            const enabledFeaturesSet = new Set(selectedFeatures);
            
            categoryFeatures.forEach(feature => {
              if (feature.isOptional) {
                // For optional features, check if user selected them during onboarding
                initialPrefs[feature.id] = enabledFeaturesSet.has(feature.id) || (prefs[feature.id] !== undefined ? prefs[feature.id] : false);
              } else {
                // For essential features, always enabled
                initialPrefs[feature.id] = true;
              }
            });
            
            setFeaturePreferences(initialPrefs);
          }
        }
      } catch (error) {
        console.error('Failed to load feature preferences:', error);
      }
    };

    loadFeaturePreferences();
  }, [subscription.plan, biz.category]);

  // Save feature preferences to Firestore
  const handleFeatureToggle = async (featureId: string, enabled: boolean) => {
    setFeaturePreferences(prev => ({ ...prev, [featureId]: enabled }));
    
    try {
      setIsSavingFeatures(true);
      const { firestore } = initializeFirebase();
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          featurePreferences: {
            ...featurePreferences,
            [featureId]: enabled,
          }
        });
        showToast(`Feature ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error('Failed to save feature preferences:', error);
      showToast('Failed to update feature preferences');
    } finally {
      setIsSavingFeatures(false);
    }
  };

  // Check if feature is locked (requires upgrade)
  const isFeatureLocked = (feature: RegistryFeature): boolean => {
    const userPlan = (subscription.plan || 'starter') as Plan;
    return !feature.requiredPlans.includes(userPlan);
  };

  // Get required plan for locked feature
  const getRequiredPlan = (feature: RegistryFeature): Plan => {
    return feature.requiredPlans[0];
  };

  // Load business profile and subscription from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const { firestore } = initializeFirebase();
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Load business profile
          if (user.businessId) {
            const businessDoc = await getDoc(doc(firestore, 'businesses', user.businessId));
            if (businessDoc.exists()) {
              const data = businessDoc.data();
              setBiz({
                name: data.businessName || '',
                category: data.category || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
              });
            }
          }

          // Load subscription info
          const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setSubscription({
              status: data.subscriptionStatus || 'trial',
              plan: data.plan || 'starter',
              endDate: data.subscriptionEndDate?.toDate() || null,
              lastPaymentAmount: data.lastPaymentAmount || 0,
            });
          }

          // Check if user is admin - only for whitelisted emails
          const adminCheck = await isAdmin();
          console.log('Settings admin check result:', adminCheck, 'for user:', user.email);
          setIsUserAdmin(adminCheck);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [user.businessId, user.id]);

  // ── Handlers ───────────────────────────────────────────
  const handleCountryChange = (cc: string) => {
    setSelectedCountry(cc);
    setCurrencyByCountry(cc);
    const c = CURRENCIES_SORTED.find(cur => cur.countries.includes(cc));
    if (c) showToast(`Currency set to ${c.name} (${c.symbol})`);
  };

  const handleCurrencySelect = (code: string) => {
    setCurrencyCode(code);
    setCurrencySearch('');
    const c = CURRENCIES_SORTED.find(cur => cur.code === code);
    if (c) showToast(`Currency set to ${c.name} (${c.symbol})`);
  };

  const handleSave = () => showToast(`${t('settings.changesSaved')}`);

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsCancellingSubscription(true);

    try {
      const { firestore } = initializeFirebase();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          subscriptionStatus: 'cancelled',
          cancellationRequestedAt: new Date(),
        });
        showToast('Subscription cancellation requested. You will retain access until the end of your billing period.');
        setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showToast('Failed to cancel subscription. Please contact support.');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  // Live preview amounts
  const PREVIEW = [1000, 25000, 1_250_000];

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <p className={styles.subtitle}>{t('settings.subtitle')}</p>
      </div>

      {/* ── Choice Chips for Section Selection ─────────────────────────────── */}
      <div className={styles.chipsContainer}>
        {sections.map(section => (
          sectionVisibility[section.id as keyof typeof sectionVisibility] && (
            <button
              key={section.id}
              className={`${styles.chip} ${activeSection === section.id ? styles.chipActive : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className={styles.chipIcon}>{typeof section.icon === 'string' ? section.icon : section.icon}</span>
              <span className={styles.chipLabel}>{section.label}</span>
            </button>
          )
        ))}
      </div>

      {/* ── Section Visibility Toggles ─────────────────────────────── */}
      <div className={styles.visibilityToggles}>
        <span className={styles.visibilityLabel}>Show sections:</span>
        {sections.map(section => (
          <label key={section.id} className={styles.visibilityToggle}>
            <input
              type="checkbox"
              checked={sectionVisibility[section.id as keyof typeof sectionVisibility]}
              onChange={(e) => setSectionVisibility(prev => ({ ...prev, [section.id]: e.target.checked }))}
              className={styles.visibilityCheckbox}
            />
            <span className={styles.visibilityIcon}>{typeof section.icon === 'string' ? section.icon : section.icon}</span>
          </label>
        ))}
      </div>

      {/* ════════════════════════════════════════
          SECTION 1 · LANGUAGE
      ════════════════════════════════════════ */}
      {activeSection === 'language' && sectionVisibility.language && (
        <Section title={t('settings.section.language')}>
        <p className={styles.rowDesc}>{t('settings.languageDesc')}</p>
        <div className={styles.langGrid}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`${styles.langCard} ${lang === l.code ? styles.langCardActive : ''}`}
              onClick={() => setLang(l.code as LangCode)}
            >
              <span className={styles.langFlag}>{l.flag}</span>
              <span className={styles.langNative}>{l.name}</span>
              <span className={styles.langEnglish}>{l.englishName}</span>
              {l.rtl && <span className={styles.rtlBadge}>RTL</span>}
              {lang === l.code && <span className={styles.langCheck}>✓</span>}
            </button>
          ))}
        </div>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 2 · CURRENCY  ← NEW
      ════════════════════════════════════════ */}
      {activeSection === 'currency' && sectionVisibility.currency && (
        <Section title={t('settings.section.currency')}>

        <p className={styles.rowDesc}>
          {t('settings.currencyDesc')}
        </p>

        {/* ── Currently active currency banner ── */}
        <div className={styles.activeCurrency}>
          <span className={styles.activeCurrencyFlag}>{currency.flag}</span>
          <div className={styles.activeCurrencyInfo}>
            <div className={styles.activeCurrencyName}>{currency.name}</div>
            <div className={styles.activeCurrencyMeta}>
              {currency.code} · {currency.symbol} · {currency.region}
            </div>
          </div>
          <div className={styles.activeCurrencyExample}>{fmt(48600)}</div>
        </div>

        {/* ── Step 1: Country picker ─────────── */}
        <div className={styles.currencyBlock}>
          <div className={styles.currencyBlockTitle}>
            <span className={styles.stepBadge}>1</span>
            <span>{t('settings.currencyAutoDetect')}</span>
          </div>
          <div className={styles.countryRow}>
            <select
              className={styles.select}
              value={selectedCountry}
              onChange={e => handleCountryChange(e.target.value)}
            >
              {COUNTRY_LIST.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <div className={styles.autoChip}>
              <Zap size={14} style={{ marginRight: '4px' }} />
              {CURRENCIES_SORTED.find(c => c.countries.includes(selectedCountry))?.symbol ?? '—'}&nbsp;
              {CURRENCIES_SORTED.find(c => c.countries.includes(selectedCountry))?.code ?? '—'}
            </div>
          </div>
        </div>

        {/* ── Step 2: Manual search ──────────── */}
        <div className={styles.currencyBlock}>
          <div className={styles.currencyBlockTitle}>
            <span className={styles.stepBadge}>2</span>
            <span>{t('settings.currencyManual')}</span>
          </div>
          <div className={styles.currencySearchWrap}>
            <span className={styles.currencySearchIcon}><Search size={16} /></span>
            <input
              className={styles.currencySearch}
              placeholder={t('settings.currencySearchPlaceholder')}
              value={currencySearch}
              onChange={e => setCurrencySearch(e.target.value)}
            />
            {currencySearch && (
              <button className={styles.clearSearch} onClick={() => setCurrencySearch('')}>×</button>
            )}
          </div>

          <div className={styles.currencyGrid}>
            {filteredCurrencies.map(c => (
              <button
                key={c.code}
                className={`${styles.currencyCard} ${currencyCode === c.code ? styles.currencyCardActive : ''}`}
                onClick={() => handleCurrencySelect(c.code)}
              >
                <div className={styles.currencyCardTop}>
                  <span className={styles.currencyFlag}>{c.flag}</span>
                  <span className={styles.currencyCode}>{c.code}</span>
                  {currencyCode === c.code && <span className={styles.currencyCheck}>✓</span>}
                </div>
                <div className={styles.currencySymbolLarge}>{c.symbol}</div>
                <div className={styles.currencyCardName}>{c.name}</div>
                <div className={styles.currencyCardRegion}>{c.region}</div>
              </button>
            ))}
            {filteredCurrencies.length === 0 && (
              <p className={styles.noResults}>{t('settings.currencyNoResults')} "{currencySearch}"</p>
            )}
          </div>
        </div>

        {/* ── Live Preview ───────────────────── */}
        <div className={styles.currencyPreview}>
          <div className={styles.previewHeader}>
            <Eye size={16} style={{ marginRight: '8px' }} />
            <span>{t('settings.currencyLivePreview')}</span>
          </div>
          <div className={styles.previewGrid}>
            {PREVIEW.map(amount => (
              <div key={amount} className={styles.previewRow}>
                <span className={styles.previewRaw}>{amount.toLocaleString()}</span>
                <ArrowRight size={14} className={styles.previewArrow} />
                <span className={styles.previewValue}>{formatMoney(amount, currencyCode)}</span>
              </div>
            ))}
          </div>
          <div className={styles.previewMeta}>
            <span>{t('settings.currencyThousands')}: <code>{currency.thousandsSep === ' ' ? 'space' : `"${currency.thousandsSep}"`}</code></span>
            <span>{t('settings.currencyDecimal')}: <code>"{currency.decimalSep}"</code></span>
            <span>{t('settings.currencyPlaces')}: <code>{currency.decimals}</code></span>
            <span>{t('settings.currencySymbol')}: <code>{currency.symbolBefore ? t('settings.currencyBefore') : t('settings.currencyAfter')} amount</code></span>
          </div>
        </div>

      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 3 · APPEARANCE
      ════════════════════════════════════════ */}
      {activeSection === 'appearance' && sectionVisibility.appearance && (
        <Section title={t('settings.section.appearance')}>
        <p className={styles.rowDesc}>{t('settings.themeDesc')}</p>
        <div className={styles.themeOptions}>
          {[
            { val: 'light', label: t('settings.themeLight'), icon: <Sun size={20} /> },
            { val: 'dark',  label: t('settings.themeDark'),  icon: <Moon size={20} /> },
          ].map(opt => (
            <button
              key={opt.val}
              className={`${styles.themeBtn} ${theme === opt.val ? styles.themeBtnActive : ''}`}
              onClick={toggleTheme}
            >
              <span className={styles.themeIcon}>{typeof opt.icon === 'string' ? opt.icon : opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 3.5 · ACCOUNT & PLAN
      ════════════════════════════════════════ */}
      {activeSection === 'account' && sectionVisibility.account && (
        <Section title="Account & Plan">
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div>
              <div className={styles.planName}>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan</div>
              <div className={styles.planEmail}>{user.email}</div>
            </div>
            <div className={`${styles.planBadge} ${
              subscription.status === 'active' ? styles.planBadgeActive :
              subscription.status === 'trial' ? styles.planBadgeTrial :
              subscription.status === 'cancelled' ? styles.planBadgeCancelled :
              styles.planBadgeExpired
            }`}>
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </div>
          </div>
          <div className={styles.planDetails}>
            <div className={styles.planDetail}>
              <span className={styles.planDetailLabel}>Role:</span>
              <span className={styles.planDetailValue}>{user.role || 'Owner'}</span>
            </div>
            <div className={styles.planDetail}>
              <span className={styles.planDetailLabel}>Business:</span>
              <span className={styles.planDetailValue}>{user.businessId ? 'Connected' : 'Not set'}</span>
            </div>
            {subscription.endDate && (
              <div className={styles.planDetail}>
                <span className={styles.planDetailLabel}>Renews on:</span>
                <span className={styles.planDetailValue}>
                  {subscription.endDate.toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription.lastPaymentAmount > 0 && (
              <div className={styles.planDetail}>
                <span className={styles.planDetailLabel}>Last payment:</span>
                <span className={styles.planDetailValue}>
                  ₦{subscription.lastPaymentAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          {(subscription.status === 'active' || subscription.status === 'trial') && (
            <button
              className={styles.cancelBtn}
              onClick={handleCancelSubscription}
              disabled={isCancellingSubscription}
              style={{ opacity: isCancellingSubscription ? 0.7 : 1, cursor: isCancellingSubscription ? 'not-allowed' : 'pointer' }}
            >
              {isCancellingSubscription ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}

          {isUserAdmin && (
            <button
              className={styles.saveBtn}
              onClick={() => window.location.href = '/admin'}
              style={{ marginTop: '12px', backgroundColor: '#6B3FE7' }}
            >
              <LayoutDashboard size={16} style={{ marginRight: '8px' }} />
              Admin Dashboard
            </button>
          )}
          {subscription.status === 'cancelled' && (
            <div className={styles.cancelledNotice}>
              Your subscription has been cancelled. You will retain access until {subscription.endDate?.toLocaleDateString()}.
            </div>
          )}
        </div>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 4 · BUSINESS PROFILE
      ════════════════════════════════════════ */}
      {activeSection === 'business' && sectionVisibility.business && (
        <Section title={t('settings.section.business')}>
        <div className={styles.formGrid}>
          {[
            { key: 'name',     label: t('settings.businessName'),     type: 'text' },
            { key: 'category', label: t('settings.businessCategory'), type: 'text' },
            { key: 'phone',    label: t('settings.businessPhone'),    type: 'tel' },
            { key: 'email',    label: t('settings.businessEmail'),    type: 'email' },
            { key: 'address',  label: t('settings.businessAddress'),  type: 'text' },
          ].map(field => (
            <div key={field.key} className={styles.formField}>
              <label className={styles.label}>{field.label}</label>
              <input
                type={field.type}
                className={styles.input}
                value={biz[field.key as keyof typeof biz]}
                onChange={e => setBiz(p => ({ ...p, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button className={styles.saveBtn} onClick={handleSave}>
          {t('common.save')} {t('settings.section.business')}
        </button>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 5 · RECEIPT CUSTOMIZATION
      ════════════════════════════════════════ */}
      {activeSection === 'receipt' && sectionVisibility.receipt && (
        <Section title="Receipt Customization">
        <p className={styles.rowDesc}>Customize the appearance of your sales receipts and invoices.</p>
        <ReceiptThemeConfig />
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 6 · NOTIFICATIONS
      ════════════════════════════════════════ */}
      {activeSection === 'notifications' && sectionVisibility.notifications && (
        <Section title={t('settings.section.notifications')}>
        {[
          { key: 'sales',    label: t('settings.notifSales') },
          { key: 'expenses', label: t('settings.notifExpenses') },
          { key: 'lowStock', label: t('settings.notifLowStock') },
          { key: 'weekly',   label: t('settings.notifWeeklySummary') },
          { key: 'marketing',label: t('settings.notifMarketing') },
        ].map(item => (
          <div key={item.key} className={styles.toggleRow}>
            <label htmlFor={`notif-${item.key}`} className={styles.toggleLabel}>{item.label}</label>
            <Toggle
              id={`notif-${item.key}`}
              checked={notif[item.key as keyof typeof notif]}
              onChange={v => {
                handleNotifChange(item.key, v);
                showToast(`${item.label}: ${v ? 'ON' : 'OFF'}`);
              }}
            />
          </div>
        ))}
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 6 · PRIVACY & DATA
      ════════════════════════════════════════ */}
      {activeSection === 'privacy' && sectionVisibility.privacy && (
        <Section title={t('settings.section.privacy')}>
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>{t('settings.privacyAnalytics')}</div>
            <div className={styles.rowDesc}>{t('settings.privacyAnalyticsDesc')}</div>
          </div>
          <Toggle id="privacy-analytics" checked={analytics} onChange={setAnalytics} />
        </div>
        <div className={styles.dangerZone}>
          <div>
            <div className={styles.dangerTitle}>{t('settings.deleteData')}</div>
            <div className={styles.rowDesc}>{t('settings.deleteDataDesc')}</div>
          </div>
          <button
            className={styles.dangerBtn}
            onClick={() => showToast('Please contact support to delete your account.')}
          >
            <ShieldAlert size={16} style={{ marginRight: '8px' }} />
            {t('settings.deleteData')}
          </button>
        </div>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 7 · FEATURES
      ════════════════════════════════════════ */}
      {activeSection === 'features' && sectionVisibility.features && (
        <Section title="Features">
          <p className={styles.rowDesc}>
            Manage which features are enabled for your business. Features available depend on your subscription plan.
          </p>
          
          {/* Current Plan Badge */}
          <div className={styles.planBadge} style={{ marginBottom: '24px', display: 'inline-block' }}>
            Current Plan: <strong>{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</strong>
          </div>

          {/* Features Grid */}
          <div className={styles.featuresGrid}>
            {availableFeatures.map((feature: RegistryFeature) => {
              const isLocked = isFeatureLocked(feature);
              const isEnabled = featurePreferences[feature.id];
              const icon = ICON_MAP[feature.id] || <Package size={20} />;
              
              return (
                <div
                  key={feature.id}
                  className={`${styles.featureCard} ${isLocked ? styles.featureCardUnavailable : ''}`}
                >
                  <div className={styles.featureCardHeader}>
                    <div className={styles.featureIcon}>{icon}</div>
                    <div className={styles.featureStatus}>
                      {isLocked ? (
                        <Lock size={20} className={styles.featureLocked} />
                      ) : isEnabled ? (
                        <CheckCircle2 size={20} className={styles.featureEnabled} />
                      ) : (
                        <XCircle size={20} className={styles.featureDisabled} />
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.featureCardContent}>
                    <h3 className={styles.featureName}>{feature.name}</h3>
                    <p className={styles.featureDescription}>{feature.description}</p>
                    
                    <div className={styles.featurePlanInfo}>
                      {isLocked ? (
                        <span className={styles.featureUpgrade}>
                          Requires {getRequiredPlan(feature).charAt(0).toUpperCase() + getRequiredPlan(feature).slice(1)} plan or higher
                        </span>
                      ) : (
                        <span className={styles.featureAvailable}>
                          Available in your plan
                        </span>
                      )}
                    </div>
                    
                    {!isLocked && (
                      <button
                        className={`${styles.featureToggle} ${isEnabled ? styles.featureToggleOn : ''}`}
                        onClick={() => handleFeatureToggle(feature.id, !isEnabled)}
                        disabled={isSavingFeatures}
                      >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upgrade CTA */}
          {subscription.plan === 'starter' && (
            <div className={styles.featureUpgradeCTA}>
              <h3 className={styles.featureUpgradeTitle}>Upgrade to unlock more features</h3>
              <p className={styles.featureUpgradeDesc}>
                Get access to Expense Tracking, Supplier Management, Ask MO AI, and more with Pro or Enterprise plans.
              </p>
              <button
                className={styles.featureUpgradeBtn}
                onClick={() => showToast('Contact sales to upgrade your plan')}
              >
                View Plans
              </button>
            </div>
          )}
        </Section>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.version}>Busmo · {t('settings.version')} 2.4.1</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: '8px' }} />
          {t('settings.logout')}
        </button>
      </div>

    </div>
  );
}

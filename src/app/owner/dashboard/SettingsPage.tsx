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
import { getSupabase } from '@/lib/supabase';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DocumentTemplateManager } from './documentTemplates';
import { checkIsAdmin } from '@/lib/adminAuth';
import { Settings, Globe, DollarSign, Palette, User, Building, FileText, Bell, Lock, Sun, Moon, Monitor, Search, Eye, ArrowRight, ShieldAlert, LogOut, Zap, LayoutDashboard, Package } from 'lucide-react';
import styles from './SettingsPage.module.css';


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
let firestoreInstance: ReturnType<typeof initializeFirebase>['firestore'] | null = null;

export default function SettingsPage() {
  const { showToast, theme, setTheme, toggleTheme, user } = useApp();
  const { t, lang, setLang } = useTranslation();
  const {
    currency,
    currencyCode,
    setCurrencyCode,
    setCurrencyByCountry,
    formatMoney: fmt,
  } = useCurrency();
  const { firestore } = React.useMemo(() => {
    if (!firestoreInstance) {
      const initialized = initializeFirebase();
      firestoreInstance = initialized.firestore;
    }
    return { firestore: firestoreInstance };
  }, []);

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
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      showToast(t('toast.loggedOutSuccess'));
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      showToast(t('toast.loggedOutFailed'));
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
        const user = getAuthCurrentUser();
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
      const user = getAuthCurrentUser();
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

  // ── Inventory Deduction Mode ───────────────────────────
  const [inventoryDeductionMode, setInventoryDeductionMode] = useState<'immediate' | 'warehouse'>('immediate');
  const [enablePayment, setEnablePayment] = useState(false);

  // ── Receipt Type Setting ───────────────────────────────
  const [receiptTypeSetting, setReceiptTypeSetting] = useState<'supermarket' | 'invoice'>('supermarket');

  // ── Subscription info ───────────────────────────────────
  const [subscription, setSubscription] = useState({
    status: '',
    plan: '',
    endDate: null as Date | null,
    lastPaymentAmount: 0,
  });
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);


  // Load business profile and subscription from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const { firestore } = initializeFirebase();
        const currentUser = getAuthCurrentUser();
        
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
              // Load inventory deduction mode
              setInventoryDeductionMode(data.inventoryDeductionMode || 'immediate');
              // Load receipt type setting
              if (data.receiptType) {
                setReceiptTypeSetting(data.receiptType);
              }
            }
            // Load store config
            const configDoc = await getDoc(doc(firestore, 'businesses', user.businessId, 'store', 'config'));
            if (configDoc.exists()) {
              setEnablePayment(configDoc.data().enablePayment || false);
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
          const ADMIN_EMAILS = [
            'taheeratorganic@gmail.com',
            'admin@busmo.io',
            'majnuncode@gmail.com',
            'sxeedtxheer@gmail.com',
            'ahmedusmus@gmail.com',
            'majnun@busmo.io',
            'victoria@busmo.io'
          ];
          
          // Check both: localStorage admin session OR current user email in whitelist
          const hasAdminSession = await checkIsAdmin();
          const isWhitelisted = !!(user.email && ADMIN_EMAILS.includes(user.email));
          const adminCheck = hasAdminSession || isWhitelisted;
          
          console.log('Settings admin check result:', adminCheck, 'for user:', user.email, 'hasSession:', hasAdminSession, 'isWhitelisted:', isWhitelisted);
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

  const handleSave = () => showToast(t('settings.changesSaved'));

  // Handle inventory deduction mode change
  const handleInventoryDeductionModeChange = async (mode: 'immediate' | 'warehouse') => {
    setInventoryDeductionMode(mode);
    try {
      const { firestore } = initializeFirebase();
      if (user.businessId) {
        await updateDoc(doc(firestore, 'businesses', user.businessId), {
          inventoryDeductionMode: mode,
        });
        showToast(`Inventory deduction mode set to ${mode === 'immediate' ? 'Immediate (Retail)' : 'Warehouse Release (Wholesale)'}`);
      }
    } catch (error) {
      console.error('Failed to save inventory deduction mode:', error);
      showToast(t('toast.inventoryModeFailed'));
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsCancellingSubscription(true);

    try {
      const { firestore } = initializeFirebase();
      const currentUser = getAuthCurrentUser();

      if (currentUser) {
        await updateDoc(doc(firestore, 'users', currentUser.uid), {
          subscriptionStatus: 'cancelled',
          cancellationRequestedAt: new Date(),
        });
        showToast(t('toast.subscriptionCancelled'));
        setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showToast(t('toast.subscriptionCancelFailed'));
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
            { val: 'system', label: 'Device default', icon: <Monitor size={20} /> },
          ].map(opt => (
            <button
              key={opt.val}
              className={`${styles.themeBtn} ${theme === opt.val ? styles.themeBtnActive : ''}`}
              onClick={() => {
                if (opt.val === 'light' || opt.val === 'dark' || opt.val === 'system') {
                  setTheme(opt.val);
                }
              }}
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
              onClick={async () => {
                console.log('Admin button clicked, checking session...');
                // Check if user already has admin session
                const hasAdminSession = await checkIsAdmin();
                if (hasAdminSession) {
                  // Already authenticated, go directly to admin dashboard
                  console.log('Admin session found, navigating to /admin');
                  window.location.href = '/admin';
                } else {
                  // No session, go to login page for OTP
                  console.log('No admin session, navigating to /admin/login');
                  window.location.href = '/admin/login';
                }
              }}
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

        {/* Inventory Deduction Mode */}
        <div className={styles.toggleRow} style={{ marginTop: '24px' }}>
          <div>
            <div className={styles.toggleLabel}>Inventory Deduction Mode</div>
            <div className={styles.rowDesc}>
              Choose when inventory is deducted: immediately on sale (retail/POS) or when warehouse releases goods (wholesale/distributor)
            </div>
          </div>
          <div className={styles.radioGroup}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="inventoryDeductionMode"
                value="immediate"
                checked={inventoryDeductionMode === 'immediate'}
                onChange={() => handleInventoryDeductionModeChange('immediate')}
              />
              <span>Immediate (Retail)</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="inventoryDeductionMode"
                value="warehouse"
                checked={inventoryDeductionMode === 'warehouse'}
                onChange={() => handleInventoryDeductionModeChange('warehouse')}
              />
              <span>Warehouse Release (Wholesale)</span>
            </label>
          </div>
        </div>

        {/* Receipt Type Setting */}
        <div className={styles.toggleRow} style={{ marginTop: '24px' }}>
          <div>
            <div className={styles.toggleLabel}>Receipt Type</div>
            <div className={styles.rowDesc}>
              Choose the receipt format: simple supermarket-style or full invoice with customer details
            </div>
          </div>
          <div className={styles.radioGroup}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="receiptType"
                value="supermarket"
                checked={receiptTypeSetting === 'supermarket'}
                onChange={async () => {
                  setReceiptTypeSetting('supermarket');
                  try {
                    const { firestore } = initializeFirebase();
                    if (user.businessId) {
                      await updateDoc(doc(firestore, 'businesses', user.businessId), {
                        receiptType: 'supermarket',
                      });
                      showToast(t('toast.receiptSupermarket'));
                    }
                  } catch (error) {
                    console.error('Failed to save receipt type:', error);
                    showToast(t('toast.receiptFailed'));
                  }
                }}
              />
              <span>Supermarket Receipt</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="receiptType"
                value="invoice"
                checked={receiptTypeSetting === 'invoice'}
                onChange={async () => {
                  setReceiptTypeSetting('invoice');
                  try {
                    const { firestore } = initializeFirebase();
                    if (user.businessId) {
                      await updateDoc(doc(firestore, 'businesses', user.businessId), {
                        receiptType: 'invoice',
                      });
                      showToast(t('toast.receiptInvoice'));
                    }
                  } catch (error) {
                    console.error('Failed to save receipt type:', error);
                    showToast(t('toast.receiptFailed'));
                  }
                }}
              />
              <span>Sale Invoice</span>
            </label>
          </div>
        </div>

        {/* Enable Payment */}
        <div className={styles.toggleRow} style={{ marginTop: '24px' }}>
          <div>
            <div className={styles.toggleLabel}>Enable Online Payments</div>
            <div className={styles.rowDesc}>
              Allow customers to pay for your digital products online.
            </div>
          </div>
          <Toggle
            id="enablePayment"
            checked={enablePayment}
            onChange={async (v) => {
              setEnablePayment(v);
              try {
                const { firestore } = initializeFirebase();
                if (user.businessId) {
                  await updateDoc(doc(firestore, 'businesses', user.businessId, 'store', 'config'), {
                    enablePayment: v,
                  });
                  showToast(v ? 'Payments enabled' : 'Payments disabled');
                }
              } catch (error) {
                console.error('Failed to update payment setting:', error);
                showToast('Failed to update payment setting');
              }
            }}
          />
        </div>

        <button className={styles.saveBtn} onClick={handleSave}>
          {t('common.save')} {t('settings.section.business')}
        </button>
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 5 · DOCUMENT TEMPLATES
      ════════════════════════════════════════ */}
      {activeSection === 'receipt' && sectionVisibility.receipt && (
        <Section title="Document Templates">
        <p className={styles.rowDesc}>Customize your invoices, receipts, and business documents. Retailers, wholesalers, and distributors get optimized templates automatically.</p>
        <DocumentTemplateManager />
      </Section>
      )}

      {/* ════════════════════════════════════════
          SECTION 6 · NOTIFICATIONS
      ════════════════════════════════════════ */}
      {activeSection === 'notifications' && sectionVisibility.notifications && (
        <Section title={t('settings.section.notifications')}>

          <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.9rem' }}>Device notifications</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: '0 0 10px' }}>
              Allow Busmo to alert this device when sales, expenses, or stock changes happen — even if the tab is in the background.
            </p>
            <button
              type="button"
              className={styles.primaryBtn || styles.saveBtn || ''}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--purple)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
              onClick={async () => {
                const { requestDeviceNotificationPermission, getNotificationPermission } = await import('@/lib/deviceNotifications');
                const perm = await requestDeviceNotificationPermission();
                if (perm === 'granted') showToast('Device notifications enabled');
                else if (perm === 'denied') alert('Notifications are blocked. Enable them in your browser site settings.');
                else alert('Permission: ' + perm);
              }}
            >
              Enable on this device
            </button>
          </div>

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
                if (['sales', 'expenses', 'lowStock'].includes(item.key)) {
                  import('@/lib/deviceNotifications').then(({ setDeviceNotifPrefs }) => {
                    setDeviceNotifPrefs({ [item.key]: v } as any);
                  }).catch(() => {});
                }
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
            onClick={() => showToast(t('toast.featureComingSoon'))}
          >
            <ShieldAlert size={16} style={{ marginRight: '8px' }} />
            {t('settings.deleteData')}
          </button>
        </div>
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


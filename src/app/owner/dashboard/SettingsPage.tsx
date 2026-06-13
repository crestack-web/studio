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

  // Handle logout
  const handleLogout = async () => {
    try {
      const { auth } = initializeFirebase();
      await signOut(auth);
      showToast('👋 Logged out successfully');
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      showToast('❌ Failed to logout');
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

  // Load business profile from Firestore
  useEffect(() => {
    const loadBusinessProfile = async () => {
      try {
        const { firestore } = initializeFirebase();
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser && user.businessId) {
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
      } catch (error) {
        console.error('Failed to load business profile:', error);
      }
    };

    loadBusinessProfile();
  }, [user.businessId]);

  // ── Handlers ───────────────────────────────────────────
  const handleCountryChange = (cc: string) => {
    setSelectedCountry(cc);
    setCurrencyByCountry(cc);
    const c = CURRENCIES_SORTED.find(cur => cur.countries.includes(cc));
    if (c) showToast(`✅ Currency set to ${c.name} (${c.symbol})`);
  };

  const handleCurrencySelect = (code: string) => {
    setCurrencyCode(code);
    setCurrencySearch('');
    const c = CURRENCIES_SORTED.find(cur => cur.code === code);
    if (c) showToast(`✅ Currency set to ${c.name} (${c.symbol})`);
  };

  const handleSave = () => showToast(`✅ ${t('settings.changesSaved')}`);

  // Live preview amounts
  const PREVIEW = [1000, 25000, 1_250_000];

  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <p className={styles.subtitle}>{t('settings.subtitle')}</p>
      </div>

      {/* ════════════════════════════════════════
          SECTION 1 · LANGUAGE
      ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
          SECTION 2 · CURRENCY  ← NEW
      ════════════════════════════════════════ */}
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
              ⚡ {CURRENCIES_SORTED.find(c => c.countries.includes(selectedCountry))?.symbol ?? '—'}&nbsp;
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
            <span className={styles.currencySearchIcon}>🔍</span>
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
            <span>👁</span>
            <span>{t('settings.currencyLivePreview')}</span>
          </div>
          <div className={styles.previewGrid}>
            {PREVIEW.map(amount => (
              <div key={amount} className={styles.previewRow}>
                <span className={styles.previewRaw}>{amount.toLocaleString()}</span>
                <span className={styles.previewArrow}>→</span>
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

      {/* ════════════════════════════════════════
          SECTION 3 · APPEARANCE
      ════════════════════════════════════════ */}
      <Section title={t('settings.section.appearance')}>
        <p className={styles.rowDesc}>{t('settings.themeDesc')}</p>
        <div className={styles.themeOptions}>
          {[
            { val: 'light', label: t('settings.themeLight'), icon: '☀️' },
            { val: 'dark',  label: t('settings.themeDark'),  icon: '🌙' },
          ].map(opt => (
            <button
              key={opt.val}
              className={`${styles.themeBtn} ${theme === opt.val ? styles.themeBtnActive : ''}`}
              onClick={toggleTheme}
            >
              <span className={styles.themeIcon}>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* ════════════════════════════════════════
          SECTION 3.5 · ACCOUNT & PLAN
      ════════════════════════════════════════ */}
      <Section title="Account & Plan">
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <div>
              <div className={styles.planName}>{user.plan || 'Starter'}</div>
              <div className={styles.planEmail}>{user.email}</div>
            </div>
            <div className={styles.planBadge}>Active</div>
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
          </div>
        </div>
      </Section>

      {/* ════════════════════════════════════════
          SECTION 4 · BUSINESS PROFILE
      ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
          SECTION 5 · NOTIFICATIONS
      ════════════════════════════════════════ */}
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

      {/* ════════════════════════════════════════
          SECTION 6 · PRIVACY & DATA
      ════════════════════════════════════════ */}
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
            onClick={() => showToast('⚠️ Please contact support to delete your account.')}
          >
            {t('settings.deleteData')}
          </button>
        </div>
      </Section>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.version}>Busmo · {t('settings.version')} 2.4.1</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          {t('settings.logout')}
        </button>
      </div>

    </div>
  );
}

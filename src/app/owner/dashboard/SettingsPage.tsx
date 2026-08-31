'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { LANGUAGES, LangCode } from './translations';
import { CURRENCIES_SORTED, COUNTRY_LIST } from './currencies';
import { initializeFirebase } from '@/firebase';
import { getSupabase } from '@/lib/supabase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { DocumentTemplateManager } from './documentTemplates';
import { ReceiptThemeConfig } from './ReceiptThemeConfig';
import { updateDoc as sbUpdateDoc } from '@/lib/supabase-client-data';
import {
  Globe, DollarSign, Palette, User, Building, FileText, Bell, Lock,
  Sun, Moon, Monitor, LogOut,
} from 'lucide-react';
import styles from './SettingsPage.module.css';

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button id={id} role="switch" aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}>
      <span className={styles.toggleThumb} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

const WAREHOUSE_CATEGORIES = new Set([
  'retail', 'wholesale', 'distributor', 'supermarket', 'grocery',
  'pharmacy', 'fashion', 'electronics', 'manufacturing',
]);

const CATEGORY_OPTIONS: [string, string][] = [
  ['retail', 'Retail'], ['restaurant', 'Restaurant'], ['cafe', 'Cafe'],
  ['grocery', 'Grocery'], ['supermarket', 'Supermarket'], ['wholesale', 'Wholesale'],
  ['distributor', 'Distributor'], ['fashion', 'Fashion'], ['electronics', 'Electronics'],
  ['pharmacy', 'Pharmacy'], ['manufacturing', 'Manufacturing'], ['services', 'Services'],
  ['healthcare', 'Healthcare'], ['education', 'Education'], ['other', 'Other'],
];

export default function SettingsPage() {
  const { showToast, theme, setTheme, user } = useApp();
  const { t, lang, setLang } = useTranslation();
  const { currency, currencyCode, setCurrencyCode, setCurrencyByCountry, formatMoney: fmt } = useCurrency();
  const [activeSection, setActiveSection] = useState('business');
  const [biz, setBiz] = useState({ name: '', category: '', phone: '', email: '', address: '' });
  const [inventoryDeductionMode, setInventoryDeductionMode] = useState<'immediate' | 'warehouse'>('immediate');
  const [receiptTypeSetting, setReceiptTypeSetting] = useState<'supermarket' | 'invoice'>('supermarket');
  const [enablePayment, setEnablePayment] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('NG');

  const showInventoryDeductionMode = WAREHOUSE_CATEGORIES.has(String(biz.category || '').toLowerCase().trim());

  useEffect(() => {
    (async () => {
      try {
        const { firestore } = initializeFirebase();
        if (!user.businessId) return;
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
          setInventoryDeductionMode(data.inventoryDeductionMode || 'immediate');
          if (data.receiptType) setReceiptTypeSetting(data.receiptType);
        }
        const configDoc = await getDoc(doc(firestore, 'businesses', user.businessId, 'store', 'config'));
        if (configDoc.exists()) setEnablePayment(configDoc.data().enablePayment || false);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user.businessId]);

  const handleInventoryDeductionModeChange = async (mode: 'immediate' | 'warehouse') => {
    setInventoryDeductionMode(mode);
    try {
      if (user.businessId) {
        const { firestore } = initializeFirebase();
        await updateDoc(doc(firestore, 'businesses', user.businessId), { inventoryDeductionMode: mode });
        showToast(mode === 'immediate' ? 'Stock deducts on sale' : 'Stock deducts on warehouse release');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to save inventory mode');
    }
  };

  const saveReceiptType = async (type: 'supermarket' | 'invoice') => {
    setReceiptTypeSetting(type);
    try {
      if (user.businessId) {
        await sbUpdateDoc('businesses', user.businessId, { receiptType: type, receipt_type: type });
        showToast(type === 'supermarket' ? 'Supermarket receipt selected' : 'Invoice receipt selected');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to save receipt type');
    }
  };

  const handleLogout = async () => {
    try {
      await getSupabase().auth.signOut();
      showToast(t('toast.loggedOutSuccess'));
      window.location.href = '/login';
    } catch {
      showToast(t('toast.loggedOutFailed'));
    }
  };

  const sections = [
    { id: 'language', label: 'Language', icon: <Globe size={18} /> },
    { id: 'currency', label: 'Currency', icon: <DollarSign size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'account', label: 'Account', icon: <User size={18} /> },
    { id: 'business', label: 'Business', icon: <Building size={18} /> },
    { id: 'receipt', label: 'Receipt', icon: <FileText size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={18} /> },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('settings.title')}</h1>
        <p className={styles.subtitle}>{t('settings.subtitle')}</p>
      </div>

      <div className={styles.chipsContainer}>
        {sections.map((section) => (
          <button key={section.id}
            className={`${styles.chip} ${activeSection === section.id ? styles.chipActive : ''}`}
            onClick={() => setActiveSection(section.id)}>
            <span className={styles.chipIcon}>{section.icon}</span>
            <span className={styles.chipLabel}>{section.label}</span>
          </button>
        ))}
      </div>

      {activeSection === 'language' && (
        <Section title={t('settings.section.language')}>
          <div className={styles.langGrid}>
            {LANGUAGES.map((l) => (
              <button key={l.code}
                className={`${styles.langCard} ${lang === l.code ? styles.langCardActive : ''}`}
                onClick={() => setLang(l.code as LangCode)}>
                <span className={styles.langFlag}>{l.flag}</span>
                <span className={styles.langNative}>{l.name}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {activeSection === 'currency' && (
        <Section title={t('settings.section.currency')}>
          <div className={styles.activeCurrency}>
            <span className={styles.activeCurrencyFlag}>{currency.flag}</span>
            <div className={styles.activeCurrencyInfo}>
              <div className={styles.activeCurrencyName}>{currency.name}</div>
              <div className={styles.activeCurrencyMeta}>{currency.code} · {currency.symbol}</div>
            </div>
            <div className={styles.activeCurrencyExample}>{fmt(48600)}</div>
          </div>
          <div className={styles.countryRow}>
            <select className={styles.select} value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setCurrencyByCountry(e.target.value); }}>
              {COUNTRY_LIST.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.currencyGrid}>
            {CURRENCIES_SORTED.slice(0, 24).map((c) => (
              <button key={c.code}
                className={`${styles.currencyCard} ${currencyCode === c.code ? styles.currencyCardActive : ''}`}
                onClick={() => { setCurrencyCode(c.code); showToast(`Currency set to ${c.name}`); }}>
                <span className={styles.currencyFlag}>{c.flag}</span>
                <span className={styles.currencyCode}>{c.code}</span>
                <div className={styles.currencySymbolLarge}>{c.symbol}</div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {activeSection === 'appearance' && (
        <Section title={t('settings.section.appearance')}>
          <div className={styles.themeOptions}>
            {([
              { val: 'light' as const, label: t('settings.themeLight'), icon: <Sun size={20} /> },
              { val: 'dark' as const, label: t('settings.themeDark'), icon: <Moon size={20} /> },
              { val: 'system' as const, label: 'Device default', icon: <Monitor size={20} /> },
            ]).map((opt) => (
              <button key={opt.val}
                className={`${styles.themeBtn} ${theme === opt.val ? styles.themeBtnActive : ''}`}
                onClick={() => setTheme(opt.val)}>
                <span className={styles.themeIcon}>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {activeSection === 'account' && (
        <Section title="Account">
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div>
                <div className={styles.planName}>{user.role || 'Owner'}</div>
                <div className={styles.planEmail}>{user.email}</div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {activeSection === 'business' && (
        <Section title={t('settings.section.business')}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>{t('settings.businessName')}</label>
              <input className={styles.input} value={biz.name} onChange={(e) => setBiz((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>{t('settings.businessCategory')}</label>
              <select className={styles.input} value={biz.category} onChange={(e) => setBiz((p) => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
              <div className={styles.rowDesc} style={{ marginTop: 6 }}>
                Category controls which settings appear (e.g. warehouse stock modes for wholesale / retail).
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>{t('settings.businessPhone')}</label>
              <input className={styles.input} type="tel" value={biz.phone} onChange={(e) => setBiz((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>{t('settings.businessEmail')}</label>
              <input className={styles.input} type="email" value={biz.email} onChange={(e) => setBiz((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>{t('settings.businessAddress')}</label>
              <input className={styles.input} value={biz.address} onChange={(e) => setBiz((p) => ({ ...p, address: e.target.value }))} />
            </div>
          </div>

          {showInventoryDeductionMode && (
            <div className={styles.toggleRow} style={{ marginTop: 24 }}>
              <div>
                <div className={styles.toggleLabel}>Inventory deduction mode</div>
                <div className={styles.rowDesc}>
                  When stock is reduced: right away on each sale, or when the warehouse releases goods (wholesale / distributor).
                </div>
              </div>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input type="radio" name="inventoryDeductionMode" value="immediate"
                    checked={inventoryDeductionMode === 'immediate'}
                    onChange={() => handleInventoryDeductionModeChange('immediate')} />
                  <span>Immediate on sale</span>
                </label>
                <label className={styles.radioOption}>
                  <input type="radio" name="inventoryDeductionMode" value="warehouse"
                    checked={inventoryDeductionMode === 'warehouse'}
                    onChange={() => handleInventoryDeductionModeChange('warehouse')} />
                  <span>On warehouse release</span>
                </label>
              </div>
            </div>
          )}

          <div className={styles.toggleRow} style={{ marginTop: 24 }}>
            <div>
              <div className={styles.toggleLabel}>Enable online payments</div>
              <div className={styles.rowDesc}>Allow customers to pay for digital products online.</div>
            </div>
            <Toggle id="enablePayment" checked={enablePayment} onChange={async (v) => {
              setEnablePayment(v);
              try {
                if (user.businessId) {
                  const { firestore } = initializeFirebase();
                  await updateDoc(doc(firestore, 'businesses', user.businessId, 'store', 'config'), { enablePayment: v });
                  showToast(v ? 'Payments enabled' : 'Payments disabled');
                }
              } catch {
                showToast('Failed to update payment setting');
              }
            }} />
          </div>

          <button className={styles.saveBtn} onClick={() => showToast(t('settings.changesSaved'))}>
            {t('common.save')} {t('settings.section.business')}
          </button>
        </Section>
      )}

      {activeSection === 'receipt' && (
        <Section title="Receipts & documents">
          <p className={styles.rowDesc}>
            Choose your receipt format, customize branding, and save it for Record Sale and Ask MO text sales.
          </p>
          <div className={styles.toggleRow} style={{ marginTop: 8, marginBottom: 16 }}>
            <div>
              <div className={styles.toggleLabel}>Receipt type</div>
              <div className={styles.rowDesc}>Supermarket-style thermal receipt, or full invoice layout with customer details.</div>
            </div>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input type="radio" name="receiptTypeSection" value="supermarket"
                  checked={receiptTypeSetting === 'supermarket'}
                  onChange={() => saveReceiptType('supermarket')} />
                <span>Supermarket</span>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="receiptTypeSection" value="invoice"
                  checked={receiptTypeSetting === 'invoice'}
                  onChange={() => saveReceiptType('invoice')} />
                <span>Invoice</span>
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div className={styles.toggleLabel} style={{ marginBottom: 8 }}>Receipt design</div>
            <ReceiptThemeConfig />
          </div>
          <div className={styles.toggleLabel} style={{ marginBottom: 8 }}>Other document templates</div>
          <DocumentTemplateManager />
        </Section>
      )}

      {activeSection === 'notifications' && (
        <Section title={t('settings.section.notifications')}>
          <p className={styles.rowDesc}>Notification preferences are managed here.</p>
        </Section>
      )}

      {activeSection === 'privacy' && (
        <Section title={t('settings.section.privacy')}>
          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>{t('settings.privacyAnalytics')}</div>
              <div className={styles.rowDesc}>{t('settings.privacyAnalyticsDesc')}</div>
            </div>
            <Toggle id="privacy-analytics" checked={analytics} onChange={setAnalytics} />
          </div>
        </Section>
      )}

      <div className={styles.footer}>
        <div className={styles.version}>Busmo · Settings</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} style={{ marginRight: 8 }} />
          {t('settings.logout')}
        </button>
      </div>
    </div>
  );
}

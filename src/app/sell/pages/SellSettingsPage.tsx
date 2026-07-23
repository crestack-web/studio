'use client';

import React, { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import { THEMES } from '@/app/store/themes/registry';
import type { StorefrontTheme } from '@/app/sell/mo-sell.types';
import { StorefrontCanvas } from '../components/StorefrontCanvas';
import styles from './SellSettingsPage.module.css';

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30);
}

export function SellSettingsPage() {
  const { user, storeConfig, refreshStoreConfig, showToast, navigateTo } = useSell();

  // Form state mirroring storeConfig
  const [storeName, setStoreName]           = useState('');
  const [storeSlug, setStoreSlug]           = useState('');
  const [primaryColor, setPrimary]          = useState('#0EA5E9');
  const [secondaryColor, setSecondary]      = useState('#6366F1');
  const [currency, setCurrency]             = useState('NGN');
  const [contactEmail, setEmail]            = useState('');
  const [contactPhone, setPhone]            = useState('');
  const [paystackPublicKey, setPaystackKey] = useState('');
  const [managedPayments, setManagedPayments]       = useState(false);
  const [payoutBankName, setPayoutBankName]         = useState('');
  const [payoutAccountNumber, setPayoutAccountNum]  = useState('');
  const [payoutAccountName, setPayoutAccountName]   = useState('');
  const [customDomain, setCustomDomain]     = useState('');
  const [logoUrl, setLogoUrl]               = useState<string | null>(null);
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState<string | null>(null);
  const [theme, setTheme]                   = useState<StorefrontTheme>('luxe');
  const [saving, setSaving]                 = useState(false);
  const [verifying, setVerifying]           = useState(false);
  const [dirty, setDirty]                   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync from storeConfig on load
  useEffect(() => {
    if (!storeConfig) return;
    setStoreName(storeConfig.storeName ?? '');
    setStoreSlug(storeConfig.storeSlug ?? '');
    setPrimary(storeConfig.primaryColor ?? '#0EA5E9');
    setSecondary(storeConfig.secondaryColor ?? '#6366F1');
    setCurrency(storeConfig.currency ?? 'NGN');
    setEmail(storeConfig.contactEmail ?? '');
    setPhone(storeConfig.contactPhone ?? '');
    setPaystackKey((storeConfig as any).paystackPublicKey ?? '');
    setManagedPayments((storeConfig as any).managedPayments ?? false);
    setPayoutBankName((storeConfig as any).payoutBankName ?? '');
    setPayoutAccountNum((storeConfig as any).payoutAccountNumber ?? '');
    setPayoutAccountName((storeConfig as any).payoutAccountName ?? '');
    setCustomDomain(storeConfig.customDomain ?? '');
    setLogoUrl(storeConfig.logoUrl ?? null);
    setImagePreview(storeConfig.logoUrl ?? null);
    setTheme((storeConfig as any).theme ?? 'luxe');
  }, [storeConfig]);

  const mark = () => setDirty(true);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    mark();
  };

  const handleSave = useCallback(async () => {
    if (!user?.businessId || !storeName.trim()) return;
    setSaving(true);
    try {
      const { firestore } = initializeFirebase();
      let finalLogoUrl = logoUrl;

      if (imageFile) {
        const { storage } = initializeFirebase();
        const imgRef = storageRef(storage, `stores/${user.businessId}/logo_${Date.now()}`);
        await uploadBytes(imgRef, imageFile);
        finalLogoUrl = await getDownloadURL(imgRef);
      }

      const finalSlug = slugify(storeSlug || storeName);

      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        {
          ...(storeConfig ?? {}),
          storeName: storeName.trim(),
          storeSlug: finalSlug,
          primaryColor, secondaryColor,
          currency, contactEmail, contactPhone,
          paystackPublicKey,
          managedPayments,
          payoutBankName:      managedPayments ? payoutBankName.trim()      : null,
          payoutAccountNumber: managedPayments ? payoutAccountNumber.trim() : null,
          payoutAccountName:   managedPayments ? payoutAccountName.trim()   : null,
          logoUrl: finalLogoUrl,
          theme,
          customDomain: customDomain.trim() || null,
          customDomainStatus: (() => {
            const savedDomain = (storeConfig as any)?.customDomain ?? '';
            const newDomain   = customDomain.trim();
            // If domain was cleared or changed, reset to pending
            if (!newDomain || newDomain !== savedDomain) return 'pending';
            // Domain unchanged — keep existing status
            return (storeConfig as any)?.customDomainStatus ?? 'pending';
          })(),
          customDomainVerifiedAt: (() => {
            const savedDomain = (storeConfig as any)?.customDomain ?? '';
            const newDomain   = customDomain.trim();
            if (!newDomain || newDomain !== savedDomain) return null;
            return (storeConfig as any)?.customDomainVerifiedAt ?? null;
          })(),
          updatedAt: serverTimestamp(),
          createdAt: (storeConfig as any)?.createdAt ?? serverTimestamp(),
        },
        { merge: true }
      );

      // Keep storeIndex in sync for O(1) slug → businessId lookup
      await setDoc(
        doc(firestore, 'storeIndex', finalSlug),
        { businessId: user.businessId, storeName: storeName.trim(), updatedAt: serverTimestamp() }
      );

      await refreshStoreConfig();
      setImageFile(null);
      setDirty(false);
      showToast('Settings saved', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    } finally { setSaving(false); }
  }, [user, storeName, storeSlug, primaryColor, secondaryColor, currency, contactEmail, contactPhone, paystackPublicKey, customDomain, logoUrl, imageFile, storeConfig, refreshStoreConfig, showToast]);

  const handleVerifyDomain = useCallback(async () => {
    if (!customDomain.trim() || !user?.businessId) return;

    // Guard: domain in the input must match what's saved in Firestore
    if (customDomain.trim() !== (storeConfig?.customDomain ?? '')) {
      showToast('Save your settings first before verifying the domain', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/store/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, customDomain: customDomain.trim() }),
      });
      const data = await res.json() as { verified?: boolean; error?: string };

      if (!res.ok) {
        showToast(data.error ?? 'Verification failed', 'error');
        return;
      }

      await refreshStoreConfig();
      showToast(
        data.verified
          ? 'Domain verified!'
          : 'CNAME not found yet — DNS can take up to 48 hours',
        data.verified ? 'success' : 'error',
      );
    } catch {
      showToast('Verification failed — please try again', 'error');
    } finally {
      setVerifying(false);
    }
  }, [customDomain, storeConfig?.customDomain, user?.businessId, refreshStoreConfig, showToast]);

  const handlePublish = useCallback(async (status: 'active' | 'paused' | 'draft') => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'businesses', user.businessId, 'store', 'config'), { status, updatedAt: serverTimestamp() }, { merge: true });
      await refreshStoreConfig();
      showToast(status === 'active' ? 'Store is now live!' : status === 'paused' ? 'Store paused' : 'Store set to draft', 'success');
    } catch { showToast('Failed to update store status', 'error'); }
  }, [user?.businessId, refreshStoreConfig, showToast]);

  const status    = (storeConfig as any)?.status ?? 'draft';
  const domStatus = (storeConfig as any)?.customDomainStatus ?? 'pending';
  const verifiedCustomDomain = storeConfig?.customDomain && domStatus === 'verified' ? storeConfig.customDomain : null;
  const liveUrl   = storeConfig?.storeSlug
    ? (verifiedCustomDomain ?? `busmo.io/store/${storeConfig.storeSlug}`)
    : null;

  const domainStatusClass =
    domStatus === 'verified' ? styles.domainVerified :
    domStatus === 'failed'   ? styles.domainFailed   :
    customDomain             ? styles.domainPending  : styles.domainNone;

  const domainStatusLabel =
    domStatus === 'verified' ? '✓ Verified' :
    domStatus === 'failed'   ? '✗ Failed'   :
    customDomain             ? 'Pending DNS' : 'Not set';

  return (
    <div className={styles.page}>
      <div><h2 className={styles.heading}>Store Settings</h2><p className={styles.sub}>Configure your store identity, domain, and payment settings.</p></div>

      {/* Store status card */}
      <div className={styles.statusCard}>
        <div className={[styles.statusCardIcon, status === 'active' ? styles.statusCardIconActive : status === 'paused' ? styles.statusCardIconPaused : styles.statusCardIconDraft].join(' ')}>
          {status === 'active'
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-green)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            : status === 'paused'
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-red)" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sell-amber)" strokeWidth="2.5"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/></svg>}
        </div>
        <div className={styles.statusCardBody}>
          <p className={styles.statusCardTitle}>
            {status === 'active' ? 'Your store is live' : status === 'paused' ? 'Store is paused' : 'Store is in draft'}
          </p>
          <p className={styles.statusCardSub}>
            {status === 'active' && liveUrl
              ? <>Accessible at <a href={verifiedCustomDomain ? `https://${verifiedCustomDomain}` : `/store/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sell-primary)' }}>{liveUrl}</a></>
              : status === 'paused' ? 'Customers see a temporarily unavailable page' : 'Not visible to customers yet'}
          </p>
        </div>
        <div className={styles.statusCardActions}>
          {status !== 'active'  && <button className={`${styles.btn} ${styles.btnGreen}`}  onClick={() => handlePublish('active')}>Publish</button>}
          {status === 'active'  && <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handlePublish('paused')}>Pause store</button>}
          {status === 'paused'  && <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => handlePublish('draft')}>Set to draft</button>}
          {status !== 'active' && liveUrl && (
            <a href={`/store/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnGhost}`}>Preview</a>
          )}
        </div>
      </div>

      {/* Identity */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Store identity</p><p className={styles.cardSub}>Name, logo, and brand colors</p></div></div>
        <div className={styles.cardBody}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoPreview}>
              {imagePreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={imagePreview} alt="logo" />
                : <span>{storeName.charAt(0).toUpperCase() || '?'}</span>}
            </div>
            <div className={styles.logoActions}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '0.8rem', padding: '7px 12px' }} onClick={() => fileRef.current?.click()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload logo
              </button>
              {imagePreview && <button className={`${styles.btn} ${styles.btnGhost}`} style={{ fontSize: '0.78rem', padding: '7px 12px' }} onClick={() => { setImagePreview(null); setImageFile(null); setLogoUrl(null); mark(); }}>Remove</button>}
              <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>PNG, JPG, WebP · max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          {/* Name + Slug */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store name *</label>
              <input className={styles.formInput} value={storeName} onChange={e => { setStoreName(e.target.value); if (!storeConfig) setStoreSlug(slugify(e.target.value)); mark(); }} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Store URL slug</label>
              <input className={styles.formInput} value={storeSlug} onChange={e => { setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); mark(); }} />
              <p className={styles.formHint}>Only lowercase letters, numbers, hyphens</p>
            </div>
          </div>
          {storeSlug && (
            <div className={styles.urlRow}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" color="var(--sell-text-3)"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
              <span className={styles.urlBase}>busmo.io/store/</span>
              <span className={styles.urlSlug}>{storeSlug}</span>
            </div>
          )}

          {/* Colors */}
          <div className={styles.colorsRow}>
            <div className={styles.colorGroup}>
              <label className={styles.formLabel}>Primary color</label>
              <div className={styles.colorWrap}>
                <input type="color" value={primaryColor} onChange={e => { setPrimary(e.target.value); mark(); }} className={styles.colorSwatch} style={{ background: primaryColor }} />
                <input className={styles.colorInput} value={primaryColor} onChange={e => { setPrimary(e.target.value); mark(); }} placeholder="#0EA5E9" />
              </div>
              <div className={styles.colorPreview} style={{ background: primaryColor }}>Buttons &amp; links</div>
            </div>
            <div className={styles.colorGroup}>
              <label className={styles.formLabel}>Accent color</label>
              <div className={styles.colorWrap}>
                <input type="color" value={secondaryColor} onChange={e => { setSecondary(e.target.value); mark(); }} className={styles.colorSwatch} style={{ background: secondaryColor }} />
                <input className={styles.colorInput} value={secondaryColor} onChange={e => { setSecondary(e.target.value); mark(); }} placeholder="#6366F1" />
              </div>
              <div className={styles.colorPreview} style={{ background: secondaryColor }}>Accents &amp; badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & currency */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Contact &amp; currency</p><p className={styles.cardSub}>Shown on order confirmation emails and receipts</p></div></div>
        <div className={styles.cardBody}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact email</label>
              <input className={styles.formInput} type="email" value={contactEmail} onChange={e => { setEmail(e.target.value); mark(); }} placeholder="hello@yourbrand.com" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact phone</label>
              <input className={styles.formInput} value={contactPhone} onChange={e => { setPhone(e.target.value); mark(); }} placeholder="+234 800 000 0000" />
            </div>
          </div>
          <div className={styles.formGroup} style={{ maxWidth: 200 }}>
            <label className={styles.formLabel}>Store currency</label>
            <select className={styles.formSelect} value={currency} onChange={e => { setCurrency(e.target.value); mark(); }}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Paystack */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><div><p className={styles.cardTitle}>Payments (Paystack)</p><p className={styles.cardSub}>Required to accept online payments</p></div></div>
        <div className={styles.cardBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Paystack public key</label>
            <input className={styles.formInput} value={paystackPublicKey} onChange={e => { setPaystackKey(e.target.value); mark(); }} placeholder="pk_live_…" />
            <p className={styles.formHint}>Find this in your Paystack dashboard under Settings → API Keys. The secret key is stored server-side in environment variables.</p>
          </div>
        </div>
      </div>

      {/* Custom domain */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div><p className={styles.cardTitle}>Custom domain</p><p className={styles.cardSub}>Connect your own domain to your store</p></div>
          <span className={`${styles.domainStatus} ${domainStatusClass}`}>{domainStatusLabel}</span>
        </div>
        <div className={styles.cardBody}>
          {domStatus === 'failed' && customDomain && (
            <div className={styles.warningBanner}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sell-amber)" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>{customDomain}</strong> is not pointing to Busmo yet. Check your DNS settings and try verifying again.</span>
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Domain name</label>
            <input className={styles.formInput} value={customDomain} onChange={e => { setCustomDomain(e.target.value.toLowerCase().trim()); mark(); }} placeholder="shop.yourbrand.com" />
            <p className={styles.formHint}>Enter your domain without https:// — e.g. shop.yourbrand.com</p>
          </div>
          {customDomain && (
            <div className={styles.dnsInstructions}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--sell-text-1)', marginBottom: 4 }}>Add this DNS record at your registrar:</p>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Type</span><span className={styles.dnsValue}>CNAME</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Host</span><span className={styles.dnsValue}>{customDomain.split('.').slice(0, -2).join('.') || '@'}</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>Value</span><span className={styles.dnsValue}>store.busmo.io</span></div>
              <div className={styles.dnsRow}><span className={styles.dnsKey}>TTL</span><span className={styles.dnsValue}>3600</span></div>
            </div>
          )}
          {customDomain && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleVerifyDomain} disabled={verifying} style={{ alignSelf: 'flex-start' }}>
              {verifying
                ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Verifying…</>
                : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Verify domain</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Theme Switcher ─────────────────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardTitle}>Storefront theme</p>
            <p className={styles.cardSub}>Choose the visual style for your public store</p>
          </div>
          <span style={{
            fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px',
            borderRadius: 100, background: 'var(--sell-primary-lt)',
            color: 'var(--sell-primary)',
          }}>
            {THEMES.find(t => t.id === theme)?.name ?? 'Classic'}
          </span>
        </div>
        <div className={styles.cardBody}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 12,
          }}>
            {THEMES.map(t => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTheme(t.id); mark(); }}
                  style={{
                    border: isActive ? '2px solid var(--sell-primary)' : '2px solid var(--sell-border)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'none',
                    padding: 0,
                    textAlign: 'left',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: isActive ? '0 0 0 3px var(--sell-primary-glow)' : 'none',
                  }}
                >
                  {/* Faithful storefront thumbnail */}
                  <StorefrontCanvas
                    theme={t.id}
                    width={160}
                    primaryColor={t.previewAccent}
                    secondaryColor={t.previewBg === '#0A0A0A' || t.previewBg === '#0F172A' ? '#444' : '#6366F1'}
                  />

                  {/* Theme label */}
                  <div style={{ padding: '8px 12px 10px', background: 'var(--sell-surface)', borderTop: '1px solid var(--sell-border)' }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: isActive ? 'var(--sell-primary)' : 'var(--sell-text-1)', marginBottom: 2 }}>
                      {t.name}
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--sell-text-3)', lineHeight: 1.4 }}>
                      {t.description.split('.')[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Managed Payments (Busmo collects on your behalf) ─────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardTitle}>Managed Payments</p>
            <p className={styles.cardSub}>Let Busmo collect payments on your behalf. We charge a 5% commission per sale and pay out your earnings on request.</p>
          </div>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => { setManagedPayments(v => !v); mark(); }}
            style={{
              width: 46, height: 26, borderRadius: 100, border: 'none', cursor: 'pointer', padding: 3,
              background: managedPayments ? 'var(--sell-primary)' : 'var(--sell-border)',
              transition: 'background 0.2s', flexShrink: 0, position: 'relative',
            }}
            aria-pressed={managedPayments}
          >
            <span style={{
              display: 'block', width: 20, height: 20, borderRadius: '50%',
              background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              transform: managedPayments ? 'translateX(20px)' : 'translateX(0)',
              transition: 'transform 0.2s',
            }} />
          </button>
        </div>

        {managedPayments && (
          <div className={styles.cardBody}>
            {/* Info banner */}
            <div style={{
              display: 'flex', gap: 12, padding: '12px 14px',
              background: 'var(--sell-primary-lt)', borderRadius: 10,
              border: '1px solid var(--sell-primary)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sell-primary)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sell-primary)', marginBottom: 3 }}>Busmo handles everything</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', lineHeight: 1.5 }}>
                  Payments are collected via Busmo&apos;s Paystack account. A <strong>5% commission</strong> is deducted from each sale. Your net earnings appear in the Earnings dashboard and you can request a payout at any time.
                </p>
              </div>
            </div>

            {/* Bank details for payouts */}
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)', marginTop: 4 }}>Your payout bank account</p>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bank name</label>
                <input className={styles.formInput} value={payoutBankName} onChange={e => { setPayoutBankName(e.target.value); mark(); }} placeholder="e.g. GTBank, Access Bank" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Account number</label>
                <input className={styles.formInput} value={payoutAccountNumber} onChange={e => { setPayoutAccountNum(e.target.value.replace(/\D/g, '')); mark(); }} placeholder="0123456789" maxLength={10} />
              </div>
            </div>
            <div className={styles.formGroup} style={{ maxWidth: 360 }}>
              <label className={styles.formLabel}>Account name</label>
              <input className={styles.formInput} value={payoutAccountName} onChange={e => { setPayoutAccountName(e.target.value); mark(); }} placeholder="As it appears on your bank account" />
            </div>

            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}
              onClick={() => navigateTo('earnings')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              View Earnings &amp; Payouts
            </button>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className={styles.saveBar}>
        <span className={styles.saveBarMsg}>{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={saving || !dirty || !storeName.trim()}>
          {saving
            ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>Saving…</>
            : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save settings</>}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

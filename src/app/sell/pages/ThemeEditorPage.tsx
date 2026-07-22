'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import { THEMES } from '@/app/store/themes/registry';
import { ThemeThumbnail } from '../components/ThemeThumbnail';
import type {
  StorefrontTheme, StoreSection, StoreSectionType,
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, ProductsSectionSettings,
  AnnouncementSectionSettings, HeaderSectionSettings,
  FooterSectionSettings,
} from '@/app/sell/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/app/sell/mo-sell.types';
import styles from './ThemeEditorPage.module.css';

// ── Section icons ─────────────────────────────────────────────────────────────

const SectionIcons: Record<StoreSectionType, React.ReactNode> = {
  header:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>,
  announcement: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 000 6h20v-6z"/><path d="M22 11V3L7 11h15z"/></svg>,
  hero:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><polyline points="3 20 7 16 11 19 15 14 21 20"/></svg>,
  collections:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  featured:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  products:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  footer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><rect x="3" y="16" width="18" height="5" rx="1"/></svg>,
};

const SECTION_META: Record<StoreSectionType, { label: string; movable: boolean }> = {
  header:       { label: 'Header',        movable: false },
  announcement: { label: 'Announcement',  movable: true  },
  hero:         { label: 'Hero Banner',   movable: false },
  collections:  { label: 'Collections',  movable: true  },
  featured:     { label: 'Featured',     movable: true  },
  products:     { label: 'All Products', movable: true  },
  footer:       { label: 'Footer',       movable: false },
};

// ── Field helpers ─────────────────────────────────────────────────────────────

function TextField({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input className={styles.fieldInput} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
  );
}

function ToggleField({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div className={styles.fieldRow}>
      <div>
        <span className={styles.fieldLabel}>{label}</span>
        {hint && <p className={styles.fieldHint}>{hint}</p>}
      </div>
      <button
        className={[styles.toggle, value ? styles.toggleOn : ''].join(' ')}
        onClick={() => onChange(!value)}
        aria-pressed={value}
        type="button"
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <select className={styles.fieldSelect} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.fieldInput}
        type="number" value={value} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 80 }}
      />
    </div>
  );
}

// ── Section settings panels ───────────────────────────────────────────────────

function HeroSettings({ s, update }: { s: HeroSectionSettings; update: (p: Partial<HeroSectionSettings>) => void }) {
  return (<>
    <TextField label="Heading" value={s.heading ?? ''} onChange={v => update({ heading: v })} placeholder="Leave empty to use store name" />
    <TextField label="Subheading" value={s.subheading ?? ''} onChange={v => update({ subheading: v })} placeholder="Leave empty to use tagline" />
    <ToggleField label="Show subheading" value={s.showTagline !== false} onChange={v => update({ showTagline: v })} />
    <TextField label="CTA button label" value={s.ctaLabel ?? 'Shop Now'} onChange={v => update({ ctaLabel: v })} />
    <TextField label="CTA button URL" value={s.ctaUrl ?? '#products'} onChange={v => update({ ctaUrl: v })} />
    <SelectField label="Text alignment" value={s.textAlign ?? 'left'} onChange={v => update({ textAlign: v as 'left'|'center'|'right' })}
      options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
    <TextField label="Background image URL" value={s.backgroundImage ?? ''} onChange={v => update({ backgroundImage: v || null })}
      placeholder="https://…" hint="Optional — overrides the theme gradient" />
  </>);
}

function CollectionsSettings({ s, update }: { s: CollectionsSectionSettings; update: (p: Partial<CollectionsSectionSettings>) => void }) {
  return (<>
    <TextField label="Section heading" value={s.heading ?? 'Collections'} onChange={v => update({ heading: v })} />
    <SelectField label="Layout" value={s.layout ?? 'strip'} onChange={v => update({ layout: v as 'strip'|'grid' })}
      options={[{ value: 'strip', label: 'Horizontal strip' }, { value: 'grid', label: 'Grid' }]} />
    <NumberField label="Max shown" value={s.maxItems ?? 8} onChange={v => update({ maxItems: v })} min={1} max={20} />
    <ToggleField label="Show cover images" value={s.showCoverImages !== false} onChange={v => update({ showCoverImages: v })} />
  </>);
}

function FeaturedSettings({ s, update }: { s: FeaturedSectionSettings; update: (p: Partial<FeaturedSectionSettings>) => void }) {
  return (<>
    <TextField label="Section heading" value={s.heading ?? '⭐ Featured'} onChange={v => update({ heading: v })} />
    <NumberField label="Max products" value={s.maxItems ?? 8} onChange={v => update({ maxItems: v })} min={1} max={20} />
    <SelectField label="Columns" value={String(s.columns ?? 4)} onChange={v => update({ columns: Number(v) as 2|3|4 })}
      options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} />
  </>);
}

function ProductsSettings({ s, update }: { s: ProductsSectionSettings; update: (p: Partial<ProductsSectionSettings>) => void }) {
  return (<>
    <TextField label="Section heading" value={s.heading ?? 'All Products'} onChange={v => update({ heading: v })} />
    <SelectField label="Columns" value={String(s.columns ?? 3)} onChange={v => update({ columns: Number(v) as 2|3|4 })}
      options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} />
    <SelectField label="Default sort" value={s.defaultSort ?? 'newest'} onChange={v => update({ defaultSort: v as 'newest'|'price_asc'|'price_desc' })}
      options={[{ value: 'newest', label: 'Newest first' }, { value: 'price_asc', label: 'Price: low → high' }, { value: 'price_desc', label: 'Price: high → low' }]} />
  </>);
}

function AnnouncementSettings({ s, update }: { s: AnnouncementSectionSettings; update: (p: Partial<AnnouncementSectionSettings>) => void }) {
  return (<>
    <TextField label="Announcement text" value={s.text ?? ''} onChange={v => update({ text: v })}
      placeholder="Free delivery on orders over ₦10,000" />
    <TextField label="Link label" value={s.linkLabel ?? ''} onChange={v => update({ linkLabel: v })} placeholder="Learn more" />
    <TextField label="Link URL" value={s.linkUrl ?? ''} onChange={v => update({ linkUrl: v })} placeholder="https://…" />
    <div className={styles.field}>
      <label className={styles.fieldLabel}>Background color</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="color" value={s.backgroundColor ?? '#0EA5E9'} onChange={e => update({ backgroundColor: e.target.value })}
          style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sell-border)', cursor: 'pointer', padding: 2 }} />
        <input className={styles.fieldInput} value={s.backgroundColor ?? '#0EA5E9'}
          onChange={e => update({ backgroundColor: e.target.value })} style={{ width: 100 }} />
      </div>
    </div>
  </>);
}

function HeaderSettings({ s, update }: { s: HeaderSectionSettings; update: (p: Partial<HeaderSectionSettings>) => void }) {
  return (<>
    <ToggleField label="Sticky header" value={s.sticky !== false} onChange={v => update({ sticky: v })}
      hint="Stays at the top when scrolling" />
    <ToggleField label="Show cart count" value={s.showCartCount !== false} onChange={v => update({ showCartCount: v })} />
  </>);
}

function FooterSettings({ s, update }: { s: FooterSectionSettings; update: (p: Partial<FooterSectionSettings>) => void }) {
  const socials = s.socials ?? {};
  const setSocial = (key: string, value: string) =>
    update({ socials: { ...socials, [key]: value || undefined } });
  return (<>
    <ToggleField label="Show store logo" value={s.showLogo !== false} onChange={v => update({ showLogo: v })} />
    <ToggleField label="Show 'Powered by Busmo'" value={s.showPoweredBy !== false} onChange={v => update({ showPoweredBy: v })} />
    <TextField label="Custom footer text" value={s.customText ?? ''} onChange={v => update({ customText: v })}
      placeholder="© 2025 Your Brand." />
    <div className={styles.field} style={{ marginTop: 4 }}>
      <p className={styles.fieldLabel} style={{ marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sell-text-3)' }}>Social links</p>
      {(['instagram','twitter','facebook','tiktok','whatsapp','youtube'] as const).map(key => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 28, height: 28, flexShrink: 0, background: 'var(--sell-surface-2)', border: '1px solid var(--sell-border)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--sell-text-2)', textTransform: 'capitalize' }}>
            {key.slice(0, 2).toUpperCase()}
          </span>
          <input className={styles.fieldInput} value={(socials as Record<string,string>)[key] ?? ''}
            onChange={e => setSocial(key, e.target.value)}
            placeholder={`https://${key}.com/yourstore`} style={{ fontSize: '0.8rem' }} />
        </div>
      ))}
    </div>
  </>);
}

// ── Live preview ──────────────────────────────────────────────────────────────

function LivePreview({ theme: themeId, sections, storeName, primary, secondary }: {
  theme: StorefrontTheme; sections: StoreSection[];
  storeName: string; primary: string; secondary: string;
}) {
  const t = THEMES.find(x => x.id === themeId) ?? THEMES[0];
  const merged = { ...t, previewAccent: primary };
  const heroSection = sections.find(s => s.type === 'hero' && s.enabled);
  const heroSettings = heroSection?.settings as HeroSectionSettings | undefined;
  const heading = heroSettings?.heading || storeName || 'Your Store';

  const isDark = themeId === 'luxe' || themeId === 'bold';
  const panelBg = isDark ? '#111' : '#f1f5f9';
  const textCol = isDark ? '#888' : '#94A3B8';
  const borderCol = isDark ? '#222' : '#e2e8f0';

  return (
    <div>
      {/* Browser chrome */}
      <div style={{ height: 30, background: 'var(--sell-surface-2)', borderRadius: '10px 10px 0 0', border: '1px solid var(--sell-border)', borderBottom: 'none', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 7 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#FF5F57','#FFBD2E','#28CA41'].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />)}
        </div>
        <div style={{ flex: 1, background: 'var(--sell-bg)', borderRadius: 5, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: 'var(--sell-text-3)', overflow: 'hidden', padding: '0 6px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          busmo.io/store/{heading.toLowerCase().replace(/\s+/g,'-').slice(0,22)}
        </div>
      </div>

      {/* Theme thumbnail */}
      <div style={{ border: '1px solid var(--sell-border)', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
        <ThemeThumbnail theme={merged} width={280} />
      </div>

      {/* Active sections list */}
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sell-text-3)', marginBottom: 8 }}>
          Active sections
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {sections.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, background: s.enabled ? 'var(--sell-surface)' : 'transparent', border: `1px solid ${s.enabled ? 'var(--sell-border)' : 'transparent'}`, opacity: s.enabled ? 1 : 0.4 }}>
              <span style={{ width: 14, height: 14, color: s.enabled ? 'var(--sell-primary)' : 'var(--sell-text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {SectionIcons[s.type]}
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: s.enabled ? 600 : 400, color: s.enabled ? 'var(--sell-text-1)' : 'var(--sell-text-3)', flex: 1 }}>
                {SECTION_META[s.type].label}
              </span>
              {!s.enabled && <span style={{ fontSize: '0.65rem', color: 'var(--sell-text-3)' }}>hidden</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ThemeEditorPage() {
  const { user, storeConfig, refreshStoreConfig, showToast } = useSell();

  const [sections,  setSections]  = useState<StoreSection[]>([]);
  const [theme,     setTheme]     = useState<StorefrontTheme>('classic');
  const [primary,   setPrimary]   = useState('#0EA5E9');
  const [secondary, setSecondary] = useState('#6366F1');
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [applying,  setApplying]  = useState(false);
  const [dirty,     setDirty]     = useState(false);

  // Seed state from storeConfig on load
  useEffect(() => {
    if (!storeConfig) return;
    const saved = (storeConfig as any).sections as StoreSection[] | undefined;
    const merged = DEFAULT_SECTIONS.map(def => {
      const s = saved?.find(x => x.id === def.id);
      return s ? { ...def, ...s, settings: { ...def.settings, ...s.settings } } : { ...def };
    }).sort((a, b) => a.order - b.order);
    setSections(merged);
    setTheme((storeConfig as any).theme ?? 'classic');
    setPrimary((storeConfig as any).primaryColor ?? '#0EA5E9');
    setSecondary((storeConfig as any).secondaryColor ?? '#6366F1');
    setDirty(false);
  }, [storeConfig]);

  const mark = useCallback(() => setDirty(true), []);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setSections(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(s => s.id === id);
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((s, i) => ({ ...s, order: i }));
    });
    mark();
  }, [mark]);

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    mark();
  }, [mark]);

  const updateSettings = useCallback((id: string, patch: Record<string, unknown>) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s));
    mark();
  }, [mark]);

  // Apply to store — writes theme + sections to Firestore
  const handleApply = useCallback(async () => {
    if (!user?.businessId || !storeConfig) return;
    setApplying(true);
    try {
      const { firestore } = initializeFirebase();
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        {
          ...(storeConfig as any),
          theme,
          primaryColor:   primary,
          secondaryColor: secondary,
          sections: sections.map(s => ({ ...s })),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      // Keep storeIndex in sync
      const slug = (storeConfig as any)?.storeSlug;
      if (slug) {
        await setDoc(doc(firestore, 'storeIndex', slug), {
          businessId: user.businessId,
          storeName: (storeConfig as any).storeName,
          updatedAt: serverTimestamp(),
        });
      }
      await refreshStoreConfig();
      setDirty(false);
      showToast('Theme applied to your store!', 'success');
    } catch (err) {
      console.error('[ThemeEditor] Apply error:', err);
      showToast('Failed to apply. Please try again.', 'error');
    } finally {
      setApplying(false);
    }
  }, [user, storeConfig, theme, primary, secondary, sections, refreshStoreConfig, showToast]);

  const activeSection = sections.find(s => s.id === activeId) ?? null;
  const storeName = (storeConfig as any)?.storeName ?? 'Your Store';

  return (
    <div className={styles.root}>
      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.topbarTitle}>Customize</span>
          {storeConfig?.storeSlug && (
            <a href={`/store/${storeConfig.storeSlug}`} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View live store
            </a>
          )}
        </div>
        <div className={styles.topbarRight}>
          {dirty && <span className={styles.unsavedDot} title="Unsaved changes" />}
          <button className={styles.btnSave} onClick={handleApply} disabled={applying || !dirty}>
            {applying ? <><span className={styles.spinner} />Applying…</> : <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Apply to store
            </>}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>

        {/* LEFT: section controls */}
        <div className={styles.panel}>
          {activeSection ? (
            <div className={styles.drillIn}>
              <button className={styles.backBtn} onClick={() => setActiveId(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                All sections
              </button>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>{SectionIcons[activeSection.type]}</span>
                <span className={styles.sectionTitle}>{SECTION_META[activeSection.type].label}</span>
              </div>
              <div className={styles.settingsBody}>
                {activeSection.type === 'hero'         && <HeroSettings         s={activeSection.settings as HeroSectionSettings}         update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'collections'  && <CollectionsSettings  s={activeSection.settings as CollectionsSectionSettings}  update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'featured'     && <FeaturedSettings     s={activeSection.settings as FeaturedSectionSettings}     update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'products'     && <ProductsSettings     s={activeSection.settings as ProductsSectionSettings}     update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'announcement' && <AnnouncementSettings s={activeSection.settings as AnnouncementSectionSettings} update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'header'       && <HeaderSettings       s={activeSection.settings as HeaderSectionSettings}       update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                {activeSection.type === 'footer'       && <FooterSettings       s={activeSection.settings as FooterSectionSettings}       update={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
              </div>
            </div>
          ) : (
            <div className={styles.sectionList}>

              {/* Theme + Colors */}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Theme</p>
                <div className={styles.themeGrid}>
                  {THEMES.map(t => (
                    <button key={t.id} className={[styles.themeCard, theme === t.id ? styles.themeCardActive : ''].join(' ')}
                      onClick={() => { setTheme(t.id); mark(); }} type="button" title={t.description}>
                      <ThemeThumbnail theme={t} width={84} />
                      <span className={styles.themeCardName}>{t.name}</span>
                      {theme === t.id && (
                        <span className={styles.themeCardCheck}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sell-border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--sell-text-2)', cursor: 'pointer' }}>
                    <input type="color" value={primary} onChange={e => { setPrimary(e.target.value); mark(); }}
                      style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--sell-border)', cursor: 'pointer', padding: 2 }} />
                    Primary color
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--sell-text-2)', cursor: 'pointer' }}>
                    <input type="color" value={secondary} onChange={e => { setSecondary(e.target.value); mark(); }}
                      style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--sell-border)', cursor: 'pointer', padding: 2 }} />
                    Accent color
                  </label>
                </div>
              </div>

              {/* Sections list */}
              <div className={styles.panelSection}>
                <p className={styles.panelLabel}>Sections</p>
                {sections.map((section, idx) => {
                  const meta = SECTION_META[section.type];
                  return (
                    <div key={section.id} className={[styles.sectionRow, !section.enabled ? styles.sectionRowDisabled : ''].join(' ')}>
                      {meta.movable ? (
                        <div className={styles.moveButtons}>
                          <button className={styles.moveBtn} onClick={() => moveSection(section.id, -1)} disabled={idx === 0}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                          </button>
                          <button className={styles.moveBtn} onClick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                        </div>
                      ) : <div className={styles.moveButtons} />}
                      <button className={styles.sectionRowBtn} onClick={() => setActiveId(section.id)}>
                        <span className={styles.sectionRowIcon}>{SectionIcons[section.type]}</span>
                        <span className={styles.sectionRowLabel}>{meta.label}</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.4 }}><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      <button className={[styles.eyeBtn, section.enabled ? styles.eyeBtnOn : ''].join(' ')} onClick={() => toggleSection(section.id)} type="button">
                        {section.enabled
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* RIGHT: live preview */}
        <div className={styles.previewPane}>
          <div className={styles.previewPaneInner}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p className={styles.panelLabel} style={{ margin: 0 }}>Live preview</p>
              <span style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>
                Click "Apply to store" to publish
              </span>
            </div>
            <LivePreview
              theme={theme}
              sections={sections}
              storeName={storeName}
              primary={primary}
              secondary={secondary}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useSell } from '../context/SellContext';
import { THEMES } from '@/app/store/themes/registry';
import { StorefrontCanvas } from '../components/StorefrontCanvas';
import { CartProvider } from '@/app/store/[storeSlug]/context/CartContext';
import type {
  StorefrontTheme, StoreSection, StoreSectionType,
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, AnnouncementSectionSettings,
  HeaderSectionSettings, FooterSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  InstagramSectionSettings, NewsletterSectionSettings,
} from '@/app/sell/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/app/sell/mo-sell.types';
import styles from './ThemeEditorPage.module.css';

// ─── Section icons & meta ─────────────────────────────────────────────────────

const SectionIcons: Record<StoreSectionType, React.ReactNode> = {
  header:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>,
  announcement: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 000 6h20v-6z"/><path d="M22 11V3L7 11h15z"/></svg>,
  hero:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><polyline points="3 20 7 16 11 19 15 14 21 20"/></svg>,
  featured:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  collections:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  about:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  testimonials: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  instagram:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  newsletter:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  footer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><rect x="3" y="16" width="18" height="5" rx="1"/></svg>,
};

const SECTION_META: Record<StoreSectionType, { label: string; movable: boolean }> = {
  header:       { label: 'Header',           movable: false },
  announcement: { label: 'Announcement bar', movable: true  },
  hero:         { label: 'Hero / Banner',    movable: false },
  featured:     { label: 'Featured Products',movable: true  },
  collections:  { label: 'Collections',     movable: true  },
  about:        { label: 'About / Story',    movable: true  },
  testimonials: { label: 'Testimonials',    movable: true  },
  instagram:    { label: 'Instagram Feed',  movable: true  },
  newsletter:   { label: 'Newsletter',      movable: true  },
  footer:       { label: 'Footer',          movable: false },
};

// ─── Field helpers ────────────────────────────────────────────────────────────

function SGroup({ label }: { label: string }) {
  return <p className={styles.sGroup}>{label}</p>;
}

function TF({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <input className={styles.fInput} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className={styles.fHint}>{hint}</p>}
    </div>
  );
}

function Toggle({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div className={styles.fRow}>
      <div style={{ flex: 1 }}>
        <span className={styles.fLabel}>{label}</span>
        {hint && <p className={styles.fHint}>{hint}</p>}
      </div>
      <button className={[styles.toggle, value ? styles.toggleOn : ''].join(' ')} onClick={() => onChange(!value)} type="button" aria-pressed={value}>
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

function SF({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <select className={styles.fSelect} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid var(--sell-border)', cursor: 'pointer', padding: 2, background: 'transparent', flexShrink: 0 }} />
        <input className={styles.fInput} value={value} onChange={e => onChange(e.target.value)} style={{ width: 90 }} />
      </div>
    </div>
  );
}

// ─── Section settings panels ──────────────────────────────────────────────────

function HeroSettings({ s, upd }: { s: HeroSectionSettings; upd: (p: Partial<HeroSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? ''} onChange={v => upd({ heading: v })} placeholder="Defaults to store name" />
    <TF label="Subheading" value={s.subheading ?? ''} onChange={v => upd({ subheading: v })} placeholder="Defaults to tagline" />
    <Toggle label="Show subheading" value={s.showTagline !== false} onChange={v => upd({ showTagline: v })} />
    <TF label="Button text" value={s.ctaLabel ?? 'Shop Now'} onChange={v => upd({ ctaLabel: v })} />
    <TF label="Button link" value={s.ctaUrl ?? '#products'} onChange={v => upd({ ctaUrl: v })} />
    <SGroup label="STYLE" />
    <SF label="Text alignment" value={s.textAlign ?? 'left'} onChange={v => upd({ textAlign: v as 'left'|'center'|'right' })}
      options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
    <TF label="Background image URL" value={s.backgroundImage ?? ''} onChange={v => upd({ backgroundImage: v || null })} placeholder="https://…" hint="Overrides theme gradient" />
  </>);
}

function AnnouncementSettings({ s, upd }: { s: AnnouncementSectionSettings; upd: (p: Partial<AnnouncementSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Text" value={s.text ?? ''} onChange={v => upd({ text: v })} placeholder="Free delivery on orders over ₦20,000" />
    <TF label="Link label" value={s.linkLabel ?? ''} onChange={v => upd({ linkLabel: v })} placeholder="Shop now" />
    <TF label="Link URL" value={s.linkUrl ?? ''} onChange={v => upd({ linkUrl: v })} placeholder="/collections/all" />
    <SGroup label="STYLE" />
    <ColorField label="Background" value={s.backgroundColor ?? '#0F172A'} onChange={v => upd({ backgroundColor: v })} />
  </>);
}

function FeaturedSettings({ s, upd }: { s: FeaturedSectionSettings; upd: (p: Partial<FeaturedSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'Shop Bestsellers'} onChange={v => upd({ heading: v })} />
    <SGroup label="LAYOUT" />
    <SF label="Columns" value={String(s.columns ?? 4)} onChange={v => upd({ columns: Number(v) as 2|3|4 })}
      options={[{ value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} />
    <div className={styles.field}>
      <label className={styles.fLabel}>Max products shown</label>
      <input className={styles.fInput} type="number" value={s.maxItems ?? 4} min={1} max={12} onChange={e => upd({ maxItems: Number(e.target.value) })} style={{ width: 70 }} />
    </div>
  </>);
}

function CollectionsSettings({ s, upd }: { s: CollectionsSectionSettings; upd: (p: Partial<CollectionsSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'Collections'} onChange={v => upd({ heading: v })} />
    <SGroup label="LAYOUT" />
    <SF label="Layout" value={s.layout ?? 'strip'} onChange={v => upd({ layout: v as 'strip'|'grid' })}
      options={[{ value: 'strip', label: 'Horizontal strip' }, { value: 'grid', label: 'Grid' }]} />
    <div className={styles.field}>
      <label className={styles.fLabel}>Max collections</label>
      <input className={styles.fInput} type="number" value={s.maxItems ?? 6} min={1} max={20} onChange={e => upd({ maxItems: Number(e.target.value) })} style={{ width: 70 }} />
    </div>
    <Toggle label="Show cover images" value={s.showCoverImages !== false} onChange={v => upd({ showCoverImages: v })} />
  </>);
}

function AboutSettings({ s, upd }: { s: AboutSectionSettings; upd: (p: Partial<AboutSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'Our Story'} onChange={v => upd({ heading: v })} />
    <div className={styles.field}>
      <label className={styles.fLabel}>Body text</label>
      <textarea className={styles.fInput} value={s.body ?? ''} onChange={e => upd({ body: e.target.value })} rows={4} placeholder="Tell customers about your brand..." style={{ resize: 'vertical' }} />
    </div>
    <TF label="Image URL" value={s.imageUrl ?? ''} onChange={v => upd({ imageUrl: v || null })} placeholder="https://…" />
    <SF label="Image position" value={s.imagePosition ?? 'right'} onChange={v => upd({ imagePosition: v as 'left'|'right' })}
      options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
  </>);
}

function TestimonialsSettings({ s, upd }: { s: TestimonialsSectionSettings; upd: (p: Partial<TestimonialsSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'What our customers say'} onChange={v => upd({ heading: v })} />
    <p className={styles.fHint} style={{ padding: '8px 0' }}>Manage testimonials in your store settings once live.</p>
  </>);
}

function InstagramSettings({ s, upd }: { s: InstagramSectionSettings; upd: (p: Partial<InstagramSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'Follow us on Instagram'} onChange={v => upd({ heading: v })} />
    <TF label="Instagram handle" value={s.handle ?? ''} onChange={v => upd({ handle: v })} placeholder="@yourstore" />
  </>);
}

function NewsletterSettings({ s, upd }: { s: NewsletterSectionSettings; upd: (p: Partial<NewsletterSectionSettings>) => void }) {
  return (<>
    <SGroup label="CONTENT" />
    <TF label="Heading" value={s.heading ?? 'Join our community'} onChange={v => upd({ heading: v })} />
    <TF label="Subheading" value={s.subheading ?? ''} onChange={v => upd({ subheading: v })} placeholder="Get the latest updates and offers." />
    <TF label="Button text" value={s.buttonLabel ?? 'Subscribe'} onChange={v => upd({ buttonLabel: v })} />
    <TF label="Input placeholder" value={s.placeholder ?? 'Enter your email'} onChange={v => upd({ placeholder: v })} />
  </>);
}

function HeaderSettings({ s, upd }: { s: HeaderSectionSettings; upd: (p: Partial<HeaderSectionSettings>) => void }) {
  return (<>
    <SGroup label="BEHAVIOR" />
    <Toggle label="Sticky header" value={s.sticky !== false} onChange={v => upd({ sticky: v })} hint="Stays fixed when scrolling" />
    <Toggle label="Show cart count" value={s.showCartCount !== false} onChange={v => upd({ showCartCount: v })} />
  </>);
}

function FooterSettings({ s, upd }: { s: FooterSectionSettings; upd: (p: Partial<FooterSectionSettings>) => void }) {
  const socials = s.socials ?? {};
  const setSocial = (key: string, val: string) => upd({ socials: { ...socials, [key]: val || undefined } });
  return (<>
    <SGroup label="CONTENT" />
    <Toggle label="Show store logo" value={s.showLogo !== false} onChange={v => upd({ showLogo: v })} />
    <Toggle label="Powered by Busmo" value={s.showPoweredBy !== false} onChange={v => upd({ showPoweredBy: v })} />
    <TF label="Custom copyright text" value={s.customText ?? ''} onChange={v => upd({ customText: v })} placeholder="© 2025 Your Brand." />
    <SGroup label="SOCIAL LINKS" />
    {(['instagram','twitter','tiktok','facebook','whatsapp','youtube'] as const).map(k => (
      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        <span className={styles.socialKey}>{k.slice(0,2).toUpperCase()}</span>
        <input className={styles.fInput} value={(socials as Record<string,string>)[k] ?? ''} onChange={e => setSocial(k, e.target.value)} placeholder={`https://${k}.com/…`} style={{ fontSize: '0.78rem' }} />
      </div>
    ))}
  </>);
}

// ─── Marketplace card ──────────────────────────────────────────────────────────

function ThemeCard({ themeId, isActive, storeName, tagline, primary, secondary, logoUrl, onSelect }: {
  themeId: StorefrontTheme; isActive: boolean; storeName: string; tagline: string;
  primary: string; secondary: string; logoUrl?: string | null; onSelect: () => void;
}) {
  const t = THEMES.find(x => x.id === themeId)!;
  return (
    <div className={[styles.mCard, isActive ? styles.mCardActive : ''].join(' ')} onClick={onSelect}>
      <div className={styles.mPreview}>
        <StorefrontCanvas theme={themeId} storeName={storeName} tagline={tagline} primaryColor={primary} secondaryColor={secondary} logoUrl={logoUrl} width={280} />
      </div>
      <div className={styles.mMeta}>
        <div>
          <p className={styles.mName}>{t.name}</p>
          <p className={styles.mSub}>{t.bestFor.join(', ')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {t.badge && <span className={styles.mBadge} style={{ color: t.badge.color, background: t.badge.bg }}>{t.badge.label}</span>}
          {isActive && <span className={styles.mActive}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Active</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ThemeEditorPage() {
  const { user, storeConfig, refreshStoreConfig, showToast } = useSell();

  const [sections,  setSections]  = useState<StoreSection[]>([]);
  const [theme,     setTheme]     = useState<StorefrontTheme>('luxe');
  const [primary,   setPrimary]   = useState('#C9A84C');
  const [secondary, setSecondary] = useState('#8B7355');
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [applying,  setApplying]  = useState(false);
  const [dirty,     setDirty]     = useState(false);
  const [view,      setView]      = useState<'marketplace' | 'editor'>('marketplace');
  const [device,    setDevice]    = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [products,  setProducts]  = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                           (typeof window !== 'undefined' && window.innerWidth < 768);
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        setDevice('mobile');
      }
    };
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Undo/redo stacks
  const undoStack = useRef<{ sections: StoreSection[]; theme: StorefrontTheme; primary: string; secondary: string }[]>([]);
  const redoStack = useRef<{ sections: StoreSection[]; theme: StorefrontTheme; primary: string; secondary: string }[]>([]);

  const snapshot = useCallback(() => ({ sections: sections.map(s => ({ ...s, settings: { ...s.settings } })), theme, primary, secondary }), [sections, theme, primary, secondary]);

  const pushUndo = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-20), snapshot()];
    redoStack.current = [];
  }, [snapshot]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(snapshot());
    setSections(prev.sections); setTheme(prev.theme); setPrimary(prev.primary); setSecondary(prev.secondary);
    setDirty(true);
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(snapshot());
    setSections(next.sections); setTheme(next.theme); setPrimary(next.primary); setSecondary(next.secondary);
    setDirty(true);
  }, [snapshot]);

  // Seed from storeConfig
  useEffect(() => {
    if (!storeConfig) return;
    const saved = (storeConfig as any).sections as StoreSection[] | undefined;
    const merged = DEFAULT_SECTIONS.map(def => {
      const s = saved?.find(x => x.id === def.id);
      return s ? { ...def, ...s, settings: { ...def.settings, ...s.settings } } : { ...def };
    }).sort((a, b) => a.order - b.order);
    setSections(merged);
    const t = (storeConfig as any).theme ?? 'luxe';
    setTheme(t);
    setPrimary((storeConfig as any).primaryColor ?? '#C9A84C');
    setSecondary((storeConfig as any).secondaryColor ?? '#8B7355');
    setDirty(false);
    undoStack.current = []; redoStack.current = [];
  }, [storeConfig]);

  // Fetch real products for preview
  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${baseUrl}/api/store/products?businessId=${user.businessId}&available=true`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, [user?.businessId]);

  // Fetch real collections for preview
  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${baseUrl}/api/store/collections?businessId=${user.businessId}`)
      .then(r => r.ok ? r.json() : { collections: [] })
      .then(d => setCollections(d.collections ?? []))
      .catch(() => setCollections([]));
  }, [user?.businessId]);

  const mark = useCallback(() => setDirty(true), []);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    pushUndo();
    setSections(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(s => s.id === id);
      const t = idx + dir;
      if (t < 0 || t >= arr.length) return prev;
      [arr[idx], arr[t]] = [arr[t], arr[idx]];
      return arr.map((s, i) => ({ ...s, order: i }));
    });
    mark();
  }, [pushUndo, mark]);

  const toggleSection = useCallback((id: string) => {
    pushUndo();
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    mark();
  }, [pushUndo, mark]);

  const updateSettings = useCallback((id: string, patch: Record<string, unknown>) => {
    pushUndo();
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s));
    mark();
  }, [pushUndo, mark]);

  const handleApply = useCallback(async () => {
    if (!user?.businessId || !storeConfig) return;
    setApplying(true);
    try {
      const { firestore } = initializeFirebase();
      const slug = (storeConfig as any)?.storeSlug;
      
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        { 
          ...(storeConfig as any), 
          theme, 
          primaryColor: primary, 
          secondaryColor: secondary, 
          sections: sections.map(s => ({ ...s })), 
          storeSlug: slug, // Explicitly include storeSlug to ensure it's preserved
          updatedAt: serverTimestamp() 
        },
        { merge: true }
      );
      
      if (slug) await setDoc(doc(firestore, 'storeIndex', slug), { businessId: user.businessId, storeName: (storeConfig as any).storeName, updatedAt: serverTimestamp() });
      await refreshStoreConfig();
      setDirty(false);
      showToast('Theme published to your store!', 'success');
    } catch (err) {
      console.error('[ThemeEditor]', err);
      showToast('Failed to publish. Try again.', 'error');
    } finally { setApplying(false); }
  }, [user, storeConfig, theme, primary, secondary, sections, refreshStoreConfig, showToast]);

  const storeName = (storeConfig as any)?.storeName ?? 'Your Store';
  const tagline   = (storeConfig as any)?.tagline   ?? 'Shop our latest collection';
  const logoUrl   = (storeConfig as any)?.logoUrl   ?? null;
  const activeSection = sections.find(s => s.id === activeId) ?? null;

  const handlePreview = useCallback(() => {
    if (isMobile) {
      // Store preview data in sessionStorage for the new page
      const previewData = {
        theme,
        storeName,
        tagline,
        primaryColor: primary,
        secondaryColor: secondary,
        logoUrl,
        sections,
        storeSlug: (storeConfig as any)?.storeSlug,
        products,
        collections,
      };
      sessionStorage.setItem('mobilePreviewData', JSON.stringify(previewData));
      // Open new page for mobile preview
      window.open('/sell/mobile-preview', '_blank');
    }
  }, [isMobile, theme, storeName, tagline, primary, secondary, logoUrl, sections, storeConfig, products, collections]);

  // Preview width by device - increased sizes for better visibility
  // Desktop fills center panel, mobile/tablet use fixed widths
  const previewWidth = device === 'mobile' ? 375 : device === 'tablet' ? 900 : 1200;
  const previewScale = device === 'mobile' ? 0.85 : device === 'tablet' ? 0.65 : 1;

  return (
    <div className={styles.root}>

      {/* ── Topbar ── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          {view === 'editor' && (
            <button className={styles.backBtn} onClick={() => { setActiveId(null); setView('marketplace'); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Themes
            </button>
          )}
          <span className={styles.topbarTitle}>{view === 'marketplace' ? 'Choose a theme' : 'Customize'}</span>
          {view === 'editor' && (
            <span className={styles.themePill}>{THEMES.find(t => t.id === theme)?.name ?? theme}</span>
          )}
          {view === 'editor' && storeConfig?.storeSlug && (
            <a href={`/store/${storeConfig.storeSlug}`} target="_blank" rel="noopener noreferrer" className={styles.liveBadge}>
              <span className={styles.liveDot} />Live
            </a>
          )}
        </div>
        <div className={styles.topbarCenter}>
          {view === 'editor' && (
            <>
              {/* Undo/Redo */}
              <button className={styles.iconBtn} onClick={undo} title="Undo" disabled={undoStack.current.length === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
              </button>
              <button className={styles.iconBtn} onClick={redo} title="Redo" disabled={redoStack.current.length === 0}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
              </button>
              <div className={styles.dividerV} />
              {/* Device switcher - hide on mobile since only mobile preview is available */}
              {!isMobile && (['desktop','tablet','mobile'] as const).map(d => (
                <button 
                  key={d} 
                  className={[styles.iconBtn, device === d ? styles.iconBtnActive : ''].join(' ')} 
                  onClick={() => setDevice(d)} 
                  title={d.charAt(0).toUpperCase() + d.slice(1)}
                >
                  {d === 'desktop' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
                  {d === 'tablet'  && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                  {d === 'mobile'  && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                </button>
              ))}
            </>
          )}
        </div>
        <div className={styles.topbarRight}>
          {view === 'editor' && (
            <button className={styles.previewBtn} onClick={handlePreview}>
              Preview
            </button>
          )}
          {view === 'editor' && dirty && <span className={styles.unsavedDot} />}
          {view === 'editor' && (
            <button className={styles.publishBtn} onClick={handleApply} disabled={applying || !dirty}>
              {applying ? <><span className={styles.spinner} />Publishing…</> : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* ── MARKETPLACE ── */}
      {view === 'marketplace' && (
        <div className={styles.marketplace}>
          <div className={styles.marketColors}>
            <span className={styles.marketColorsLabel}>Preview with your colors:</span>
            <label className={styles.cLabel}><input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className={styles.cPicker} />Primary</label>
            <label className={styles.cLabel}><input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} className={styles.cPicker} />Accent</label>
          </div>
          <div className={styles.themeGrid}>
            {THEMES.map(t => (
              <ThemeCard key={t.id} themeId={t.id} isActive={theme === t.id}
                storeName={storeName} tagline={tagline} primary={primary} secondary={secondary} logoUrl={logoUrl}
                onSelect={() => { setTheme(t.id); pushUndo(); mark(); setView('editor'); }} />
            ))}
          </div>
        </div>
      )}

      {/* ── 3-PANEL EDITOR ── */}
      {view === 'editor' && (
        <div className={styles.editorBody}>

          {/* LEFT: sections */}
          <div className={styles.leftPanel}>
            <div className={styles.sectionsList}>
              {sections.map((sec, idx) => {
                const meta = SECTION_META[sec.type];
                return (
                  <div key={sec.id} className={[styles.secRow, !sec.enabled ? styles.secRowOff : '', activeId === sec.id ? styles.secRowActive : ''].join(' ')}>
                    {meta.movable ? (
                      <div className={styles.moveBtns}>
                        <button className={styles.moveBtn} onClick={() => moveSection(sec.id, -1)} disabled={idx === 0}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>
                        <button className={styles.moveBtn} onClick={() => moveSection(sec.id, 1)} disabled={idx === sections.length - 1}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
                      </div>
                    ) : <div className={styles.moveBtns} />}
                    <button className={styles.secBtn} onClick={() => setActiveId(activeId === sec.id ? null : sec.id)}>
                      <span className={styles.secIcon}>{SectionIcons[sec.type]}</span>
                      <span className={styles.secLabel}>{meta.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <button className={[styles.eyeBtn, sec.enabled ? styles.eyeOn : ''].join(' ')} onClick={() => toggleSection(sec.id)} type="button">
                      {sec.enabled
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      }
                    </button>
                  </div>
                );
              })}
              <button className={styles.addSectionBtn}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add section
              </button>
            </div>
          </div>

          {/* CENTER: live preview - hidden on mobile, shown in modal */}
          <div className={`${styles.centerPanel} ${styles.hideOnMobile}`}>
            <div className={styles.previewOuter}>
              {device === 'desktop' ? (
                // Desktop: fill center panel without scaling
                <div className={styles.desktopPreview}>
                  <CartProvider storeSlug={(storeConfig as any)?.storeSlug}>
                    <StorefrontCanvas
                      theme={theme}
                      storeName={storeName}
                      tagline={tagline}
                      primaryColor={primary}
                      secondaryColor={secondary}
                      logoUrl={logoUrl}
                      sections={sections}
                      width={previewWidth}
                      storeSlug={(storeConfig as any)?.storeSlug}
                      products={products}
                      collections={collections}
                    />
                  </CartProvider>
                </div>
              ) : (
                // Mobile/Tablet: use scaling
                <div style={{
                  width: previewWidth * previewScale,
                  position: 'relative',
                  flexShrink: 0,
                  minWidth: 0,
                  maxWidth: '100%',
                }}>
                  <div className={styles.previewInner} style={{
                    width: previewWidth,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0, left: 0,
                    minWidth: 0,
                  }}>
                    <CartProvider storeSlug={(storeConfig as any)?.storeSlug}>
                      <StorefrontCanvas
                        theme={theme}
                        storeName={storeName}
                        tagline={tagline}
                        primaryColor={primary}
                        secondaryColor={secondary}
                        logoUrl={logoUrl}
                        sections={sections}
                        width={previewWidth}
                        storeSlug={(storeConfig as any)?.storeSlug}
                        products={products}
                        collections={collections}
                      />
                    </CartProvider>
                  </div>
                  {/* Invisible spacer that matches the scaled height so parent scrolls correctly */}
                  <div style={{
                    width: previewWidth * previewScale,
                    visibility: 'hidden',
                    pointerEvents: 'none',
                    minWidth: 0,
                  }}>
                    <StorefrontCanvas
                      theme={theme}
                      storeName={storeName}
                      tagline={tagline}
                      primaryColor={primary}
                      secondaryColor={secondary}
                      logoUrl={logoUrl}
                      sections={sections}
                      width={previewWidth * previewScale}
                      storeSlug={(storeConfig as any)?.storeSlug}
                      products={products}
                      collections={collections}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: settings */}
          <div className={styles.rightPanel}>
            {activeSection ? (
              <>
                <div className={styles.rHeader}>
                  <span className={styles.rIcon}>{SectionIcons[activeSection.type]}</span>
                  <span className={styles.rTitle}>{SECTION_META[activeSection.type].label}</span>
                  <button className={styles.iconBtn} style={{ marginLeft: 'auto' }} onClick={() => setActiveId(null)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className={styles.rBody}>
                  {activeSection.type === 'hero'         && <HeroSettings         s={activeSection.settings as HeroSectionSettings}         upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'announcement' && <AnnouncementSettings s={activeSection.settings as AnnouncementSectionSettings} upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'featured'     && <FeaturedSettings     s={activeSection.settings as FeaturedSectionSettings}     upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'collections'  && <CollectionsSettings  s={activeSection.settings as CollectionsSectionSettings}  upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'about'        && <AboutSettings        s={activeSection.settings as AboutSectionSettings}        upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'testimonials' && <TestimonialsSettings s={activeSection.settings as TestimonialsSectionSettings} upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'instagram'    && <InstagramSettings    s={activeSection.settings as InstagramSectionSettings}    upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'newsletter'   && <NewsletterSettings   s={activeSection.settings as NewsletterSectionSettings}   upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'header'       && <HeaderSettings       s={activeSection.settings as HeaderSectionSettings}       upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                  {activeSection.type === 'footer'       && <FooterSettings       s={activeSection.settings as FooterSectionSettings}       upd={p => updateSettings(activeSection.id, p as Record<string,unknown>)} />}
                </div>
              </>
            ) : (
              <div className={styles.rEmpty}>
                <div className={styles.rEmptyColors}>
                  <p className={styles.rEmptyTitle}>Brand Colors</p>
                  <label className={styles.cLabel}><input type="color" value={primary} onChange={e => { pushUndo(); setPrimary(e.target.value); mark(); }} className={styles.cPicker} />Primary</label>
                  <label className={styles.cLabel}><input type="color" value={secondary} onChange={e => { pushUndo(); setSecondary(e.target.value); mark(); }} className={styles.cPicker} />Accent</label>
                </div>
                <p className={styles.rEmptyHint}>Click any section on the left to edit its settings.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

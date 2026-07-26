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
  StorefrontProduct, StoreCollection,
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { return; }
    const reader = new FileReader();
    reader.onloadend = () => upd({ backgroundImage: reader.result as string });
    reader.readAsDataURL(file);
  };
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
    <div className={styles.field}>
      <label className={styles.fLabel}>Background image</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input className={styles.fInput} value={s.backgroundImage ?? ''} onChange={v => upd({ backgroundImage: (v.target as HTMLInputElement).value || null })} placeholder="https://…" style={{ flex: 1 }} />
        <button className={styles.iconBtn} onClick={() => fileInputRef.current?.click()} style={{ flexShrink: 0, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sell-primary)', width: 'auto', gap: 5 }} type="button">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeroImageUpload} />
      <p className={styles.fHint}>Paste a URL or upload an image (max 5MB)</p>
    </div>
    <div className={styles.field}>
      <label className={styles.fLabel}>Overlay opacity</label>
      <input className={styles.fInput} type="range" min={0} max={1} step={0.05} value={s.overlayOpacity ?? 0.4} onChange={e => upd({ overlayOpacity: Number(e.target.value) })} />
      <p className={styles.fHint}>Darkness of the overlay on background images (0 = none, 1 = black)</p>
    </div>
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
    <ColorField label="Text color" value={s.textColor ?? '#FFFFFF'} onChange={v => upd({ textColor: v })} />
    <Toggle label="Dismissible" value={s.dismissible ?? false} onChange={v => upd({ dismissible: v })} hint="Let visitors close the announcement bar" />
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
  const navLinks = s.navLinks ?? [];
  return (<>
    <SGroup label="BEHAVIOR" />
    <Toggle label="Sticky header" value={s.sticky !== false} onChange={v => upd({ sticky: v })} hint="Stays fixed when scrolling" />
    <Toggle label="Show search icon" value={s.showSearch ?? false} onChange={v => upd({ showSearch: v })} />
    <Toggle label="Show cart count" value={s.showCartCount !== false} onChange={v => upd({ showCartCount: v })} />
    <Toggle label="Hide store name when logo exists" value={s.hideStoreNameWithLogo ?? false} onChange={v => upd({ hideStoreNameWithLogo: v })} hint="Show only the logo in the header" />
    <SGroup label="NAV LINKS" />
    {navLinks.map((link, i) => (
      <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input className={styles.fInput} value={link.label} onChange={e => {
          const updated = [...navLinks]; updated[i] = { ...updated[i], label: e.target.value }; upd({ navLinks: updated });
        }} placeholder="Label" style={{ flex: 1, fontSize: '0.78rem' }} />
        <input className={styles.fInput} value={link.url} onChange={e => {
          const updated = [...navLinks]; updated[i] = { ...updated[i], url: e.target.value }; upd({ navLinks: updated });
        }} placeholder="/…" style={{ flex: 1, fontSize: '0.78rem' }} />
        <button className={styles.iconBtn} onClick={() => upd({ navLinks: navLinks.filter((_, j) => j !== i) })} aria-label="Remove nav link" style={{ flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    ))}
    <button className={styles.iconBtn} onClick={() => upd({ navLinks: [...navLinks, { label: '', url: '' }] })} style={{ width: 'auto', gap: 5, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sell-primary)' }} aria-label="Add nav link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add link
    </button>
  </>);
}

function FooterSettings({ s, upd }: { s: FooterSectionSettings; upd: (p: Partial<FooterSectionSettings>) => void }) {
  const socials = s.socials ?? {};
  const links = s.links ?? [];
  const setSocial = (key: string, val: string) => upd({ socials: { ...socials, [key]: val || undefined } });
  return (<>
    <SGroup label="CONTENT" />
    <Toggle label="Show store logo" value={s.showLogo !== false} onChange={v => upd({ showLogo: v })} />
    <Toggle label="Powered by Busmo" value={s.showPoweredBy !== false} onChange={v => upd({ showPoweredBy: v })} />
    <TF label="Custom copyright text" value={s.customText ?? ''} onChange={v => upd({ customText: v })} placeholder="© 2025 Your Brand." />
    <SGroup label="FOOTER LINKS" />
    {links.map((link, i) => (
      <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input className={styles.fInput} value={link.label} onChange={e => {
          const updated = [...links]; updated[i] = { ...updated[i], label: e.target.value }; upd({ links: updated });
        }} placeholder="Label" style={{ flex: 1, fontSize: '0.78rem' }} />
        <input className={styles.fInput} value={link.url} onChange={e => {
          const updated = [...links]; updated[i] = { ...updated[i], url: e.target.value }; upd({ links: updated });
        }} placeholder="/…" style={{ flex: 1, fontSize: '0.78rem' }} />
        <button className={styles.iconBtn} onClick={() => upd({ links: links.filter((_, j) => j !== i) })} aria-label="Remove footer link" style={{ flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    ))}
    <button className={styles.iconBtn} onClick={() => upd({ links: [...links, { label: '', url: '' }] })} style={{ width: 'auto', gap: 5, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--sell-primary)' }} aria-label="Add footer link">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add link
    </button>
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
  const isDark = themeId === 'luxe' || themeId === 'creator' || themeId === 'link';
  return (
    <div className={[styles.mCard, isActive ? styles.mCardActive : ''].join(' ')} onClick={onSelect}
      style={{ background: t.previewBg }}>
      {isActive && <span className={styles.mActive}><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>}
      <p className={styles.mName} style={{ color: isDark ? '#fff' : '#1a1a1a' }}>{t.name}</p>
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
  const [products,  setProducts]  = useState<StorefrontProduct[]>([]);
  const [collections, setCollections] = useState<StoreCollection[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [fontFamily, setFontFamily] = useState<string>('');
  const [buttonStyle, setButtonStyle] = useState<'pill' | 'square' | 'rounded'>('pill');
  const [bodyTextColor, setBodyTextColor] = useState<string>('');

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
  const undoStack = useRef<{ sections: StoreSection[]; theme: StorefrontTheme; primary: string; secondary: string; fontFamily: string; buttonStyle: 'pill' | 'square' | 'rounded'; bodyTextColor: string }[]>([]);
  const redoStack = useRef<{ sections: StoreSection[]; theme: StorefrontTheme; primary: string; secondary: string; fontFamily: string; buttonStyle: 'pill' | 'square' | 'rounded'; bodyTextColor: string }[]>([]);

  const snapshot = useCallback(() => ({ sections: sections.map(s => ({ ...s, settings: { ...s.settings } })), theme, primary, secondary, fontFamily, buttonStyle, bodyTextColor }), [sections, theme, primary, secondary, fontFamily, buttonStyle, bodyTextColor]);

  const pushUndo = useCallback(() => {
    undoStack.current = [...undoStack.current.slice(-20), snapshot()];
    redoStack.current = [];
  }, [snapshot]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(snapshot());
    setSections(prev.sections); setTheme(prev.theme); setPrimary(prev.primary); setSecondary(prev.secondary);
    setFontFamily(prev.fontFamily); setButtonStyle(prev.buttonStyle); setBodyTextColor(prev.bodyTextColor);
    setDirty(true);
  }, [snapshot]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(snapshot());
    setSections(next.sections); setTheme(next.theme); setPrimary(next.primary); setSecondary(next.secondary);
    setFontFamily(next.fontFamily); setButtonStyle(next.buttonStyle); setBodyTextColor(next.bodyTextColor);
    setDirty(true);
  }, [snapshot]);

  // Seed from storeConfig
  useEffect(() => {
    if (!storeConfig) return;
    const saved = storeConfig.sections as StoreSection[] | undefined;
    const merged = DEFAULT_SECTIONS.map(def => {
      const s = saved?.find(x => x.id === def.id);
      return s ? { ...def, ...s, settings: { ...def.settings, ...s.settings } } : { ...def };
    }).sort((a, b) => a.order - b.order);
    setSections(merged);
    const t = (storeConfig.theme ?? 'luxe') as StorefrontTheme;
    setTheme(t);
    setPrimary(storeConfig.primaryColor ?? '#C9A84C');
    setSecondary(storeConfig.secondaryColor ?? '#8B7355');
    setFontFamily((storeConfig as any).fontFamily ?? '');
    setButtonStyle((storeConfig as any).buttonStyle ?? 'pill');
    setBodyTextColor((storeConfig as any).bodyTextColor ?? '');
    setDirty(false);
    undoStack.current = []; redoStack.current = [];
  }, [storeConfig]);

  // Fetch real products for preview
  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${baseUrl}/api/store/products?businessId=${user.businessId}&available=true`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(d => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
  }, [user?.businessId]);

  // Fetch real collections for preview
  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    fetch(`${baseUrl}/api/store/collections?businessId=${user.businessId}`)
      .then(r => r.ok ? r.json() : { collections: [] })
      .then(d => setCollections(d.collections ?? []))
      .catch(() => setCollections([]));
  }, [user?.businessId]);

  const mark = useCallback(() => setDirty(true), []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (mod && e.key === 'z' && e.shiftKey)  { e.preventDefault(); redo(); }
      if (mod && e.key === 'y')                 { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Debounced undo snapshot for text inputs
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushUndoDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { pushUndo(); }, 500);
  }, [pushUndo]);

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
    pushUndoDebounced();
    setSections(prev => prev.map(s => s.id === id ? { ...s, settings: { ...s.settings, ...patch } } : s));
    mark();
  }, [pushUndoDebounced, mark]);

  const handleApply = useCallback(async () => {
    if (!user?.businessId || !storeConfig) return;
    setApplying(true);
    try {
      const { firestore } = initializeFirebase();
      const slug = storeConfig.storeSlug;
      
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        { 
          ...storeConfig, 
          theme, 
          primaryColor: primary, 
          secondaryColor: secondary, 
          fontFamily: fontFamily || null,
          buttonStyle,
          bodyTextColor: bodyTextColor || null,
          sections: sections.map(s => ({ ...s })), 
          storeSlug: slug,
          updatedAt: serverTimestamp() 
        },
        { merge: true }
      );
      
      if (slug) await setDoc(doc(firestore, 'storeIndex', slug), { businessId: user.businessId, storeName: storeConfig.storeName, updatedAt: serverTimestamp() });
      await refreshStoreConfig();
      setDirty(false);
      showToast('Theme published to your store!', 'success');
    } catch (err) {
      console.error('[ThemeEditor]', err);
      showToast('Failed to publish. Try again.', 'error');
    } finally { setApplying(false); }
  }, [user, storeConfig, theme, primary, secondary, fontFamily, buttonStyle, bodyTextColor, sections, refreshStoreConfig, showToast]);

  const storeName = storeConfig?.storeName ?? 'Your Store';
  const tagline   = storeConfig?.tagline   ?? 'Shop our latest collection';
  const logoUrl   = storeConfig?.logoUrl   ?? null;
  const activeSection = sections.find(s => s.id === activeId) ?? null;
  const headerSection = sections.find(s => s.id === 'header');
  const hideStoreNameWithLogo = headerSection ? (headerSection.settings as HeaderSectionSettings).hideStoreNameWithLogo : false;

  const handlePreview = useCallback(() => {
    if (isMobile) {
      const previewData = {
        theme,
        storeName,
        tagline,
        primaryColor: primary,
        secondaryColor: secondary,
        logoUrl,
        sections,
        storeSlug: storeConfig?.storeSlug,
        products,
        collections,
      };
      sessionStorage.setItem('mobilePreviewData', JSON.stringify(previewData));
      window.open('/sell/mobile-preview', '_blank');
    }
  }, [isMobile, theme, storeName, tagline, primary, secondary, logoUrl, sections, storeConfig, products, collections]);

  // Device frame dimensions & dynamic scaling
  const previewOuterRef = useRef<HTMLDivElement>(null);
  const [panelSize, setPanelSize] = useState({ w: 900, h: 700 });

  useEffect(() => {
    const el = previewOuterRef.current;
    if (!el) return;
    const update = () => setPanelSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const DEVICE_FRAMES = {
    desktop: { outerW: 1240, outerH: 800, screenW: 1200, screenH: 700 },
    tablet:  { outerW: 800,  outerH: 600, screenW: 768,  screenH: 540 },
    mobile:  { outerW: 400,  outerH: 750, screenW: 375,  screenH: 660 },
  } as const;

  const frame = DEVICE_FRAMES[device];
  const availW = panelSize.w - 48;
  const availH = panelSize.h - 80;
  const deviceScale = Math.min(1, availW / frame.outerW, availH / frame.outerH);

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
              <button className={styles.iconBtn} onClick={undo} title="Undo (Ctrl+Z)" disabled={undoStack.current.length === 0} aria-label="Undo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
              </button>
              <button className={styles.iconBtn} onClick={redo} title="Redo (Ctrl+Shift+Z)" disabled={redoStack.current.length === 0} aria-label="Redo">
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
                  aria-label={`Preview in ${d} mode`}
                  aria-pressed={device === d}
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
            <label className={styles.cLabel}><input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className={styles.cPicker} aria-label="Primary color" />Primary</label>
            <label className={styles.cLabel}><input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} className={styles.cPicker} aria-label="Accent color" />Accent</label>
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
                        <button className={styles.moveBtn} onClick={() => moveSection(sec.id, -1)} disabled={idx === 0} aria-label={`Move ${meta.label} up`}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>
                        <button className={styles.moveBtn} onClick={() => moveSection(sec.id, 1)} disabled={idx === sections.length - 1} aria-label={`Move ${meta.label} down`}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
                      </div>
                    ) : <div className={styles.moveBtns} />}
                    <button className={styles.secBtn} onClick={() => setActiveId(activeId === sec.id ? null : sec.id)}>
                      <span className={styles.secIcon}>{SectionIcons[sec.type]}</span>
                      <span className={styles.secLabel}>{meta.label}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', opacity: 0.3 }}><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <button className={[styles.eyeBtn, sec.enabled ? styles.eyeOn : ''].join(' ')} onClick={() => toggleSection(sec.id)} type="button" aria-label={sec.enabled ? `Hide ${meta.label}` : `Show ${meta.label}`} aria-pressed={sec.enabled}>
                      {sec.enabled
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER: live preview - device frames */}
          <div className={`${styles.centerPanel} ${styles.hideOnMobile}`}>
            <div className={styles.previewOuter} ref={previewOuterRef}>
              <div className={styles.deviceScaleWrap} style={{
                width: frame.outerW * deviceScale,
                height: frame.outerH * deviceScale,
              }}>
                <div className={styles.deviceFrameInner} style={{
                  width: frame.outerW,
                  transform: `scale(${deviceScale})`,
                }}>

                  {/* ── Desktop: Laptop mockup ── */}
                  {device === 'desktop' && (
                    <div className={styles.laptopFrame}>
                      <div className={styles.laptopChrome}>
                        <div className={styles.laptopDots}>
                          <span /><span /><span />
                        </div>
                        <div className={styles.laptopAddress}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                          {storeConfig?.storeSlug || 'your-store'}.busmo.app
                        </div>
                        <div className={styles.laptopActions}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </div>
                      </div>
                      <div className={styles.laptopScreen}>
                        <div className={styles.screenScroll}>
                          <CartProvider storeSlug={storeConfig?.storeSlug ?? ''}>
                            <StorefrontCanvas
                              theme={theme}
                              storeName={storeName}
                              tagline={tagline}
                              primaryColor={primary}
                              secondaryColor={secondary}
                              logoUrl={logoUrl}
                              sections={sections}
                              width={frame.screenW}
                              storeSlug={storeConfig?.storeSlug ?? ''}
                              products={products}
                              collections={collections}
                              fontFamily={fontFamily || null}
                              buttonStyle={buttonStyle}
                              bodyTextColor={bodyTextColor || null}
                              hideStoreNameWithLogo={hideStoreNameWithLogo}
                            />
                          </CartProvider>
                        </div>
                      </div>
                      <div className={styles.laptopBase}>
                        <div className={styles.laptopNotch} />
                      </div>
                    </div>
                  )}

                  {/* ── Tablet: iPad mockup ── */}
                  {device === 'tablet' && (
                    <div className={styles.tabletFrame}>
                      <div className={styles.tabletCamera} />
                      <div className={styles.tabletScreen}>
                        <div className={styles.screenScroll}>
                          <CartProvider storeSlug={storeConfig?.storeSlug ?? ''}>
                            <StorefrontCanvas
                              theme={theme}
                              storeName={storeName}
                              tagline={tagline}
                              primaryColor={primary}
                              secondaryColor={secondary}
                              logoUrl={logoUrl}
                              sections={sections}
                              width={frame.screenW}
                              storeSlug={storeConfig?.storeSlug ?? ''}
                              products={products}
                              collections={collections}
                              fontFamily={fontFamily || null}
                              buttonStyle={buttonStyle}
                              bodyTextColor={bodyTextColor || null}
                              hideStoreNameWithLogo={hideStoreNameWithLogo}
                            />
                          </CartProvider>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Mobile: iPhone mockup ── */}
                  {device === 'mobile' && (
                    <div className={styles.phoneFrame}>
                      <div className={styles.phoneStatusBar}>
                        <span className={styles.phoneTime}>9:41</span>
                        <div className={styles.phoneNotch} />
                        <div className={styles.phoneIcons}>
                          <svg width="14" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="5" width="3" height="5" rx="0.5" opacity="0.4"/><rect x="4.5" y="3" width="3" height="7" rx="0.5" opacity="0.6"/><rect x="9" y="1" width="3" height="9" rx="0.5" opacity="0.8"/><rect x="13" y="0" width="3" height="10" rx="0.5"/></svg>
                          <svg width="14" height="10" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 8.5a8 8 0 0114 0" strokeLinecap="round"/><path d="M4 6a5 5 0 018 0" strokeLinecap="round"/><path d="M7 3.5a2 2 0 013 0" strokeLinecap="round"/><circle cx="8.5" cy="9" r="1" fill="currentColor" stroke="none"/></svg>
                          <svg width="20" height="10" viewBox="0 0 26 12" fill="currentColor"><rect x="0" y="1" width="22" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.2"/><rect x="2" y="3" width="16" height="6" rx="1" opacity="0.8"/><path d="M23 4.5v3a1.5 1.5 0 000-3z" opacity="0.4"/></svg>
                        </div>
                      </div>
                      <div className={styles.phoneScreen}>
                        <div className={styles.screenScroll}>
                          <CartProvider storeSlug={storeConfig?.storeSlug ?? ''}>
                            <StorefrontCanvas
                              theme={theme}
                              storeName={storeName}
                              tagline={tagline}
                              primaryColor={primary}
                              secondaryColor={secondary}
                              logoUrl={logoUrl}
                              sections={sections}
                              width={frame.screenW}
                              storeSlug={storeConfig?.storeSlug ?? ''}
                              products={products}
                              collections={collections}
                              fontFamily={fontFamily || null}
                              buttonStyle={buttonStyle}
                              bodyTextColor={bodyTextColor || null}
                              hideStoreNameWithLogo={hideStoreNameWithLogo}
                            />
                          </CartProvider>
                        </div>
                      </div>
                      <div className={styles.phoneHomeBar} />
                    </div>
                  )}

                </div>
              </div>
            </div>
            {/* Device label */}
            <div className={styles.deviceLabel}>
              {device === 'desktop' ? 'Desktop — 1200px' : device === 'tablet' ? 'Tablet — 768px' : 'Mobile — 375px'}
              <span className={styles.deviceScaleBadge}>{Math.round(deviceScale * 100)}%</span>
            </div>
          </div>

          {/* RIGHT: settings */}
          <div className={styles.rightPanel}>
            {activeSection ? (
              <>
                <div className={styles.rHeader}>
                  <span className={styles.rIcon}>{SectionIcons[activeSection.type]}</span>
                  <span className={styles.rTitle}>{SECTION_META[activeSection.type].label}</span>
                  <button className={styles.iconBtn} style={{ marginLeft: 'auto' }} onClick={() => setActiveId(null)} aria-label="Close settings panel">
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
                  <label className={styles.cLabel}><input type="color" value={primary} onChange={e => { pushUndo(); setPrimary(e.target.value); mark(); }} className={styles.cPicker} aria-label="Primary color" />Primary</label>
                  <label className={styles.cLabel}><input type="color" value={secondary} onChange={e => { pushUndo(); setSecondary(e.target.value); mark(); }} className={styles.cPicker} aria-label="Accent color" />Accent</label>
                </div>
                <div style={{ marginTop: 16 }}>
                  <p className={styles.rEmptyTitle}>Store Design</p>
                  <div className={styles.field}>
                    <label className={styles.fLabel}>Font family</label>
                    <select className={styles.fSelect} value={fontFamily} onChange={e => { pushUndo(); setFontFamily(e.target.value); mark(); }}>
                      <option value="">Theme default</option>
                      <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                      <option value="DM Sans">DM Sans</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="Sora">Sora</option>
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Raleway">Raleway</option>
                      <option value="Cormorant Garamond">Cormorant Garamond</option>
                      <option value="Lora">Lora</option>
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Manrope">Manrope</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fLabel}>Button style</label>
                    <select className={styles.fSelect} value={buttonStyle} onChange={e => { pushUndo(); setButtonStyle(e.target.value as 'pill' | 'square' | 'rounded'); mark(); }}>
                      <option value="pill">Pill (rounded full)</option>
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fLabel}>Text color override</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="color" value={bodyTextColor || '#1a1a1a'} onChange={e => { pushUndo(); setBodyTextColor(e.target.value); mark(); }}
                        style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid var(--sell-border)', cursor: 'pointer', padding: 2, background: 'transparent', flexShrink: 0 }} />
                      <input className={styles.fInput} value={bodyTextColor} onChange={e => { pushUndo(); setBodyTextColor(e.target.value); mark(); }} placeholder="Theme default" style={{ width: 90 }} />
                    </div>
                    <p className={styles.fHint}>Overrides the main text color across the store</p>
                  </div>
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

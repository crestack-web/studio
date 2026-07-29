'use client';
/**
 * StorefrontCanvas
 *
 * The single source of truth for what a storefront looks like.
 * Used identically in:
 *  1. Theme editor center preview (scaled, device-framed)
 *  2. Theme marketplace cards (small scale)
 *
 * Every section is built with real HTML/CSS — no SVG shapes, no fake blocks.
 * The preview IS the website. There is no separate "preview component".
 */

import React from 'react';
import type {
  StorefrontTheme, StoreSection,
  StorefrontProduct, StoreCollection,
  HeroSectionSettings, FeaturedSectionSettings,
  CollectionsSectionSettings, AnnouncementSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  NewsletterSectionSettings, InstagramSectionSettings,
  FooterSectionSettings,
} from '@/app/sell/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/app/sell/mo-sell.types';
import { isLinkTheme } from '@/app/store/themes/registry';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StorefrontCanvasProps {
  theme: StorefrontTheme;
  storeName?: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  sections?: StoreSection[];
  /** Width in px — the canvas fills this width, height is natural */
  width?: number;
  storeSlug?: string;
  products?: StorefrontProduct[];
  collections?: StoreCollection[];
  fontFamily?: string | null;
  buttonStyle?: 'pill' | 'square' | 'rounded';
  bodyTextColor?: string | null;
  bgColor?: string | null;
  hideStoreNameWithLogo?: boolean;
}

// ─── CSS variable injection per theme ─────────────────────────────────────────
// These mirror storefront.css [data-theme="..."] exactly.
// Injected inline so the canvas works anywhere without global CSS.

function getThemeCssVars(theme: StorefrontTheme, primary: string, secondary: string) {
  const base = { '--sf-primary': primary, '--sf-secondary': secondary };
  const themeVars: Record<string, string | undefined> = (() => {
    switch (theme) {
      case 'luxe': return {
        '--sf-bg': '#0A0A0A', '--sf-surface': '#111111', '--sf-border': '#222222',
        '--sf-text-1': '#F5F0E8', '--sf-text-2': '#A89878', '--sf-text-3': '#5A5040',
        '--sf-radius': '0px', '--sf-radius-sm': '0px', '--sf-radius-lg': '0px',
        '--sf-gold': '#C9A84C', '--sf-nav-h': '64px',
        '--sf-font': '"Playfair Display",Georgia,serif',
      };
      case 'glow': return {
        '--sf-bg': '#FDF6F0', '--sf-surface': '#FFFFFF', '--sf-border': '#F0E0D6',
        '--sf-text-1': '#2D1B12', '--sf-text-2': '#7A5545', '--sf-text-3': '#B09080',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '20px',
        '--sf-nav-h': '64px', '--sf-font': '"DM Sans","Plus Jakarta Sans",system-ui,sans-serif',
      };
      case 'market': return {
        '--sf-bg': '#FFF7ED', '--sf-surface': '#FFFFFF', '--sf-border': '#FFE4C8',
        '--sf-text-1': '#1A0A00', '--sf-text-2': '#8B4513', '--sf-text-3': '#C47843',
        '--sf-radius': '8px', '--sf-radius-sm': '6px', '--sf-radius-lg': '14px',
        '--sf-nav-h': '64px', '--sf-font': '"Plus Jakarta Sans",system-ui,sans-serif',
      };
      case 'creator': return {
        '--sf-bg': '#0F172A', '--sf-surface': '#1E293B', '--sf-border': '#334155',
        '--sf-text-1': '#F8FAFC', '--sf-text-2': '#94A3B8', '--sf-text-3': '#475569',
        '--sf-radius': '8px', '--sf-radius-sm': '6px', '--sf-radius-lg': '14px',
        '--sf-nav-h': '64px', '--sf-font': '"Sora","Inter",system-ui,sans-serif',
      };
      case 'link': return {
        '--sf-bg': '#0D0D0D', '--sf-surface': '#161616', '--sf-border': '#2A2A2A',
        '--sf-text-1': '#F5F5F5', '--sf-text-2': '#A0A0A0', '--sf-text-3': '#555555',
        '--sf-radius': '14px', '--sf-radius-sm': '10px', '--sf-radius-lg': '22px',
        '--sf-nav-h': '0px', '--sf-font': '"Plus Jakarta Sans",system-ui,sans-serif',
      };
      case 'pulse': return {
        '--sf-bg': '#FFFAF5', '--sf-surface': '#FFFFFF', '--sf-border': '#FFE8D6',
        '--sf-text-1': '#3D2B1F', '--sf-text-2': '#8B6F5E', '--sf-text-3': '#C4A68A',
        '--sf-radius': '16px', '--sf-radius-sm': '10px', '--sf-radius-lg': '24px',
        '--sf-nav-h': '64px', '--sf-font': '"Outfit",system-ui,sans-serif',
      };
      case 'vault': return {
        '--sf-bg': '#0B1D3A', '--sf-surface': '#112240', '--sf-border': '#1E3A5F',
        '--sf-text-1': '#F1F5F9', '--sf-text-2': '#94A3B8', '--sf-text-3': '#475569',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '18px',
        '--sf-nav-h': '64px', '--sf-font': '"Space Grotesk","Inter",system-ui,sans-serif',
      };
      case 'atlas': return {
        '--sf-bg': '#F8FAFC', '--sf-surface': '#FFFFFF', '--sf-border': '#E2E8F0',
        '--sf-text-1': '#1E293B', '--sf-text-2': '#64748B', '--sf-text-3': '#94A3B8',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '16px',
        '--sf-nav-h': '64px', '--sf-font': '"Manrope","Inter",system-ui,sans-serif',
      };
      case 'spark': return {
        '--sf-bg': '#FFF8EE', '--sf-surface': '#FFFFFF', '--sf-border': '#F3E8D8',
        '--sf-text-1': '#2D1B69', '--sf-text-2': '#5B4A8A', '--sf-text-3': '#8B7AB0',
        '--sf-radius': '14px', '--sf-radius-sm': '10px', '--sf-radius-lg': '20px',
        '--sf-nav-h': '64px', '--sf-font': '"Raleway","Inter",system-ui,sans-serif',
      };
      case 'bazaar': return {
        '--sf-bg': '#ECFDF5', '--sf-surface': '#FFFFFF', '--sf-border': '#D1FAE5',
        '--sf-text-1': '#064E3B', '--sf-text-2': '#047857', '--sf-text-3': '#6EE7B7',
        '--sf-radius': '12px', '--sf-radius-sm': '8px', '--sf-radius-lg': '16px',
        '--sf-nav-h': '64px', '--sf-font': '"Poppins","Inter",system-ui,sans-serif',
      };
    }
  })();
  return { ...base, ...themeVars } as React.CSSProperties;
}

// ─── Mock data for editor preview (real products would come from Firestore) ───

const MOCK: Record<StorefrontTheme, {
  products: { name: string; price: string; tag?: string }[];
  collections: { name: string; emoji: string }[];
  testimonials: { name: string; text: string }[];
}> = {
  luxe: {
    products: [
      { name: 'Leather Handbag', price: '₦129,000', tag: 'New' },
      { name: 'Minimal Watch', price: '₦98,000' },
      { name: 'Sunglasses', price: '₦19,000' },
      { name: 'Leather Wallet', price: '₦48,000' },
    ],
    collections: [{ name: 'Women', emoji: '👒' }, { name: 'Men', emoji: '🕶' }, { name: 'Sale', emoji: '🏷' }],
    testimonials: [{ name: 'Amara K.', text: 'The quality is unmatched. Worth every naira.' }],
  },
  glow: {
    products: [
      { name: 'Glow Serum', price: '₦8,500', tag: 'Bestseller' },
      { name: 'Face Mist', price: '₦4,200' },
      { name: 'Rose Toner', price: '₦6,800' },
      { name: 'Eye Cream', price: '₦11,000', tag: 'New' },
    ],
    collections: [{ name: 'Skincare', emoji: '🧴' }, { name: 'Makeup', emoji: '💄' }, { name: 'Wellness', emoji: '🌿' }],
    testimonials: [{ name: 'Temi O.', text: 'My skin has never looked better. Absolutely love this brand.' }],
  },
  market: {
    products: [
      { name: 'Smart Blender', price: '₦24,000', tag: 'Sale' },
      { name: 'Throw Pillow', price: '₦3,500' },
      { name: 'Table Lamp', price: '₦12,000' },
      { name: 'Wall Art', price: '₦7,800', tag: 'New' },
    ],
    collections: [{ name: 'Kitchen', emoji: '🍳' }, { name: 'Living', emoji: '🛋' }, { name: 'Garden', emoji: '🌱' }],
    testimonials: [{ name: 'Chidi M.', text: 'Fast delivery and products are exactly as described.' }],
  },
  creator: {
    products: [
      { name: 'UI Design Kit', price: '₦15,000', tag: 'New' },
      { name: 'Brand Template', price: '₦8,000' },
      { name: 'Social Pack', price: '₦5,500' },
      { name: 'Logo Bundle', price: '₦12,000', tag: 'Sale' },
    ],
    collections: [{ name: 'Templates', emoji: '📐' }, { name: 'Courses', emoji: '🎓' }, { name: 'Bundles', emoji: '📦' }],
    testimonials: [{ name: 'Simi A.', text: 'These templates saved me weeks of work. Incredible value.' }],
  },
  link: {
    products: [
      { name: '1-on-1 Coaching', price: '₦25,000', tag: 'Popular' },
      { name: 'Content Strategy', price: '₦18,000' },
      { name: 'Brand Audit', price: '₦12,000' },
      { name: 'Growth Blueprint', price: '₦8,500', tag: 'New' },
    ],
    collections: [{ name: 'Coaching', emoji: '🎯' }, { name: 'Templates', emoji: '📄' }, { name: 'Courses', emoji: '🎓' }],
    testimonials: [{ name: 'Kemi L.', text: 'Changed my business completely. Best investment I have made.' }],
  },
  pulse: {
    products: [
      { name: 'Creator Course', price: '₦35,000', tag: 'Popular' },
      { name: 'Presets Pack', price: '₦8,500' },
      { name: 'Merch Drop', price: '₦12,000', tag: 'New' },
      { name: 'E-Book Guide', price: '₦5,000' },
    ],
    collections: [{ name: 'Courses', emoji: '🎓' }, { name: 'Digital', emoji: '📥' }, { name: 'Merch', emoji: '👕' }],
    testimonials: [{ name: 'Adaobi N.', text: 'This creator platform changed my life. So easy to sell to my audience!' }],
  },
  vault: {
    products: [
      { name: 'Notion Template', price: '₦12,000', tag: 'Bestseller' },
      { name: 'UI Kit Pro', price: '₦25,000', tag: 'New' },
      { name: 'E-Book Bundle', price: '₦8,500' },
      { name: 'Course Access', price: '₦45,000', tag: 'Premium' },
    ],
    collections: [{ name: 'Templates', emoji: '📐' }, { name: 'E-Books', emoji: '📚' }, { name: 'Courses', emoji: '🎓' }],
    testimonials: [{ name: 'Femi A.', text: 'Instant delivery and incredible quality. Best digital products I have purchased.' }],
  },
  atlas: {
    products: [
      { name: 'Brand Design', price: '₦150,000', tag: 'Popular' },
      { name: 'Web Development', price: '₦250,000' },
      { name: 'Photo Session', price: '₦45,000', tag: 'New' },
      { name: 'Strategy Call', price: '₦25,000' },
    ],
    collections: [{ name: 'Design', emoji: '🎨' }, { name: 'Development', emoji: '💻' }, { name: 'Photography', emoji: '📸' }],
    testimonials: [{ name: 'Oluwaseun M.', text: 'Professional, timely, and exceeded expectations. Highly recommend their services.' }],
  },
  spark: {
    products: [
      { name: '12-Week Program', price: '₦180,000', tag: 'Bestseller' },
      { name: 'Group Coaching', price: '₦45,000' },
      { name: 'Mentorship Call', price: '₦15,000', tag: 'New' },
      { name: 'Fitness Plan', price: '₦8,000' },
    ],
    collections: [{ name: 'Programs', emoji: '🎯' }, { name: 'Coaching', emoji: '🏆' }, { name: 'Resources', emoji: '📖' }],
    testimonials: [{ name: 'Chidinma E.', text: 'Transformed my business and mindset. The coaching is world-class.' }],
  },
  bazaar: {
    products: [
      { name: 'Ankara Dress', price: '₦28,000', tag: 'Bestseller' },
      { name: 'Handmade Bag', price: '₦15,000' },
      { name: 'Body Butter Set', price: '₦6,500', tag: 'New' },
      { name: 'Artisan Soap', price: '₦3,200' },
    ],
    collections: [{ name: 'Fashion', emoji: '👗' }, { name: 'Beauty', emoji: '💄' }, { name: 'Handmade', emoji: '🎨' }],
    testimonials: [{ name: 'Blessing I.', text: 'Love the quality! Fast delivery and the WhatsApp ordering is so convenient.' }],
  },
};

// ─── Section components ────────────────────────────────────────────────────────

function SfNav({ theme, storeName, logoUrl, primary, storeSlug, hideStoreNameWithLogo }: {
  theme: StorefrontTheme; storeName: string; logoUrl?: string | null; primary: string; storeSlug?: string;
  hideStoreNameWithLogo?: boolean;
}) {
  const isLuxe = theme === 'luxe';
  const isMarket = theme === 'market';
  const isBazaar = theme === 'bazaar';
  return (
    <nav style={{
      background: isMarket ? 'var(--sf-primary)' : isBazaar ? 'var(--sf-primary)' : 'var(--sf-surface)',
      borderBottom: '1px solid var(--sf-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 24, height: 'var(--sf-nav-h)',
      position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {logoUrl
          ? <img src={logoUrl} alt={storeName} style={{ height: 32, width: 'auto', maxWidth: 120, objectFit: 'contain', borderRadius: 'var(--sf-radius-sm)' }} />
          : <span style={{
              width: 36, height: 36, borderRadius: 8,
              background: isMarket || isBazaar ? '#fff' : primary, color: isMarket || isBazaar ? primary : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem', flexShrink: 0,
            }}>{storeName.charAt(0).toUpperCase()}</span>
        }
        {!(hideStoreNameWithLogo && logoUrl) && <span style={{
          fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : 'var(--sf-font)',
          fontStyle: isLuxe ? 'italic' : 'normal', fontWeight: isLuxe ? 400 : 800,
          fontSize: isLuxe ? '1.1rem' : '1rem', letterSpacing: isLuxe ? '0.12em' : '-0.01em',
          color: isMarket || isBazaar ? '#fff' : 'var(--sf-text-1)',
        }}>{storeName}</span>}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        {['Shop', 'Collections', 'About', 'Contact'].map(l => (
          <span key={l} style={{ fontSize: '0.8rem', fontWeight: 500, color: isMarket || isBazaar ? 'rgba(255,255,255,0.85)' : 'var(--sf-text-2)', cursor: 'pointer' }}>{l}</span>
        ))}
      </div>
      <div style={{
        padding: '8px 16px', borderRadius: 'var(--sf-radius-sm)',
        background: isLuxe ? 'transparent' : isMarket || isBazaar ? '#fff' : 'var(--sf-primary)',
        border: isLuxe ? '1px solid #C9A84C' : 'none',
        color: isLuxe ? '#C9A84C' : isMarket || isBazaar ? primary : '#fff',
        fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6,
        position: 'relative',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
        Cart
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: 'var(--sf-secondary)', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700, minWidth: '16px', height: '16px',
          borderRadius: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
        }}>0</span>
      </div>
    </nav>
  );
}

function SfHero({ theme, storeName, tagline, settings, primary, secondary, buttonStyle }: {
  theme: StorefrontTheme; storeName: string; tagline: string;
  settings: HeroSectionSettings; primary: string; secondary: string;
  buttonStyle?: 'pill' | 'square' | 'rounded';
}) {
  const heading = settings.heading || storeName;
  const sub = settings.showTagline !== false ? (settings.subheading || tagline) : '';
  const cta = settings.ctaLabel || 'Shop Now';
  const bgImg = settings.backgroundImage;
  const textAlign = settings.textAlign ?? 'left';
  const heroBg = bgImg ? `url(${bgImg}) center/cover` :
    theme === 'luxe'   ? '#111111' :
    theme === 'glow'   ? `linear-gradient(135deg,${primary}1a 0%,${secondary}0d 100%)` :
    theme === 'market' ? `linear-gradient(135deg,${primary} 0%,${secondary} 100%)` :
    theme === 'pulse'  ? `linear-gradient(135deg,${primary} 0%,${secondary} 100%)` :
    theme === 'vault'  ? `linear-gradient(135deg,${primary}28 0%,#0B1D3A 100%)` :
    theme === 'atlas'  ? `linear-gradient(135deg,${primary}12 0%,${secondary}08 100%)` :
    theme === 'spark'  ? `linear-gradient(135deg,${secondary}20 0%,${primary}18 100%)` :
    theme === 'bazaar' ? `linear-gradient(135deg,${primary} 0%,${secondary} 100%)` :
                         `linear-gradient(135deg,${primary}28 0%,${secondary}18 100%)`;
  const isLuxe = theme === 'luxe'; const isMarket = theme === 'market'; const isCreator = theme === 'creator';
  const isPulse = theme === 'pulse'; const isVault = theme === 'vault'; const isAtlas = theme === 'atlas';
  const isSpark = theme === 'spark'; const isBazaar = theme === 'bazaar';
  const alignMap = { left: 'flex-start' as const, center: 'center' as const, right: 'flex-end' as const };
  const align = alignMap[textAlign] ?? 'flex-start';

  let radius: number;
  if (buttonStyle === 'pill') radius = 100;
  else if (buttonStyle === 'square') radius = 0;
  else if (buttonStyle === 'rounded') radius = 8;
  else radius = isMarket ? 100 : isLuxe ? 0 : 'var(--sf-radius-sm)' as unknown as number;

  return (
    <section style={{ background: heroBg, padding: isLuxe ? '72px 48px' : '60px 32px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 340, justifyContent: 'center', alignItems: align, textAlign }}>
      {isLuxe    && <p style={{ fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 500, margin: 0 }}>New Collection</p>}
      {isMarket  && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', margin: 0 }}>🛍️ Fresh arrivals daily</p>}
      {isCreator && <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: primary, fontWeight: 700, margin: 0 }}>Build once. Sell forever.</p>}
      {theme === 'glow' && <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: primary, fontWeight: 700, margin: 0, opacity: 0.7 }}>Beauty · Wellness</p>}
      {isPulse  && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', margin: 0 }}>✨ Your favorite creator</p>}
      {isVault  && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60A5FA', margin: 0 }}>⚡ Instant Digital Delivery</p>}
      {isAtlas  && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: primary, margin: 0 }}>⭐ Trusted by 200+ clients</p>}
      {isSpark  && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D97706', margin: 0 }}>🏆 Transform Your Life</p>}
      {isBazaar && <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', margin: 0 }}>📦 Shop Local · Deliver Fast</p>}

      <h1 style={{
        fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : isCreator ? '"Sora","Inter",sans-serif' : 'var(--sf-font)',
        fontSize: isCreator || isPulse ? 'clamp(2.4rem,6vw,4.2rem)' : isLuxe ? 'clamp(2.2rem,5.5vw,3.5rem)' : 'clamp(2rem,5vw,3.2rem)',
        fontWeight: isLuxe ? 400 : 800, fontStyle: isLuxe ? 'italic' : 'normal',
        letterSpacing: isLuxe ? '0.04em' : isCreator || isPulse ? '-0.03em' : '-0.02em',
        color: isLuxe ? '#F5F0E8' : isMarket || isPulse || isBazaar ? '#fff' : isCreator ? '#F8FAFC' : isVault ? '#F1F5F9' : isSpark ? '#2D1B69' : 'var(--sf-text-1)',
        lineHeight: 1.1, margin: 0,
      }}>{heading}</h1>

      {sub && <p style={{ fontSize: '1.05rem', lineHeight: 1.65, maxWidth: 520, margin: 0,
        color: isLuxe ? '#A89878' : isMarket || isPulse || isBazaar ? 'rgba(255,255,255,0.88)' : isCreator ? '#94A3B8' : isVault ? '#94A3B8' : isSpark ? '#5B4A8A' : 'var(--sf-text-2)' }}>{sub}</p>}

      <a href="#" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8,
        padding: isLuxe ? '13px 38px' : '13px 32px',
        background: isLuxe ? 'transparent' : isMarket || isBazaar ? '#fff' : isVault ? '#3B82F6' : isSpark ? '#D97706' : primary,
        color: isLuxe ? '#C9A84C' : isMarket || isBazaar ? primary : isSpark ? '#FFF' : '#fff',
        border: isLuxe ? '1px solid #C9A84C' : 'none',
        borderRadius: radius,
        fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer',
        letterSpacing: isLuxe ? '0.14em' : 0, textTransform: isLuxe ? 'uppercase' : 'none',
        width: 'fit-content',
        boxShadow: isVault ? '0 4px 20px rgba(59,130,246,0.4)' : 'none',
      }}>{cta}{!isLuxe && ' →'}</a>
    </section>
  );
}

function SfFeatured({ theme, settings, primary, products, storeSlug }: {
  theme: StorefrontTheme; settings: FeaturedSectionSettings; primary: string; products: StorefrontProduct[]; storeSlug?: string;
}) {
  const mock = MOCK[theme];
  const heading = settings.heading || (theme === 'luxe' ? 'New Arrivals' : theme === 'glow' ? 'Bestsellers' : theme === 'creator' ? 'Digital Products' : theme === 'vault' ? 'Digital Products' : theme === 'pulse' ? 'Featured Products' : theme === 'atlas' ? 'Our Services' : theme === 'spark' ? 'Programs' : theme === 'bazaar' ? 'Best Sellers' : 'Top Deals');
  const cols = settings.columns ?? 4;
  const isLuxe = theme === 'luxe';
  const isDark = theme === 'luxe' || theme === 'creator' || theme === 'vault';
  const hasReal = products.length > 0;
  const maxItems = settings.maxItems ?? 4;

  const handleProductClick = (productId: string) => {
    if (storeSlug) {
      window.open(`/store/${storeSlug}/product/${productId}`, '_blank');
    } else {
      console.log('Product clicked - preview mode');
    }
  };

  return (
    <section style={{ padding: '40px 32px', background: 'var(--sf-bg)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: isLuxe ? 400 : 700, fontStyle: isLuxe ? 'italic' : 'normal', fontFamily: isLuxe ? '"Playfair Display",Georgia,serif' : 'inherit', letterSpacing: isLuxe ? '0.08em' : 0, color: 'var(--sf-text-1)', marginBottom: 20 }}>
        {heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12 }}>
        {hasReal
          ? products.slice(0, maxItems).map((p, i) => (
            <div key={i} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s' }} onClick={() => handleProductClick(p.productId)}>
              <div style={{ aspectRatio: isLuxe ? '3/4' : '1/1', background: p.images?.[0] ? `url(${p.images[0]}) center/cover` : `${primary}${['20','16','12','0e'][i] || '10'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.compareAtPrice && p.compareAtPrice > p.price && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sf-radius-sm)', background: theme === 'glow' ? '#FEF3C7' : theme === 'market' || theme === 'bazaar' ? '#FEE2E2' : theme === 'vault' ? '#3B82F6' : primary, color: theme === 'glow' ? '#92400E' : theme === 'market' || theme === 'bazaar' ? '#991B1B' : '#fff' }}>Sale</span>}
                {!p.images?.[0] && <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sf-text-1)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.displayName}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: primary, margin: 0 }}>₦{p.price.toLocaleString()}</p>
              </div>
            </div>
          ))
          : mock.products.slice(0, maxItems).map((p, i) => (
            <div key={i} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s' }}>
              <div style={{ aspectRatio: isLuxe ? '3/4' : '1/1', background: `${primary}${['20','16','12','0e'][i] || '10'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {p.tag && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--sf-radius-sm)', background: theme === 'glow' ? '#FEF3C7' : theme === 'market' ? '#FEE2E2' : primary, color: theme === 'glow' ? '#92400E' : theme === 'market' ? '#991B1B' : '#fff' }}>{p.tag}</span>}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.5" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sf-text-1)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: primary, margin: 0 }}>{p.price}</p>
              </div>
            </div>
          ))
        }
      </div>
    </section>
  );
}

function SfCollections({ theme, settings, primary, secondary }: {
  theme: StorefrontTheme; settings: CollectionsSectionSettings; primary: string; secondary: string;
}) {
  const mock = MOCK[theme];
  const heading = settings.heading || 'Collections';
  const isGrid = settings.layout === 'grid';
  const visible = mock.collections.slice(0, settings.maxItems ?? 6);

  return (
    <section style={{ padding: '40px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16 }}>{heading}</h2>
      <div style={{ display: isGrid ? 'grid' : 'flex', gridTemplateColumns: isGrid ? 'repeat(3,1fr)' : undefined, gap: 10, overflowX: isGrid ? undefined : 'auto', paddingBottom: isGrid ? 0 : 8 }}>
        {visible.map((col, i) => (
          <div key={i} style={{ flexShrink: 0, minWidth: 130, borderRadius: 'var(--sf-radius)', overflow: 'hidden', border: '1px solid var(--sf-border)', cursor: 'pointer', background: 'var(--sf-bg)' }}>
            <div style={{ height: 72, background: `linear-gradient(135deg,${primary}${['28','1e','14'][i]||'10'},${secondary}${['18','10','0a'][i]||'08'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
              {col.emoji}
            </div>
            <div style={{ padding: '8px 12px' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: 'var(--sf-text-1)' }}>{col.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfAnnouncement({ settings }: { settings: AnnouncementSectionSettings }) {
  return (
    <div style={{ background: settings.backgroundColor ?? '#0F172A', color: settings.textColor ?? '#fff', padding: '10px 20px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <span>{settings.text || 'Free delivery on orders over ₦20,000'}</span>
      {settings.linkLabel && <a href={settings.linkUrl ?? '#'} style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.8 }}>{settings.linkLabel}</a>}
    </div>
  );
}

function SfAbout({ settings, theme }: { settings: AboutSectionSettings; theme: StorefrontTheme }) {
  const imgLeft = settings.imagePosition === 'left';
  return (
    <section style={{ padding: '48px 32px', background: 'var(--sf-bg)', borderTop: '1px solid var(--sf-border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: settings.imageUrl ? '1fr 1fr' : '1fr', gap: 40, alignItems: 'center' }}>
        {settings.imageUrl && imgLeft && (
          <img src={settings.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--sf-radius-lg)' }} />
        )}
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16, lineHeight: 1.2 }}>
            {settings.heading ?? 'Our Story'}
          </h2>
          <p style={{ color: 'var(--sf-text-2)', lineHeight: 1.75, fontSize: '1rem' }}>
            {settings.body ?? 'Tell customers what makes your brand special.'}
          </p>
        </div>
        {settings.imageUrl && !imgLeft && (
          <img src={settings.imageUrl} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--sf-radius-lg)' }} />
        )}
        {!settings.imageUrl && (
          <div style={{ height: 220, background: 'var(--sf-surface)', borderRadius: 'var(--sf-radius-lg)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
      </div>
    </section>
  );
}

function SfTestimonials({ settings, theme, primary }: { settings: TestimonialsSectionSettings; theme: StorefrontTheme; primary: string }) {
  const mock = MOCK[theme].testimonials;
  const items = (settings.testimonials && settings.testimonials.length > 0) ? settings.testimonials : mock;
  return (
    <section style={{ padding: '48px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 24, textAlign: 'center' }}>
        {settings.heading ?? 'What our customers say'}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {items.map((t, i) => (
          <div key={i} style={{ background: 'var(--sf-bg)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-lg)', padding: 24 }}>
            <div style={{ color: '#F59E0B', fontSize: '0.9rem', marginBottom: 10 }}>★★★★★</div>
            <p style={{ color: 'var(--sf-text-2)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: 12 }}>"{t.text}"</p>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--sf-text-1)' }}>— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfNewsletter({ settings, primary }: { settings: NewsletterSectionSettings; primary: string }) {
  return (
    <section style={{ padding: '56px 32px', background: 'var(--sf-bg)', borderTop: '1px solid var(--sf-border)', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 8 }}>
        {settings.heading ?? 'Join our community'}
      </h2>
      <p style={{ color: 'var(--sf-text-2)', marginBottom: 24, fontSize: '1rem', lineHeight: 1.6 }}>
        {settings.subheading ?? 'Get the latest updates, offers and more.'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 480, margin: '0 auto' }}>
        <input type="email" placeholder={settings.placeholder ?? 'Enter your email'}
          style={{ flex: 1, minWidth: 200, padding: '12px 16px', border: '1.5px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)', fontSize: '0.95rem', background: 'var(--sf-surface)', color: 'var(--sf-text-1)', outline: 'none', fontFamily: 'inherit' }} />
        <button style={{ padding: '12px 24px', background: primary, color: '#fff', borderRadius: 'var(--sf-radius-sm)', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          {settings.buttonLabel ?? 'Subscribe'}
        </button>
      </div>
    </section>
  );
}

function SfInstagram({ settings }: { settings: InstagramSectionSettings }) {
  return (
    <section style={{ padding: '48px 32px', background: 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--sf-text-1)', marginBottom: 16, textAlign: 'center' }}>
        {settings.heading ?? 'Follow us on Instagram'}
      </h2>
      {settings.handle && <p style={{ textAlign: 'center', color: 'var(--sf-text-3)', marginBottom: 16, fontSize: '0.9rem' }}>{settings.handle}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '1/1', background: 'var(--sf-bg)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/></svg>
          </div>
        ))}
      </div>
    </section>
  );
}

function SfFooter({ settings, storeName, logoUrl, theme }: {
  settings: FooterSectionSettings; storeName: string; logoUrl?: string | null; theme: StorefrontTheme;
}) {
  const socials = settings.socials ?? {};
  const hasSocials = Object.values(socials).some(Boolean);
  const isDark = theme === 'luxe' || theme === 'creator' || theme === 'vault';
  return (
    <footer style={{ background: isDark ? (theme === 'luxe' ? '#000' : theme === 'vault' ? '#060E1F' : '#060C1A') : 'var(--sf-surface)', borderTop: '1px solid var(--sf-border)', padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      {settings.showLogo !== false && logoUrl && (
        <img src={logoUrl} alt={storeName} style={{ height: 36, width: 'auto', maxWidth: 140, objectFit: 'contain', borderRadius: 'var(--sf-radius-sm)' }} />
      )}
      {settings.showLogo !== false && !logoUrl && (
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--sf-text-1)' }}>{storeName}</span>
      )}
      {hasSocials && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(['instagram','twitter','tiktok','facebook','youtube'] as const).map(k => {
            const url = (socials as Record<string,string>)[k];
            if (!url) return null;
            return (
              <a key={k} href={url} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--sf-border)', background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sf-text-2)', textDecoration: 'none', fontSize: '0.65rem', fontWeight: 800 }}>
                {k.slice(0,2).toUpperCase()}
              </a>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: '0.8rem', color: 'var(--sf-text-3)' }}>
        {settings.customText || `© ${new Date().getFullYear()} ${storeName}`}
        {settings.showPoweredBy !== false && <span> · Powered by Busmo</span>}
      </p>
    </footer>
  );
}

// ─── Link theme — standalone creator page components ─────────────────────────

function SfLinkProfile({ storeName, tagline, logoUrl, primary, secondary }: {
  storeName: string; tagline: string; logoUrl?: string | null;
  primary: string; secondary: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '48px 24px 28px', gap: 14, background: 'var(--sf-bg)' }}>
      {/* Avatar with gradient ring */}
      <div style={{
        padding: 3, borderRadius: '50%',
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 86, height: 86, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={storeName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '2rem', fontWeight: 800, background: `linear-gradient(135deg,${primary},${secondary})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {storeName.charAt(0).toUpperCase()}
              </span>
          }
        </div>
      </div>
      {/* Name */}
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sf-text-1)', margin: 0, letterSpacing: '-0.02em' }}>
        {storeName}
      </h1>
      {/* Bio */}
      <p style={{ fontSize: '0.92rem', color: 'var(--sf-text-2)', margin: 0, maxWidth: 440, lineHeight: 1.65 }}>
        {tagline}
      </p>
      {/* Social pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {['Instagram', 'Twitter', 'YouTube', 'TikTok'].map(s => (
          <span key={s} style={{
            padding: '5px 14px', borderRadius: 100,
            border: '1px solid var(--sf-border)',
            fontSize: '0.72rem', fontWeight: 600, color: 'var(--sf-text-2)',
            cursor: 'pointer', background: 'var(--sf-surface)',
            transition: 'border-color 0.18s, color 0.18s',
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

function SfLinkProducts({ products, primary, secondary }: {
  products: { name: string; price: string; tag?: string }[];
  primary: string; secondary: string;
}) {
  return (
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sf-text-3)', textAlign: 'center', margin: '0 0 4px' }}>Products & Services</p>
      {products.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
          borderRadius: 'var(--sf-radius-lg)', padding: '16px 20px',
          cursor: 'pointer', transition: 'border-color 0.18s, transform 0.18s',
        }}>
          {/* Product icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--sf-radius)',
            background: `linear-gradient(135deg,${primary}28,${secondary}1c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
              {p.tag && <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: primary + '25', color: primary, flexShrink: 0 }}>{p.tag}</span>}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: 700, color: primary }}>{p.price}</p>
          </div>
          {/* Arrow */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sf-text-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}
    </div>
  );
}

function SfLinkTestimonials({ testimonials, primary }: {
  testimonials: { name: string; text: string }[];
  primary: string;
}) {
  return (
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560, margin: '0 auto', width: '100%' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sf-text-3)', textAlign: 'center', margin: '0 0 4px' }}>What people say</p>
      {testimonials.map((t, i) => (
        <div key={i} style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-lg)', padding: '18px 20px' }}>
          <div style={{ color: '#F59E0B', fontSize: '0.75rem', marginBottom: 8 }}>★★★★★</div>
          <p style={{ color: 'var(--sf-text-2)', fontStyle: 'italic', lineHeight: 1.6, fontSize: '0.9rem', margin: '0 0 10px' }}>"{t.text}"</p>
          <p style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--sf-text-1)', margin: 0 }}>— {t.name}</p>
        </div>
      ))}
    </div>
  );
}

function SfLinkFooter({ storeName, primary }: { storeName: string; primary: string }) {
  return (
    <div style={{ padding: '20px 20px 36px', textAlign: 'center', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg)' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)', margin: 0 }}>
        © {new Date().getFullYear()} {storeName} · Powered by <span style={{ color: primary }}>Busmo</span>
      </p>
    </div>
  );
}

// ─── Main StorefrontCanvas export ─────────────────────────────────────────────

export function StorefrontCanvas({
  theme,
  storeName = 'Your Store',
  tagline = 'Shop our latest collection',
  primaryColor,
  secondaryColor,
  logoUrl,
  sections,
  width = 1000,
  storeSlug,
  products = [],
  collections = [],
  fontFamily,
  buttonStyle = 'pill',
  bodyTextColor,
  bgColor,
  hideStoreNameWithLogo,
}: StorefrontCanvasProps) {
  // Fall back to theme defaults if no colors provided
  const defaultColors: Record<StorefrontTheme, [string, string]> = {
    luxe:    ['#C9A84C', '#8B7355'],
    glow:    ['#E8927C', '#D4756A'],
    market:  ['#EA580C', '#C2410C'],
    creator: ['#6366F1', '#4F46E5'],
    link:    ['#A78BFA', '#7C3AED'],
    pulse:   ['#FF6B35', '#F7C948'],
    vault:   ['#3B82F6', '#1D4ED8'],
    atlas:   ['#0D9488', '#0F766E'],
    spark:   ['#D97706', '#2D1B69'],
    bazaar:  ['#059669', '#F97316'],
  };
  const [defPrimary, defSecondary] = defaultColors[theme];
  const primary   = primaryColor   ?? defPrimary;
  const secondary = secondaryColor ?? defSecondary;

  // Merge saved sections with defaults
  const saved = sections ?? [];
  const activeSections = (saved.length > 0 ? saved : DEFAULT_SECTIONS)
    .slice()
    .sort((a, b) => a.order - b.order);

  const themeVars = getThemeCssVars(theme, primary, secondary);
  const isLink = isLinkTheme(theme);

  // Apply custom font and color overrides
  const customVars: Record<string, string> = {};
  if (fontFamily) customVars['--sf-font'] = `'${fontFamily}', system-ui, sans-serif`;
  if (bodyTextColor) customVars['--sf-text-1'] = bodyTextColor;
  if (bgColor) customVars['--sf-bg'] = bgColor;

  // Link theme uses a completely different layout (centered profile page)
  if (isLink) {
    const linkMock = MOCK.link;
    const linkProducts = products.length > 0
      ? products.slice(0, 6).map(p => ({ name: p.displayName, price: `₦${p.price.toLocaleString()}`, tag: p.compareAtPrice && p.compareAtPrice > p.price ? 'Sale' : undefined }))
      : linkMock.products;
    return (
      <div style={{
        width, background: 'var(--sf-bg)', fontFamily: 'var(--sf-font)',
        color: 'var(--sf-text-1)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none', ...themeVars, ...customVars,
      }}>
        <SfLinkProfile storeName={storeName} tagline={tagline} logoUrl={logoUrl} primary={primary} secondary={secondary} />
        <SfLinkProducts products={linkProducts} primary={primary} secondary={secondary} />
        <SfLinkTestimonials testimonials={linkMock.testimonials} primary={primary} />
        <SfLinkFooter storeName={storeName} primary={primary} />
      </div>
    );
  }

  return (
    <div style={{
      width,
      background: 'var(--sf-bg)',
      fontFamily: 'var(--sf-font)',
      color: 'var(--sf-text-1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      ...themeVars,
      ...customVars,
    }}>
      {activeSections.map(section => {
        if (!section.enabled) return null;
        const s = section.settings as Record<string, unknown>;

        switch (section.type) {
          case 'header':
            return <SfNav key={section.id} theme={theme} storeName={storeName} logoUrl={logoUrl} primary={primary} storeSlug={storeSlug} hideStoreNameWithLogo={hideStoreNameWithLogo} />;

          case 'announcement':
            return <SfAnnouncement key={section.id} settings={s as unknown as AnnouncementSectionSettings} />;

          case 'hero':
            return <SfHero key={section.id} theme={theme} storeName={storeName} tagline={tagline} settings={s as HeroSectionSettings} primary={primary} secondary={secondary} buttonStyle={buttonStyle} />;

          case 'featured':
            return <SfFeatured key={section.id} theme={theme} settings={s as FeaturedSectionSettings} primary={primary} products={products} storeSlug={storeSlug} />;

          case 'collections':
            return <SfCollections key={section.id} theme={theme} settings={s as CollectionsSectionSettings} primary={primary} secondary={secondary} />;

          case 'about':
            return <SfAbout key={section.id} settings={s as AboutSectionSettings} theme={theme} />;

          case 'testimonials':
            return <SfTestimonials key={section.id} settings={s as TestimonialsSectionSettings} theme={theme} primary={primary} />;

          case 'instagram':
            return <SfInstagram key={section.id} settings={s as InstagramSectionSettings} />;

          case 'newsletter':
            return <SfNewsletter key={section.id} settings={s as NewsletterSectionSettings} primary={primary} />;

          case 'footer':
            return <SfFooter key={section.id} settings={s as FooterSectionSettings} storeName={storeName} logoUrl={logoUrl} theme={theme} />;

          default:
            return null;
        }
      })}
    </div>
  );
}

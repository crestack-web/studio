import type { StorefrontTheme } from '@/app/sell/mo-sell.types';
import type { ThemeComponents, ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

// ─── Theme metadata (for sell dashboard UI) ─────────────────────────────────

export interface ThemeMeta {
  id: StorefrontTheme;
  name: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewFont: string;
  bestFor: string[];
  badge: { label: string; color: string; bg: string } | null;
  dataAttr: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'luxe',
    name: 'Luxe',
    description: 'Editorial, high-end fashion with large imagery and luxury whitespace.',
    previewBg: '#0A0A0A',
    previewAccent: '#C9A84C',
    previewFont: 'Playfair Display',
    bestFor: ['Fashion', 'Accessories'],
    badge: { label: 'Premium', color: '#92400E', bg: '#FEF3C7' },
    dataAttr: 'luxe',
  },
  {
    id: 'glow',
    name: 'Glow',
    description: 'Soft, feminine, and beauty-forward. Perfect for skincare and cosmetics.',
    previewBg: '#FDF6F0',
    previewAccent: '#E8927C',
    previewFont: 'DM Sans',
    bestFor: ['Beauty', 'Cosmetics'],
    badge: { label: 'New', color: '#065F46', bg: '#D1FAE5' },
    dataAttr: 'glow',
  },
  {
    id: 'market',
    name: 'Market',
    description: 'Bright, dense, and price-forward. Built for high-volume everyday selling.',
    previewBg: '#FFF7ED',
    previewAccent: '#EA580C',
    previewFont: 'Plus Jakarta Sans',
    bestFor: ['General', 'Home', 'Lifestyle'],
    badge: { label: 'Best Seller', color: '#065F46', bg: '#D1FAE5' },
    dataAttr: 'market',
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Clean and conversion-focused for digital products and online services.',
    previewBg: '#0F172A',
    previewAccent: '#6366F1',
    previewFont: 'Sora',
    bestFor: ['Digital Products'],
    badge: { label: 'Best for Creators', color: '#5B21B6', bg: '#EDE9FE' },
    dataAttr: 'creator',
  },
  {
    id: 'link',
    name: 'Link',
    description: 'Centered creator page. Profile, bio, social links, and products in one scroll.',
    previewBg: '#0D0D0D',
    previewAccent: '#A78BFA',
    previewFont: 'Plus Jakarta Sans',
    bestFor: ['Coaches', 'Creators', 'Freelancers'],
    badge: { label: 'Stan Store style', color: '#1D4ED8', bg: '#DBEAFE' },
    dataAttr: 'link',
  },
];

export function getTheme(id?: string): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function suggestTheme(category: string): StorefrontTheme {
  const c = category.toLowerCase();
  if (['fashion', 'jewellery', 'luxury', 'clothing', 'accessories'].some(k => c.includes(k))) return 'luxe';
  if (['beauty', 'cosmetics', 'skincare', 'glow', 'makeup', 'wellness', 'spa', 'candle'].some(k => c.includes(k))) return 'glow';
  if (['digital', 'creator', 'course', 'service', 'software', 'ebook'].some(k => c.includes(k))) return 'creator';
  if (['link', 'coach', 'consult', 'freelance', 'booking', 'bio'].some(k => c.includes(k))) return 'link';
  if (['food', 'grocery', 'market', 'home', 'lifestyle', 'general'].some(k => c.includes(k))) return 'market';
  return 'luxe';
}

// ─── Lazy-load theme components ─────────────────────────────────────────────

const themeLoader: Record<string, () => Promise<ThemeComponents>> = {
  luxe: () => import('./luxe').then(m => ({
    ProductCard: m.LuxeProductCard,
    CollectionCard: m.LuxeCollectionCard,
    Hero: m.LuxeHero,
    ProductPage: m.LuxeProductPage,
    cssClass: 'theme-luxe',
  })),
  market: () => import('./market').then(m => ({
    ProductCard: m.MarketProductCard,
    CollectionCard: m.MarketCollectionCard,
    Hero: m.MarketHero,
    ProductPage: m.MarketProductPage,
    cssClass: 'theme-market',
  })),
  creator: () => import('./creator').then(m => ({
    ProductCard: m.CreatorProductCard,
    CollectionCard: m.CreatorCollectionCard,
    Hero: m.CreatorHero,
    ProductPage: m.CreatorProductPage,
    cssClass: 'theme-creator',
  })),
  glow: () => import('./glow').then(m => ({
    ProductCard: m.GlowProductCard,
    CollectionCard: m.GlowCollectionCard,
    Hero: m.GlowHero,
    ProductPage: m.GlowProductPage,
    cssClass: 'theme-glow',
  })),
};

export type ThemeId = keyof typeof themeLoader;

export async function getThemeComponents(themeId: string): Promise<ThemeComponents> {
  const loader = themeLoader[themeId];
  if (!loader) {
    return themeLoader.luxe();
  }
  return loader();
}

export async function getThemeComponentsServer(themeId: string): Promise<ThemeComponents> {
  const loader = themeLoader[themeId];
  if (!loader) {
    return themeLoader.luxe();
  }
  return loader();
}

export function isLinkTheme(themeId: string): boolean {
  return themeId === 'link';
}

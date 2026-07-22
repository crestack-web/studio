import type { StorefrontTheme } from '@/app/sell/mo-sell.types';

export interface ThemeMeta {
  id: StorefrontTheme;
  name: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewFont: string;
  bestFor: string[];
  /** CSS data-theme attribute value injected on <html> */
  dataAttr: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, familiar e-commerce layout. Trusted and easy to navigate.',
    previewBg: '#FFFFFF',
    previewAccent: '#0EA5E9',
    previewFont: 'Plus Jakarta Sans',
    bestFor: ['general', 'retail', 'electronics', 'wholesale'],
    dataAttr: 'classic',
  },
  {
    id: 'luxe',
    name: 'Luxe',
    description: 'Dark, editorial, and high-end. Large imagery with luxury whitespace.',
    previewBg: '#0A0A0A',
    previewAccent: '#C9A84C',
    previewFont: 'Playfair Display',
    bestFor: ['fashion', 'beauty', 'jewellery', 'premium'],
    dataAttr: 'luxe',
  },
  {
    id: 'market',
    name: 'Market',
    description: 'Bright, dense, and price-forward. Built for high-volume selling.',
    previewBg: '#FFF7ED',
    previewAccent: '#EA580C',
    previewFont: 'Plus Jakarta Sans',
    bestFor: ['food', 'grocery', 'market', 'everyday'],
    dataAttr: 'market',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Minimal and art-gallery inspired. Photography-first layout.',
    previewBg: '#FAFAFA',
    previewAccent: '#18181B',
    previewFont: 'DM Sans',
    bestFor: ['art', 'handmade', 'photography', 'lifestyle'],
    dataAttr: 'studio',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'High-contrast, oversized type, and punchy CTAs. Built to convert.',
    previewBg: '#09090B',
    previewAccent: '#22C55E',
    previewFont: 'Sora',
    bestFor: ['streetwear', 'tech', 'gaming', 'youth'],
    dataAttr: 'bold',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean with muted tones and generous whitespace. Lets products speak.',
    previewBg: '#F8F8F5',
    previewAccent: '#71717A',
    previewFont: 'Inter',
    bestFor: ['wellness', 'home', 'skincare', 'candles'],
    dataAttr: 'minimal',
  },
];

export function getTheme(id?: string): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

/** Suggest a theme based on business category from the wizard */
export function suggestTheme(category: string): StorefrontTheme {
  const c = category.toLowerCase();
  if (['fashion', 'beauty', 'jewellery', 'luxury', 'clothing'].some(k => c.includes(k))) return 'luxe';
  if (['food', 'grocery', 'restaurant', 'market', 'cafe'].some(k => c.includes(k))) return 'market';
  if (['art', 'handmade', 'craft', 'photography', 'gallery'].some(k => c.includes(k))) return 'studio';
  if (['tech', 'gaming', 'streetwear', 'electronics', 'gadget'].some(k => c.includes(k))) return 'bold';
  if (['wellness', 'spa', 'skincare', 'candle', 'home', 'organic'].some(k => c.includes(k))) return 'minimal';
  return 'classic';
}

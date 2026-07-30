import type { StorefrontTheme } from '@/types/mo-sell.types';

// ─── Shared product data shape ──────────────────────────────────────────────

export interface ProductCardData {
  id: string;
  displayName: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  available: boolean;
  stock: number;
  productType: 'physical' | 'digital' | 'service';
  description?: string;
}

export interface CollectionData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  description: string;
  productCount?: number;
}

// ─── Theme component interfaces ─────────────────────────────────────────────

export interface ThemeProductCardProps {
  product: ProductCardData;
  storeSlug: string;
  currency: string;
}

export interface ThemeCollectionCardProps {
  collection: CollectionData;
  storeSlug: string;
  index: number;
}

export interface ThemeHeroProps {
  storeName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string | null;
  businessCategory?: string;
  textAlign?: 'left' | 'center' | 'right';
  buttonStyle?: 'pill' | 'square' | 'rounded';
}

export interface ThemeProductPageProps {
  product: {
    id: string;
    displayName: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    category: string;
    stock: number;
    productType: 'physical' | 'digital' | 'service';
    tags: string[];
    deliveryNote: string | null;
    digitalFileUrl: string | null;
  };
  storeSlug: string;
  currency: string;
}

export interface ThemeComponents {
  ProductCard: React.ComponentType<ThemeProductCardProps>;
  CollectionCard: React.ComponentType<ThemeCollectionCardProps>;
  Hero: React.ComponentType<ThemeHeroProps>;
  ProductPage: React.ComponentType<ThemeProductPageProps>;
  cssClass?: string; // Additional CSS class to apply to the page wrapper
}

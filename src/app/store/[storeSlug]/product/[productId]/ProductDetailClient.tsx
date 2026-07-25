'use client';

import React, { useEffect, useState } from 'react';
import type { ThemeComponents, ThemeProductPageProps } from '../../../themes/types';

interface Product {
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
}

interface Props {
  product: Product;
  storeSlug: string;
  currency: string;
  theme: string;
}

// Loading skeleton while theme loads
function ProductPageSkeleton() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div style={{ aspectRatio: '1/1', background: '#F3F4F6', borderRadius: 16, animation: 'pulse 2s infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 80, height: 12, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: '60%', height: 28, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: 120, height: 20, background: '#E5E7EB', borderRadius: 4 }} />
          <div style={{ width: '100%', height: 80, background: '#E5E7EB', borderRadius: 4, marginTop: 16 }} />
        </div>
      </div>
    </div>
  );
}

// Fallback: generic product page if theme fails to load
function GenericProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
        <div>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 16 }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#F3F4F6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📦</div>
          )}
        </div>
        <div>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>{product.category}</p>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 8 }}>{product.displayName}</h1>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4F46E5', marginTop: 12 }}>
            {currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' '}{product.price.toLocaleString()}
          </p>
          {product.description && <p style={{ color: '#6B7280', marginTop: 16, lineHeight: 1.7 }}>{product.description}</p>}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailClient({ product, storeSlug, currency, theme }: Props) {
  const [ThemeComponents, setThemeComponents] = useState<ThemeComponents | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import(`../../../themes/registry`).then(mod => {
      mod.getThemeComponents(theme).then((components: ThemeComponents) => {
        if (!cancelled) setThemeComponents(components);
      }).catch(() => {
        if (!cancelled) setError(true);
      });
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; };
  }, [theme]);

  if (error || !ThemeComponents) {
    if (error) {
      return <GenericProductPage product={product} storeSlug={storeSlug} currency={currency} />;
    }
    return <ProductPageSkeleton />;
  }

  const ProductPage = ThemeComponents.ProductPage;

  return (
    <div className={ThemeComponents.cssClass || ''}>
      <ProductPage product={product} storeSlug={storeSlug} currency={currency} />
    </div>
  );
}

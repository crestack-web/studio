import React from 'react';
import { ProductCard, type ProductCardData } from './ProductCard';

interface Props {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  emptyMessage?: string;
  columns?: number;
}

export function ProductGrid({ products, storeSlug, currency, emptyMessage = 'No products yet.', columns }: Props) {
  if (products.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', textAlign: 'center',
        color: 'var(--sf-text-3)', fontSize: '0.9rem',
      }}>
        {emptyMessage}
      </div>
    );
  }

  const minWidth = columns ? `${Math.floor(100 / columns) - 2}%` : '220px';

  return (
    <div className="sf-product-grid" style={{
      display: 'grid',
      gridTemplateColumns: columns
        ? `repeat(${columns}, 1fr)`
        : `repeat(auto-fill, minmax(${minWidth}, 1fr))`,
      gap: 16,
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}

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

  return (
    <div className="sf-product-grid" style={columns ? {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 24,
    } : undefined}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}

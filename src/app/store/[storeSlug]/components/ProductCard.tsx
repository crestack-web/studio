'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

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

interface Props {
  product: ProductCardData;
  storeSlug: string;
  currency: string;
}

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function ProductCard({ product, storeSlug, currency }: Props) {
  const { addItem } = useCart();

  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  const isOutOfStock = product.productType === 'physical' && product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      displayName: product.displayName,
      price: product.price,
      imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
    });
    fetch('/api/store/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'add_to_cart', storeSlug, productId: product.id, pageType: 'grid' }),
    }).catch(() => {});
  };

  return (
    <Link href={`/store/${storeSlug}/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="sf-card">

        {/* Image area */}
        <div className="sf-card-img">
          {product.images[0]
            // eslint-disable-next-line @next/next/no-img-element
            ? <img
                src={product.images[0]}
                alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            : <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', background: 'var(--sf-surface-2)',
              }}>📦</div>
          }

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {discount && (
              <span className="sf-badge-discount" style={{
                fontSize: '0.7rem', fontWeight: 700,
                padding: '3px 8px', borderRadius: 100,
                background: 'var(--sf-secondary, #6366F1)', color: '#fff',
              }}>-{discount}%</span>
            )}
            {product.productType === 'digital' && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '3px 8px', borderRadius: 100,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                backdropFilter: 'blur(4px)',
              }}>Digital</span>
            )}
            {isOutOfStock && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '3px 8px', borderRadius: 100,
                background: 'rgba(0,0,0,0.6)', color: '#fff',
              }}>Out of stock</span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="sf-card-body">
          {product.category && (
            <p className="sf-card-category">{product.category}</p>
          )}
          <p className="sf-card-name">{product.displayName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span className="sf-card-price">{fmt(product.price, currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.82rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          className="sf-card-btn"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.displayName} to cart`}
        >
          {isOutOfStock ? 'Out of stock' : '+ Add to cart'}
        </button>
      </div>
    </Link>
  );
}

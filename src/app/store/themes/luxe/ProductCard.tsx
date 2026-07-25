'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function LuxeProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
    });
  };

  return (
    <Link href={`/store/${storeSlug}/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Editorial image — full bleed, no border */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 380, background: '#1C1C1C',
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'opacity 0.6s ease',
                opacity: hovered && product.images[1] ? 0.9 : 1,
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#333' }}>📦</div>
          )}

          {/* Minimal badges */}
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {discount && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '4px 12px', background: '#C9A84C', color: '#0A0A0A',
              }}>-{discount}%</span>
            )}
            {product.productType === 'digital' && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '4px 12px', background: 'rgba(10,10,10,0.7)', color: '#C9A84C',
                backdropFilter: 'blur(8px)',
              }}>DIGITAL</span>
            )}
          </div>

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(10,10,10,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.15em',
              color: '#A89878', textTransform: 'uppercase',
            }}>Sold Out</div>
          )}
        </div>

        {/* Minimal text — luxury typography */}
        <div style={{ padding: '16px 0 0' }}>
          {product.category && (
            <p style={{
              fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#C9A84C', fontWeight: 500, margin: 0,
            }}>{product.category}</p>
          )}
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400, fontSize: '1.05rem', color: '#F5F5F0',
            margin: '6px 0 8px', lineHeight: 1.3,
          }}>{product.displayName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.95rem', color: '#C9A84C', fontWeight: 400, letterSpacing: '0.03em' }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.82rem', color: '#606060', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Add to cart — minimal uppercase */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          style={{
            width: '100%', padding: '14px', marginTop: 14,
            background: 'transparent', border: '1px solid #2A2A2A',
            color: '#F5F5F0', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            opacity: isOutOfStock ? 0.3 : 1,
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => { if (!isOutOfStock) { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; e.currentTarget.style.borderColor = '#C9A84C'; }}}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#F5F5F0'; e.currentTarget.style.borderColor = '#2A2A2A'; }}
          aria-label={`Add ${product.displayName} to cart`}
        >
          {isOutOfStock ? 'Sold Out' : '+ Add to Bag'}
        </button>
      </div>
    </Link>
  );
}

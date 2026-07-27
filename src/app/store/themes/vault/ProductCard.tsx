'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const C = {
  navy: '#0B1D3A',
  surface: '#112240',
  surfaceLight: '#1A3358',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  white: '#F1F5F9',
  muted: '#94A3B8',
  darkText: '#CBD5E1',
};

export function VaultProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
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
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 16, overflow: 'hidden',
        background: C.surface,
        border: hovered
          ? '1px solid rgba(59,130,246,0.35)'
          : '1px solid rgba(59,130,246,0.08)',
        boxShadow: hovered
          ? '0 12px 40px rgba(59,130,246,0.15), 0 0 24px rgba(59,130,246,0.06)'
          : '0 2px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
      }}>
        {/* Image area */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 300,
          background: C.navy,
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.6s ease, opacity 0.4s ease',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                opacity: hovered && product.images[1] ? 0.92 : 1,
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', color: C.blue,
              background: `linear-gradient(135deg, ${C.surface}, ${C.navy})`,
            }}>📦</div>
          )}

          {/* Dark gradient overlay at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 80,
            background: 'linear-gradient(to top, rgba(11,29,58,0.7) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {discount && (
              <span style={{
                fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em',
                padding: '5px 12px', borderRadius: 8,
                background: `linear-gradient(135deg, ${C.blue}, #2563EB)`,
                color: '#FFFFFF',
              }}>-{discount}%</span>
            )}
            {product.productType === 'digital' && (
              <span style={{
                fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: C.lightBlue,
              }}>📥 Digital</span>
            )}
            {product.productType === 'service' && (
              <span style={{
                fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: C.lightBlue,
              }}>Service</span>
            )}
          </div>

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(11,29,58,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em',
              color: C.muted, textTransform: 'uppercase',
            }}>Sold Out</div>
          )}
        </div>

        {/* Product info */}
        <div style={{ padding: '18px 20px 20px' }}>
          {product.category && (
            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: C.lightBlue, fontWeight: 600, margin: 0,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>{product.category}</p>
          )}

          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600, fontSize: '1rem', color: C.white,
            margin: '8px 0 12px', lineHeight: 1.35,
          }}>{product.displayName}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.1rem', color: C.white, fontWeight: 700,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.8rem', color: C.muted,
                textDecoration: 'line-through', opacity: 0.6,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            style={{
              width: '100%', padding: '14px', marginTop: 16,
              background: isOutOfStock ? C.surfaceLight : C.blue,
              border: 'none', borderRadius: 10,
              color: '#FFFFFF',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.75rem', fontWeight: 600,
              letterSpacing: '0.06em',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              opacity: isOutOfStock ? 0.4 : 1,
              transition: 'all 0.3s ease',
              boxShadow: isOutOfStock ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
            }}
            onMouseEnter={e => {
              if (!isOutOfStock) {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.45)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 4px 16px rgba(59,130,246,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            aria-label={`Get ${product.displayName}`}
          >
            {isOutOfStock ? 'Sold Out' : 'Get Instant Access →'}
          </button>
        </div>
      </div>
    </Link>
  );
}

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
  slate: '#1E293B',
  slateMuted: '#64748B',
  slateLight: '#94A3B8',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealPale: '#CCFBF1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

export function AtlasProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
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

  const serviceLabel = product.productType === 'service' ? 'SERVICE'
    : product.productType === 'digital' ? 'DIGITAL'
    : null;

  return (
    <Link href={`/store/${storeSlug}/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 14, overflow: 'hidden',
        background: C.white,
        border: `1px solid ${hovered ? C.teal : C.border}`,
        boxShadow: hovered
          ? '0 12px 32px rgba(13,148,136,0.12), 0 0 0 1px rgba(13,148,136,0.15)'
          : '0 1px 8px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.02)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
      }}>
        {/* Image area */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 300, borderRadius: '14px 14px 0 0',
          background: C.bg,
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease, opacity 0.35s ease',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                opacity: hovered && product.images[1] ? 0.9 : 1,
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', color: C.tealLight,
              background: `linear-gradient(135deg, ${C.tealPale}, ${C.bg})`,
            }}>✦</div>
          )}

          {/* Service type badge */}
          {serviceLabel && (
            <span style={{
              position: 'absolute', top: 12, left: 12,
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.12em',
              padding: '4px 12px', borderRadius: 6,
              background: C.teal, color: C.white,
              fontFamily: "'Manrope', sans-serif",
            }}>{serviceLabel}</span>
          )}

          {/* Discount badge */}
          {discount && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
              padding: '4px 10px', borderRadius: 6,
              background: C.slate, color: C.white,
              fontFamily: "'Manrope', sans-serif",
            }}>-{discount}%</span>
          )}

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(248,250,252,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em',
              color: C.slateMuted, textTransform: 'uppercase',
              fontFamily: "'Manrope', sans-serif",
            }}>Unavailable</div>
          )}
        </div>

        {/* Product info */}
        <div style={{ padding: '16px 18px 18px' }}>
          {product.category && (
            <p style={{
              fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: C.teal, fontWeight: 700, margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}>{product.category}</p>
          )}

          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600, fontSize: '0.98rem', color: C.slate,
            margin: '6px 0 10px', lineHeight: 1.35,
          }}>{product.displayName}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: '0.92rem', color: C.teal, fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.78rem', color: C.slateLight,
                textDecoration: 'line-through',
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            style={{
              width: '100%', padding: '12px', marginTop: 14,
              background: isOutOfStock ? C.bg : C.teal,
              border: `1px solid ${isOutOfStock ? C.border : C.teal}`,
              borderRadius: 10,
              color: isOutOfStock ? C.slateMuted : C.white,
              fontSize: '0.68rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              opacity: isOutOfStock ? 0.5 : 1,
              transition: 'all 0.3s ease',
              fontFamily: "'Manrope', sans-serif",
              boxShadow: isOutOfStock ? 'none' : '0 2px 8px rgba(13,148,136,0.2)',
            }}
            onMouseEnter={e => {
              if (!isOutOfStock) {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 2px 8px rgba(13,148,136,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            aria-label={`Get started with ${product.displayName}`}
          >
            {isOutOfStock ? 'Unavailable' : product.productType === 'service' ? 'Book Now' : 'Get Started'}
          </button>
        </div>
      </div>
    </Link>
  );
}

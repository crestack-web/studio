'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const COLORS = {
  roseGold: '#B76E79',
  roseGoldLight: '#D4A0A6',
  softPink: '#FDE8E9',
  warmWhite: '#FFFAF7',
  gold: '#D4A574',
  blush: '#F5D5CC',
  cream: '#FFF5EE',
  dustyRose: '#C9929B',
};

export function GlowProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
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
        borderRadius: 20, overflow: 'hidden',
        background: COLORS.warmWhite,
        boxShadow: hovered
          ? '0 12px 36px rgba(183,110,121,0.18), 0 4px 12px rgba(183,110,121,0.08)'
          : '0 2px 12px rgba(183,110,121,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
      }}>
        {/* Image area */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 340, borderRadius: '20px 20px 0 0',
          background: COLORS.softPink,
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                borderRadius: 16, margin: 0,
                transition: 'transform 0.6s ease, opacity 0.4s ease',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
                opacity: hovered && product.images[1] ? 0.92 : 1,
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3.5rem', color: COLORS.roseGoldLight,
              background: `linear-gradient(135deg, ${COLORS.softPink}, ${COLORS.cream})`,
            }}>✨</div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {discount && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em',
                padding: '5px 14px', borderRadius: 20,
                background: COLORS.roseGold, color: COLORS.warmWhite,
              }}>-{discount}%</span>
            )}
            {product.productType === 'digital' && (
              <span style={{
                fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '5px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.85)', color: COLORS.roseGold,
                backdropFilter: 'blur(8px)',
              }}>DIGITAL</span>
            )}
            {product.productType === 'service' && (
              <span style={{
                fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '5px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.85)', color: COLORS.gold,
                backdropFilter: 'blur(8px)',
              }}>SERVICE</span>
            )}
          </div>

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,250,247,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em',
              color: COLORS.roseGold, textTransform: 'uppercase',
            }}>Sold Out</div>
          )}
        </div>

        {/* Product info */}
        <div style={{ padding: '18px 20px 20px' }}>
          {product.category && (
            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: COLORS.roseGold, fontWeight: 600, margin: 0,
            }}>{product.category}</p>
          )}

          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400, fontSize: '1.05rem', color: '#4A3238',
            margin: '6px 0 10px', lineHeight: 1.35,
          }}>{product.displayName}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: '0.95rem', color: COLORS.roseGold, fontWeight: 500,
              letterSpacing: '0.02em',
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.8rem', color: COLORS.dustyRose,
                textDecoration: 'line-through', opacity: 0.6,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          {/* Add to routine button */}
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            style={{
              width: '100%', padding: '14px', marginTop: 16,
              background: isOutOfStock
                ? COLORS.softPink
                : `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.dustyRose})`,
              border: 'none', borderRadius: 50,
              color: isOutOfStock ? COLORS.dustyRose : COLORS.warmWhite,
              fontSize: '0.72rem', fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              opacity: isOutOfStock ? 0.5 : 1,
              transition: 'all 0.3s ease',
              boxShadow: isOutOfStock ? 'none' : '0 4px 16px rgba(183,110,121,0.25)',
            }}
            onMouseEnter={e => {
              if (!isOutOfStock) {
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(183,110,121,0.35)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 4px 16px rgba(183,110,121,0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            aria-label={`Add ${product.displayName} to routine`}
          >
            {isOutOfStock ? 'Sold Out' : '♡ Add to Routine'}
          </button>
        </div>
      </div>
    </Link>
  );
}

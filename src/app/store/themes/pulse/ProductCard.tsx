'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const typeIcon: Record<string, string> = {
  digital: '📥',
  physical: '📦',
  service: '⚡',
};

const typeLabel: Record<string, string> = {
  digital: 'Digital',
  physical: 'Physical',
  service: 'Service',
};

const typeColors: Record<string, { bg: string; text: string }> = {
  digital: { bg: '#FFF3E6', text: '#E85D04' },
  physical: { bg: '#FFF1E1', text: '#FF6B35' },
  service: { bg: '#FFF9DB', text: '#D4A017' },
};

export function PulseProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const tc = typeColors[product.productType] ?? typeColors.physical;

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
    <Link
      href={`/store/${storeSlug}/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: '#FFFAF5',
        borderRadius: 16,
        overflow: 'hidden',
        border: hovered ? '2px solid rgba(255,107,53,0.4)' : '2px solid rgba(255,107,53,0.1)',
        boxShadow: hovered
          ? '0 12px 40px rgba(255,107,53,0.15), 0 2px 8px rgba(247,201,72,0.1)'
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Image area */}
        <div style={{
          position: 'relative', height: 320, overflow: 'hidden',
          margin: 10, borderRadius: 12, background: '#FFF3E6',
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease, opacity 0.3s ease',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                opacity: hovered && product.images[1] ? 0.92 : 1,
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7C948 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '4rem',
            }}>🎨</div>
          )}

          {/* Product type badge */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            background: tc.bg, color: tc.text,
            padding: '5px 12px', borderRadius: 20,
            fontSize: '0.7rem', fontWeight: 700,
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,107,53,0.12)',
          }}>
            <span>{typeIcon[product.productType]}</span>
            <span>{typeLabel[product.productType]}</span>
          </div>

          {/* Discount badge */}
          {discount && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
              color: '#FFFFFF',
              padding: '5px 12px', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 800,
              boxShadow: '0 2px 12px rgba(255,107,53,0.4)',
            }}>
              -{discount}%
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(255,250,245,0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800,
              color: '#FF6B35', letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Sold Out
            </div>
          )}
        </div>

        {/* Info area */}
        <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {product.category && (
            <p style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#E85D04', margin: 0,
            }}>{product.category}</p>
          )}

          <p style={{
            fontWeight: 800, fontSize: '1.05rem', color: '#3D2B1F',
            margin: 0, lineHeight: 1.3,
            fontFamily: "'Outfit', sans-serif",
          }}>{product.displayName}</p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <span style={{
              fontSize: '1.2rem', fontWeight: 900, color: '#FF6B35',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.85rem', color: '#C0A080', textDecoration: 'line-through',
                fontWeight: 600,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* CTA button */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            onMouseEnter={() => { if (!isOutOfStock) setBtnHover(true); }}
            onMouseLeave={() => { if (!isOutOfStock) setBtnHover(false); }}
            style={{
              width: '100%', padding: '13px 0',
              background: isOutOfStock
                ? '#E8DFD5'
                : btnHover
                  ? '#FFFFFF'
                  : 'linear-gradient(135deg, #FF6B35, #F7C948)',
              color: isOutOfStock ? '#B5A898' : btnHover ? '#FF6B35' : '#FFFFFF',
              border: btnHover && !isOutOfStock ? '2px solid #FF6B35' : '2px solid transparent',
              borderRadius: 12,
              fontSize: '0.82rem', fontWeight: 800,
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: '0.04em',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: isOutOfStock ? 'none' : btnHover
                ? '0 6px 24px rgba(255,107,53,0.4)'
                : '0 4px 16px rgba(255,107,53,0.3)',
            }}
            aria-label={`Add ${product.displayName} to cart`}
          >
            {isOutOfStock ? 'Sold Out' : '🔥 Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}

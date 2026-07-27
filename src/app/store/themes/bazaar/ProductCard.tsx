'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

const poppins = "'Poppins', sans-serif";

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function BazaarProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const isLowStock = product.productType === 'physical' && product.stock > 0 && product.stock <= 5;
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
        background: '#FFFFFF',
        border: `2px solid ${hovered ? '#059669' : '#E5E7EB'}`,
        borderRadius: 14, overflow: 'hidden',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 28px rgba(5,150,105,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease',
        display: 'flex', flexDirection: 'column',
        fontFamily: poppins,
      }}>
        {/* Image area */}
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: '#ECFDF5' }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.3s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#059669' }}>🛍️</div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px',
                background: '#059669', color: '#FFFFFF', borderRadius: 8,
                lineHeight: 1, letterSpacing: '-0.02em',
              }}>Bestseller</span>
            )}
            {discount && (
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px',
                background: '#F97316', color: '#FFFFFF', borderRadius: 8,
                lineHeight: 1, letterSpacing: '-0.02em',
              }}>-{discount}%</span>
            )}
            {product.productType === 'digital' && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px',
                background: '#059669', color: '#FFFFFF', borderRadius: 8,
              }}>DIGITAL</span>
            )}
          </div>

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF',
                background: '#DC2626', padding: '6px 16px', borderRadius: 10,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>Sold Out</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {product.category && (
            <p style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              color: '#059669', margin: 0, letterSpacing: '0.06em',
            }}>{product.category}</p>
          )}

          <p style={{
            fontWeight: 700, fontSize: '0.9rem', color: '#064E3B',
            margin: 0, lineHeight: 1.3, display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{product.displayName}</p>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
            <span style={{
              fontSize: '1.25rem', fontWeight: 900, color: '#059669',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '0.8rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 500,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.productType === 'physical' && product.stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem' }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isLowStock ? '#F97316' : '#059669', display: 'inline-block',
              }} />
              <span style={{ color: isLowStock ? '#C2410C' : '#059669', fontWeight: 600 }}>
                {isLowStock ? `Only ${product.stock} left` : 'In Stock'}
              </span>
            </div>
          )}

          {/* Add to cart */}
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              style={{
                width: '100%', padding: '10px',
                background: isOutOfStock ? '#E5E7EB' : '#059669',
                color: isOutOfStock ? '#9CA3AF' : '#FFFFFF',
                border: 'none', borderRadius: 10,
                fontSize: '0.8rem', fontWeight: 800, cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                letterSpacing: '0.02em',
                fontFamily: poppins,
              }}
              onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.background = '#047857'; }}
              onMouseLeave={e => { if (!isOutOfStock) e.currentTarget.style.background = '#059669'; }}
              aria-label={`Add ${product.displayName} to cart`}
            >
              {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function SparkProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
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
        background: '#FFFFFF', borderRadius: 14,
        border: hovered ? '2px solid #7C3AED' : '2px solid rgba(45,27,105,0.06)',
        overflow: 'hidden',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 36px rgba(45,27,105,0.12)' : '0 2px 12px rgba(45,27,105,0.04)',
      }}>
        {/* Image area */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 260, background: '#FFF8EE',
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', color: '#C4B5D0' }}>✨</div>
          )}

          {/* Discount badge — gold */}
          {discount && (
            <span style={{
              position: 'absolute', top: 14, right: 14,
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em',
              padding: '5px 14px', borderRadius: 100,
              background: 'linear-gradient(135deg, #D97706, #F59E0B)',
              color: '#FFFFFF',
            }}>-{discount}%</span>
          )}

          {/* Service type badge — purple */}
          {product.productType !== 'physical' && (
            <span style={{
              position: 'absolute', top: 14, left: 14,
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '5px 14px', borderRadius: 100,
              background: 'rgba(45,27,105,0.88)', color: '#FFFFFF',
              backdropFilter: 'blur(4px)',
            }}>{product.productType === 'digital' ? '📥 Digital' : '🎓 Service'}</span>
          )}

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(45,27,105,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em',
              color: '#FFFFFF', textTransform: 'uppercase',
            }}>Sold Out</div>
          )}
        </div>

        {/* Text area */}
        <div style={{ padding: '18px 20px 6px' }}>
          {product.category && (
            <p style={{
              fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#7C3AED', fontWeight: 600, margin: 0,
            }}>{product.category}</p>
          )}
          <p style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontWeight: 700, fontSize: '1.05rem', color: '#2D1B69',
            margin: '6px 0 10px', lineHeight: 1.35,
          }}>{product.displayName}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '1.05rem', color: '#D97706', fontWeight: 700,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.82rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* CTA button — purple→gold gradient */}
        <div style={{ padding: '10px 20px 20px' }}>
          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            style={{
              width: '100%', padding: '13px',
              background: isOutOfStock ? 'transparent' : 'linear-gradient(135deg, #7C3AED 0%, #D97706 100%)',
              border: isOutOfStock ? '2px solid rgba(45,27,105,0.10)' : 'none',
              color: isOutOfStock ? '#9CA3AF' : '#FFFFFF',
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              borderRadius: 10,
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { if (!isOutOfStock) { e.currentTarget.style.opacity = '0.88'; }}}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            aria-label={`Add ${product.displayName} to cart`}
          >
            {isOutOfStock ? 'Sold Out' : 'Get Started'}
          </button>
        </div>
      </div>
    </Link>
  );
}

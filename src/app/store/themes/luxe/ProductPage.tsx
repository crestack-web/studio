'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function LuxeProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 5% 80px' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#606060', marginBottom: 40, display: 'flex', gap: 8 }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#C9A84C', textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span style={{ color: '#A89878' }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 64, alignItems: 'start' }}>
        {/* Full editorial image gallery */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '3/4', overflow: 'hidden',
            background: '#141414', position: 'relative',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#333' }}>📦</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 80, padding: 0, border: 'none', cursor: 'pointer',
                    opacity: i === activeImg ? 1 : 0.5,
                    transition: 'opacity 0.3s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info — editorial layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 24 }}>
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#C9A84C', fontWeight: 500, margin: 0,
          }}>{product.category}</p>

          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic', fontWeight: 400,
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            color: '#F5F5F0', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '1.5rem', color: '#C9A84C', fontWeight: 400, letterSpacing: '0.03em' }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontSize: '1rem', color: '#606060', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: '#C9A84C', color: '#0A0A0A',
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em',
                padding: '4px 14px',
              }}>-{discount}%</span>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#2A2A2A' }} />

          {product.description && (
            <p style={{ fontSize: '0.92rem', color: '#A89878', lineHeight: 1.75, fontWeight: 300 }}>
              {product.description}
            </p>
          )}

          {/* Stock */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#C9A84C', display: 'inline-block' }} />
              <span style={{ color: '#A89878' }}>
                {product.stock === 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'Available'}
              </span>
            </div>
          )}

          {product.productType === 'digital' && (
            <div style={{ padding: '14px 18px', background: '#141414', border: '1px solid #2A2A2A', fontSize: '0.85rem', color: '#A89878' }}>
              📥 Instant digital delivery after purchase
            </div>
          )}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 2, padding: '16px', background: isOutOfStock ? 'transparent' : added ? '#10B981' : '#C9A84C',
                color: isOutOfStock ? '#606060' : '#0A0A0A', border: isOutOfStock ? '1px solid #2A2A2A' : 'none',
                fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
              }}
              onMouseEnter={e => { if (!isOutOfStock && !added) { e.currentTarget.style.opacity = '0.88'; }}}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {isOutOfStock ? 'Sold Out' : added ? '✓ Added' : '+ Add to Bag'}
            </button>
          </div>

          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.68rem', letterSpacing: '0.06em', padding: '4px 12px',
                  border: '1px solid #2A2A2A', color: '#606060', textTransform: 'uppercase',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

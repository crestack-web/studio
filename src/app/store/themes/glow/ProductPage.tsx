'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

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

export function GlowProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id, displayName: product.displayName,
        price: product.price, imageUrl: product.images[0] ?? null,
        maxStock: product.productType === 'physical' ? product.stock : 999,
        productType: product.productType,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 5% 80px' }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.7rem', letterSpacing: '0.08em',
        color: COLORS.dustyRose, marginBottom: 40,
        display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: COLORS.roseGold, textDecoration: 'none' }}>Store</Link>
        <span style={{ color: COLORS.roseGoldLight }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: COLORS.roseGoldLight }}>/</span>
        <span style={{ color: COLORS.roseGold }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '3/4', overflow: 'hidden',
            borderRadius: 20, position: 'relative',
            background: COLORS.softPink,
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '5rem', color: COLORS.roseGoldLight,
                background: `linear-gradient(135deg, ${COLORS.softPink}, ${COLORS.cream})`,
              }}>✨</div>
            )}

            {/* Discount badge */}
            {discount && (
              <span style={{
                position: 'absolute', top: 16, left: 16,
                fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em',
                padding: '6px 16px', borderRadius: 20,
                background: COLORS.roseGold, color: COLORS.warmWhite,
              }}>-{discount}%</span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 80, padding: 0, border: 'none', cursor: 'pointer',
                    borderRadius: 12, overflow: 'hidden',
                    outline: i === activeImg ? `2px solid ${COLORS.roseGold}` : '2px solid transparent',
                    outlineOffset: 2,
                    opacity: i === activeImg ? 1 : 0.6,
                    transition: 'all 0.3s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 16 }}>
          {/* Category */}
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: COLORS.roseGold, fontWeight: 600, margin: 0,
          }}>{product.category}</p>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.7rem, 2.8vw, 2.4rem)',
            color: '#3D2228', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontSize: '1.5rem', color: COLORS.roseGold, fontWeight: 500,
              letterSpacing: '0.02em',
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontSize: '1rem', color: COLORS.dustyRose, textDecoration: 'line-through', opacity: 0.6 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(to right, ${COLORS.softPink}, transparent)` }} />

          {/* Description */}
          {product.description && (
            <p style={{
              fontSize: '0.92rem', color: COLORS.dustyRose, lineHeight: 1.8, fontWeight: 300,
            }}>{product.description}</p>
          )}

          {/* Stock */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: product.stock === 0 ? '#E88B8B' : product.stock <= 5 ? COLORS.gold : '#A8C5A0',
                display: 'inline-block',
              }} />
              <span style={{ color: COLORS.dustyRose }}>
                {product.stock === 0 ? 'Currently unavailable' : product.stock <= 5 ? `Only ${product.stock} left — grab yours` : 'In stock & ready to ship'}
              </span>
            </div>
          )}

          {/* Digital delivery */}
          {product.productType === 'digital' && (
            <div style={{
              padding: '14px 18px', borderRadius: 14,
              background: COLORS.softPink, border: `1px solid rgba(183,110,121,0.15)`,
              fontSize: '0.85rem', color: COLORS.roseGold,
            }}>
              ✨ Instant digital delivery after purchase
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: COLORS.cream, border: `1px solid rgba(212,165,116,0.2)`,
              fontSize: '0.8rem', color: COLORS.gold,
            }}>
              📦 {product.deliveryNote}
            </div>
          )}

          {/* Quantity + CTA */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'stretch' }}>
            {product.productType === 'physical' && !isOutOfStock && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                borderRadius: 50, overflow: 'hidden',
                border: `1px solid rgba(183,110,121,0.2)`,
                background: COLORS.warmWhite,
              }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 44, height: 48, border: 'none', background: 'transparent',
                    color: COLORS.roseGold, fontSize: '1.1rem', cursor: 'pointer',
                    fontWeight: 500, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.softPink; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >−</button>
                <span style={{
                  width: 40, textAlign: 'center', fontSize: '0.88rem',
                  color: '#3D2228', fontWeight: 500,
                }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{
                    width: 44, height: 48, border: 'none', background: 'transparent',
                    color: COLORS.roseGold, fontSize: '1.1rem', cursor: 'pointer',
                    fontWeight: 500, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.softPink; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >+</button>
              </div>
            )}

            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 2, padding: '16px 24px',
                background: isOutOfStock
                  ? COLORS.softPink
                  : added
                    ? '#A8C5A0'
                    : `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.dustyRose})`,
                border: 'none', borderRadius: 50,
                color: isOutOfStock ? COLORS.dustyRose : COLORS.warmWhite,
                fontSize: '0.72rem', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.5 : 1,
                transition: 'all 0.35s ease',
                boxShadow: isOutOfStock ? 'none' : '0 6px 24px rgba(183,110,121,0.25)',
              }}
              onMouseEnter={e => {
                if (!isOutOfStock && !added) {
                  e.currentTarget.style.boxShadow = '0 10px 36px rgba(183,110,121,0.35)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 6px 24px rgba(183,110,121,0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isOutOfStock ? 'Sold Out' : added ? '✓ Added to Routine' : '♡ Add to Routine'}
            </button>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.68rem', letterSpacing: '0.06em',
                  padding: '5px 14px', borderRadius: 20,
                  border: `1px solid rgba(183,110,121,0.25)`,
                  color: COLORS.roseGold, background: COLORS.warmWhite,
                  fontWeight: 500,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Care details */}
          <div style={{
            marginTop: 12, padding: '16px 20px', borderRadius: 16,
            background: `linear-gradient(135deg, ${COLORS.cream}, ${COLORS.softPink})`,
            border: `1px solid rgba(183,110,121,0.1)`,
          }}>
            <p style={{
              fontSize: '0.72rem', fontWeight: 600, color: COLORS.roseGold,
              letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px',
            }}>Beauty Notes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: COLORS.dustyRose }}>
                <span>🌸</span> Carefully curated for your wellness
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: COLORS.dustyRose }}>
                <span>✨</span> Premium quality ingredients & materials
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem', color: COLORS.dustyRose }}>
                <span>♡</span> Love-backed satisfaction guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import { EbookPreviewModal } from '@/app/store/components/EbookPreviewModal';
import type { ThemeProductPageProps } from '../types';

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

const INCLUDED_ITEMS = [
  'High-resolution digital file(s)',
  'Instant download after purchase',
  'Lifetime access — no subscriptions',
  'Commercial license included',
  'Free updates for 12 months',
];

export function VaultProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const isDigital = product.productType === 'digital';

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
    <div style={{
      maxWidth: 1200, margin: '0 auto', padding: '32px 5% 80px',
      background: 'transparent',
    }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.7rem', letterSpacing: '0.06em',
        color: C.muted, marginBottom: 40,
        display: 'flex', gap: 8, alignItems: 'center',
        fontFamily: "'Space Grotesk', sans-serif",
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: C.lightBlue, textDecoration: 'none' }}>Store</Link>
        <span style={{ color: C.surfaceLight }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: C.surfaceLight }}>/</span>
        <span style={{ color: C.white }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '3/4', overflow: 'hidden',
            borderRadius: 16, position: 'relative',
            background: C.navy,
            border: '1px solid rgba(59,130,246,0.1)',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '5rem', color: C.blue,
                background: `linear-gradient(135deg, ${C.surface}, ${C.navy})`,
              }}>📦</div>
            )}

            {/* Discount badge */}
            {discount && (
              <span style={{
                position: 'absolute', top: 16, left: 16,
                fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.06em',
                padding: '6px 14px', borderRadius: 8,
                background: `linear-gradient(135deg, ${C.blue}, #2563EB)`,
                color: '#FFFFFF',
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
                    borderRadius: 10, overflow: 'hidden',
                    outline: i === activeImg ? `2px solid ${C.blue}` : '2px solid transparent',
                    outlineOffset: 2,
                    opacity: i === activeImg ? 1 : 0.5,
                    transition: 'all 0.3s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
          {/* Category */}
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: C.lightBlue, fontWeight: 600, margin: 0,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>{product.category}</p>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(1.7rem, 2.8vw, 2.4rem)',
            color: C.white, lineHeight: 1.2, margin: 0,
            letterSpacing: '-0.02em',
          }}>{product.displayName}</h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.6rem', color: C.white, fontWeight: 700,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontSize: '1rem', color: C.muted, textDecoration: 'line-through', opacity: 0.6 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>

          {/* Digital delivery badge */}
          {isDigital && (
            <div style={{
              padding: '14px 18px', borderRadius: 10,
              background: 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.15)',
              fontSize: '0.82rem', color: C.lightBlue,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
            }}>
              ⚡ Instant Digital Delivery — download immediately after purchase
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.1)',
              fontSize: '0.78rem', color: C.muted,
            }}>
              📦 {product.deliveryNote}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(59,130,246,0.1)' }} />

          {/* Description */}
          {product.description && (
            <p style={{
              fontSize: '0.9rem', color: C.darkText, lineHeight: 1.8,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
            }}>{product.description}</p>
          )}

          {/* Preview button for digital products */}
          {isDigital && product.digitalFileUrl && (
            <button
              onClick={() => setPreviewOpen(true)}
              style={{
                padding: '12px 20px',
                background: 'transparent',
                border: `1px solid ${C.blue}`,
                borderRadius: 10,
                color: C.lightBlue,
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              👁 Preview Product
            </button>
          )}

          {/* Stock indicator */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#22C55E',
                display: 'inline-block',
              }} />
              <span style={{ color: C.muted, fontFamily: "'Space Grotesk', sans-serif" }}>
                {product.stock === 0 ? 'Currently unavailable' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock & ready to ship'}
              </span>
            </div>
          )}

          {/* Quantity selector + Add to cart */}
          <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'stretch' }}>
            {product.productType === 'physical' && !isOutOfStock && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                borderRadius: 10, overflow: 'hidden',
                border: '1px solid rgba(59,130,246,0.15)',
                background: C.surface,
              }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 44, height: 48, border: 'none', background: 'transparent',
                    color: C.lightBlue, fontSize: '1.1rem', cursor: 'pointer',
                    fontWeight: 500, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >−</button>
                <span style={{
                  width: 40, textAlign: 'center', fontSize: '0.88rem',
                  color: C.white, fontWeight: 600,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{
                    width: 44, height: 48, border: 'none', background: 'transparent',
                    color: C.lightBlue, fontSize: '1.1rem', cursor: 'pointer',
                    fontWeight: 500, transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >+</button>
              </div>
            )}

            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 2, padding: '16px 24px',
                background: isOutOfStock
                  ? C.surfaceLight
                  : added
                    ? '#22C55E'
                    : C.blue,
                border: 'none', borderRadius: 10,
                color: '#FFFFFF',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.78rem', fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.4 : 1,
                transition: 'all 0.35s ease',
                boxShadow: isOutOfStock ? 'none' : '0 6px 24px rgba(59,130,246,0.3)',
              }}
              onMouseEnter={e => {
                if (!isOutOfStock && !added) {
                  e.currentTarget.style.boxShadow = '0 10px 36px rgba(59,130,246,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 6px 24px rgba(59,130,246,0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isOutOfStock ? 'Sold Out' : added ? '✓ Added to Cart' : isDigital ? '📥 Get Instant Access' : '🛒 Add to Cart'}
            </button>
          </div>

          {/* What's included */}
          {isDigital && (
            <div style={{
              marginTop: 12, padding: '18px 20px', borderRadius: 12,
              background: C.surface,
              border: '1px solid rgba(59,130,246,0.08)',
            }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, color: C.lightBlue,
                letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>What&apos;s Included</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {INCLUDED_ITEMS.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.8rem', color: C.darkText,
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    <span style={{ color: C.blue, fontSize: '0.7rem' }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.65rem', letterSpacing: '0.04em',
                  padding: '5px 12px', borderRadius: 6,
                  border: '1px solid rgba(59,130,246,0.15)',
                  color: C.lightBlue,
                  background: 'rgba(59,130,246,0.05)',
                  fontWeight: 500,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {isDigital && product.digitalFileUrl && (
        <EbookPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileUrl={product.digitalFileUrl}
          title={product.displayName}
          accentColor={C.blue}
        />
      )}
    </div>
  );
}

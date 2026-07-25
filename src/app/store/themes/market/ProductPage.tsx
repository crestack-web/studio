'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function MarketProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const isLowStock = product.productType === 'physical' && product.stock > 0 && product.stock <= 5;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const maxQty = product.productType === 'physical' ? product.stock : 99;

  const handleAdd = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id, displayName: product.displayName,
        price: product.price, imageUrl: product.images[0] ?? null,
        maxStock: product.productType === 'physical' ? product.stock : 999,
        productType: product.productType,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 5% 80px' }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.75rem', fontWeight: 600, color: '#6B7280',
        marginBottom: 28, display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#EA580C', textDecoration: 'none' }}>Store</Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#374151' }}>{product.displayName}</span>
      </nav>

      {/* 2-column grid: info left, image right (desktop) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start',
      }}>
        {/* Product info — left side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: 1 }}>
          {/* Category */}
          {product.category && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              color: '#EA580C', letterSpacing: '0.08em',
            }}>{product.category}</span>
          )}

          {/* Product name — bold */}
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            color: '#111827', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          {/* Price block — prominent */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '16px 0', borderTop: '2px solid #F3F4F6', borderBottom: '2px solid #F3F4F6',
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, color: '#EA580C',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '1.1rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: '#F59E0B', color: '#FFFFFF',
                fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px',
                borderRadius: 6, letterSpacing: '-0.01em',
              }}>-{discount}% OFF</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.65, fontWeight: 500 }}>
              {product.description}
            </p>
          )}

          {/* Stock info */}
          {product.productType === 'physical' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600,
              padding: '10px 14px', borderRadius: 8,
              background: isOutOfStock ? '#FEF2F2' : isLowStock ? '#FFFBEB' : '#F0FDF4',
              border: `1px solid ${isOutOfStock ? '#FECACA' : isLowStock ? '#FDE68A' : '#BBF7D0'}`,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#16A34A',
              }} />
              <span style={{ color: isOutOfStock ? '#DC2626' : isLowStock ? '#B45309' : '#15803D' }}>
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left — order soon!` : `In Stock (${product.stock} available)`}
              </span>
            </div>
          )}

          {/* Digital delivery */}
          {product.productType === 'digital' && (
            <div style={{
              padding: '12px 14px', background: '#FFF7ED', border: '1px solid #FED7AA',
              borderRadius: 8, fontSize: '0.85rem', color: '#C2410C', fontWeight: 600,
            }}>
              ⚡ Instant digital delivery after purchase
            </div>
          )}

          {/* Quantity + Add to cart */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginTop: 8 }}>
              {/* Quantity selector */}
              <div style={{
                display: 'flex', alignItems: 'center', border: '2px solid #E5E7EB',
                borderRadius: 8, overflow: 'hidden', background: '#FFFFFF',
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 40, height: 48, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#374151', cursor: 'pointer',
                  }}>-</button>
                <span style={{
                  width: 40, textAlign: 'center', fontSize: '1rem', fontWeight: 800,
                  color: '#111827', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48,
                }}>{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  style={{
                    width: 40, height: 48, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#374151', cursor: 'pointer',
                  }}>+</button>
              </div>

              {/* Add to cart button */}
              <button onClick={handleAdd}
                style={{
                  flex: 1, padding: '0 24px', height: 48,
                  background: added ? '#16A34A' : '#EA580C',
                  color: '#FFFFFF', border: 'none', borderRadius: 8,
                  fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.02em', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#C2410C'; }}
                onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#EA580C'; }}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* Delivery info */}
          {product.deliveryNote && (
            <div style={{
              fontSize: '0.82rem', color: '#6B7280', padding: '10px 14px',
              background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6',
              fontWeight: 500,
            }}>
              🚚 {product.deliveryNote}
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px',
                  background: '#FFF7ED', color: '#EA580C', borderRadius: 6,
                  border: '1px solid #FED7AA',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Image gallery — right side */}
        <div style={{ order: 2 }}>
          <div style={{
            width: '100%', aspectRatio: '1', overflow: 'hidden',
            background: '#FFF7ED', borderRadius: 12, border: '2px solid #F3F4F6',
            position: 'relative',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#EA580C' }}>🛒</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 72, padding: 0, cursor: 'pointer',
                    border: i === activeImg ? '2px solid #EA580C' : '2px solid #E5E7EB',
                    borderRadius: 8, overflow: 'hidden',
                    opacity: i === activeImg ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products placeholder */}
      <div style={{ marginTop: 64, padding: '32px 0', borderTop: '2px solid #F3F4F6' }}>
        <h2 style={{
          fontWeight: 900, fontSize: '1.4rem', color: '#111827', margin: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: '#EA580C' }}>🔥</span> You Might Also Like
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
          More great deals in {product.category}
        </p>
      </div>
    </div>
  );
}

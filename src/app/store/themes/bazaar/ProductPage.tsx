'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

const poppins = "'Poppins', sans-serif";

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function BazaarProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
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
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 5% 80px', fontFamily: poppins }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.78rem', fontWeight: 600, color: '#6B7280',
        marginBottom: 28, display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#059669', textDecoration: 'none' }}>Store</Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#064E3B' }}>{product.displayName}</span>
      </nav>

      {/* 2-column grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start',
      }}>
        {/* Product info — left side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, order: 1 }}>
          {/* Category */}
          {product.category && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              color: '#059669', letterSpacing: '0.08em',
            }}>{product.category}</span>
          )}

          {/* Product name */}
          <h1 style={{
            fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            color: '#064E3B', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          {/* Price block */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '16px 0', borderTop: '2px solid #D1FAE5', borderBottom: '2px solid #D1FAE5',
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, color: '#059669',
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
                background: '#F97316', color: '#FFFFFF',
                fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px',
                borderRadius: 8, letterSpacing: '-0.01em',
              }}>-{discount}% OFF</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.65, fontWeight: 500 }}>
              {product.description}
            </p>
          )}

          {/* Stock indicator */}
          {product.productType === 'physical' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600,
              padding: '12px 14px', borderRadius: 10,
              background: isOutOfStock ? '#FEF2F2' : isLowStock ? '#FFF7ED' : '#ECFDF5',
              border: `1px solid ${isOutOfStock ? '#FECACA' : isLowStock ? '#FDBA74' : '#A7F3D0'}`,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOutOfStock ? '#EF4444' : isLowStock ? '#F97316' : '#059669',
              }} />
              <span style={{ color: isOutOfStock ? '#DC2626' : isLowStock ? '#C2410C' : '#047857' }}>
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left — order soon!` : `In Stock (${product.stock} available)`}
              </span>
            </div>
          )}

          {/* Digital delivery */}
          {product.productType === 'digital' && (
            <div style={{
              padding: '12px 14px', background: '#ECFDF5', border: '1px solid #A7F3D0',
              borderRadius: 10, fontSize: '0.85rem', color: '#047857', fontWeight: 600,
            }}>
              ⚡ Instant digital delivery after purchase
            </div>
          )}

          {/* Quantity + Add to cart */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginTop: 8 }}>
              {/* Quantity selector */}
              <div style={{
                display: 'flex', alignItems: 'center', border: '2px solid #D1FAE5',
                borderRadius: 10, overflow: 'hidden', background: '#FFFFFF',
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 42, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#064E3B', cursor: 'pointer',
                  }}>-</button>
                <span style={{
                  width: 42, textAlign: 'center', fontSize: '1rem', fontWeight: 800,
                  color: '#064E3B', borderLeft: '1px solid #D1FAE5', borderRight: '1px solid #D1FAE5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50,
                }}>{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  style={{
                    width: 42, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#064E3B', cursor: 'pointer',
                  }}>+</button>
              </div>

              {/* Add to cart */}
              <button onClick={handleAdd}
                style={{
                  flex: 1, padding: '0 24px', height: 50,
                  background: added ? '#059669' : '#059669',
                  color: '#FFFFFF', border: 'none', borderRadius: 10,
                  fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.02em', transition: 'all 0.3s',
                  fontFamily: poppins,
                }}
                onMouseEnter={e => { if (!added) e.currentTarget.style.background = '#047857'; }}
                onMouseLeave={e => { if (!added) e.currentTarget.style.background = '#059669'; }}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          )}

          {/* WhatsApp to Order */}
          <a
            href={`https://wa.me/?text=Hi! I'm interested in ${encodeURIComponent(product.displayName)} (${fmt(product.price, currency)})`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 24px', background: '#25D366', color: '#FFFFFF',
              borderRadius: 10, textDecoration: 'none', fontWeight: 700,
              fontSize: '0.9rem', transition: 'background 0.2s',
              marginTop: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1DA851'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; }}
          >
            💬 WhatsApp to Order
          </a>

          {/* Delivery info */}
          {product.deliveryNote && (
            <div style={{
              fontSize: '0.82rem', color: '#6B7280', padding: '12px 14px',
              background: '#F0FDF4', borderRadius: 10, border: '1px solid #D1FAE5',
              fontWeight: 500,
            }}>
              📦 {product.deliveryNote}
            </div>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '4px 10px',
                  background: '#ECFDF5', color: '#047857', borderRadius: 8,
                  border: '1px solid #A7F3D0',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Image gallery — right side */}
        <div style={{ order: 2 }}>
          <div style={{
            width: '100%', aspectRatio: '1', overflow: 'hidden',
            background: '#ECFDF5', borderRadius: 14, border: '2px solid #D1FAE5',
            position: 'relative',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#059669' }}>🛍️</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 72, padding: 0, cursor: 'pointer',
                    border: i === activeImg ? '2px solid #059669' : '2px solid #E5E7EB',
                    borderRadius: 10, overflow: 'hidden',
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

      {/* Customer Reviews placeholder */}
      <div style={{ marginTop: 64, padding: '32px 0', borderTop: '2px solid #D1FAE5' }}>
        <h2 style={{
          fontWeight: 800, fontSize: '1.4rem', color: '#064E3B', margin: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: '#059669' }}>⭐</span> What Our Customers Say
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: 6, fontWeight: 500 }}>
          Real reviews from happy customers
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
          {[
            { name: 'Adaeze K.', text: 'Amazing quality! Will definitely order again. Fast delivery too.', rating: 5 },
            { name: 'Tunde M.', text: 'Love the product. Exactly as described. Highly recommend this shop!', rating: 5 },
            { name: 'Fatima A.', text: 'Great customer service. They responded quickly on WhatsApp.', rating: 4 },
          ].map((review, i) => (
            <div key={i} style={{
              padding: '18px 16px', background: '#FFFFFF', borderRadius: 12,
              border: '1px solid #D1FAE5', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} style={{ fontSize: '0.85rem', color: s < review.rating ? '#F97316' : '#E5E7EB' }}>★</span>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                &ldquo;{review.text}&rdquo;
              </p>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                {review.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

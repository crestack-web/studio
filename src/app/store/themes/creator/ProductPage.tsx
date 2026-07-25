'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const typeConfig: Record<string, { icon: string; label: string; gradient: string }> = {
  digital: { icon: '📥', label: 'Digital Product', gradient: 'linear-gradient(135deg, #7C3AED, #6D28D9)' },
  physical: { icon: '📦', label: 'Physical Product', gradient: 'linear-gradient(135deg, #EC4899, #DB2777)' },
  service: { icon: '⚡', label: 'Service', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
};

const tagColors = [
  { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
  { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#DBEAFE', text: '#2563EB', border: '#BFDBFE' },
  { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
];

export function CreatorProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const isLowStock = product.productType === 'physical' && product.stock > 0 && product.stock <= 5;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const maxQty = product.productType === 'physical' ? product.stock : 99;
  const tc = typeConfig[product.productType] ?? typeConfig.physical;

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
        fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF',
        marginBottom: 24, display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#7C3AED', textDecoration: 'none' }}>Store</Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#4B5563' }}>{product.displayName}</span>
      </nav>

      {/* Product type banner */}
      <div style={{
        background: tc.gradient,
        color: '#FFFFFF',
        padding: '10px 20px', borderRadius: 12,
        fontSize: '0.8rem', fontWeight: 800,
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 28,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      }}>
        <span style={{ fontSize: '1.1rem' }}>{tc.icon}</span>
        <span>{tc.label}</span>
      </div>

      {/* 2-column grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start',
      }}>
        {/* Image gallery — left */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '1', overflow: 'hidden',
            background: '#F5F3FF', borderRadius: 16,
            border: '2px solid #EDE9FE',
            position: 'relative',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '5rem',
              }}>🎨</div>
            )}

            {/* Discount ribbon */}
            {discount && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                color: '#FFFFFF', padding: '6px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 800,
                boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
              }}>
                -{discount}% OFF
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 72, padding: 0, cursor: 'pointer',
                    border: i === activeImg ? '2px solid #7C3AED' : '2px solid #EDE9FE',
                    borderRadius: 10, overflow: 'hidden',
                    opacity: i === activeImg ? 1 : 0.6,
                    transition: 'all 0.25s',
                    boxShadow: i === activeImg ? '0 2px 8px rgba(124,58,237,0.25)' : 'none',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info — right */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 18,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16, padding: 28,
          border: '1px solid #EDE9FE',
        }}>
          {/* Category */}
          {product.category && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#A78BFA',
            }}>{product.category}</span>
          )}

          {/* Name */}
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            color: '#1E1B4B', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          {/* Price block */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '14px 0',
            borderTop: '1px solid #EDE9FE', borderBottom: '1px solid #EDE9FE',
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, color: '#7C3AED',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '1.1rem', color: '#9CA3AF',
                textDecoration: 'line-through', fontWeight: 600,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800,
                padding: '4px 14px', borderRadius: 20,
              }}>-{discount}%</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{
              fontSize: '0.95rem', color: '#4B5563', lineHeight: 1.65, fontWeight: 500,
            }}>{product.description}</p>
          )}

          {/* Stock indicator */}
          {product.productType === 'physical' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem',
              fontWeight: 700, padding: '10px 14px', borderRadius: 10,
              background: isOutOfStock ? '#FEF2F2' : isLowStock ? '#FFFBEB' : '#F0FDF4',
              border: `1px solid ${isOutOfStock ? '#FECACA' : isLowStock ? '#FDE68A' : '#BBF7D0'}`,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#16A34A',
              }} />
              <span style={{
                color: isOutOfStock ? '#DC2626' : isLowStock ? '#B45309' : '#15803D',
              }}>
                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stock} left!` : `In Stock (${product.stock} available)`}
              </span>
            </div>
          )}

          {/* Digital delivery */}
          {product.productType === 'digital' && (
            <div style={{
              padding: '12px 16px', background: '#F5F3FF',
              border: '1px solid #EDE9FE', borderRadius: 10,
              fontSize: '0.85rem', color: '#7C3AED', fontWeight: 700,
            }}>
              📥 Instant digital delivery after purchase
            </div>
          )}

          {/* Service info */}
          {product.productType === 'service' && (
            <div style={{
              padding: '12px 16px', background: '#FFFBEB',
              border: '1px solid #FDE68A', borderRadius: 10,
              fontSize: '0.85rem', color: '#D97706', fontWeight: 700,
            }}>
              ⚡ Service — details will be shared after purchase
            </div>
          )}

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginTop: 4 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '2px solid #EDE9FE', borderRadius: 12,
                overflow: 'hidden', background: '#FFFFFF',
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 44, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >−</button>
                <span style={{
                  width: 48, textAlign: 'center', fontSize: '1.05rem', fontWeight: 900,
                  color: '#1E1B4B', borderLeft: '1px solid #EDE9FE',
                  borderRight: '1px solid #EDE9FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50,
                }}>{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  style={{
                    width: 44, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >+</button>
              </div>

              <button onClick={handleAdd}
                style={{
                  flex: 1, padding: '0 24px', height: 50,
                  background: added ? '#10B981' : 'linear-gradient(135deg, #7C3AED, #EC4899)',
                  color: '#FFFFFF', border: 'none', borderRadius: 12,
                  fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                  letterSpacing: '0.02em', transition: 'all 0.3s',
                  boxShadow: added ? '0 2px 12px rgba(16,185,129,0.3)' : '0 4px 16px rgba(124,58,237,0.3)',
                }}
                onMouseEnter={e => {
                  if (!added) {
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.45)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = added ? '0 2px 12px rgba(16,185,129,0.3)' : '0 4px 16px rgba(124,58,237,0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {added ? '✓ Added!' : '✨ Add to Cart'}
              </button>
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <div style={{
              fontSize: '0.82rem', color: '#6B7280', padding: '10px 14px',
              background: '#FAFAFE', borderRadius: 10, border: '1px solid #F3F4F6',
              fontWeight: 500,
            }}>
              🚚 {product.deliveryNote}
            </div>
          )}

          {/* Tags as colorful pills */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {product.tags.map((tag, idx) => {
                const c = tagColors[idx % tagColors.length];
                return (
                  <span key={tag} style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '5px 12px',
                    background: c.bg, color: c.text, borderRadius: 20,
                    border: `1px solid ${c.border}`,
                  }}>{tag}</span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Related products section */}
      <div style={{
        marginTop: 64, padding: '32px 0',
        borderTop: '2px solid #EDE9FE',
      }}>
        <h2 style={{
          fontWeight: 900, fontSize: '1.4rem', color: '#1E1B4B', margin: 0,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🎨</span> You Might Also Love
        </h2>
        <p style={{
          fontSize: '0.85rem', color: '#9CA3AF', marginTop: 6, fontWeight: 600,
        }}>
          More from {product.category}
        </p>
      </div>
    </div>
  );
}

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

const typeConfig: Record<string, { icon: string; label: string; gradient: string }> = {
  digital: { icon: '📥', label: 'Digital Product', gradient: 'linear-gradient(135deg, #FF6B35, #E85D04)' },
  physical: { icon: '📦', label: 'Physical Product', gradient: 'linear-gradient(135deg, #FF6B35, #D4A017)' },
  service: { icon: '⚡', label: 'Service', gradient: 'linear-gradient(135deg, #F7C948, #D4A017)' },
};

const tagColors = [
  { bg: '#FFF3E6', text: '#E85D04', border: '#FFD9B3' },
  { bg: '#FFF9DB', text: '#D4A017', border: '#FDE68A' },
  { bg: '#FFE8D6', text: '#FF6B35', border: '#FFD0B0' },
  { bg: '#FFF0E0', text: '#CC5500', border: '#FFD6B0' },
  { bg: '#FFFBE6', text: '#B8960F', border: '#F5E6A3' },
];

export function PulseProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
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
        fontSize: '0.75rem', fontWeight: 600, color: '#B5A898',
        marginBottom: 24, display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#FF6B35', textDecoration: 'none' }}>Store</Link>
        <span style={{ color: '#D6CCC0' }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: '#D6CCC0' }}>/</span>
        <span style={{ color: '#6B5B4E' }}>{product.displayName}</span>
      </nav>

      {/* Product type banner */}
      <div style={{
        background: tc.gradient,
        color: '#FFFFFF',
        padding: '10px 20px', borderRadius: 12,
        fontSize: '0.8rem', fontWeight: 800,
        fontFamily: "'Outfit', sans-serif",
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 28,
        boxShadow: '0 2px 12px rgba(255,107,53,0.2)',
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
            background: '#FFF3E6', borderRadius: 16,
            border: '2px solid rgba(255,107,53,0.12)',
            position: 'relative',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7C948 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '5rem',
              }}>🎨</div>
            )}

            {/* Discount ribbon */}
            {discount && (
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
                color: '#FFFFFF', padding: '6px 16px', borderRadius: 20,
                fontSize: '0.75rem', fontWeight: 800,
                boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
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
                    border: i === activeImg ? '2px solid #FF6B35' : '2px solid rgba(255,107,53,0.12)',
                    borderRadius: 10, overflow: 'hidden',
                    opacity: i === activeImg ? 1 : 0.6,
                    transition: 'all 0.25s',
                    boxShadow: i === activeImg ? '0 2px 8px rgba(255,107,53,0.25)' : 'none',
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
          background: '#FFFAF5',
          borderRadius: 16, padding: 28,
          border: '1px solid rgba(255,107,53,0.12)',
        }}>
          {/* Category */}
          {product.category && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#E85D04',
            }}>{product.category}</span>
          )}

          {/* Name */}
          <h1 style={{
            fontWeight: 900, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            color: '#3D2B1F', lineHeight: 1.2, margin: 0,
            fontFamily: "'Outfit', sans-serif",
          }}>{product.displayName}</h1>

          {/* Price block */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '14px 0',
            borderTop: '1px solid rgba(255,107,53,0.12)',
            borderBottom: '1px solid rgba(255,107,53,0.12)',
          }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, color: '#FF6B35',
              letterSpacing: '-0.02em', lineHeight: 1,
              fontFamily: "'Outfit', sans-serif",
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{
                fontSize: '1.1rem', color: '#B5A898',
                textDecoration: 'line-through', fontWeight: 600,
              }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
                color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800,
                padding: '4px 14px', borderRadius: 20,
              }}>-{discount}%</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{
              fontSize: '0.95rem', color: '#6B5B4E', lineHeight: 1.65, fontWeight: 500,
            }}>{product.description}</p>
          )}

          {/* Stock indicator */}
          {product.productType === 'physical' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem',
              fontWeight: 700, padding: '10px 14px', borderRadius: 10,
              background: isOutOfStock ? '#FFF0F0' : isLowStock ? '#FFFBE6' : '#F0FFF4',
              border: `1px solid ${isOutOfStock ? '#FFD0D0' : isLowStock ? '#FDE68A' : '#C6F6D5'}`,
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '12px 16px', background: '#FFF3E6',
                border: '1px solid rgba(255,107,53,0.15)', borderRadius: 10,
                fontSize: '0.85rem', color: '#E85D04', fontWeight: 700,
              }}>
                📥 Instant digital delivery after purchase
              </div>
              {product.digitalFileUrl && (
                <button
                  onClick={() => setShowPreview(true)}
                  style={{
                    padding: '10px 16px', background: 'transparent',
                    border: '1.5px solid #FF6B35', borderRadius: 10,
                    color: '#FF6B35', fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FF6B35'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF6B35'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Preview this ebook
                </button>
              )}
            </div>
          )}

          {/* Service info */}
          {product.productType === 'service' && (
            <div style={{
              padding: '12px 16px', background: '#FFF9DB',
              border: '1px solid #FDE68A', borderRadius: 10,
              fontSize: '0.85rem', color: '#D4A017', fontWeight: 700,
            }}>
              ⚡ Service — details will be shared after purchase
            </div>
          )}

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginTop: 4 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '2px solid rgba(255,107,53,0.12)', borderRadius: 12,
                overflow: 'hidden', background: '#FFFFFF',
              }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  style={{
                    width: 44, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.2rem', fontWeight: 800, color: '#FF6B35',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF3E6'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >−</button>
                <span style={{
                  width: 48, textAlign: 'center', fontSize: '1.05rem', fontWeight: 900,
                  color: '#3D2B1F', borderLeft: '1px solid rgba(255,107,53,0.12)',
                  borderRight: '1px solid rgba(255,107,53,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 50,
                }}>{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  style={{
                    width: 44, height: 50, border: 'none', background: 'transparent',
                    fontSize: '1.2rem', fontWeight: 800, color: '#FF6B35',
                    cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FFF3E6'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >+</button>
              </div>

              <button onClick={handleAdd}
                onMouseEnter={() => { if (!added) setBtnHover(true); }}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  flex: 1, padding: '0 24px', height: 50,
                  background: added ? '#10B981'
                    : btnHover ? '#FFFFFF' : 'linear-gradient(135deg, #FF6B35, #F7C948)',
                  color: added ? '#FFFFFF' : btnHover ? '#FF6B35' : '#FFFFFF',
                  border: btnHover && !added ? '2px solid #FF6B35' : '2px solid transparent',
                  borderRadius: 12,
                  fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'Outfit', sans-serif",
                  letterSpacing: '0.02em', transition: 'all 0.3s',
                  boxShadow: added ? '0 2px 12px rgba(16,185,129,0.3)'
                    : btnHover ? '0 6px 24px rgba(255,107,53,0.4)' : '0 4px 16px rgba(255,107,53,0.3)',
                }}
              >
                {added ? '✓ Added!' : '🔥 Add to Cart'}
              </button>
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <div style={{
              fontSize: '0.82rem', color: '#8B7355', padding: '10px 14px',
              background: '#FFF9F0', borderRadius: 10, border: '1px solid rgba(255,107,53,0.08)',
              fontWeight: 500,
            }}>
              🚚 {product.deliveryNote}
            </div>
          )}

          {/* Tags as warm pills */}
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
        borderTop: '2px solid rgba(255,107,53,0.1)',
      }}>
        <h2 style={{
          fontWeight: 900, fontSize: '1.4rem', color: '#3D2B1F', margin: 0,
          fontFamily: "'Outfit', sans-serif",
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>🔥</span> You Might Also Love
        </h2>
        <p style={{
          fontSize: '0.85rem', color: '#B5A898', marginTop: 6, fontWeight: 600,
        }}>
          More from {product.category}
        </p>
      </div>

      {/* Ebook preview modal */}
      {product.productType === 'digital' && product.digitalFileUrl && (
        <EbookPreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          fileUrl={product.digitalFileUrl}
          title={product.displayName}
          accentColor="#FF6B35"
        />
      )}
    </div>
  );
}

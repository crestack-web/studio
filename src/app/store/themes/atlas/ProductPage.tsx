'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductPageProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

const C = {
  slate: '#1E293B',
  slateMuted: '#64748B',
  slateLight: '#94A3B8',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealPale: '#CCFBF1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  tealBg: 'rgba(13,148,136,0.06)',
  tealBorder: 'rgba(13,148,136,0.2)',
};

const INCLUDED_ITEMS = [
  'Initial consultation & briefing',
  'Two rounds of revisions',
  'Final deliverables in all formats',
  '30-day post-project support',
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'CEO, TechStart', quote: 'Exceptional quality and attention to detail. Truly a professional experience from start to finish.', rating: 5 },
  { name: 'James K.', role: 'Founder, Bloom Co.', quote: 'Delivered beyond expectations. The process was smooth and the results speak for themselves.', rating: 5 },
];

export function AtlasProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const isService = product.productType === 'service';
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
    setTimeout(() => {
      setAdded(false);
      router.push(`/store/${storeSlug}/cart`);
    }, 1200);
  };

  const serviceLabel = isService ? 'SERVICE'
    : product.productType === 'digital' ? 'DIGITAL'
    : null;

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '32px 5% 80px' }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.68rem', letterSpacing: '0.06em',
        color: C.slateLight, marginBottom: 40,
        display: 'flex', gap: 8, alignItems: 'center',
        fontFamily: "'Manrope', sans-serif",
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: C.teal, textDecoration: 'none', fontWeight: 600 }}>Store</Link>
        <span style={{ color: C.border }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: C.border }}>/</span>
        <span style={{ color: C.slate }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '4/5', overflow: 'hidden',
            borderRadius: 14, position: 'relative',
            background: C.bg, border: `1px solid ${C.border}`,
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '4.5rem', color: C.tealLight,
                background: `linear-gradient(135deg, ${C.tealPale}, ${C.bg})`,
              }}>✦</div>
            )}

            {discount && (
              <span style={{
                position: 'absolute', top: 14, left: 14,
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                padding: '5px 14px', borderRadius: 6,
                background: C.teal, color: C.white,
                fontFamily: "'Manrope', sans-serif",
              }}>-{discount}%</span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 72, padding: 0, border: 'none', cursor: 'pointer',
                    borderRadius: 10, overflow: 'hidden',
                    outline: i === activeImg ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                    outlineOffset: 2,
                    opacity: i === activeImg ? 1 : 0.55,
                    transition: 'all 0.25s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
          {/* Category + service badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{
              fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: C.teal, fontWeight: 700, margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}>{product.category}</p>
            {serviceLabel && (
              <span style={{
                fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em',
                padding: '3px 10px', borderRadius: 4,
                background: C.tealPale, color: C.teal,
                fontFamily: "'Manrope', sans-serif",
              }}>{serviceLabel}</span>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)',
            color: C.slate, lineHeight: 1.2, margin: 0,
            letterSpacing: '-0.01em',
          }}>{product.displayName}</h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1.5rem', color: C.teal, fontWeight: 700,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.95rem', color: C.slateLight, textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
                padding: '3px 10px', borderRadius: 4,
                background: C.tealPale, color: C.teal,
                fontFamily: "'Manrope', sans-serif",
              }}>SAVE {discount}%</span>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.border }} />

          {/* Description */}
          {product.description && (
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.9rem', color: C.slateMuted, lineHeight: 1.75, fontWeight: 400,
            }}>{product.description}</p>
          )}

          {/* Service availability / Stock */}
          {isService && (
            <div style={{
              padding: '14px 18px', borderRadius: 10,
              background: C.tealBg, border: `1px solid ${C.tealBorder}`,
              fontSize: '0.82rem', color: C.teal,
              fontFamily: "'Manrope', sans-serif", fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, display: 'inline-block', flexShrink: 0 }} />
              Available for booking — typically responds within 24 hours
            </div>
          )}

          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontFamily: "'Manrope', sans-serif" }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : C.teal,
                display: 'inline-block',
              }} />
              <span style={{ color: C.slateMuted }}>
                {product.stock === 0 ? 'Currently unavailable' : product.stock <= 5 ? `Only ${product.stock} remaining` : 'In stock & ready to ship'}
              </span>
            </div>
          )}

          {product.productType === 'digital' && (
            <div style={{
              padding: '14px 18px', borderRadius: 10,
              background: C.tealBg, border: `1px solid ${C.tealBorder}`,
              fontSize: '0.82rem', color: C.teal,
              fontFamily: "'Manrope', sans-serif", fontWeight: 500,
            }}>
              Instant digital delivery after purchase
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: C.bg, border: `1px solid ${C.border}`,
              fontSize: '0.78rem', color: C.slateMuted,
              fontFamily: "'Manrope', sans-serif",
            }}>
              {product.deliveryNote}
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'stretch' }}>
            {product.productType === 'physical' && !isOutOfStock && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                borderRadius: 10, overflow: 'hidden',
                border: `1px solid ${C.border}`,
                background: C.white,
              }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 40, height: 48, border: 'none', background: 'transparent',
                    color: C.slateMuted, fontSize: '1rem', cursor: 'pointer',
                    fontWeight: 600, transition: 'background 0.2s',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >−</button>
                <span style={{
                  width: 36, textAlign: 'center', fontSize: '0.88rem',
                  color: C.slate, fontWeight: 600,
                  fontFamily: "'Manrope', sans-serif",
                }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{
                    width: 40, height: 48, border: 'none', background: 'transparent',
                    color: C.slateMuted, fontSize: '1rem', cursor: 'pointer',
                    fontWeight: 600, transition: 'background 0.2s',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >+</button>
              </div>
            )}

            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 2, padding: '16px 24px',
                background: isOutOfStock
                  ? C.bg
                  : added
                    ? '#059669'
                    : C.teal,
                border: `1px solid ${isOutOfStock ? C.border : added ? '#059669' : C.teal}`,
                borderRadius: 10,
                color: isOutOfStock ? C.slateMuted : C.white,
                fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                opacity: isOutOfStock ? 0.5 : 1,
                transition: 'all 0.3s ease',
                fontFamily: "'Manrope', sans-serif",
                boxShadow: isOutOfStock ? 'none' : '0 2px 12px rgba(13,148,136,0.25)',
              }}
              onMouseEnter={e => {
                if (!isOutOfStock && !added) {
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(13,148,136,0.35)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = isOutOfStock ? 'none' : '0 2px 12px rgba(13,148,136,0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isOutOfStock ? 'Unavailable' : added ? '✓ Added to Cart' : isService ? 'Book Now' : 'Add to Cart'}
            </button>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.64rem', letterSpacing: '0.06em',
                  padding: '4px 12px', borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  color: C.slateMuted, background: C.white,
                  fontWeight: 500,
                  fontFamily: "'Manrope', sans-serif",
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* What's Included — service only */}
          {isService && (
            <div style={{
              marginTop: 10, padding: '18px 20px', borderRadius: 12,
              background: C.bg, border: `1px solid ${C.border}`,
            }}>
              <p style={{
                fontSize: '0.68rem', fontWeight: 700, color: C.teal,
                letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
                fontFamily: "'Manrope', sans-serif",
              }}>What&apos;s Included</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {INCLUDED_ITEMS.map(item => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: '0.82rem', color: C.slateMuted,
                    fontFamily: "'Manrope', sans-serif",
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: C.tealPale, color: C.teal,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                    }}>✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Testimonials section */}
      <div style={{ marginTop: 72 }}>
        <p style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: C.teal, marginBottom: 8,
          fontFamily: "'Manrope', sans-serif",
        }}>Client Feedback</p>
        <h2 style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700, fontSize: '1.4rem', color: C.slate,
          margin: '0 0 28px',
        }}>What Clients Say</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{
              padding: '24px', borderRadius: 12,
              background: C.white, border: `1px solid ${C.border}`,
              boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} style={{ color: '#F59E0B', fontSize: '0.85rem' }}>★</span>
                ))}
              </div>
              <p style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.88rem', color: C.slateMuted, lineHeight: 1.65,
                margin: '0 0 16px', fontWeight: 400,
              }}>&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '0.78rem', fontWeight: 600, color: C.slate, margin: 0,
                }}>{t.name}</p>
                <p style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: '0.7rem', color: C.slateLight, margin: '2px 0 0',
                }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

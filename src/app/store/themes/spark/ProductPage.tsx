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

export function SparkProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem, openCart } = useCart();
  const router = useRouter();
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

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
    });
    openCart();
  };

  const checklistItems = [
    'Expert guidance and personalized strategy',
    'Step-by-step actionable framework',
    'Lifetime access to all course materials',
    'Private community access',
    'Certificate of completion',
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 5% 80px', background: '#FFF8EE', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <nav style={{
        fontFamily: "'Raleway', Georgia, serif",
        fontSize: '0.72rem', letterSpacing: '0.08em', color: '#9CA3AF',
        marginBottom: 36, display: 'flex', gap: 8, alignItems: 'center',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>Store</Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span>{product.category}</span>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ color: '#2D1B69', fontWeight: 600 }}>{product.displayName}</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 56, alignItems: 'start' }}>
        {/* Image gallery */}
        <div>
          <div style={{
            width: '100%', aspectRatio: '4/5', overflow: 'hidden',
            background: '#FFFFFF', position: 'relative', borderRadius: 14,
            border: '2px solid rgba(45,27,105,0.06)',
          }}>
            {product.images[activeImg] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImg]} alt={product.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', color: '#C4B5D0' }}>✨</div>
            )}
            {/* Discount ribbon */}
            {discount && (
              <span style={{
                position: 'absolute', top: 16, right: 16,
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                padding: '6px 18px', borderRadius: 100,
                background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                color: '#FFFFFF',
              }}>-{discount}% OFF</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  style={{
                    flex: 1, height: 80, padding: 0, border: i === activeImg ? '2px solid #7C3AED' : '2px solid rgba(45,27,105,0.06)',
                    borderRadius: 10, cursor: 'pointer', overflow: 'hidden',
                    opacity: i === activeImg ? 1 : 0.6,
                    transition: 'all 0.3s',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 12 }}>
          {/* Category */}
          <p style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#7C3AED', fontWeight: 700, margin: 0,
          }}>{product.category}</p>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontWeight: 700, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
            color: '#2D1B69', lineHeight: 1.2, margin: 0,
          }}>{product.displayName}</h1>

          {/* Price block with gold accent */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 20px', background: '#FFFFFF', borderRadius: 12,
            border: '2px solid rgba(217,119,6,0.15)',
          }}>
            <span style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '1.6rem', color: '#D97706', fontWeight: 700,
            }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '1rem', color: '#9CA3AF', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: 'linear-gradient(135deg, #D97706, #F59E0B)',
                color: '#FFFFFF',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                padding: '5px 14px', borderRadius: 100,
              }}>-{discount}%</span>
            )}
          </div>

          {/* Transformation / Results section (mock) */}
          <div style={{
            padding: '20px 22px', background: 'rgba(45,27,105,0.04)',
            borderRadius: 12, border: '1px solid rgba(45,27,105,0.08)',
          }}>
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: '#D97706', margin: '0 0 12px',
            }}>Transformation Results</p>
            <div style={{ display: 'flex', gap: 28 }}>
              {[
                { value: '97%', label: 'Success Rate' },
                { value: '4.9★', label: 'Avg. Rating' },
                { value: '500+', label: 'Graduates' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontFamily: "'Raleway', Georgia, serif", fontSize: '1.3rem', fontWeight: 700, color: '#2D1B69', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: '0.68rem', color: '#7C3AED', margin: '2px 0 0', fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontFamily: "'Raleway', Georgia, serif", fontSize: '0.92rem', color: '#5B4A8A', lineHeight: 1.75, fontWeight: 400 }}>
              {product.description}
            </p>
          )}

          {/* What You'll Get checklist */}
          <div style={{ padding: '18px 22px', background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(45,27,105,0.08)' }}>
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: '#2D1B69', margin: '0 0 12px',
            }}>What You&apos;ll Get</p>
            {checklistItems.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: '#7C3AED', fontWeight: 700, fontSize: '0.85rem' }}>✓</span>
                <span style={{ fontFamily: "'Raleway', Georgia, serif", fontSize: '0.85rem', color: '#5B4A8A' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Program duration/format for services */}
          {product.productType === 'service' && (
            <div style={{
              display: 'flex', gap: 16,
            }}>
              {[
                { icon: '⏱', label: '6 Weeks' },
                { icon: '📹', label: '12 Modules' },
                { icon: '💬', label: 'Live Q&A' },
              ].map(f => (
                <div key={f.label} style={{
                  flex: 1, textAlign: 'center', padding: '14px 10px',
                  background: '#FFFFFF', borderRadius: 10,
                  border: '1px solid rgba(45,27,105,0.08)',
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                  <p style={{ fontFamily: "'Raleway', Georgia, serif", fontSize: '0.72rem', fontWeight: 600, color: '#2D1B69', margin: '4px 0 0' }}>{f.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Digital delivery notice */}
          {product.productType === 'digital' && (
            <div style={{
              padding: '14px 18px', background: '#FFFFFF', borderRadius: 10,
              border: '1px solid rgba(45,27,105,0.08)',
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.85rem', color: '#5B4A8A',
            }}>
              📥 Instant digital delivery after purchase
            </div>
          )}

          {/* Stock indicator for physical products */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981',
                display: 'inline-block',
              }} />
              <span style={{ fontFamily: "'Raleway', Georgia, serif", color: '#5B4A8A', fontWeight: 500 }}>
                {product.stock === 0 ? 'Sold out' : product.stock <= 5 ? `Only ${product.stock} remaining` : `${product.stock} in stock`}
              </span>
            </div>
          )}

          {/* Quantity selector (physical only) */}
          {product.productType === 'physical' && !isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: "'Raleway', Georgia, serif", fontSize: '0.78rem', fontWeight: 600, color: '#2D1B69' }}>Quantity</span>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '2px solid rgba(45,27,105,0.10)', borderRadius: 10, overflow: 'hidden',
              }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    width: 40, height: 40, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#2D1B69', cursor: 'pointer',
                  }}>-</button>
                <span style={{
                  width: 44, textAlign: 'center', fontFamily: "'Raleway', Georgia, serif",
                  fontSize: '0.9rem', fontWeight: 700, color: '#2D1B69',
                }}>{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{
                    width: 40, height: 40, border: 'none', background: 'transparent',
                    fontSize: '1.1rem', fontWeight: 700, color: '#2D1B69', cursor: 'pointer',
                  }}>+</button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={handleAdd} disabled={isOutOfStock}
              style={{
                flex: 2, padding: '16px',
                background: isOutOfStock ? 'transparent' : added ? '#10B981' : 'linear-gradient(135deg, #7C3AED 0%, #D97706 100%)',
                color: isOutOfStock ? '#9CA3AF' : '#FFFFFF',
                fontFamily: "'Raleway', Georgia, serif",
                border: isOutOfStock ? '2px solid rgba(45,27,105,0.10)' : 'none',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: 10,
                transition: 'all 0.3s',
                backgroundSize: '200% 200%',
              }}
              onMouseEnter={e => { if (!isOutOfStock && !added) { e.currentTarget.style.backgroundPosition = '100% 0'; }}}
              onMouseLeave={e => { if (!isOutOfStock && !added) { e.currentTarget.style.backgroundPosition = '0% 0'; }}}
            >
              {isOutOfStock ? 'Sold Out' : added ? '✓ Added to Cart' : '+ Add to Cart'}
            </button>
            <button onClick={handleBuyNow} disabled={isOutOfStock}
              style={{
                flex: 1, padding: '16px',
                background: 'transparent',
                border: '2px solid #7C3AED',
                color: '#7C3AED',
                fontFamily: "'Raleway', Georgia, serif",
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: 10,
                transition: 'all 0.3s',
                opacity: isOutOfStock ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isOutOfStock) { e.currentTarget.style.background = '#7C3AED'; e.currentTarget.style.color = '#FFFFFF'; }}}
              onMouseLeave={e => { if (!isOutOfStock) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#7C3AED'; }}}
            >
              Buy Now
            </button>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: "'Raleway', Georgia, serif",
                  fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.05em',
                  padding: '5px 14px', borderRadius: 100,
                  border: '1px solid rgba(45,27,105,0.12)',
                  color: '#7C3AED',
                  background: 'rgba(124,58,237,0.04)',
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Delivery note */}
          {product.deliveryNote && (
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.78rem', color: '#9CA3AF', fontStyle: 'italic',
            }}>{product.deliveryNote}</p>
          )}

          {/* Testimonial quote (mock) */}
          <div style={{
            marginTop: 16, padding: '20px 22px',
            background: '#FFFFFF', borderRadius: 12,
            borderLeft: '4px solid #D97706',
            border: '1px solid rgba(45,27,105,0.06)',
            borderLeftWidth: 4, borderLeftColor: '#D97706',
          }}>
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.88rem', fontStyle: 'italic', color: '#5B4A8A',
              lineHeight: 1.65, margin: 0, fontWeight: 400,
            }}>&ldquo;This program completely transformed my approach to business. Within 3 months I doubled my revenue.&rdquo;</p>
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontSize: '0.72rem', color: '#D97706', fontWeight: 700,
              marginTop: 10, marginBottom: 0,
            }}>— Sarah M., CEO</p>
          </div>
        </div>
      </div>
    </div>
  );
}

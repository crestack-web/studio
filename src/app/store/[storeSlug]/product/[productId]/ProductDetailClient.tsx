'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';

interface Product {
  id: string;
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  stock: number;
  productType: 'physical' | 'digital' | 'service';
  tags: string[];
  deliveryNote: string | null;
  digitalFileUrl: string | null;
}

interface Props {
  product: Product;
  storeSlug: string;
  currency: string;
}

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function ProductDetailClient({ product, storeSlug, currency }: Props) {
  const { addItem, openCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const maxQty = product.productType === 'physical' ? product.stock : 99;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id,
        displayName: product.displayName,
        price: product.price,
        imageUrl: product.images[0] ?? null,
        maxStock: maxQty,
        productType: product.productType,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    fetch('/api/store/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'add_to_cart', storeSlug,
        productId: product.id, pageType: 'product_detail',
      }),
    }).catch(() => {});
  };

  return (
    <div className="sf-page">
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.82rem', color: 'var(--sf-text-3)', marginBottom: 24, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href={`/store/${storeSlug}`} style={{ color: 'var(--sf-primary)' }}>Store</Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span style={{ color: 'var(--sf-text-2)' }}>{product.displayName}</span>
      </nav>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: 48, alignItems: 'start',
      }}>
        {/* ── Images ── */}
        <div>
          {/* Main image */}
          <div style={{
            width: '100%', aspectRatio: '1/1',
            borderRadius: 'var(--sf-radius-lg)',
            overflow: 'hidden', background: 'var(--sf-bg)',
            border: '1px solid var(--sf-border)', marginBottom: 12,
          }}>
            {product.images[activeImg]
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={product.images[activeImg]} alt={product.displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>📦</div>
            }
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 64, height: 64, padding: 0,
                    borderRadius: 8, overflow: 'hidden',
                    border: `2px solid ${i === activeImg ? 'var(--sf-primary)' : 'var(--sf-border)'}`,
                    background: 'var(--sf-bg)', cursor: 'pointer',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category */}
          <p style={{
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--sf-text-3)',
          }}>{product.category}</p>

          {/* Name */}
          <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, lineHeight: 1.2, color: 'var(--sf-text-1)' }}>
            {product.displayName}
          </h1>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-primary)' }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && (
              <span style={{ fontSize: '1rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
            {discount && (
              <span style={{
                background: 'var(--sf-secondary)', color: '#fff',
                fontSize: '0.75rem', fontWeight: 700,
                padding: '3px 10px', borderRadius: 100,
              }}>-{discount}%</span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p style={{ fontSize: '0.95rem', color: 'var(--sf-text-2)', lineHeight: 1.7 }}>
              {product.description}
            </p>
          )}

          {/* Stock / delivery note */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: product.stock === 0 ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981',
                display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ color: 'var(--sf-text-2)' }}>
                {product.stock === 0
                  ? 'Out of stock'
                  : product.stock <= 5
                  ? `Only ${product.stock} left`
                  : 'In stock'}
              </span>
            </div>
          )}
          {product.productType === 'service' && product.deliveryNote && (
            <div style={{
              padding: '12px 16px', background: 'var(--sf-bg)',
              border: '1px solid var(--sf-border)', borderRadius: 8,
              fontSize: '0.85rem', color: 'var(--sf-text-2)',
            }}>
              🗓 {product.deliveryNote}
            </div>
          )}
          {product.productType === 'digital' && (
            <div style={{
              padding: '12px 16px', background: 'var(--sf-bg)',
              border: '1px solid var(--sf-border)', borderRadius: 8,
              fontSize: '0.85rem', color: 'var(--sf-text-2)',
            }}>
              📥 Instant download delivered after purchase
            </div>
          )}

          {/* Qty selector */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>Qty:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--sf-border)', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 36, height: 36, background: 'var(--sf-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', color: 'var(--sf-text-1)' }}
                >−</button>
                <span style={{ minWidth: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, borderLeft: '1px solid var(--sf-border)', borderRight: '1px solid var(--sf-border)' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                  style={{ width: 36, height: 36, background: 'var(--sf-bg)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', color: 'var(--sf-text-1)', opacity: qty >= maxQty ? 0.4 : 1 }}
                >+</button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                flex: 2, padding: '14px',
                background: isOutOfStock ? 'var(--sf-bg)' : added ? '#10B981' : 'var(--sf-primary)',
                color: isOutOfStock ? 'var(--sf-text-3)' : '#fff',
                border: isOutOfStock ? '1px solid var(--sf-border)' : 'none',
                borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {isOutOfStock ? 'Out of stock' : added ? '✓ Added to cart' : '+ Add to cart'}
            </button>
            {!isOutOfStock && (
              <Link
                href={`/store/${storeSlug}/checkout`}
                onClick={handleAddToCart}
                style={{
                  flex: 1, padding: '14px',
                  border: '2px solid var(--sf-primary)',
                  color: 'var(--sf-primary)', background: 'transparent',
                  borderRadius: 10, fontWeight: 700, fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                Buy now
              </Link>
            )}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {product.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: '0.75rem', padding: '3px 10px',
                  background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                  borderRadius: 100, color: 'var(--sf-text-3)',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 640px) {
          .sf-product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

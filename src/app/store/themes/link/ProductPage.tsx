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

export function LinkProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const maxQty = product.productType === 'physical' ? product.stock : 99;

  const handleBuy = () => {
    if (isOutOfStock) return;
    setBuying(true);
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product.id, displayName: product.displayName,
        price: product.price, imageUrl: product.images[0] ?? null,
        maxStock: product.productType === 'physical' ? product.stock : 999,
        productType: product.productType,
      });
    }
    router.push(`/store/${storeSlug}/checkout`);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* Breadcrumb */}
      <nav style={{
        fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-3)',
        marginBottom: 20, display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        <Link href={`/store/${storeSlug}`} style={{ color: 'var(--sf-primary)', textDecoration: 'none' }}>Store</Link>
        <span>/</span>
        <span style={{ color: 'var(--sf-text-2)' }}>{product.displayName}</span>
      </nav>

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1', overflow: 'hidden',
        background: 'var(--sf-surface)', borderRadius: 'var(--sf-radius-lg)',
        border: '1px solid var(--sf-border)', position: 'relative', marginBottom: 20,
      }}>
        {product.images[activeImg] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[activeImg]} alt={product.displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '4rem', color: 'var(--sf-text-3)',
          }}>📦</div>
        )}

        {discount && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: '#A78BFA', color: '#fff',
            padding: '5px 14px', borderRadius: 20,
            fontSize: '0.75rem', fontWeight: 800,
          }}>-{discount}%</div>
        )}
      </div>

      {/* Thumbnails */}
      {product.images.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {product.images.map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i)}
              style={{
                flex: 1, height: 64, padding: 0, cursor: 'pointer',
                border: i === activeImg ? '2px solid var(--sf-primary)' : '2px solid var(--sf-border)',
                borderRadius: 'var(--sf-radius-sm)', overflow: 'hidden',
                opacity: i === activeImg ? 1 : 0.5, transition: 'all 0.2s',
              }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {product.category && (
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'var(--sf-primary)',
          }}>{product.category}</span>
        )}

        <h1 style={{
          fontWeight: 800, fontSize: '1.5rem', color: 'var(--sf-text-1)',
          lineHeight: 1.2, margin: 0,
        }}>{product.displayName}</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--sf-primary)' }}>
            {fmt(product.price, currency)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span style={{ fontSize: '1rem', color: 'var(--sf-text-3)', textDecoration: 'line-through', fontWeight: 500 }}>
              {fmt(product.compareAtPrice, currency)}
            </span>
          )}
          {discount && (
            <span style={{
              background: '#A78BFA', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
              padding: '3px 12px', borderRadius: 20,
            }}>-{discount}%</span>
          )}
        </div>

        {product.description && (
          <p style={{
            fontSize: '0.92rem', color: 'var(--sf-text-2)', lineHeight: 1.65,
          }}>{product.description}</p>
        )}

        {/* Stock */}
        {product.productType === 'physical' && (
          <div style={{
            fontSize: '0.8rem', fontWeight: 700, padding: '10px 14px',
            borderRadius: 'var(--sf-radius-sm)',
            background: isOutOfStock ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            color: isOutOfStock ? '#EF4444' : '#16A34A',
          }}>
            {isOutOfStock ? 'Out of Stock' : `${product.stock} available`}
          </div>
        )}

        {/* Digital */}
        {product.productType === 'digital' && (
          <div style={{
            padding: '10px 14px', background: 'rgba(167,139,250,0.1)',
            border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)',
            fontSize: '0.82rem', color: 'var(--sf-primary)', fontWeight: 700,
          }}>
            📥 Instant digital delivery
          </div>
        )}

        {/* Qty + Add */}
        {!isOutOfStock && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', marginTop: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid var(--sf-border)', borderRadius: 'var(--sf-radius-sm)',
              overflow: 'hidden', background: 'var(--sf-surface)',
            }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                style={{
                  width: 40, height: 46, border: 'none', background: 'transparent',
                  fontSize: '1.1rem', fontWeight: 800, color: 'var(--sf-primary)', cursor: 'pointer',
                }}>−</button>
              <span style={{
                width: 40, textAlign: 'center', fontSize: '1rem', fontWeight: 800,
                color: 'var(--sf-text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 46,
                borderLeft: '1px solid var(--sf-border)', borderRight: '1px solid var(--sf-border)',
              }}>{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))}
                style={{
                  width: 40, height: 46, border: 'none', background: 'transparent',
                  fontSize: '1.1rem', fontWeight: 800, color: 'var(--sf-primary)', cursor: 'pointer',
                }}>+</button>
            </div>

            <button onClick={handleBuy}
              disabled={buying}
              style={{
                flex: 1, height: 46,
                background: buying ? '#10B981' : 'var(--sf-primary)',
                color: '#fff', border: 'none', borderRadius: 'var(--sf-radius-sm)',
                fontSize: '0.85rem', fontWeight: 700, cursor: buying ? 'default' : 'pointer',
                transition: 'all 0.25s',
              }}>
              {buying ? 'Redirecting...' : `Buy Now — ${fmt(product.price * qty, currency)}`}
            </button>
          </div>
        )}

        {/* Tags */}
        {product.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {product.tags.map(tag => (
              <span key={tag} style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px',
                background: 'var(--sf-surface)', color: 'var(--sf-text-2)',
                borderRadius: 20, border: '1px solid var(--sf-border)',
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Delivery note */}
        {product.deliveryNote && (
          <p style={{ fontSize: '0.8rem', color: 'var(--sf-text-3)' }}>
            🚚 {product.deliveryNote}
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/app/store/[storeSlug]/context/CartContext';
import type { ThemeProductCardProps } from '../types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export function LinkProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id, displayName: product.displayName,
      price: product.price, imageUrl: product.images[0] ?? null,
      maxStock: product.productType === 'physical' ? product.stock : 999,
      productType: product.productType,
    });
    router.push(`/store/${storeSlug}/checkout`);
  };

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sf-card" style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 32px rgba(0,0,0,0.35)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        {/* Image */}
        <div style={{
          position: 'relative', height: 200, overflow: 'hidden',
          background: 'var(--sf-surface)',
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[hovered && product.images[1] ? 1 : 0]}
              alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.4s ease, opacity 0.3s ease',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                opacity: hovered && product.images[1] ? 0.92 : 1,
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', color: 'var(--sf-text-3)',
            }}>📦</div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'var(--sf-surface)', color: 'var(--sf-text-2)',
            padding: '4px 10px', borderRadius: 20,
            fontSize: '0.65rem', fontWeight: 700,
            border: '1px solid var(--sf-border)',
          }}>
            {product.productType === 'digital' ? '📥 Digital' : product.productType === 'service' ? '⚡ Service' : '📦 Physical'}
          </div>

          {/* Discount */}
          {discount && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: '#A78BFA', color: '#fff',
              padding: '4px 10px', borderRadius: 20,
              fontSize: '0.65rem', fontWeight: 800,
            }}>
              -{discount}%
            </div>
          )}

          {isOutOfStock && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800, color: '#F5F5F5',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Sold Out</div>
          )}
        </div>

        {/* Info */}
        <div className="sf-card-body" style={{ padding: '14px 16px' }}>
          <p className="sf-card-name" style={{
            fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)',
            margin: 0, lineHeight: 1.3,
          }}>{product.displayName}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span className="sf-card-price" style={{ fontWeight: 800, color: 'var(--sf-primary)' }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-3)', textDecoration: 'line-through', fontWeight: 500 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={handleBuy}
            disabled={isOutOfStock}
            className="sf-card-btn"
            style={{
              width: '100%', padding: '11px 0',
              background: isOutOfStock ? 'var(--sf-border)' : 'var(--sf-primary)',
              color: isOutOfStock ? 'var(--sf-text-3)' : '#fff',
              borderRadius: 'var(--sf-radius-sm)',
              fontSize: '0.8rem', fontWeight: 700, border: 'none',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {isOutOfStock ? 'Sold Out' : 'Buy Now'}
          </button>
        </div>
      </div>
    </Link>
  );
}

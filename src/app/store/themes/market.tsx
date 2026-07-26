'use client';

import React from 'react';
import type { ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MARKET — Dense, price-forward, bright, quick-add buttons
// For groceries, electronics, wholesale, everyday goods
// ══════════════════════════════════════════════════════════════════════════════

export function MarketProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;
  const isOutOfStock = product.productType === 'physical' && product.stock === 0;

  return (
    <a href={`/store/${storeSlug}/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#fff', border: '2px solid #FED7AA', borderRadius: 12, overflow: 'hidden',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(234,88,12,0.12)'; e.currentTarget.style.borderColor = '#EA580C'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#FED7AA'; }}>
        {/* Image — compact */}
        <div style={{ height: 180, background: '#FEF3C7', position: 'relative', overflow: 'hidden' }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>📦</div>
          )}
          {/* Badges — stacked top-left */}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {discount && (
              <span style={{ background: '#F59E0B', color: '#1C0A00', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
                −{discount}%
              </span>
            )}
            {product.productType === 'digital' && (
              <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 100, backdropFilter: 'blur(4px)' }}>
                Digital
              </span>
            )}
            {isOutOfStock && (
              <span style={{ background: '#DC2626', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
                Sold out
              </span>
            )}
          </div>
        </div>
        {/* Info — tight, price-forward */}
        <div style={{ padding: '10px 12px 8px' }}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1C0A00', lineHeight: 1.3, margin: 0 }}>
            {product.displayName}
          </p>
          <p style={{ fontWeight: 900, fontSize: '1.15rem', color: '#EA580C', margin: '6px 0 0' }}>
            {fmt(product.price, currency)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.78rem', color: '#B45309', textDecoration: 'line-through', marginLeft: 8, fontWeight: 600 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </p>
        </div>
        {/* Quick add CTA */}
        <div style={{ padding: '0 12px 10px' }}>
          <button style={{
            width: '100%', padding: '9px', borderRadius: 8, fontWeight: 800, fontSize: '0.82rem',
            background: isOutOfStock ? '#E5E7EB' : '#EA580C', color: isOutOfStock ? '#9CA3AF' : '#fff',
            cursor: isOutOfStock ? 'not-allowed' : 'pointer', border: 'none', transition: 'background 0.15s',
          }}>
            {isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
          </button>
        </div>
      </div>
    </a>
  );
}

export function MarketCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  return (
    <a href={`/store/${storeSlug}/collections/${collection.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#fff', border: '2px solid #FED7AA', borderRadius: 12, overflow: 'hidden',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#EA580C'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#FED7AA'; }}>
        <div style={{
          height: 120, backgroundSize: 'cover', backgroundPosition: 'center',
          background: collection.coverImageUrl ? `url(${collection.coverImageUrl})` : 'linear-gradient(135deg, #EA580C, #F59E0B)',
        }} />
        <div style={{ padding: '12px 14px' }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1C0A00', margin: 0 }}>{collection.title}</h3>
          {collection.description && (
            <p style={{ fontSize: '0.78rem', color: '#78350F', margin: '4px 0 0', lineHeight: 1.4 }}>{collection.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

export function MarketHero({ storeName, tagline, logoUrl, primaryColor, secondaryColor, ctaLabel, ctaUrl, backgroundImage }: ThemeHeroProps) {
  const bg = backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  return (
    <section style={{
      background: `linear-gradient(135deg, ${primaryColor || '#EA580C'} 0%, ${secondaryColor || '#F59E0B'} 100%)`,
      borderRadius: 18, padding: '40px 36px', color: '#fff', position: 'relative', overflow: 'hidden',
      ...bg,
    }}>
      <div style={{ position: 'absolute', right: 32, bottom: -10, fontSize: '7rem', opacity: 0.15, pointerEvents: 'none' }}>🛒</div>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }} />
      )}
      <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
        🛍️ Fresh arrivals daily
      </p>
      <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em' }}>
        {storeName}
      </h1>
      {tagline && <p style={{ color: 'rgba(255,255,255,0.88)', maxWidth: 460, fontSize: '1.05rem', marginTop: 8, lineHeight: 1.6, fontWeight: 500 }}>{tagline}</p>}
      {ctaLabel && (
        <a href={ctaUrl || '#products'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, padding: '13px 32px', background: '#fff', color: primaryColor || '#EA580C', borderRadius: 100, fontWeight: 800, fontSize: '0.92rem', textDecoration: 'none' }}>
          {ctaLabel} →
        </a>
      )}
    </section>
  );
}

export function MarketProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const [qty, setQty] = React.useState(1);
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* Image */}
        <div>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, border: '2px solid #FED7AA' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '1/1', background: '#FEF3C7', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📦</div>
          )}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {product.images.slice(0, 4).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid #FED7AA' }} />
              ))}
            </div>
          )}
        </div>
        {/* Info — price-forward, dense */}
        <div>
          {product.category && (
            <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100, textTransform: 'uppercase' }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1C0A00', marginTop: 12, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {product.displayName}
          </h1>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#EA580C', marginTop: 12 }}>
            {fmt(product.price, currency)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '1rem', color: '#B45309', textDecoration: 'line-through', marginLeft: 10, fontWeight: 600 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </p>
          {product.description && (
            <p style={{ color: '#78350F', lineHeight: 1.7, marginTop: 20, fontSize: '0.95rem' }}>{product.description}</p>
          )}
          {/* Quantity selector */}
          {product.productType === 'physical' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1C0A00' }}>Qty:</span>
              <div style={{ display: 'flex', border: '2px solid #FED7AA', borderRadius: 8, overflow: 'hidden' }}>
                <button style={{ width: 40, height: 40, background: '#FEF3C7', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: '#1C0A00' }} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span style={{ width: 48, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#1C0A00' }}>{qty}</span>
                <button style={{ width: 40, height: 40, background: '#FEF3C7', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', color: '#1C0A00' }} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              {product.stock > 0 && product.stock < 10 && (
                <span style={{ fontSize: '0.78rem', color: '#DC2626', fontWeight: 700 }}>Only {product.stock} left!</span>
              )}
            </div>
          )}
          <button style={{
            width: '100%', marginTop: 24, padding: '14px', borderRadius: 100, fontWeight: 800, fontSize: '1rem',
            background: '#EA580C', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#C2410C'}
            onMouseLeave={e => e.currentTarget.style.background = '#EA580C'}>
            {product.productType === 'digital' ? 'Purchase Now' : 'Add to Cart'}
          </button>
          {/* Trust signals */}
          <div style={{ display: 'flex', gap: 16, marginTop: 20, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>🚚 Fast Delivery</span>
            <span style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>✅ Quality Guaranteed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

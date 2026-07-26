'use client';

import React from 'react';
import type { ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// GLOW — Warm, soft, beauty/wellness-focused, rounded corners, gentle palette
// For skincare, cosmetics, wellness, lifestyle, handmade goods
// ══════════════════════════════════════════════════════════════════════════════

export function GlowProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  return (
    <a href={`/store/${storeSlug}/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#FFFDF9', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(180,130,90,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(180,130,90,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(180,130,90,0.08)'; }}>
        {/* Image */}
        <div style={{ height: 220, background: '#FAF5EF', borderRadius: '20px 20px 0 0', position: 'relative', overflow: 'hidden' }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px 20px 0 0' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
              {product.productType === 'digital' ? '✨' : '🧴'}
            </div>
          )}
          {/* Soft badge */}
          {product.productType === 'digital' && (
            <span style={{
              position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
              color: '#92400E', fontSize: '0.62rem', fontWeight: 700, padding: '4px 12px', borderRadius: 100,
            }}>Digital</span>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: '18px 20px 8px' }}>
          {product.category && (
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309', fontWeight: 600, margin: 0 }}>
              {product.category}
            </p>
          )}
          <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#1C0A00', margin: '4px 0 10px', lineHeight: 1.3 }}>
            {product.displayName}
          </h3>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#92400E', margin: 0 }}>
            {fmt(product.price, currency)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.8rem', color: '#B45309', textDecoration: 'line-through', marginLeft: 8, fontWeight: 500 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </p>
        </div>
        {/* Gentle CTA */}
        <div style={{ padding: '4px 20px 20px' }}>
          <button style={{
            width: '100%', padding: '11px', borderRadius: 100, fontWeight: 600, fontSize: '0.85rem',
            background: '#92400E', color: '#FFFDF9', border: 'none', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#78350F'}
            onMouseLeave={e => e.currentTarget.style.background = '#92400E'}>
            {product.productType === 'digital' ? 'Download' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </a>
  );
}

export function GlowCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  return (
    <a href={`/store/${storeSlug}/collections/${collection.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#FFFDF9', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(180,130,90,0.08)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(180,130,90,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(180,130,90,0.08)'; }}>
        <div style={{
          height: 130, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '20px 20px 0 0',
          background: collection.coverImageUrl ? `url(${collection.coverImageUrl})` : 'linear-gradient(135deg, #FAF5EF, #F5E6D3)',
        }} />
        <div style={{ padding: '16px 20px 20px' }}>
          <h3 style={{ fontWeight: 600, fontSize: '0.98rem', color: '#1C0A00', margin: 0, lineHeight: 1.3 }}>
            {collection.title}
          </h3>
          {collection.description && (
            <p style={{ fontSize: '0.78rem', color: '#78350F', margin: '6px 0 0', lineHeight: 1.4 }}>{collection.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

export function GlowHero({ storeName, tagline, logoUrl, primaryColor, secondaryColor, ctaLabel, ctaUrl, backgroundImage }: ThemeHeroProps) {
  const bg = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(145deg, ${primaryColor || '#FAF5EF'} 0%, ${secondaryColor || '#F5E6D3'} 100%)` };
  return (
    <section style={{ borderRadius: 28, padding: '50px 40px', ...bg, position: 'relative' }}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName} style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover', marginBottom: 18 }} />
      )}
      <p style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400E', fontWeight: 700, marginBottom: 10 }}>
        ✦ Natural &amp; Handcrafted
      </p>
      <h1 style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', color: '#1C0A00', fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
        {storeName}
      </h1>
      {tagline && (
        <p style={{ color: '#78350F', maxWidth: 460, fontSize: '1rem', marginTop: 10, lineHeight: 1.7 }}>{tagline}</p>
      )}
      {ctaLabel && (
        <a href={ctaUrl || '#products'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 26, padding: '12px 30px', background: '#92400E', color: '#FFFDF9', borderRadius: 100, fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', transition: 'background 0.2s' }}>
          {ctaLabel}
        </a>
      )}
    </section>
  );
}

export function GlowProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '50px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'start' }}>
        {/* Image */}
        <div>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', aspectRatio: '4/4.5', objectFit: 'cover', borderRadius: 20 }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '4/4.5', background: '#FAF5EF', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🧴</div>
          )}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {product.images.slice(0, 4).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }} />
              ))}
            </div>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: '10px 0' }}>
          {product.category && (
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B45309', fontWeight: 600 }}>
              {product.category}
            </span>
          )}
          <h1 style={{ fontFamily: '"Cormorant Garamond","Playfair Display",serif', fontSize: '2rem', fontWeight: 700, color: '#1C0A00', marginTop: 10, lineHeight: 1.15 }}>
            {product.displayName}
          </h1>
          <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#92400E', marginTop: 14 }}>
            {fmt(product.price, currency)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.95rem', color: '#B45309', textDecoration: 'line-through', marginLeft: 10, fontWeight: 500 }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </p>
          {product.description && (
            <p style={{ color: '#78350F', lineHeight: 1.8, marginTop: 24, fontSize: '0.95rem' }}>{product.description}</p>
          )}
          {/* Tags */}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
              {product.tags.map(t => (
                <span key={t} style={{ fontSize: '0.7rem', color: '#78350F', background: '#FAF5EF', padding: '5px 14px', borderRadius: 100 }}>{t}</span>
              ))}
            </div>
          )}
          <button style={{
            width: '100%', marginTop: 28, padding: '14px', borderRadius: 100, fontWeight: 600, fontSize: '0.95rem',
            background: '#92400E', color: '#FFFDF9', border: 'none', cursor: 'pointer', transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#78350F'}
            onMouseLeave={e => e.currentTarget.style.background = '#92400E'}>
            {product.productType === 'digital' ? 'Download Now' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}

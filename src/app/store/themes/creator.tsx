'use client';

import React from 'react';
import type { ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATOR — Dark, modern, digital-first, landing-page style
// For ebooks, courses, templates, services, digital products
// ══════════════════════════════════════════════════════════════════════════════

export function CreatorProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  return (
    <a href={`/store/${storeSlug}/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#1E293B', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.boxShadow = 'none'; }}>
        {/* Cover image */}
        <div style={{ height: 200, background: '#0F172A', position: 'relative', overflow: 'hidden' }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#334155' }}>
              {product.productType === 'digital' ? '📄' : '📦'}
            </div>
          )}
          {/* Type badge */}
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(34,197,94,0.15)', color: '#22C55E',
            fontSize: '0.6rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100,
            letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(34,197,94,0.3)',
          }}>
            {product.productType === 'digital' ? 'Digital' : product.productType === 'service' ? 'Service' : 'Physical'}
          </span>
        </div>
        {/* Info */}
        <div style={{ padding: '16px' }}>
          {product.category && (
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94A3B8', fontWeight: 600, margin: 0 }}>
              {product.category}
            </p>
          )}
          <h3 style={{ fontFamily: '"Sora","Inter",sans-serif', fontWeight: 700, fontSize: '1rem', color: '#F8FAFC', margin: '6px 0 8px', lineHeight: 1.3 }}>
            {product.displayName}
          </h3>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#22C55E', margin: 0 }}>
            {fmt(product.price, currency)}
          </p>
        </div>
        {/* CTA */}
        <div style={{ padding: '0 16px 16px' }}>
          <button style={{
            width: '100%', padding: '11px', borderRadius: 6, fontWeight: 700, fontSize: '0.85rem',
            background: '#22C55E', color: '#0F172A', border: 'none', cursor: 'pointer',
            fontFamily: '"Sora","Inter",sans-serif', transition: 'opacity 0.15s',
          }}>
            {product.productType === 'digital' ? 'Get it Now' : '+ Add to Cart'}
          </button>
        </div>
      </div>
    </a>
  );
}

export function CreatorCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  return (
    <a href={`/store/${storeSlug}/collections/${collection.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#1E293B', border: '1px solid #334155', borderRadius: 8, overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#22C55E'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
        <div style={{
          height: 140, backgroundSize: 'cover', backgroundPosition: 'center',
          background: collection.coverImageUrl ? `url(${collection.coverImageUrl})` : 'linear-gradient(135deg, #0F172A, #1E293B)',
        }} />
        <div style={{ padding: '14px 16px' }}>
          <h3 style={{ fontFamily: '"Sora","Inter",sans-serif', fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC', margin: 0 }}>
            {collection.title}
          </h3>
          {collection.description && (
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', margin: '6px 0 0', lineHeight: 1.4 }}>{collection.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

export function CreatorHero({ storeName, tagline, logoUrl, primaryColor, secondaryColor, ctaLabel, ctaUrl, backgroundImage }: ThemeHeroProps) {
  const bg = backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  return (
    <section style={{
      background: `linear-gradient(135deg, ${primaryColor || '#22C55E'}25 0%, ${secondaryColor || '#0F172A'}18 100%)`,
      padding: '60px 5%', display: 'flex', flexDirection: 'column', gap: 14,
      ...bg,
    }}>
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', marginBottom: 8 }} />
      )}
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: primaryColor || '#22C55E', fontWeight: 700 }}>
        Build once. Sell forever.
      </p>
      <h1 style={{ fontFamily: '"Sora","Inter",sans-serif', color: '#F8FAFC', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.03em' }}>
        {storeName}
      </h1>
      {tagline && <p style={{ color: '#94A3B8', maxWidth: 480, fontSize: '1.1rem', marginTop: 10, lineHeight: 1.65 }}>{tagline}</p>}
      {ctaLabel && (
        <a href={ctaUrl || '#products'} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 26, padding: '13px 32px', background: primaryColor || '#22C55E', color: '#fff', borderRadius: 6, fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', fontFamily: '"Sora","Inter",sans-serif' }}>
          {ctaLabel} →
        </a>
      )}
    </section>
  );
}

export function CreatorProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 5% 80px' }}>
      {/* Landing page style — centered, single column */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        {product.category && (
          <span style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontSize: '0.7rem', fontWeight: 700, padding: '5px 14px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid rgba(34,197,94,0.25)' }}>
            {product.category}
          </span>
        )}
        <h1 style={{ fontFamily: '"Sora","Inter",sans-serif', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#F8FAFC', marginTop: 16, lineHeight: 1.12, letterSpacing: '-0.03em' }}>
          {product.displayName}
        </h1>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22C55E', marginTop: 16 }}>
          {fmt(product.price, currency)}
        </p>
      </div>

      {/* Product image — full width */}
      {product.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.images[0]} alt={product.displayName}
          style={{ width: '100%', borderRadius: 12, border: '1px solid #334155', marginBottom: 40 }} />
      )}

      {/* Description — landing page style */}
      {product.description && (
        <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '32px', marginBottom: 32 }}>
          <h2 style={{ fontFamily: '"Sora","Inter",sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 16 }}>What you get</h2>
          <p style={{ color: '#94A3B8', lineHeight: 1.8, fontSize: '1rem' }}>{product.description}</p>
        </div>
      )}

      {/* Tags */}
      {product.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {product.tags.map(t => (
            <span key={t} style={{ fontSize: '0.7rem', color: '#94A3B8', border: '1px solid #334155', padding: '5px 12px', borderRadius: 100 }}>{t}</span>
          ))}
        </div>
      )}

      {/* Purchase CTA — big and centered */}
      <div style={{ textAlign: 'center' }}>
        <button style={{
          padding: '16px 48px', borderRadius: 8, fontWeight: 700, fontSize: '1rem',
          background: '#22C55E', color: '#0F172A', border: 'none', cursor: 'pointer',
          fontFamily: '"Sora","Inter",sans-serif', transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {product.productType === 'digital' ? 'Get Instant Access' : 'Purchase Now'}
        </button>
        {product.productType === 'digital' && product.digitalFileUrl && (
          <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 12 }}>Instant digital delivery after purchase</p>
        )}
      </div>
    </div>
  );
}

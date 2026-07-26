'use client';

import React from 'react';
import type { ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// LUXE — Editorial, high-end, large imagery, minimal text
// ══════════════════════════════════════════════════════════════════════════════

export function LuxeProductCard({ product, storeSlug, currency }: ThemeProductCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  return (
    <a href={`/store/${storeSlug}/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Large editorial image */}
        <div style={{
          height: 400, background: '#1C1C1C', overflow: 'hidden', position: 'relative',
          border: '1px solid #2A2A2A',
        }}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.displayName}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: hovered ? 0.85 : 1, transition: 'opacity 0.4s ease, transform 0.6s ease',
                transform: hovered ? 'scale(1.03)' : 'scale(1)',
              }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#3A3A3A' }}>📦</div>
          )}
          {discount && (
            <span style={{ position: 'absolute', top: 14, left: 14, background: '#C9A84C', color: '#0A0A0A', fontSize: '0.65rem', fontWeight: 600, padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              −{discount}%
            </span>
          )}
          {product.productType === 'digital' && (
            <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.6rem', fontWeight: 600, padding: '4px 10px', letterSpacing: '0.12em', textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
              Digital
            </span>
          )}
        </div>
        {/* Minimal text below */}
        <div style={{ padding: '16px 0' }}>
          {product.category && (
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 500, margin: 0 }}>
              {product.category}
            </p>
          )}
          <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.05rem', color: '#F5F5F0', margin: '6px 0 8px', letterSpacing: '0.01em' }}>
            {product.displayName}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.9rem', color: '#C9A84C', fontWeight: 400, letterSpacing: '0.04em' }}>
              {fmt(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '0.8rem', color: '#606060', textDecoration: 'line-through' }}>
                {fmt(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>
        {/* CTA */}
        <div style={{
          padding: '12px', border: '1px solid #2A2A2A', textAlign: 'center',
          fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#F5F5F0', cursor: 'pointer', transition: 'all 0.25s',
          background: hovered ? '#C9A84C' : 'transparent', borderColor: hovered ? '#C9A84C' : '#2A2A2A',
        }}>
          {product.productType === 'digital' ? 'View Details' : '+ Add to Cart'}
        </div>
      </div>
    </a>
  );
}

export function LuxeCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ border: '1px solid #2A2A2A', overflow: 'hidden' }}>
        <div style={{
          height: 220, backgroundSize: 'cover', backgroundPosition: 'center',
          background: collection.coverImageUrl ? `url(${collection.coverImageUrl})` : 'linear-gradient(135deg, #1C1C1C, #2A2A2A)',
          transition: 'transform 0.5s ease', transform: hovered ? 'scale(1.04)' : 'scale(1)',
        }} />
        <div style={{ padding: '20px 16px' }}>
          <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.1rem', color: '#F5F5F0', margin: 0, letterSpacing: '0.02em' }}>
            {collection.title}
          </h3>
          {collection.description && (
            <p style={{ fontSize: '0.78rem', color: '#A0A09A', margin: '6px 0 0', lineHeight: 1.5 }}>
              {collection.description}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export function LuxeHero({ storeName, tagline, logoUrl, primaryColor, ctaLabel, ctaUrl, backgroundImage }: ThemeHeroProps) {
  const bg = backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  return (
    <section style={{
      background: '#111111', padding: '80px 5%', position: 'relative', overflow: 'hidden',
      borderBottom: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', gap: 14, ...bg,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName} style={{ width: 56, height: 56, borderRadius: 4, objectFit: 'cover', marginBottom: 8, position: 'relative' }} />
      )}
      <p style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 8, fontWeight: 500, position: 'relative' }}>
        New Collection
      </p>
      <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.1, color: '#F5F0E8', position: 'relative' }}>
        {storeName}
      </h1>
      {tagline && <p style={{ fontWeight: 300, fontSize: '1rem', color: '#A0A09A', letterSpacing: '0.04em', marginTop: 8, position: 'relative' }}>{tagline}</p>}
      {ctaLabel && (
        <a href={ctaUrl || '#products'} style={{ display: 'inline-block', marginTop: 20, padding: '14px 40px', border: `1px solid ${primaryColor || '#C9A84C'}`, color: primaryColor || '#C9A84C', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.2s', position: 'relative' }}>
          {ctaLabel}
        </a>
      )}
    </section>
  );
}

export function LuxeProductPage({ product, storeSlug, currency }: ThemeProductPageProps) {
  const [selectedImg, setSelectedImg] = React.useState(0);
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 5% 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          {product.images[selectedImg] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[selectedImg]} alt={product.displayName}
              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', border: '1px solid #2A2A2A' }} />
          ) : (
            <div style={{ width: '100%', aspectRatio: '3/4', background: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#3A3A3A' }}>📦</div>
          )}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {product.images.slice(0, 5).map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={img} alt="" onClick={() => setSelectedImg(i)}
                  style={{ width: 72, height: 72, objectFit: 'cover', border: i === selectedImg ? '2px solid #C9A84C' : '1px solid #2A2A2A', cursor: 'pointer', opacity: i === selectedImg ? 1 : 0.6 }} />
              ))}
            </div>
          )}
        </div>
        {/* Details */}
        <div style={{ paddingTop: 16 }}>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 500 }}>{product.category}</p>
          <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '2.2rem', fontWeight: 400, color: '#F5F0E8', marginTop: 10, lineHeight: 1.2 }}>{product.displayName}</h1>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: '1.5rem', color: '#C9A84C', fontWeight: 400 }}>{fmt(product.price, currency)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '1rem', color: '#606060', textDecoration: 'line-through' }}>{fmt(product.compareAtPrice, currency)}</span>
            )}
          </div>
          {product.description && (
            <p style={{ color: '#A0A09A', lineHeight: 1.8, marginTop: 24, fontSize: '0.95rem' }}>{product.description}</p>
          )}
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {product.tags.map(t => (
                <span key={t} style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#606060', border: '1px solid #2A2A2A', padding: '5px 12px' }}>{t}</span>
              ))}
            </div>
          )}
          <button style={{ width: '100%', marginTop: 32, padding: '16px', background: 'transparent', border: '1px solid #C9A84C', color: '#C9A84C', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0A0A0A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C9A84C'; }}>
            {product.productType === 'digital' ? 'Purchase' : 'Add to Cart'}
          </button>
          {product.productType === 'digital' && product.digitalFileUrl && (
            <p style={{ fontSize: '0.78rem', color: '#606060', marginTop: 12, textAlign: 'center' }}>Digital delivery — instant download after purchase</p>
          )}
        </div>
      </div>
    </div>
  );
}

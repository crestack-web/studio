'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

export function MarketHero({ storeName, tagline, logoUrl, ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, textAlign = 'left', buttonStyle }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '80px 5%', overflow: 'hidden',
      background: backgroundImage ? undefined : 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)',
      color: '#FFFFFF', ...bgStyle,
    }}>
      {/* Dark overlay if using background image */}
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(234,88,12,0.85) 0%, rgba(245,158,11,0.75) 100%)',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16 }}>
        {logoUrl && (
          <div style={{
            background: '#FFFFFF', borderRadius: 12, padding: 6,
            display: 'inline-flex', marginBottom: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }} />
          </div>
        )}

        <h1 style={{
          fontWeight: 900,
          fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
          letterSpacing: '-0.03em', lineHeight: 1.1,
          color: '#FFFFFF', margin: 0,
          textShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          {'🛒 '}{storeName}
        </h1>

        {tagline && (
          <p style={{
            fontWeight: 600, fontSize: '1.1rem', color: 'rgba(255,255,255,0.92)',
            letterSpacing: '0.01em', lineHeight: 1.5,
            maxWidth: 520, margin: 0,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 12, padding: '14px 40px',
          background: '#FFFFFF', color: '#EA580C',
          borderRadius: buttonStyle === 'pill' ? 999 : buttonStyle === 'square' ? 0 : 12, textDecoration: 'none',
          fontSize: '0.9rem', fontWeight: 800, width: 'fit-content',
          letterSpacing: '0.02em', textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
          border: 'none', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.15)'; }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}

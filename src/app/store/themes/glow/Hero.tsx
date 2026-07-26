'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

const COLORS = {
  roseGold: '#B76E79',
  roseGoldLight: '#D4A0A6',
  softPink: '#FDE8E9',
  warmWhite: '#FFFAF7',
  gold: '#D4A574',
  blush: '#F5D5CC',
  cream: '#FFF5EE',
  dustyRose: '#C9929B',
};

export function GlowHero({ storeName, tagline, logoUrl, ctaLabel = 'Explore Collection', ctaUrl = '#products', backgroundImage, textAlign = 'left', buttonStyle }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '100px 5%', overflow: 'hidden',
      background: backgroundImage
        ? undefined
        : `linear-gradient(160deg, ${COLORS.cream} 0%, ${COLORS.softPink} 35%, ${COLORS.blush} 60%, rgba(183,110,121,0.3) 100%)`,
      color: '#4A3238', ...bgStyle,
    }}>
      {/* Warm overlay for image backgrounds */}
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(255,245,238,0.82) 0%, rgba(253,232,233,0.7) 40%, rgba(183,110,121,0.35) 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: '-30%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(183,110,121,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Soft decorative circles */}
      <div style={{
        position: 'absolute', bottom: -40, left: '10%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,165,116,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start', textAlign }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName}
            style={{
              width: 60, height: 60, borderRadius: '50%',
              objectFit: 'cover', marginBottom: 28,
              border: `2px solid rgba(183,110,121,0.2)`,
              boxShadow: '0 4px 16px rgba(183,110,121,0.1)',
            }} />
        )}

        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: COLORS.roseGold, fontWeight: 600, marginBottom: 18,
        }}>Your Beauty Destination</p>

        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
          letterSpacing: '-0.005em', lineHeight: 1.15,
          color: '#3D2228', margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontWeight: 300, fontSize: '1.05rem', color: COLORS.dustyRose,
            letterSpacing: '0.03em', marginTop: 22, lineHeight: 1.65,
            maxWidth: 440,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 40, padding: '15px 44px',
          background: `linear-gradient(135deg, ${COLORS.roseGold}, ${COLORS.dustyRose})`,
          borderRadius: buttonStyle === 'pill' ? 50 : buttonStyle === 'square' ? 0 : 12,
          color: COLORS.warmWhite,
          fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          textDecoration: 'none', fontWeight: 600, width: 'fit-content',
          transition: 'all 0.35s ease',
          boxShadow: '0 6px 24px rgba(183,110,121,0.25)',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 10px 36px rgba(183,110,121,0.35)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(183,110,121,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}

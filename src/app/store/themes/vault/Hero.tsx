'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

const C = {
  navy: '#0B1D3A',
  surface: '#112240',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  white: '#F1F5F9',
  muted: '#94A3B8',
  darkBlue: '#1E3A5F',
};

export function VaultHero({
  storeName,
  tagline,
  logoUrl,
  ctaLabel = 'Browse Products',
  ctaUrl = '#products',
  backgroundImage,
  textAlign = 'left',
  buttonStyle,
}: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '100px 5%', overflow: 'hidden',
      background: backgroundImage ? undefined : `linear-gradient(170deg, ${C.navy} 0%, #0A1628 50%, #091422 100%)`,
      color: C.white,
      ...bgStyle,
    }}>
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(170deg, rgba(11,29,58,0.88) 0%, rgba(10,22,40,0.82) 50%, rgba(9,20,34,0.78) 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Decorative glow orbs */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-8%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-30%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Floating mockup shapes */}
      <div style={{
        position: 'absolute', top: 60, right: '12%',
        width: 180, height: 240, borderRadius: 16,
        border: '1px solid rgba(59,130,246,0.12)',
        background: 'rgba(17,34,64,0.6)',
        transform: 'rotate(6deg)',
        pointerEvents: 'none',
        opacity: 0.5,
      }} />
      <div style={{
        position: 'absolute', bottom: 50, right: '18%',
        width: 140, height: 190, borderRadius: 14,
        border: '1px solid rgba(59,130,246,0.08)',
        background: 'rgba(17,34,64,0.4)',
        transform: 'rotate(-4deg)',
        pointerEvents: 'none',
        opacity: 0.35,
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 640,
        display: 'flex', flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        textAlign,
      }}>
        {/* Badge */}
        <span style={{
          display: 'inline-block', marginBottom: 24,
          padding: '7px 18px', borderRadius: 8,
          background: 'rgba(59,130,246,0.12)',
          border: '1px solid rgba(59,130,246,0.2)',
          fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: C.lightBlue,
        }}>
          ⚡ Instant Digital Delivery
        </span>

        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName}
            style={{
              width: 56, height: 56, borderRadius: 12,
              objectFit: 'cover', marginBottom: 24,
              border: '1px solid rgba(59,130,246,0.2)',
              boxShadow: '0 4px 20px rgba(59,130,246,0.15)',
            }} />
        )}

        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
          letterSpacing: '-0.03em', lineHeight: 1.12,
          color: C.white, margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 400, fontSize: '1.05rem', color: C.muted,
            letterSpacing: '0.01em', marginTop: 20, lineHeight: 1.65,
            maxWidth: 480,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 40, padding: '15px 44px',
          background: C.blue,
          borderRadius: buttonStyle === 'pill' ? 50 : buttonStyle === 'square' ? 0 : 10,
          color: '#FFFFFF',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.04em',
          textDecoration: 'none', width: 'fit-content',
          transition: 'all 0.35s ease',
          boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 36px rgba(59,130,246,0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = '#2563EB';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.35)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = C.blue;
          }}
        >{ctaLabel}</a>
      </div>
    </section>
  );
}

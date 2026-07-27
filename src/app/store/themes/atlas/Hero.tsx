'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

const C = {
  slate: '#1E293B',
  slateMuted: '#64748B',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealPale: '#CCFBF1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  tealBg: 'rgba(13,148,136,0.06)',
  tealBorder: 'rgba(13,148,136,0.12)',
};

export function AtlasHero({
  storeName, tagline, logoUrl, ctaLabel = 'View Services', ctaUrl = '#products',
  backgroundImage, textAlign = 'left', buttonStyle,
}: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  const align = textAlign ?? 'left';

  return (
    <section style={{
      position: 'relative', padding: '100px 5%', overflow: 'hidden',
      background: backgroundImage
        ? undefined
        : `linear-gradient(160deg, ${C.bg} 0%, #EFF6FF 30%, ${C.tealPale} 70%, rgba(13,148,136,0.08) 100%)`,
      color: C.slate, ...bgStyle,
    }}>
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(248,250,252,0.88) 0%, rgba(204,251,241,0.75) 50%, rgba(13,148,136,0.3) 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Geometric accent: top-right triangle */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 0, height: 0,
        borderLeft: '400px solid transparent',
        borderTop: `400px solid ${C.tealBg}`,
        pointerEvents: 'none', opacity: 0.5,
      }} />

      {/* Subtle horizontal line decoration */}
      <div style={{
        position: 'absolute', bottom: 60, left: '5%',
        width: 200, height: 1,
        background: `linear-gradient(to right, ${C.tealBorder}, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Dotted grid pattern */}
      <div style={{
        position: 'absolute', top: 40, right: '8%',
        display: 'grid', gridTemplateColumns: 'repeat(5, 8px)', gap: 16,
        pointerEvents: 'none', opacity: 0.18,
      }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{
            width: 4, height: 4, borderRadius: '50%',
            background: C.teal,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 640,
        display: 'flex', flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        textAlign: align,
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName}
            style={{
              width: 56, height: 56, borderRadius: 14,
              objectFit: 'cover', marginBottom: 28,
              border: `1px solid ${C.tealBorder}`,
              boxShadow: '0 2px 12px rgba(13,148,136,0.1)',
            }} />
        )}

        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: C.teal, fontWeight: 700, marginBottom: 16,
          fontFamily: "'Manrope', sans-serif",
        }}>Professional Services</p>

        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
          letterSpacing: '-0.02em', lineHeight: 1.12,
          color: C.slate, margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 400, fontSize: '1.05rem', color: C.slateMuted,
            letterSpacing: '0.01em', marginTop: 20, lineHeight: 1.65,
            maxWidth: 440,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 36, padding: '14px 40px',
          background: C.teal,
          borderRadius: buttonStyle === 'pill' ? 50 : buttonStyle === 'square' ? 0 : 10,
          color: C.white,
          fontFamily: "'Manrope', sans-serif",
          fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          textDecoration: 'none', fontWeight: 700, width: 'fit-content',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 16px rgba(13,148,136,0.25)',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(13,148,136,0.35)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,148,136,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >{ctaLabel}</a>

        {/* Trust badges */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 36,
          flexWrap: 'wrap',
          justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        }}>
          {[
            { icon: '⭐', label: '5.0 Rating' },
            { icon: '📋', label: '200+ Projects' },
            { icon: '✅', label: 'Verified' },
          ].map(badge => (
            <div key={badge.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.72rem', color: C.slateMuted,
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 500,
            }}>
              <span style={{ fontSize: '0.85rem' }}>{badge.icon}</span>
              {badge.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

export function LinkHero({ storeName, tagline, logoUrl, primaryColor = '#A78BFA', secondaryColor = '#818CF8', ctaLabel = 'Visit Store', ctaUrl = '#products' }: ThemeHeroProps) {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '48px 20px 32px', textAlign: 'center', gap: 12,
      background: 'var(--sf-bg)',
    }}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={storeName}
          style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--sf-border)' }} />
      ) : (
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          border: '3px solid transparent', backgroundClip: 'padding-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden',
        }}>
          {storeName.charAt(0).toUpperCase()}
        </div>
      )}

      <h1 style={{
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        fontSize: '1.4rem', fontWeight: 800, color: 'var(--sf-text-1)',
        margin: 0, letterSpacing: '-0.02em',
      }}>{storeName}</h1>

      {tagline && (
        <p style={{
          fontSize: '0.95rem', color: 'var(--sf-text-2)',
          margin: 0, maxWidth: 420, lineHeight: 1.6,
        }}>{tagline}</p>
      )}

      <a href={ctaUrl} style={{
        marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '11px 28px', borderRadius: 100,
        background: primaryColor, color: '#fff',
        fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
        transition: 'opacity 0.18s', width: 'fit-content',
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >{ctaLabel} →</a>
    </section>
  );
}

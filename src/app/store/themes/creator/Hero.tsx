'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

export function CreatorHero({
  storeName, tagline, logoUrl, primaryColor = '#7C3AED', secondaryColor = '#EC4899',
  ctaLabel = '✨ Shop Now', ctaUrl = '#products', backgroundImage, textAlign = 'left', buttonStyle,
}: ThemeHeroProps) {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '80px 5% 90px',
      background: backgroundImage
        ? `linear-gradient(135deg, rgba(124,58,237,0.85), rgba(236,72,153,0.8)), url(${backgroundImage})`
        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      backgroundSize: backgroundImage ? 'cover' : undefined,
      backgroundPosition: backgroundImage ? 'center' : undefined,
      color: '#FFFFFF',
    }}>
      {/* Decorative floating shapes */}
      <div style={{
        position: 'absolute', top: -60, right: -40,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, left: -30,
        width: 280, height: 280, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 40, left: '40%',
        width: 80, height: 80, borderRadius: 20,
        background: 'rgba(255,255,255,0.07)',
        transform: 'rotate(45deg)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, display: 'flex', flexDirection: 'column', alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start', textAlign }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{
              width: 72, height: 72, borderRadius: 16,
              objectFit: 'cover', marginBottom: 20,
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          />
        )}

        <p style={{
          fontSize: '0.75rem', fontWeight: 800,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.85)', marginBottom: 12,
        }}>
          🎨 Welcome to
        </p>

        <h1 style={{
          fontWeight: 900,
          fontSize: 'clamp(2.4rem, 7vw, 4.5rem)',
          lineHeight: 1.08, margin: 0,
          letterSpacing: '-0.02em',
        }}>
          {storeName}
        </h1>

        {tagline && (
          <p style={{
            fontWeight: 500, fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: 18, lineHeight: 1.6,
            maxWidth: 480,
          }}>
            {tagline}
          </p>
        )}

        <a
          href={ctaUrl}
          style={{
            display: 'inline-block', marginTop: 32,
            padding: '16px 48px',
            background: '#FFFFFF',
            color: primaryColor,
            borderRadius: buttonStyle === 'pill' ? 50 : buttonStyle === 'square' ? 4 : 12,
            fontSize: '0.85rem', fontWeight: 800,
            letterSpacing: '0.04em',
            textDecoration: 'none', width: 'fit-content',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)';
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

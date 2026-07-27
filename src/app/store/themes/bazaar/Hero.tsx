'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

const poppins = "'Poppins', sans-serif";

export function BazaarHero({ storeName, tagline, logoUrl, ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage, textAlign = 'left', buttonStyle }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '72px 5%', overflow: 'hidden',
      background: backgroundImage ? undefined : 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 40%, #F0FDF4 100%)',
      color: '#064E3B', fontFamily: poppins, ...bgStyle,
    }}>
      {backgroundImage && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(5,150,105,0.88) 0%, rgba(16,185,129,0.8) 100%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Decorative shapes */}
      <div style={{
        position: 'absolute', top: -30, right: '10%', width: 160, height: 160,
        borderRadius: '50%', background: 'rgba(5,150,105,0.07)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -40, left: '5%', width: 120, height: 120,
        borderRadius: 24, background: 'rgba(249,115,22,0.06)', transform: 'rotate(25deg)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '30%', right: '4%', width: 60, height: 60,
        borderRadius: 16, background: 'rgba(5,150,105,0.06)', transform: 'rotate(-15deg)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 720,
        display: 'flex', flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        gap: 14, textAlign,
      }}>
        {logoUrl && (
          <div style={{
            background: '#FFFFFF', borderRadius: 14, padding: 6,
            display: 'inline-flex', marginBottom: 6,
            boxShadow: '0 4px 16px rgba(5,150,105,0.12)',
            border: '2px solid #D1FAE5',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={storeName}
              style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
          </div>
        )}

        <h1 style={{
          fontWeight: 800,
          fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
          letterSpacing: '-0.03em', lineHeight: 1.1,
          color: backgroundImage ? '#FFFFFF' : '#064E3B', margin: 0,
        }}>
          {storeName}
        </h1>

        {tagline && (
          <p style={{
            fontWeight: 500, fontSize: '1.05rem',
            color: backgroundImage ? 'rgba(255,255,255,0.92)' : '#047857',
            lineHeight: 1.55, maxWidth: 520, margin: 0,
          }}>{tagline}</p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
          <a href={ctaUrl} style={{
            display: 'inline-block', padding: '13px 36px',
            background: backgroundImage ? '#FFFFFF' : '#059669',
            color: backgroundImage ? '#059669' : '#FFFFFF',
            borderRadius: buttonStyle === 'pill' ? 999 : buttonStyle === 'square' ? 0 : 12,
            textDecoration: 'none',
            fontSize: '0.9rem', fontWeight: 700, width: 'fit-content',
            letterSpacing: '0.02em',
            boxShadow: backgroundImage ? '0 4px 16px rgba(0,0,0,0.12)' : '0 4px 14px rgba(5,150,105,0.3)',
            transition: 'all 0.2s',
            border: 'none', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = backgroundImage ? '0 6px 24px rgba(0,0,0,0.18)' : '0 6px 20px rgba(5,150,105,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = backgroundImage ? '0 4px 16px rgba(0,0,0,0.12)' : '0 4px 14px rgba(5,150,105,0.3)'; }}
          >{ctaLabel}</a>
        </div>

        {/* Badges */}
        <div style={{
          display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            background: backgroundImage ? 'rgba(255,255,255,0.15)' : 'rgba(5,150,105,0.08)',
            fontSize: '0.78rem', fontWeight: 600,
            color: backgroundImage ? '#FFFFFF' : '#047857',
            backdropFilter: backgroundImage ? 'blur(4px)' : undefined,
          }}>
            📦 Free Delivery
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 10,
            background: backgroundImage ? 'rgba(255,255,255,0.15)' : 'rgba(249,115,22,0.08)',
            fontSize: '0.78rem', fontWeight: 600,
            color: backgroundImage ? '#FFFFFF' : '#C2410C',
            backdropFilter: backgroundImage ? 'blur(4px)' : undefined,
          }}>
            💬 WhatsApp Us
          </span>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import type { ThemeHeroProps } from '../types';

export function SparkHero({ storeName, tagline, logoUrl, ctaLabel = 'Book a Free Consultation', ctaUrl = '#products', backgroundImage, textAlign = 'center', buttonStyle }: ThemeHeroProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover' as const, backgroundPosition: 'center' as const }
    : {};

  return (
    <section style={{
      position: 'relative', padding: '100px 5% 90px', overflow: 'hidden',
      background: '#FFF8EE', color: '#2D1B69', ...bgStyle,
    }}>
      {/* Decorative purple gradient accent — top-left corner */}
      <div style={{
        position: 'absolute', top: -120, left: -120,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,27,105,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Decorative gold accent — bottom-right */}
      <div style={{
        position: 'absolute', bottom: -80, right: -80,
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Sparkle decorations */}
      <div style={{ position: 'absolute', top: 60, right: '18%', fontSize: '1.6rem', opacity: 0.15, pointerEvents: 'none', color: '#D97706' }}>✦</div>
      <div style={{ position: 'absolute', top: 140, left: '10%', fontSize: '1rem', opacity: 0.10, pointerEvents: 'none', color: '#7C3AED' }}>✦</div>
      <div style={{ position: 'absolute', bottom: 80, left: '22%', fontSize: '1.3rem', opacity: 0.08, pointerEvents: 'none', color: '#D97706' }}>✦</div>

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        textAlign,
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName}
            style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', marginBottom: 28, border: '3px solid #D97706' }} />
        )}

        <p style={{
          fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: '#D97706', fontWeight: 600, marginBottom: 18,
        }}>Welcome to Your Transformation</p>

        <h1 style={{
          fontFamily: "'Raleway', Georgia, serif",
          fontWeight: 700,
          fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
          letterSpacing: '-0.01em', lineHeight: 1.15,
          color: '#2D1B69', margin: 0,
        }}>{storeName}</h1>

        {tagline && (
          <p style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontWeight: 400, fontSize: '1.1rem', color: '#5B4A8A',
            letterSpacing: '0.03em', marginTop: 20, lineHeight: 1.65,
            maxWidth: 540,
          }}>{tagline}</p>
        )}

        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 36, padding: '15px 44px',
          background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
          color: '#FFF8EE',
          fontFamily: "'Raleway', Georgia, serif",
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.3s', width: 'fit-content',
          borderRadius: buttonStyle === 'pill' ? 100 : buttonStyle === 'square' ? 0 : 10,
          boxShadow: '0 4px 20px rgba(217,119,6,0.30)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(217,119,6,0.40)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(217,119,6,0.30)'; }}
        >{ctaLabel}</a>

        {/* Authority badges */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 40, flexWrap: 'wrap',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        }}>
          {[
            { icon: '🏆', label: '500+ Clients' },
            { icon: '📈', label: 'Proven Results' },
            { icon: '🎯', label: 'Certified' },
          ].map(b => (
            <div key={b.label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 100,
              background: 'rgba(45,27,105,0.06)', border: '1px solid rgba(45,27,105,0.10)',
            }}>
              <span style={{ fontSize: '1rem' }}>{b.icon}</span>
              <span style={{
                fontFamily: "'Raleway', Georgia, serif",
                fontSize: '0.75rem', fontWeight: 600, color: '#2D1B69', letterSpacing: '0.04em',
              }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import type { ThemeHeroProps } from '../types';

export function PulseHero({
  storeName, tagline, logoUrl, primaryColor = '#FF6B35', secondaryColor = '#F7C948',
  ctaLabel = '🔥 Shop Now', ctaUrl = '#products', backgroundImage, textAlign = 'center', buttonStyle,
}: ThemeHeroProps) {
  const [ctaHover, setCtaHover] = useState(false);

  const socialLinks = [
    { icon: 'IG', label: 'Instagram' },
    { icon: 'X', label: 'Twitter' },
    { icon: 'YT', label: 'YouTube' },
    { icon: 'TT', label: 'TikTok' },
  ];

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '80px 5% 90px',
      background: backgroundImage
        ? `linear-gradient(135deg, rgba(255,107,53,0.88), rgba(247,201,72,0.85)), url(${backgroundImage})`
        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      backgroundSize: backgroundImage ? 'cover' : undefined,
      backgroundPosition: backgroundImage ? 'center' : undefined,
      color: '#FFFFFF',
      textAlign,
    }}>
      {/* Decorative floating dots */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${15 + i * 14}%`,
          left: `${10 + i * 15}%`,
          width: 8 + i * 4,
          height: 8 + i * 4,
          borderRadius: '50%',
          background: `rgba(255,255,255,${0.08 + i * 0.02})`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Decorative circles */}
      <div style={{
        position: 'absolute', top: -80, right: -60,
        width: 240, height: 240, borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -50,
        width: 320, height: 320, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 50, right: '30%',
        width: 60, height: 60, borderRadius: 16,
        background: 'rgba(255,255,255,0.08)',
        transform: 'rotate(45deg)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, maxWidth: 640,
        display: 'flex', flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {/* Avatar with gradient ring */}
        {logoUrl && (
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF6B35, #F7C948)',
            padding: 4, marginBottom: 24,
            boxShadow: '0 6px 28px rgba(255,107,53,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={storeName}
              style={{
                width: 84, height: 84, borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #FFFAF5',
              }}
            />
          </div>
        )}

        <p style={{
          fontSize: '0.7rem', fontWeight: 800,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.85)', marginBottom: 12,
        }}>
          ✦ Welcome to
        </p>

        <h1 style={{
          fontWeight: 900, fontFamily: "'Outfit', sans-serif",
          fontSize: 'clamp(2.6rem, 8vw, 5rem)',
          lineHeight: 1.05, margin: 0,
          letterSpacing: '-0.03em',
          textShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          {storeName}
        </h1>

        {tagline && (
          <p style={{
            fontWeight: 500, fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.9)',
            marginTop: 16, lineHeight: 1.6,
            maxWidth: 480,
          }}>
            {tagline}
          </p>
        )}

        {/* Social link pills */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap',
          justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        }}>
          {socialLinks.map(s => (
            <span key={s.icon} style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
              padding: '8px 18px', borderRadius: 24,
              fontSize: '0.72rem', fontWeight: 800,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 0.3s',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {s.icon}
            </span>
          ))}
        </div>

        <a
          href={ctaUrl}
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            display: 'inline-block', marginTop: 36,
            padding: '16px 52px',
            background: ctaHover ? '#FFFFFF' : 'linear-gradient(135deg, #FF6B35, #F7C948)',
            color: ctaHover ? '#FF6B35' : '#FFFFFF',
            borderRadius: buttonStyle === 'pill' ? 50 : buttonStyle === 'square' ? 6 : 14,
            fontSize: '0.88rem', fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.04em',
            textDecoration: 'none', width: 'fit-content',
            boxShadow: ctaHover
              ? '0 8px 32px rgba(255,107,53,0.3)'
              : '0 4px 24px rgba(255,107,53,0.35)',
            transform: ctaHover ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            border: ctaHover ? '2px solid #FF6B35' : '2px solid transparent',
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

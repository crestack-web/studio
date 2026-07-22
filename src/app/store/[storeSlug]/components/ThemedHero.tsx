'use client';

import React from 'react';
import type { StorefrontTheme } from '@/app/sell/mo-sell.types';

interface Props {
  storeName: string;
  tagline?: string | null;
  logoUrl?: string | null;
  theme: StorefrontTheme;
  primaryColor: string;
  secondaryColor: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundImage?: string | null;
}

export function ThemedHero({
  storeName, tagline, theme, primaryColor, secondaryColor,
  ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage,
}: Props) {

  const bgOverride = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  // Bold theme — oversized type, accent on last word, green CTA
  if (theme === 'bold') {
    const words = storeName.trim().split(' ');
    const last  = words.pop();
    return (
      <section className="sf-hero" style={{ '--sf-primary': primaryColor, '--sf-secondary': secondaryColor, ...bgOverride } as unknown as React.CSSProperties}>
        <h1>
          {words.length > 0 && <>{words.join(' ')} </>}
          <span>{last}</span>
        </h1>
        {tagline && <p>{tagline}</p>}
        <a href={ctaUrl} className="sf-hero-cta" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 24, padding: '12px 28px',
          background: 'var(--sf-green)', color: '#09090B',
          borderRadius: 'var(--sf-radius-sm)',
          fontWeight: 700, fontSize: '0.82rem',
          letterSpacing: '-0.01em', textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          {ctaLabel}
        </a>
      </section>
    );
  }

  // Luxe theme — dark, editorial, gold
  if (theme === 'luxe') {
    return (
      <section className="sf-hero" style={bgOverride}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sf-gold)', marginBottom: 16, fontWeight: 500 }}>
          Welcome
        </p>
        <h1>{storeName}</h1>
        {tagline && <p>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 28,
          padding: '12px 32px',
          border: '1px solid var(--sf-gold)', color: 'var(--sf-gold)',
          fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sf-gold)';
            (e.currentTarget as HTMLAnchorElement).style.color = '#0A0A0A';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sf-gold)';
          }}
        >
          {ctaLabel}
        </a>
      </section>
    );
  }

    // Market theme — energetic, price-forward
  if (theme === 'market') {
    return (
      <section className="sf-hero" style={{ '--sf-primary': primaryColor, '--sf-secondary': secondaryColor, ...bgOverride } as unknown as React.CSSProperties}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>
          🛍️ Fresh arrivals daily
        </p>
        <h1>{storeName}</h1>
        {tagline && <p>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 20, padding: '12px 28px',
          background: '#fff', color: 'var(--sf-orange)',
          borderRadius: 100, fontWeight: 800, fontSize: '0.88rem',
          textDecoration: 'none',
        }}>
          {ctaLabel}
        </a>
      </section>
    );
  }

  // Studio theme — sparse, photography-first
  if (theme === 'studio') {
    return (
      <section className="sf-hero" style={bgOverride}>
        <h1>{storeName}</h1>
        {tagline && <p>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 28,
          padding: '11px 28px',
          border: '1px solid var(--sf-text-1)', color: 'var(--sf-text-1)',
          fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s',
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sf-text-1)';
            (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--sf-text-1)';
          }}
        >
          {ctaLabel}
        </a>
      </section>
    );
  }

  // Minimal theme — quiet, wellness feel
  if (theme === 'minimal') {
    return (
      <section className="sf-hero" style={bgOverride}>
        <p style={{ fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sf-sage)', marginBottom: 16, fontWeight: 500 }}>
          Curated Collection
        </p>
        <h1>{storeName}</h1>
        {tagline && <p>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 28,
          padding: '11px 32px',
          background: 'var(--sf-text-1)', color: 'var(--sf-surface)',
          fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          textDecoration: 'none', borderRadius: 'var(--sf-radius-sm)',
          transition: 'background 0.2s',
        }}>
          {ctaLabel}
        </a>
      </section>
    );
  }

  // Classic (default) — gradient banner
  return (
    <section className="sf-hero" style={{ '--sf-primary': primaryColor, '--sf-secondary': secondaryColor, ...bgOverride } as unknown as React.CSSProperties}>
      <h1>Welcome to {storeName}</h1>
      <p>{tagline ?? 'Discover our collection and shop with confidence. Fast delivery, easy returns.'}</p>
      <a href={ctaUrl} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        marginTop: 20, padding: '12px 28px',
        background: 'rgba(255,255,255,0.2)', color: '#fff',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: 'var(--sf-radius)', fontWeight: 700,
        fontSize: '0.9rem', textDecoration: 'none',
        backdropFilter: 'blur(4px)', transition: 'background 0.2s',
      }}>
        {ctaLabel}
      </a>
    </section>
  );
}

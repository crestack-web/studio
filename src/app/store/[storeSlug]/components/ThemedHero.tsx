'use client';

import React from 'react';
import type { StorefrontTheme } from '@/types/mo-sell.types';

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
  textAlign?: 'left' | 'center' | 'right';
  buttonStyle?: 'pill' | 'square' | 'rounded';
}

function btnRadius(style?: 'pill' | 'square' | 'rounded', theme?: string): number {
  if (style === 'pill') return 100;
  if (style === 'square') return 0;
  if (style === 'rounded') return 8;
  // default per theme
  if (theme === 'glow') return 100;
  if (theme === 'market') return 100;
  if (theme === 'pulse') return 100;
  if (theme === 'bazaar') return 8;
  if (theme === 'spark') return 100;
  if (theme === 'creator') return 6;
  if (theme === 'vault') return 8;
  if (theme === 'atlas') return 8;
  return 0;
}

export function ThemedHero({
  storeName, tagline, logoUrl, theme, primaryColor, secondaryColor,
  ctaLabel = 'Shop Now', ctaUrl = '#products', backgroundImage,
  textAlign = 'left', buttonStyle,
}: Props) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const alignMap = { left: 'flex-start' as const, center: 'center' as const, right: 'flex-end' as const };
  const align = alignMap[textAlign] ?? 'flex-start';
  const textAl = textAlign;
  const radius = btnRadius(buttonStyle, theme);

  // ── Luxe ──────────────────────────────────────────────────────────────────
  if (theme === 'luxe') {
    return (
      <section className="sf-hero" style={{ background: '#111111', ...bgStyle, alignItems: align, textAlign: textAl }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 56, height: 56, borderRadius: 4, objectFit: 'cover', marginBottom: 16 }}
          />
        )}
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 12, fontWeight: 500 }}>
          New Collection
        </p>
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 400, letterSpacing: '0.04em', color: '#F5F0E8', lineHeight: 1.15 }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#A89878', maxWidth: 440, fontSize: '1rem', marginTop: 8 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-block', marginTop: 28, padding: '12px 36px',
          border: '1px solid #C9A84C', color: '#C9A84C',
          fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s', borderRadius: radius, width: 'fit-content',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#C9A84C'; (e.currentTarget as HTMLAnchorElement).style.color = '#0A0A0A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#C9A84C'; }}
        >
          {ctaLabel}
        </a>
      </section>
    );
  }

  // ── Glow ──────────────────────────────────────────────────────────────────
  if (theme === 'glow') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor}18 0%, ${secondaryColor}0d 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl,
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', marginBottom: 14, border: `3px solid ${primaryColor}40` }}
          />
        )}
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: primaryColor, marginBottom: 10, fontWeight: 700, opacity: 0.8 }}>
          Beauty · Wellness
        </p>
        <h1 style={{ color: '#2D1B12', fontFamily: '"DM Sans","Plus Jakarta Sans",sans-serif', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15 }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#7A5545', maxWidth: 460, fontSize: '1.05rem', marginTop: 8, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 24, padding: '13px 32px',
          background: primaryColor, color: '#fff',
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', width: 'fit-content',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
        >
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Market ─────────────────────────────────────────────────────────────────
  if (theme === 'market') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl,
      } as React.CSSProperties}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', marginBottom: 14 }}
          />
        )}
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
          🛍️ Fresh arrivals daily
        </p>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15 }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: 'rgba(255,255,255,0.88)', maxWidth: 460, fontSize: '1.05rem', marginTop: 8, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 22, padding: '13px 32px',
          background: '#fff', color: primaryColor,
          borderRadius: radius, fontWeight: 800, fontSize: '0.92rem',
          textDecoration: 'none', transition: 'box-shadow 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Creator ────────────────────────────────────────────────────────────────
  if (theme === 'creator') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor}25 0%, ${secondaryColor}18 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl,
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', marginBottom: 14 }}
          />
        )}
        <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: primaryColor, marginBottom: 10, fontWeight: 700 }}>
          Build once. Sell forever.
        </p>
        <h1 style={{
          color: '#F8FAFC', fontFamily: '"Sora","Inter",sans-serif',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800,
          lineHeight: 1.12, letterSpacing: '-0.03em',
        }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#94A3B8', maxWidth: 480, fontSize: '1.1rem', marginTop: 10, lineHeight: 1.65 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 26, padding: '13px 32px',
          background: primaryColor, color: '#fff',
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s',
          fontFamily: '"Sora","Inter",sans-serif', width: 'fit-content',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
        >
          Browse Products →
        </a>
      </section>
    );
  }

  // ── Link theme — centered bio card (Stan Store / Linktree style) ──────────
  if (theme === 'link') {
    return (
      <section style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 20px 32px', textAlign: 'center', gap: 12,
        background: 'var(--sf-bg)',
      }}>
        {/* Avatar / Logo */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={storeName}
            style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--sf-border)' }}
          />
        ) : (
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            border: '3px solid transparent',
            backgroundClip: 'padding-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 700, color: '#fff',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {storeName.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Name */}
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--sf-text-1)', margin: 0, letterSpacing: '-0.02em' }}>
          {storeName}
        </h1>
        {/* Bio / tagline */}
        {tagline && (
          <p style={{ fontSize: '0.95rem', color: 'var(--sf-text-2)', margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
            {tagline}
          </p>
        )}
        {/* CTA */}
        <a href={ctaUrl} style={{
          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 28px', borderRadius: radius,
          background: primaryColor, color: '#fff',
          fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
          transition: 'opacity 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Pulse — social-first creator store ──────────────────────────────────
  if (theme === 'pulse') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        ...bgStyle, alignItems: 'center', textAlign: 'center',
      }}>
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={storeName}
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.3)', marginBottom: 14 }} />
        )}
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
          ✨ Your favorite creator
        </p>
        <h1 style={{ color: '#fff', fontFamily: '"Outfit",sans-serif', fontSize: 'clamp(2rem, 5.5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 480, fontSize: '1.05rem', marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          padding: '13px 32px', background: '#fff', color: primaryColor,
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Vault — digital product showcase ────────────────────────────────────
  if (theme === 'vault') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor}20 0%, #0B1D3A 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl, border: '1px solid #1E3A5F',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#60A5FA', marginBottom: 8 }}>
          ⚡ Instant Digital Delivery
        </p>
        <h1 style={{ color: '#F1F5F9', fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#94A3B8', maxWidth: 480, fontSize: '1.05rem', marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          padding: '13px 32px', background: '#3B82F6', color: '#fff',
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Atlas — professional services ───────────────────────────────────────
  if (theme === 'atlas') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}08 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl, border: '1px solid #E2E8F0',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: primaryColor, marginBottom: 8 }}>
          ⭐ Trusted by 200+ clients
        </p>
        <h1 style={{ color: '#1E293B', fontFamily: '"Manrope",sans-serif', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#64748B', maxWidth: 480, fontSize: '1.05rem', marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          padding: '13px 32px', background: '#0D9488', color: '#fff',
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Spark — coach & expert ──────────────────────────────────────────────
  if (theme === 'spark') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${secondaryColor}18 0%, ${primaryColor}12 100%)`,
        ...bgStyle, alignItems: align, textAlign: textAl, border: '1px solid #F3E8D8',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D97706', marginBottom: 8 }}>
          🏆 Transform Your Life
        </p>
        <h1 style={{ color: '#2D1B69', fontFamily: '"Raleway",sans-serif', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: '#5B4A8A', maxWidth: 480, fontSize: '1.05rem', marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          padding: '13px 32px', background: '#D97706', color: '#fff',
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Bazaar — small business ecommerce ───────────────────────────────────
  if (theme === 'bazaar') {
    return (
      <section className="sf-hero" style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        ...bgStyle, alignItems: 'center', textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
          📦 Shop Local · Deliver Fast
        </p>
        <h1 style={{ color: '#fff', fontFamily: '"Poppins",sans-serif', fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
          {storeName}
        </h1>
        {tagline && <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: 480, fontSize: '1.05rem', marginTop: 10, lineHeight: 1.6 }}>{tagline}</p>}
        <a href={ctaUrl} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 24,
          padding: '13px 32px', background: '#fff', color: primaryColor,
          borderRadius: radius, fontWeight: 700, fontSize: '0.9rem',
          textDecoration: 'none', transition: 'opacity 0.18s', width: 'fit-content',
        }}>
          {ctaLabel} →
        </a>
      </section>
    );
  }

  // ── Fallback (luxe) ────────────────────────────────────────────────────────
  return (
    <section className="sf-hero" style={{ background: '#111111', ...bgStyle, alignItems: align, textAlign: textAl }}>
      <h1 style={{ color: '#F5F0E8', fontFamily: '"Playfair Display",Georgia,serif', fontStyle: 'italic' }}>{storeName}</h1>
      {tagline && <p style={{ color: '#A89878' }}>{tagline}</p>}
      <a href={ctaUrl} style={{ display: 'inline-block', marginTop: 24, padding: '12px 32px', border: '1px solid #C9A84C', color: '#C9A84C', textDecoration: 'none', fontSize: '0.8rem', borderRadius: radius, width: 'fit-content' }}>{ctaLabel}</a>
    </section>
  );
}

'use client';

import React from 'react';
import type { ThemeMeta } from '@/app/store/themes/registry';

/**
 * ThemeThumbnail
 *
 * Renders a faithful miniature of what each storefront theme looks like —
 * nav bar, hero section, and product card grid — all in the theme's
 * actual color palette and visual style.
 */

interface Props {
  theme: ThemeMeta;
  /** Width of the thumbnail in px. Height is always 4:3 ratio of width. */
  width?: number;
}

export function ThemeThumbnail({ theme: t, width = 160 }: Props) {
  const h = Math.round(width * 0.75); // 4:3 ratio
  const scale = width / 200;          // design base is 200px wide

  // Per-theme palette
  const p: Record<string, {
    bg: string; surface: string; border: string;
    text: string; textFaint: string;
    navBg: string; navText: string;
    heroBg: string; heroText: string;
    ctaBg: string; ctaText: string;
    cardBg: string; cardBorder: string;
    radius: number;
  }> = {
    classic: {
      bg: '#F8FAFC', surface: '#fff', border: '#E2E8F0',
      text: '#0F172A', textFaint: '#94A3B8',
      navBg: '#fff', navText: '#0F172A',
      heroBg: `linear-gradient(135deg, ${t.previewAccent} 0%, #6366F1 100%)`,
      heroText: '#fff',
      ctaBg: 'rgba(255,255,255,0.25)', ctaText: '#fff',
      cardBg: '#fff', cardBorder: '#E2E8F0',
      radius: 6,
    },
    luxe: {
      bg: '#0A0A0A', surface: '#111', border: '#2A2A2A',
      text: '#F5F0E8', textFaint: '#4A4A4A',
      navBg: '#0A0A0A', navText: '#F5F0E8',
      heroBg: '#0A0A0A',
      heroText: '#F5F0E8',
      ctaBg: 'transparent', ctaText: '#C9A84C',
      cardBg: '#111', cardBorder: '#2A2A2A',
      radius: 0,
    },
    market: {
      bg: '#FFF7ED', surface: '#fff', border: '#FDE8D0',
      text: '#1C0A00', textFaint: '#92400E',
      navBg: `${t.previewAccent}`, navText: '#fff',
      heroBg: `linear-gradient(135deg, ${t.previewAccent} 0%, #F59E0B 100%)`,
      heroText: '#fff',
      ctaBg: '#fff', ctaText: t.previewAccent,
      cardBg: '#fff', cardBorder: '#FDE8D0',
      radius: 6,
    },
    studio: {
      bg: '#FAFAFA', surface: '#fff', border: '#E4E4E7',
      text: '#18181B', textFaint: '#A1A1AA',
      navBg: '#fff', navText: '#18181B',
      heroBg: '#FAFAFA',
      heroText: '#18181B',
      ctaBg: 'transparent', ctaText: '#18181B',
      cardBg: '#fff', cardBorder: '#E4E4E7',
      radius: 0,
    },
    bold: {
      bg: '#09090B', surface: '#111', border: '#27272A',
      text: '#FAFAFA', textFaint: '#3F3F46',
      navBg: '#09090B', navText: '#FAFAFA',
      heroBg: `linear-gradient(135deg, ${t.previewAccent} 0%, #16A34A 100%)`,
      heroText: '#FAFAFA',
      ctaBg: '#22C55E', ctaText: '#09090B',
      cardBg: '#111', cardBorder: '#27272A',
      radius: 3,
    },
    minimal: {
      bg: '#F8F8F5', surface: '#fff', border: '#E5E5E0',
      text: '#1A1A18', textFaint: '#9A9A94',
      navBg: '#fff', navText: '#1A1A18',
      heroBg: '#F8F8F5',
      heroText: '#1A1A18',
      ctaBg: '#1A1A18', ctaText: '#F8F8F5',
      cardBg: '#fff', cardBorder: '#E5E5E0',
      radius: 4,
    },
  };

  const c = p[t.id] ?? p.classic;
  const r = c.radius;
  const s = scale; // scale factor

  // Nav height, hero height, grid row height (design base)
  const navH  = 18 * s;
  const heroH = 38 * s;
  const cardH = 28 * s;
  const cardW = 48 * s;
  const pad   = 8 * s;
  const gap   = 4 * s;

  // Gold color for luxe accents
  const gold = '#C9A84C';

  return (
    <div style={{
      width,
      height: h,
      background: c.bg,
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'system-ui, sans-serif',
      userSelect: 'none',
      flexShrink: 0,
    }}>

      {/* ── Nav bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: navH,
        background: c.navBg,
        borderBottom: `${0.5 * s}px solid ${c.border}`,
        display: 'flex', alignItems: 'center',
        padding: `0 ${pad}px`,
        gap: gap,
        zIndex: 2,
      }}>
        {/* Logo dot */}
        <div style={{
          width: 10 * s, height: 10 * s,
          borderRadius: r > 0 ? 3 * s : 0,
          background: t.previewAccent,
          flexShrink: 0,
        }} />
        {/* Store name line */}
        <div style={{
          flex: 1, height: 5 * s, borderRadius: 2 * s,
          background: c.navText + '40',
        }} />
        {/* Cart button */}
        <div style={{
          width: 18 * s, height: 8 * s,
          borderRadius: r > 0 ? 3 * s : 0,
          background: t.id === 'luxe' ? gold : t.id === 'studio' ? c.navText + '20' : t.previewAccent,
          opacity: 0.85,
        }} />
      </div>

      {/* ── Hero ── */}
      <div style={{
        position: 'absolute',
        top: navH,
        left: t.id === 'luxe' || t.id === 'studio' || t.id === 'minimal' ? 0 : pad * 0.5,
        right: t.id === 'luxe' || t.id === 'studio' || t.id === 'minimal' ? 0 : pad * 0.5,
        height: heroH,
        background: c.heroBg,
        borderRadius: t.id === 'luxe' || t.id === 'studio' ? 0 : r * s * 1.5,
        marginTop: t.id === 'luxe' || t.id === 'studio' ? 0 : pad * 0.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: `0 ${pad}px`,
        gap: gap * 0.8,
        overflow: 'hidden',
      }}>
        {/* Luxe: gold "Welcome" eyebrow */}
        {t.id === 'luxe' && (
          <div style={{ height: 3 * s, width: 24 * s, borderRadius: 0, background: gold, opacity: 0.9 }} />
        )}
        {/* Market: eyebrow label */}
        {t.id === 'market' && (
          <div style={{ height: 3 * s, width: 30 * s, borderRadius: 2 * s, background: '#fff', opacity: 0.7 }} />
        )}
        {/* Minimal: eyebrow label */}
        {t.id === 'minimal' && (
          <div style={{ height: 3 * s, width: 26 * s, borderRadius: 2 * s, background: '#71717A', opacity: 0.5 }} />
        )}
        {/* Hero heading */}
        <div style={{
          height: t.id === 'bold' ? 10 * s : 8 * s,
          width: t.id === 'bold' ? '85%' : '70%',
          borderRadius: r > 0 ? 2 * s : 0,
          background: t.id === 'luxe' ? c.heroText + 'CC'
            : t.id === 'studio' || t.id === 'minimal' ? c.text + 'CC'
            : '#fff',
          opacity: 0.9,
        }} />
        {/* Hero sub-line */}
        <div style={{
          height: 4 * s, width: '55%', borderRadius: 2 * s,
          background: t.id === 'studio' || t.id === 'minimal' ? c.text + '50'
            : t.id === 'luxe' ? c.heroText + '60'
            : '#fff',
          opacity: 0.65,
        }} />
        {/* CTA button */}
        <div style={{
          width: 34 * s,
          height: 8 * s,
          borderRadius: t.id === 'market' ? 100 : r > 0 ? 3 * s : 0,
          background: c.ctaBg === 'transparent'
            ? 'transparent'
            : c.ctaBg,
          border: t.id === 'luxe' ? `${0.75 * s}px solid ${gold}`
            : t.id === 'studio' ? `${0.75 * s}px solid ${c.text}`
            : 'none',
          marginTop: gap * 0.5,
          opacity: 0.9,
        }} />
      </div>

      {/* ── Product card grid ── */}
      <div style={{
        position: 'absolute',
        top: navH + heroH + (t.id === 'luxe' || t.id === 'studio' ? 0 : pad * 0.5) + (pad * 1.5),
        left: pad,
        right: pad,
        display: 'flex',
        gap: gap,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1,
            background: c.cardBg,
            border: `${0.5 * s}px solid ${c.cardBorder}`,
            borderRadius: r > 0 ? r * s : 0,
            overflow: 'hidden',
          }}>
            {/* Card image placeholder */}
            <div style={{
              height: cardH * 0.65,
              background: i === 0
                ? t.previewAccent + '30'
                : c.border,
            }} />
            {/* Card text lines */}
            <div style={{ padding: `${gap}px` }}>
              <div style={{ height: 3 * s, background: c.text + '50', borderRadius: 1, marginBottom: 2 * s }} />
              <div style={{ height: 3 * s, width: '60%', background: t.previewAccent + '80', borderRadius: 1 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

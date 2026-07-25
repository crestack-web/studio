'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

const COLORS = {
  roseGold: '#B76E79',
  roseGoldLight: '#D4A0A6',
  softPink: '#FDE8E9',
  warmWhite: '#FFFAF7',
  gold: '#D4A574',
  cream: '#FFF5EE',
  dustyRose: '#C9929B',
  blush: '#F5D5CC',
};

export function GlowCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 20, overflow: 'hidden',
        background: COLORS.warmWhite,
        border: `1px solid rgba(183,110,121,0.15)`,
        boxShadow: hovered
          ? '0 12px 36px rgba(183,110,121,0.15), 0 0 20px rgba(183,110,121,0.08)'
          : '0 2px 12px rgba(183,110,121,0.06)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
      }}>
        {/* Cover image */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 240, borderRadius: '20px 20px 0 0',
          background: COLORS.softPink,
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                borderRadius: 16, margin: 0,
                transition: 'transform 0.6s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, ${COLORS.softPink} 0%, ${COLORS.cream} 50%, ${COLORS.blush} 100%)`,
            }} />
          )}

          {/* Warm gradient overlay at bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to top, rgba(183,110,121,0.55) 0%, rgba(253,232,233,0.15) 50%, transparent 100%)`,
          }} />

          {/* Content on image */}
          <div style={{
            position: 'absolute', bottom: 18, left: 18, right: 18,
          }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontSize: '1.35rem', color: COLORS.warmWhite,
              margin: 0, letterSpacing: '0.01em',
              textShadow: '0 1px 8px rgba(0,0,0,0.1)',
            }}>{collection.title}</p>

            {collection.description && (
              <p style={{
                fontSize: '0.78rem', color: 'rgba(255,250,247,0.85)', margin: '6px 0 0',
                fontWeight: 300, letterSpacing: '0.02em',
                textShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>{collection.description}</p>
            )}

            {/* Product count */}
            {collection.productCount != null && collection.productCount > 0 && (
              <span style={{
                display: 'inline-block', marginTop: 10,
                fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '4px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
                color: COLORS.warmWhite,
                textTransform: 'uppercase',
              }}>
                {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

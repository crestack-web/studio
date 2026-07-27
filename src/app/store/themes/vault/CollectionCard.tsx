'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

const C = {
  navy: '#0B1D3A',
  surface: '#112240',
  blue: '#3B82F6',
  lightBlue: '#60A5FA',
  white: '#F1F5F9',
  muted: '#94A3B8',
};

export function VaultCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
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
        borderRadius: 16, overflow: 'hidden',
        background: C.surface,
        border: hovered
          ? '1px solid rgba(59,130,246,0.35)'
          : '1px solid rgba(59,130,246,0.1)',
        boxShadow: hovered
          ? '0 12px 36px rgba(59,130,246,0.12), 0 0 20px rgba(59,130,246,0.05)'
          : '0 2px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
      }}>
        {/* Cover image */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 220,
          background: C.navy,
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.6s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, ${C.surface} 0%, ${C.navy} 50%, #0A1628 100%)`,
            }} />
          )}

          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(11,29,58,0.85) 0%, rgba(11,29,58,0.2) 50%, transparent 100%)',
          }} />

          {/* Content on image */}
          <div style={{
            position: 'absolute', bottom: 18, left: 18, right: 18,
          }}>
            {/* Product count pill */}
            {collection.productCount != null && collection.productCount > 0 && (
              <span style={{
                display: 'inline-block', marginBottom: 10,
                fontSize: '0.56rem', fontWeight: 600, letterSpacing: '0.1em',
                padding: '4px 12px', borderRadius: 6,
                background: C.blue,
                color: '#FFFFFF',
                textTransform: 'uppercase',
              }}>
                {collection.productCount} {collection.productCount === 1 ? 'product' : 'products'}
              </span>
            )}

            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: '1.25rem', color: C.white,
              margin: 0, letterSpacing: '-0.01em',
            }}>{collection.title}</p>

            {collection.description && (
              <p style={{
                fontSize: '0.78rem', color: C.muted, margin: '6px 0 0',
                fontWeight: 400, lineHeight: 1.5,
              }}>{collection.description}</p>
            )}

            <p style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.7rem', fontWeight: 600,
              color: C.lightBlue, marginTop: 12,
              letterSpacing: '0.02em',
            }}>Browse Collection →</p>
          </div>
        </div>
      </div>
    </a>
  );
}

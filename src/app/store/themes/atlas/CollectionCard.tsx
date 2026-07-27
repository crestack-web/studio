'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

const C = {
  slate: '#1E293B',
  slateMuted: '#64748B',
  teal: '#0D9488',
  tealLight: '#14B8A6',
  tealPale: '#CCFBF1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

export function AtlasCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
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
        borderRadius: 14, overflow: 'hidden',
        background: C.white,
        border: `1px solid ${hovered ? C.teal : C.border}`,
        boxShadow: hovered
          ? '0 12px 32px rgba(13,148,136,0.1), 0 0 0 1px rgba(13,148,136,0.12)'
          : '0 1px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}>
        {/* Cover image */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          height: 220,
          background: C.bg,
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, ${C.tealPale} 0%, ${C.bg} 100%)`,
            }} />
          )}

          {/* Product count pill */}
          {collection.productCount != null && collection.productCount > 0 && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em',
              padding: '4px 12px', borderRadius: 6,
              background: C.teal, color: C.white,
              fontFamily: "'Manrope', sans-serif",
              textTransform: 'uppercase',
            }}>
              {collection.productCount} {collection.productCount === 1 ? 'service' : 'services'}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '18px 18px 20px' }}>
          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            fontSize: '1.05rem', color: C.slate,
            margin: 0, lineHeight: 1.3,
          }}>{collection.title}</p>

          {collection.description && (
            <p style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.8rem', color: C.slateMuted, margin: '8px 0 0',
              fontWeight: 400, lineHeight: 1.5,
            }}>{collection.description}</p>
          )}

          <p style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '0.68rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: C.teal, margin: '14px 0 0',
          }}>
            View Services →
          </p>
        </div>
      </div>
    </a>
  );
}

'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

export function SparkCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
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
        background: '#FFFFFF',
        border: hovered ? '2px solid #7C3AED' : '2px solid rgba(45,27,105,0.06)',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 36px rgba(45,27,105,0.12)' : '0 2px 12px rgba(45,27,105,0.04)',
      }}>
        {/* Cover image */}
        <div style={{
          height: 240, overflow: 'hidden', background: '#FFF8EE',
          position: 'relative',
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #7C3AED 0%, #D97706 100%)',
              opacity: 0.12,
            }} />
          )}

          {/* Purple gradient overlay on hover */}
          <div style={{
            position: 'absolute', inset: 0,
            background: hovered
              ? 'linear-gradient(135deg, rgba(45,27,105,0.55) 0%, rgba(124,58,237,0.35) 100%)'
              : 'linear-gradient(to top, rgba(45,27,105,0.35) 0%, transparent 60%)',
            transition: 'background 0.4s ease',
          }} />

          {/* Product count pill — gold */}
          {collection.productCount != null && collection.productCount > 0 && (
            <span style={{
              position: 'absolute', top: 14, right: 14,
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
              padding: '5px 14px', borderRadius: 100,
              background: 'linear-gradient(135deg, #D97706, #F59E0B)',
              color: '#FFFFFF',
            }}>{collection.productCount} {collection.productCount === 1 ? 'Program' : 'Programs'}</span>
          )}

          {/* Title overlay */}
          <div style={{
            position: 'absolute', bottom: 20, left: 22, right: 22,
          }}>
            <p style={{
              fontFamily: "'Raleway', Georgia, serif",
              fontWeight: 700, fontSize: '1.35rem', color: '#FFFFFF',
              margin: 0, letterSpacing: '0.01em',
              textShadow: '0 2px 8px rgba(45,27,105,0.30)',
            }}>{collection.title}</p>
            {collection.description && (
              <p style={{
                fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: '6px 0 0',
                fontWeight: 400, letterSpacing: '0.02em',
                lineHeight: 1.5,
              }}>{collection.description}</p>
            )}
          </div>
        </div>

        {/* Bottom text row */}
        <div style={{ padding: '14px 22px 16px' }}>
          <span style={{
            fontFamily: "'Raleway', Georgia, serif",
            fontSize: '0.74rem', fontWeight: 700,
            color: '#7C3AED', letterSpacing: '0.04em',
          }}>Explore Programs →</span>
        </div>
      </div>
    </a>
  );
}

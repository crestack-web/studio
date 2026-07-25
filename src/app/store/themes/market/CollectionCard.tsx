'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

export function MarketCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative', height: 220, borderRadius: 12, overflow: 'hidden',
        border: `2px solid ${hovered ? '#EA580C' : '#E5E7EB'}`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 20px rgba(234,88,12,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
      }}>
        {collection.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={collection.coverImageUrl} alt={collection.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)',
          }} />
        )}

        {/* Gradient overlay — title area at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#F59E0B',
              background: 'rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 4,
            }}>
              Browse
            </span>
            {collection.productCount != null && collection.productCount > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              }}>
                {collection.productCount} items
              </span>
            )}
          </div>

          <h3 style={{
            fontWeight: 800, fontSize: '1.2rem', color: '#FFFFFF',
            margin: 0, lineHeight: 1.2,
          }}>{collection.title}</h3>

          {collection.description && (
            <p style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)',
              margin: '5px 0 0', lineHeight: 1.4, fontWeight: 500,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{collection.description}</p>
          )}
        </div>
      </div>
    </a>
  );
}

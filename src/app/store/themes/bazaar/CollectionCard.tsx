'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

const poppins = "'Poppins', sans-serif";

export function BazaarCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'relative', height: 220, borderRadius: 14, overflow: 'hidden',
        border: `2px solid ${hovered ? '#059669' : '#E5E7EB'}`,
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(5,150,105,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease',
        fontFamily: poppins,
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
            background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
          }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(6,78,59,0.75) 0%, rgba(5,150,105,0.15) 50%, transparent 100%)',
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
              letterSpacing: '0.08em', color: '#ECFDF5',
              background: 'rgba(5,150,105,0.5)', padding: '3px 10px', borderRadius: 8,
            }}>
              Collection
            </span>
            {collection.productCount != null && collection.productCount > 0 && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 8,
              }}>
                {collection.productCount} items
              </span>
            )}
          </div>

          <h3 style={{
            fontWeight: 700, fontSize: '1.15rem', color: '#FFFFFF',
            margin: 0, lineHeight: 1.2,
          }}>{collection.title}</h3>

          {collection.description && (
            <p style={{
              fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)',
              margin: '5px 0 8px', lineHeight: 1.4, fontWeight: 500,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{collection.description}</p>
          )}

          <span style={{
            fontSize: '0.78rem', fontWeight: 700,
            color: '#ECFDF5', display: 'inline-flex', alignItems: 'center', gap: 4,
            transition: 'gap 0.2s',
            ...(hovered ? { gap: 8 } : {}),
          }}>
            Shop Collection →
          </span>
        </div>
      </div>
    </a>
  );
}

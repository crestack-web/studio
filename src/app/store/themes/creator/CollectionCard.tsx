'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

export function CreatorCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow: hovered
          ? '0 12px 40px rgba(124,58,237,0.25), 0 0 0 1px rgba(124,58,237,0.3)'
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Cover image */}
        <div style={{
          position: 'relative', height: 200, overflow: 'hidden',
          margin: 10, borderRadius: 12,
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={collection.coverImageUrl}
              alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.08)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #C4B5FD 0%, #F9A8D4 50%, #FDE68A 100%)',
            }} />
          )}

          {/* Purple hover overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: hovered
              ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(236,72,153,0.3))'
              : 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 60%)',
            transition: 'background 0.4s ease',
            borderRadius: 12,
          }} />

          {/* Product count pill */}
          {collection.productCount != null && collection.productCount > 0 && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
              color: '#FFFFFF',
              padding: '5px 14px', borderRadius: 20,
              fontSize: '0.7rem', fontWeight: 800,
              boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
            }}>
              {collection.productCount} {collection.productCount === 1 ? 'item' : 'items'}
            </div>
          )}

          {/* Collection title overlay */}
          <div style={{
            position: 'absolute', bottom: 14, left: 14, right: 14,
          }}>
            <p style={{
              fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF',
              margin: 0, lineHeight: 1.2,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
              {collection.title}
            </p>
          </div>
        </div>

        {/* Description area */}
        <div style={{ padding: '8px 16px 16px' }}>
          {collection.description && (
            <p style={{
              fontSize: '0.82rem', color: '#6B7280', margin: 0,
              lineHeight: 1.5, fontWeight: 500,
            }}>
              {collection.description.length > 100
                ? collection.description.slice(0, 100) + '…'
                : collection.description}
            </p>
          )}

          {/* Explore link */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 10, fontSize: '0.75rem', fontWeight: 700,
            color: '#7C3AED',
          }}>
            <span>Explore Collection</span>
            <span style={{
              transition: 'transform 0.3s',
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
              display: 'inline-block',
            }}>→</span>
          </div>
        </div>
      </div>
    </a>
  );
}

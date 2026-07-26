'use client';

import React, { useState } from 'react';
import type { ThemeCollectionCardProps } from '../types';

export function LinkCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sf-card" style={{
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 12px 32px rgba(0,0,0,0.35)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          position: 'relative', height: 160, overflow: 'hidden',
          background: 'var(--sf-surface)',
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
              }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #6366F1 100%)',
            }} />
          )}

          <div style={{
            position: 'absolute', inset: 0,
            background: hovered
              ? 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(99,102,241,0.2))'
              : 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)',
            transition: 'background 0.4s ease',
          }} />

          {collection.productCount != null && collection.productCount > 0 && (
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'var(--sf-primary)', color: '#fff',
              padding: '4px 12px', borderRadius: 20,
              fontSize: '0.65rem', fontWeight: 800,
            }}>
              {collection.productCount} {collection.productCount === 1 ? 'item' : 'items'}
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
            <p style={{
              fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF',
              margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}>{collection.title}</p>
          </div>
        </div>

        <div style={{ padding: '10px 16px 14px' }}>
          {collection.description && (
            <p style={{
              fontSize: '0.8rem', color: 'var(--sf-text-2)', margin: 0,
              lineHeight: 1.5,
            }}>
              {collection.description.length > 80
                ? collection.description.slice(0, 80) + '…'
                : collection.description}
            </p>
          )}

          <p style={{
            marginTop: 8, fontSize: '0.72rem', fontWeight: 700,
            color: 'var(--sf-primary)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>Explore</span>
            <span style={{
              transition: 'transform 0.3s',
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              display: 'inline-block',
            }}>→</span>
          </p>
        </div>
      </div>
    </a>
  );
}

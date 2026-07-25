'use client';

import React from 'react';
import type { ThemeCollectionCardProps } from '../types';

export function LuxeCollectionCard({ collection, storeSlug }: ThemeCollectionCardProps) {
  return (
    <a
      href={`/store/${storeSlug}/collections/${collection.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Full-width editorial image */}
        <div style={{
          height: 240, overflow: 'hidden', background: '#1C1C1C',
          position: 'relative',
        }}>
          {collection.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={collection.coverImageUrl} alt={collection.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)',
            }} />
          )}
          {/* Overlay gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.7) 0%, transparent 60%)',
          }} />
          {/* Title on image */}
          <div style={{
            position: 'absolute', bottom: 20, left: 20, right: 20,
          }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: 'italic', fontWeight: 400,
              fontSize: '1.4rem', color: '#F5F5F0',
              margin: 0, letterSpacing: '0.02em',
            }}>{collection.title}</p>
            {collection.description && (
              <p style={{
                fontSize: '0.78rem', color: '#A89878', margin: '6px 0 0',
                fontWeight: 300, letterSpacing: '0.02em',
              }}>{collection.description}</p>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

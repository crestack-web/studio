'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

interface Collection { id: string; title: string; }

interface Props {
  storeName: string;
  logoUrl: string | null;
  storeSlug: string;
  currency: string;
  businessId: string;
}

export function StorefrontNav({ storeName, logoUrl, storeSlug, businessId }: Props) {
  const { totalItems, toggleCart } = useCart();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/store/collections?businessId=${businessId}`)
      .then(r => r.ok ? r.json() : { collections: [] })
      .then(d => setCollections((d.collections ?? []).slice(0, 5)))
      .catch(() => {});
  }, [businessId]);

  return (
    <nav className="sf-nav">
      <Link href={`/store/${storeSlug}`} className="sf-nav-logo">
        {logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logoUrl} alt={storeName} />
          : <span style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--sf-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1rem',
            }}>{storeName.charAt(0).toUpperCase()}</span>
        }
        {storeName}
      </Link>

      {/* Collections nav links */}
      {collections.length > 0 && (
        <div className="sf-nav-links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {collections.map(col => (
            <Link
              key={col.id}
              href={`/store/${storeSlug}/collections/${col.id}`}
              style={{
                fontSize: 13, fontWeight: 500, color: 'var(--sf-text-2)',
                textDecoration: 'none', padding: '6px 10px', borderRadius: 8,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'var(--sf-border)')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
            >
              {col.title}
            </Link>
          ))}
        </div>
      )}

      <div className="sf-nav-spacer" />

      <button className="sf-nav-cart" onClick={toggleCart} aria-label="Open cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.74l1.38-9.26H6"/>
        </svg>
        Cart
        {totalItems > 0 && (
          <span className="sf-cart-badge">{totalItems}</span>
        )}
      </button>
    </nav>
  );
}
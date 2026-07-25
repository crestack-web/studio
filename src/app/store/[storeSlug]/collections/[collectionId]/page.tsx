import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductGrid } from '../../components/ProductGrid';
import type { ProductCardData } from '../../components/ProductCard';

const BASE = () => process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

async function getStoreConfig(storeSlug: string) {
  try {
    const res = await fetch(`${BASE()}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getCollection(businessId: string, collectionId: string) {
  try {
    const res = await fetch(
      `${BASE()}/api/store/collections/${collectionId}?businessId=${businessId}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getProducts(businessId: string, collectionId: string) {
  try {
    const params = new URLSearchParams({ businessId, available: 'true', collectionId });
    const res = await fetch(`${BASE()}/api/store/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []) as ProductCardData[];
  } catch { return []; }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionId: string }>;
}): Promise<Metadata> {
  const { storeSlug, collectionId } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return { title: 'Collection' };
  const collection = await getCollection(config.businessId, collectionId);
  return {
    title: collection ? `${collection.title} — ${config.storeName}` : config.storeName,
    description: collection?.description || `Shop ${collection?.title} at ${config.storeName}`,
    openGraph: {
      title: collection?.title ?? config.storeName,
      images: collection?.coverImageUrl ? [collection.coverImageUrl] : config.logoUrl ? [config.logoUrl] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionId: string }>;
}) {
  const { storeSlug, collectionId } = await params;

  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const [collection, products] = await Promise.all([
    getCollection(config.businessId, collectionId),
    getProducts(config.businessId, collectionId),
  ]);

  if (!collection) notFound();

  // Fire analytics event
  fetch(`${BASE()}/api/store/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId, pageType: 'collection',
      collectionId,
    }),
  }).catch(() => {});

  return (
    <div className="sf-page">
      {/* Collection header */}
      <section className="sf-hero" style={{ paddingBottom: '32px' }}>
        {collection.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.coverImageUrl}
            alt={collection.title}
            style={{
              width: '100%', maxHeight: 240, objectFit: 'cover',
              borderRadius: 16, marginBottom: 24,
            }}
          />
        )}
        <h1>{collection.title}</h1>
        {collection.description && (
          <p style={{ maxWidth: 560, margin: '0 auto' }}>{collection.description}</p>
        )}
        <p style={{ fontSize: '0.85rem', color: 'var(--sf-text-3)', marginTop: 8 }}>
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Products */}
      <section className="sf-section">
        <ProductGrid
          products={products}
          storeSlug={storeSlug}
          currency={config.currency}
          emptyMessage="No products in this collection yet."
        />
      </section>

      {/* Back link */}
      <div style={{ textAlign: 'center', padding: '16px 0 48px' }}>
        <a
          href={`/store/${storeSlug}`}
          style={{
            fontSize: 14, color: 'var(--sf-text-2)',
            textDecoration: 'none', fontWeight: 500,
          }}
        >
          ← Back to all products
        </a>
      </div>
    </div>
  );
}

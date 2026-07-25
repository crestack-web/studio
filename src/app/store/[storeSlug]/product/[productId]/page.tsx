import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetailClient } from './ProductDetailClient';

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getStoreConfig(storeSlug: string) {
  try {
    const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getProduct(businessId: string, productId: string) {
  try {
    const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(
      `${base}/api/store/products?businessId=${businessId}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data.products ?? []).find((p: any) => p.id === productId) ?? null;
  } catch { return null; }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}): Promise<Metadata> {
  const { storeSlug, productId } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return {};
  const product = await getProduct(config.businessId, productId);
  if (!product) return { title: config.storeName };
  return {
    title: `${product.displayName} — ${config.storeName}`,
    description: product.description ?? `Buy ${product.displayName} at ${config.storeName}`,
    openGraph: {
      title: `${product.displayName} — ${config.storeName}`,
      description: product.description ?? '',
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;

  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const product = await getProduct(config.businessId, productId);
  if (!product || !product.available) notFound();

  // Fire page_view analytics (fire-and-forget)
  fetch(`${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/store/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId,
      pageType: 'product', productId,
    }),
  }).catch(() => {});

  return (
    <ProductDetailClient
      product={product}
      storeSlug={storeSlug}
      currency={config.currency}
      theme={config.theme ?? 'luxe'}
    />
  );
}

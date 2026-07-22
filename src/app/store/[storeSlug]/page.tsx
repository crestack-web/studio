import React from 'react';
import { notFound } from 'next/navigation';
import { ProductGrid } from './components/ProductGrid';
import { ThemedHero } from './components/ThemedHero';
import type { ProductCardData } from './components/ProductCard';
import type { StorefrontTheme, StoreSection } from '@/app/sell/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/app/sell/mo-sell.types';

const BASE = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

async function getStoreConfig(storeSlug: string) {
  try {
    const res = await fetch(`${BASE()}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getProducts(businessId: string, filter?: { featured?: boolean; collectionId?: string }) {
  try {
    const params = new URLSearchParams({ businessId, available: 'true' });
    if (filter?.featured)     params.set('featured', 'true');
    if (filter?.collectionId) params.set('collectionId', filter.collectionId);
    const res = await fetch(`${BASE()}/api/store/products?${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products ?? []) as ProductCardData[];
  } catch { return []; }
}

async function getCollections(businessId: string) {
  try {
    const res = await fetch(`${BASE()}/api/store/collections?businessId=${businessId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.collections ?? []) as { id: string; title: string; coverImageUrl: string | null; description: string }[];
  } catch { return []; }
}

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const theme: StorefrontTheme = config.theme ?? 'classic';

  // Merge saved sections with defaults — missing sections fall back to defaults
  const savedSections: StoreSection[] = config.sections ?? [];
  const sections: StoreSection[] = DEFAULT_SECTIONS.map(def => {
    const saved = savedSections.find(s => s.id === def.id);
    return saved ? { ...def, ...saved, settings: { ...def.settings, ...saved.settings } } : def;
  }).sort((a, b) => a.order - b.order);

  // Determine which data we need to fetch based on enabled sections
  const needFeatured    = sections.some(s => s.type === 'featured'     && s.enabled);
  const needProducts    = sections.some(s => s.type === 'products'     && s.enabled);
  const needCollections = sections.some(s => s.type === 'collections'  && s.enabled);

  const [featured, allProducts, collections] = await Promise.all([
    needFeatured    ? getProducts(config.businessId, { featured: true }) : Promise.resolve([]),
    needProducts    ? getProducts(config.businessId) : Promise.resolve([]),
    needCollections ? getCollections(config.businessId) : Promise.resolve([]),
  ]);

  // Fire page_view analytics (fire-and-forget)
  fetch(`${BASE()}/api/store/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId, pageType: 'home',
    }),
  }).catch(() => {});

  return (
    <div className="sf-page" id="products">
      {sections.map(section => {
        if (!section.enabled) return null;
        const s = section.settings as Record<string, unknown>;

        switch (section.type) {

          case 'announcement': {
            const text = (s.text as string) || '';
            if (!text) return null;
            const bg   = (s.backgroundColor as string) || 'var(--sf-primary)';
            const fg   = (s.textColor as string) || '#fff';
            return (
              <div key={section.id} style={{
                background: bg, color: fg,
                padding: '10px 20px', textAlign: 'center',
                fontSize: '0.875rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <span>{text}</span>
                {Boolean(s.linkLabel && s.linkUrl) && (
                  <a href={s.linkUrl as string} style={{ color: fg, textDecoration: 'underline', opacity: 0.85 }}>
                    {s.linkLabel as string}
                  </a>
                ) as React.ReactNode}
              </div>
            );
          }

          case 'hero': {
            const heading    = (s.heading as string)    || config.storeName;
            const subheading = (s.subheading as string) || config.tagline || null;
            const ctaLabel   = (s.ctaLabel as string)   || 'Shop Now';
            const ctaUrl     = (s.ctaUrl as string)     || '#products';
            const bgImage    = s.backgroundImage as string | null | undefined;
            const showTagline = s.showTagline !== false;
            return (
              <ThemedHero
                key={section.id}
                storeName={heading}
                tagline={showTagline ? subheading : null}
                logoUrl={config.logoUrl ?? null}
                theme={theme}
                primaryColor={config.primaryColor ?? '#0EA5E9'}
                secondaryColor={config.secondaryColor ?? '#6366F1'}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
                backgroundImage={bgImage}
              />
            );
          }

          case 'collections': {
            if (collections.length === 0) return null;
            const heading  = (s.heading as string) || 'Collections';
            const layout   = (s.layout as string) || 'strip';
            const maxItems = (s.maxItems as number) || 8;
            const visible  = collections.slice(0, maxItems);
            return (
              <section key={section.id} className="sf-section">
                <p className="sf-section-title">{heading}</p>
                <div style={{
                  display: layout === 'grid' ? 'grid' : 'flex',
                  gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : undefined,
                  gap: 12,
                  overflowX: layout === 'strip' ? 'auto' : undefined,
                  paddingBottom: 8,
                  flexWrap: layout === 'strip' ? 'nowrap' : 'wrap',
                }}>
                  {visible.map(col => (
                    <a
                      key={col.id}
                      href={`/store/${storeSlug}/collections/${col.id}`}
                      className="sf-collection-chip"
                      style={{
                        flexShrink: 0,
                        borderRadius: 'var(--sf-radius)',
                        overflow: 'hidden',
                        border: '1px solid var(--sf-border)',
                        textDecoration: 'none',
                        background: 'var(--sf-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: layout === 'strip' ? 130 : undefined,
                        transition: 'box-shadow 0.18s ease',
                      }}
                    >
                      <div style={{
                        height: 72,
                        background: col.coverImageUrl
                          ? `url(${col.coverImageUrl}) center/cover`
                          : 'linear-gradient(135deg, var(--sf-primary), var(--sf-secondary))',
                      }} />
                      <div style={{ padding: '8px 12px' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: 'var(--sf-text-1)' }}>
                          {col.title}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            );
          }

          case 'featured': {
            if ((featured as ProductCardData[]).length === 0) return null;
            const heading  = (s.heading as string) || '⭐ Featured';
            const maxItems = (s.maxItems as number) || 8;
            const cols     = (s.columns as number) || 4;
            return (
              <section key={section.id} className="sf-section">
                <p className="sf-section-title">{heading}</p>
                <ProductGrid
                  products={(featured as ProductCardData[]).slice(0, maxItems)}
                  storeSlug={storeSlug}
                  currency={config.currency}
                  columns={cols}
                />
              </section>
            );
          }

          case 'products': {
            const heading = (s.heading as string) || 'All Products';
            const cols    = (s.columns as number) || 3;
            return (
              <section key={section.id} className="sf-section">
                <p className="sf-section-title">
                  {heading}
                  <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 500, color: 'var(--sf-text-3)' }}>
                    {(allProducts as ProductCardData[]).length} item{(allProducts as ProductCardData[]).length !== 1 ? 's' : ''}
                  </span>
                </p>
                <ProductGrid
                  products={allProducts as ProductCardData[]}
                  storeSlug={storeSlug}
                  currency={config.currency}
                  columns={cols}
                  emptyMessage="No products available yet. Check back soon!"
                />
              </section>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

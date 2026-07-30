import React from 'react';
import { notFound } from 'next/navigation';
import { getThemeComponentsServer, isLinkTheme, type ThemeId } from '../themes/registry';
import type { ProductCardData } from '../themes/types';
import type {
  StorefrontTheme, StoreSection,
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, AnnouncementSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  InstagramSectionSettings, NewsletterSectionSettings,
} from '@/types/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/types/mo-sell.types';

const BASE = () => process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

async function getStoreConfig(storeSlug: string) {
  try {
    const res = await fetch(`${BASE()}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getProducts(businessId: string, filter?: { featured?: boolean }) {
  try {
    const params = new URLSearchParams({ businessId, available: 'true' });
    if (filter?.featured) params.set('featured', 'true');
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
    return (data.collections ?? []) as { id: string; title: string; coverImageUrl: string | null; description: string; productCount?: number }[];
  } catch { return []; }
}

// ─── Theme-aware Product Grid ───────────────────────────────────────────────

function ThemeProductGrid({ products, storeSlug, currency, columns, emptyMessage, ProductCard }: {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  columns: number;
  emptyMessage?: string;
  ProductCard: React.ComponentType<{ product: ProductCardData; storeSlug: string; currency: string }>;
}) {
  if (products.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
        {emptyMessage || 'No products yet.'}
      </div>
    );
  }
  return (
    <div className="sf-product-grid" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: 24,
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function StorefrontHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const theme: StorefrontTheme = config.theme ?? 'luxe';
  const components = await getThemeComponentsServer(theme as ThemeId);

  // Merge saved sections with defaults
  const savedSections: StoreSection[] = config.sections ?? [];
  const sections: StoreSection[] = DEFAULT_SECTIONS.map(def => {
    const saved = savedSections.find(s => s.id === def.id);
    return saved ? { ...def, ...saved, settings: { ...def.settings, ...saved.settings } } : def;
  }).sort((a, b) => a.order - b.order);

  // Fetch data for enabled sections
  const needFeatured    = sections.some(s => s.type === 'featured'    && s.enabled);
  const needCollections = sections.some(s => s.type === 'collections' && s.enabled);

  const [featured, allProducts, collections] = await Promise.all([
    needFeatured    ? getProducts(config.businessId, { featured: true }) : Promise.resolve([]),
    getProducts(config.businessId),
    needCollections ? getCollections(config.businessId) : Promise.resolve([]),
  ]);

  // Fire analytics
  fetch(`${BASE()}/api/store/analytics/event`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType: 'page_view', storeSlug, businessId: config.businessId, pageType: 'home' }),
  }).catch(() => {});

  const Hero = components.Hero;
  const ProductCard = components.ProductCard;
  const CollectionCard = components.CollectionCard;

  // ── Link-in-bio layout ────────────────────────────────────────────────────
  if (isLinkTheme(theme)) {
    const heroSection = sections.find(s => s.type === 'hero');
    const hs = heroSection?.enabled ? (heroSection.settings as HeroSectionSettings) : null;
    return (
      <div id="products" style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        {hs && (
          <Hero
            storeName={hs.heading || config.storeName}
            tagline={hs.showTagline !== false ? (hs.subheading || config.tagline || null) : null}
            logoUrl={config.logoUrl ?? null}
            primaryColor={config.primaryColor ?? '#C9A84C'}
            secondaryColor={config.secondaryColor ?? '#8B7355'}
            ctaLabel={hs.ctaLabel || 'Shop Now'}
            ctaUrl={hs.ctaUrl || '#products'}
            backgroundImage={hs.backgroundImage ?? null}
            textAlign={hs.textAlign ?? 'center'}
            buttonStyle={config.buttonStyle ?? 'pill'}
          />
        )}
        {allProducts.length > 0 && (
          <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sf-text-3)', textAlign: 'center', margin: '0 0 4px' }}>
              Products
            </p>
            {allProducts.map(p => (
              <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={config.currency} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── E-commerce layout ─────────────────────────────────────────────────────
  return (
    <div id="products">
      {sections.map(section => {
        if (!section.enabled) return null;
        const s = section.settings as Record<string, unknown>;

        switch (section.type) {

          case 'announcement': {
            const text = s.text as string;
            if (!text) return null;
            return (
              <div key={section.id} className="sf-announcement" style={{ background: (s.backgroundColor as string) || '#0F172A', color: (s.textColor as string) || '#fff' }}>
                <span>{text}</span>
                {(s.linkLabel as string) && (s.linkUrl as string) && <a href={s.linkUrl as string} style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.8 }}>{s.linkLabel as string}</a>}
              </div>
            );
          }

          case 'hero': {
            const hs = s as HeroSectionSettings;
            return (
              <Hero key={section.id}
                storeName={hs.heading || config.storeName}
                tagline={hs.showTagline !== false ? (hs.subheading || config.tagline || null) : null}
                logoUrl={config.logoUrl ?? null}
                primaryColor={config.primaryColor ?? '#C9A84C'}
                secondaryColor={config.secondaryColor ?? '#8B7355'}
                ctaLabel={hs.ctaLabel || 'Shop Now'}
                ctaUrl={hs.ctaUrl || '#products'}
                backgroundImage={hs.backgroundImage ?? null}
                textAlign={hs.textAlign ?? 'left'}
                buttonStyle={config.buttonStyle ?? 'pill'}
              />
            );
          }

          case 'featured': {
            if ((featured as ProductCardData[]).length === 0) return null;
            const fs = s as FeaturedSectionSettings;
            return (
              <div key={section.id} className="sf-page sf-section">
                <p className="sf-section-title">{fs.heading || 'Shop Bestsellers'}</p>
                <ThemeProductGrid
                  products={(featured as ProductCardData[]).slice(0, fs.maxItems ?? 8)}
                  storeSlug={storeSlug}
                  currency={config.currency}
                  columns={fs.columns ?? 4}
                  ProductCard={ProductCard}
                />
              </div>
            );
          }

          case 'collections': {
            if (collections.length === 0) return null;
            const cs = s as CollectionsSectionSettings;
            const visible = collections.slice(0, cs.maxItems ?? 6);
            return (
              <div key={section.id} className="sf-page sf-section">
                <p className="sf-section-title">{cs.heading || 'Collections'}</p>
                <div className="sf-collection-grid">
                  {visible.map((col, i) => (
                    <CollectionCard key={col.id} collection={col} storeSlug={storeSlug} index={i} />
                  ))}
                </div>
              </div>
            );
          }

          case 'about': {
            const as_ = s as AboutSectionSettings;
            if (!as_.body && !as_.imageUrl) return null;
            return (
              <div key={section.id} className="sf-page">
                <div className="sf-about" style={{ direction: as_.imagePosition === 'left' ? 'rtl' : 'ltr' }}>
                  {as_.imageUrl && <img src={as_.imageUrl} alt="" className="sf-about-img" style={{ direction: 'ltr' }} />}
                  <div className="sf-about-body" style={{ direction: 'ltr' }}>
                    <h2>{as_.heading || 'Our Story'}</h2>
                    <p>{as_.body}</p>
                  </div>
                </div>
              </div>
            );
          }

          case 'testimonials': {
            const ts = s as TestimonialsSectionSettings;
            const items = ts.testimonials ?? [];
            if (items.length === 0) return null;
            return (
              <div key={section.id} className="sf-page sf-testimonials">
                <p className="sf-section-title">{ts.heading || 'What our customers say'}</p>
                <div className="sf-testimonials-grid">
                  {items.map((t, i) => (
                    <div key={i} className="sf-testimonial-card">
                      <div className="sf-testimonial-stars">{'★'.repeat(t.rating ?? 5)}</div>
                      <p className="sf-testimonial-text">&ldquo;{t.text}&rdquo;</p>
                      <p className="sf-testimonial-name">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          case 'instagram': {
            const is = s as InstagramSectionSettings;
            return (
              <div key={section.id} className="sf-page sf-instagram">
                <p className="sf-section-title">{is.heading || 'Follow us on Instagram'}</p>
                <div className="sf-instagram-grid">
                  {[...Array(6)].map((_, i) => <div key={i} className="sf-instagram-cell" />)}
                </div>
                {is.handle && <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>{is.handle}</p>}
              </div>
            );
          }

          case 'newsletter': {
            const ns = s as NewsletterSectionSettings;
            return (
              <div key={section.id} className="sf-page">
                <div className="sf-newsletter">
                  <h2>{ns.heading || 'Join our community'}</h2>
                  <p>{ns.subheading || 'Get the latest updates, offers and more.'}</p>
                  <div className="sf-newsletter-form">
                    <input type="email" className="sf-newsletter-input" placeholder={ns.placeholder || 'Enter your email'} />
                    <button className="sf-newsletter-btn">{ns.buttonLabel || 'Subscribe'}</button>
                  </div>
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}

      {/* Always show all products at the bottom */}
      {allProducts.length > 0 && (
        <div className="sf-page sf-section" id="products">
          <p className="sf-section-title">
            All Products
            <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 500, color: 'var(--sf-text-3)' }}>
              {allProducts.length} item{allProducts.length !== 1 ? 's' : ''}
            </span>
          </p>
          <ThemeProductGrid
            products={allProducts}
            storeSlug={storeSlug}
            currency={config.currency}
            columns={3}
            emptyMessage="No products yet. Check back soon!"
            ProductCard={ProductCard}
          />
        </div>
      )}
    </div>
  );
}

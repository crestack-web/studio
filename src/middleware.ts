import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware
 *
 * Custom domain rewriting — if the request host is NOT a known Busmo host,
 * look up which storeSlug owns that domain and rewrite to /store/[storeSlug].
 *
 * The domain lookup result is cached in-memory for 5 minutes per domain
 * to avoid a Firestore read on every request.
 */

const BUSMO_HOSTS = new Set([
  'busmo.io',
  'www.busmo.io',
  'localhost',
]);

function isBusmoHost(host: string): boolean {
  const bare = host.split(':')[0];
  return BUSMO_HOSTS.has(bare) || bare.endsWith('.busmo.io');
}

// ── In-memory domain cache (edge runtime compatible) ──────────────────────────
interface CacheEntry { storeSlug: string; businessId: string; expiresAt: number; }
const domainCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(domain: string): CacheEntry | null {
  const entry = domainCache.get(domain);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { domainCache.delete(domain); return null; }
  return entry;
}

function setCached(domain: string, data: { storeSlug: string; businessId: string }) {
  domainCache.set(domain, { ...data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  // Pass through all Busmo-hosted requests untouched
  if (isBusmoHost(host)) {
    return NextResponse.next();
  }

  const domain = host.split(':')[0];
  const { pathname } = request.nextUrl;

  // Skip static assets, Next internals, and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    // Check cache first
    let result = getCached(domain);

    if (!result) {
      // Call the lookup API — use absolute URL from request origin
      const lookupUrl = new URL(
        `/api/store/domain/lookup?domain=${encodeURIComponent(domain)}`,
        request.nextUrl.origin
      );

      const lookupRes = await fetch(lookupUrl.toString());

      if (!lookupRes.ok) {
        // Domain not found or not verified — fall through to 404
        return NextResponse.next();
      }

      const data = await lookupRes.json() as { storeSlug: string; businessId: string };
      setCached(domain, data);
      result = data as CacheEntry;
    }

    const { storeSlug } = result;

    // Rewrite the path:
    //   /            → /store/[storeSlug]
    //   /products/x  → /store/[storeSlug]/products/x
    //   /collections → /store/[storeSlug]/collections
    const rewrittenPath = pathname === '/'
      ? `/store/${storeSlug}`
      : `/store/${storeSlug}${pathname}`;

    const url = request.nextUrl.clone();
    url.pathname = rewrittenPath;

    // Preserve the original host header so the storefront knows the custom domain
    const response = NextResponse.rewrite(url);
    response.headers.set('x-forwarded-host', host);
    return response;

  } catch (err) {
    console.error('[middleware] domain lookup error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

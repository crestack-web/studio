import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/store/domain/lookup?domain=shop.mybrand.com
 *
 * Used by src/middleware.ts to resolve a custom domain to a storeSlug.
 * Returns { storeSlug, businessId } or 404.
 * Cached 5 minutes at the edge.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain')?.toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Query the 'store' collectionGroup for docs with matching verified custom domain
    // Path: businesses/{businessId}/store/config — 'store' is the subcollection
    const snap = await db.collectionGroup('store')
      .where('customDomain', '==', domain)
      .where('customDomainStatus', '==', 'verified')
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Domain not found or not verified' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const businessId = doc.ref.path.split('/')[1];

    return NextResponse.json(
      { storeSlug: data.storeSlug, businessId },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

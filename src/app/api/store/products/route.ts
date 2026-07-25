import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/store/products
 * Public — lists store products for a business.
 *
 * Query params:
 *   businessId   (required)
 *   available    "true" | omit — filter to available=true only
 *   collectionId — filter by collection membership
 *   featured     "true" — filter to featured only
 *   limit        number, default 100
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const businessId   = searchParams.get('businessId');
  const available    = searchParams.get('available');
  const collectionId = searchParams.get('collectionId');
  const featured     = searchParams.get('featured');
  const limitParam   = parseInt(searchParams.get('limit') ?? '100', 10);

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    let query = db
      .collection('businesses').doc(businessId)
      .collection('storeProducts') as FirebaseFirestore.Query;

    if (available === 'true') {
      query = query.where('available', '==', true);
    }
    if (featured === 'true') {
      query = query.where('featured', '==', true);
    }
    if (collectionId) {
      query = query.where('collectionIds', 'array-contains', collectionId);
    }

    const snap = await query.limit(Math.min(limitParam, 200)).get();

    const products = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      // Convert Timestamps to ISO strings for JSON serialization
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

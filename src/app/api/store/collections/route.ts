import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/store/collections?businessId=xxx
 * Returns all collections for a store (sorted by title).
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeCollections')
      .orderBy('title', 'asc')
      .get();

    const collections = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ collections }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

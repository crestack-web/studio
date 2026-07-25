import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * GET /api/store/collections/[collectionId]?businessId=xxx
 * Returns a single store collection with its metadata.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const { collectionId } = await params;
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId || !collectionId) {
    return NextResponse.json({ error: 'businessId and collectionId are required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeCollections').doc(collectionId)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ id: snap.id, ...snap.data() }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

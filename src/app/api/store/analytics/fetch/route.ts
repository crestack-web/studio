import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { collection, query, where, getDocs, Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/store/analytics/fetch
 * Fetches aggregated analytics data for a store.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const analyticsRef = db.collection('businesses').doc(businessId).collection('storeAnalytics');
    
    // For now, fetch last 30 days of events
    const thirtyDaysAgo = new Timestamp(Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, 0);
    const q = query(analyticsRef, where('timestamp', '>=', thirtyDaysAgo));
    const snapshot = await getDocs(q);

    const events: any[] = snapshot.docs.map(doc => doc.data());

    // Aggregate data
    const pageViews = events.filter(e => e.eventType === 'page_view').length;
    const checkoutsInitiated = events.filter(e => e.eventType === 'checkout_initiated').length;
    const ordersCompleted = events.filter(e => e.eventType === 'order_completed').length;
    
    const productCounts: Record<string, number> = {};
    events.filter(e => e.eventType === 'order_completed' && e.productId).forEach(e => {
      productCounts[e.productId] = (productCounts[e.productId] || 0) + 1;
    });

    return NextResponse.json({
      pageViews,
      checkoutsInitiated,
      ordersCompleted,
      conversionRate: checkoutsInitiated > 0 ? (ordersCompleted / checkoutsInitiated) * 100 : 0,
      topProducts: Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, count]) => ({ productId, count }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

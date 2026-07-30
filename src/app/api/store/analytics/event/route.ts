import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AnalyticsEventType } from '@/types/mo-sell.types';

const VALID_EVENT_TYPES: AnalyticsEventType[] = [
  'page_view', 'add_to_cart', 'checkout_initiated', 'order_completed',
];

/**
 * POST /api/store/analytics/event
 * Fire-and-forget analytics event recording.
 * Always returns 204 — client never waits on this.
 */
export async function POST(req: NextRequest) {
  // Always respond immediately — client doesn't block on analytics
  const body: {
    eventType: AnalyticsEventType;
    storeSlug: string;
    businessId: string;
    pageType?: string | null;
    productId?: string | null;
  } = await req.json().catch(() => ({}));

  const { eventType, storeSlug, businessId, pageType = null, productId = null } = body;

  // Validate silently — bad analytics data is dropped, not errored
  if (!VALID_EVENT_TYPES.includes(eventType) || !storeSlug || !businessId) {
    return new NextResponse(null, { status: 204 });
  }

  // Write in background — response is already sent
  try {
    const db = getAdminDb();
    await db
      .collection('businesses').doc(businessId)
      .collection('storeAnalytics').add({
        eventType,
        storeSlug,
        pageType:  pageType ?? null,
        productId: productId ?? null,
        timestamp: FieldValue.serverTimestamp(),
      });
  } catch {
    // Silent — analytics failures must never surface to customers
  }

  return new NextResponse(null, { status: 204 });
}

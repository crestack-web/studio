import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../mo-sales/_auth';
import {
  CustomFeatureError,
  createCustomFeature,
  ensureDeliveryTrackerFeature,
  getCustomFeature,
  getPublishedFeatureBySlug,
  listCustomFeatures,
  publishCustomFeature,
} from '@/lib/custom-features/service';
import { DELIVERY_TRACKER_DEFINITION } from '@/lib/custom-features/definitions/delivery-tracker';
import { validateFeatureDefinition } from '@/lib/custom-features/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errRes(e: unknown) {
  if (e instanceof CustomFeatureError) {
    return NextResponse.json(
      { error: e.message, details: e.details },
      { status: e.status }
    );
  }
  console.error('[custom-features]', e);
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}

/**
 * GET ?businessId=&slug=delivery-tracker&ensure=1
 * Lists features or returns published feature by slug.
 * ensure=1 bootstraps Delivery Tracker for internal prototype.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = String(req.nextUrl.searchParams.get('businessId') || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const slug = req.nextUrl.searchParams.get('slug');
    const featureId = req.nextUrl.searchParams.get('featureId');
    const ensure = req.nextUrl.searchParams.get('ensure') === '1';

    if (ensure && slug === 'delivery-tracker') {
      const feature = await ensureDeliveryTrackerFeature({
        businessId,
        userId: user.id,
        definition: DELIVERY_TRACKER_DEFINITION,
      });
      return NextResponse.json({ feature });
    }

    if (featureId) {
      const feature = await getCustomFeature(businessId, featureId);
      if (!feature) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ feature });
    }

    if (slug) {
      const feature = await getPublishedFeatureBySlug(businessId, slug);
      if (!feature) {
        return NextResponse.json({ error: 'No published feature' }, { status: 404 });
      }
      return NextResponse.json({ feature });
    }

    const features = await listCustomFeatures(businessId);
    return NextResponse.json({ features });
  } catch (e) {
    return errRes(e);
  }
}

/**
 * POST — create feature or publish.
 * body: { businessId, action: 'create' | 'publish' | 'validate', definition?, featureId? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const action = String(body.action || 'create');

    if (action === 'validate') {
      const result = validateFeatureDefinition(body.definition);
      return NextResponse.json(result);
    }

    if (action === 'publish') {
      const featureId = String(body.featureId || '').trim();
      if (!featureId) {
        return NextResponse.json({ error: 'featureId required' }, { status: 400 });
      }
      const feature = await publishCustomFeature({
        businessId,
        featureId,
        userId: user.id,
      });
      return NextResponse.json({ feature });
    }

    if (action === 'create') {
      const feature = await createCustomFeature({
        businessId,
        definition: body.definition,
        userId: user.id,
        status: body.status === 'published' ? 'published' : 'draft',
      });
      return NextResponse.json({ feature });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return errRes(e);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import {
  CustomFeatureError,
  createFeatureRecord,
  deleteFeatureRecord,
  listFeatureRecords,
  updateFeatureRecord,
} from '@/lib/custom-features/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errRes(e: unknown) {
  if (e instanceof CustomFeatureError) {
    return NextResponse.json(
      { error: e.message, details: e.details },
      { status: e.status }
    );
  }
  console.error('[custom-features/records]', e);
  return NextResponse.json({ error: 'Server error' }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = String(req.nextUrl.searchParams.get('businessId') || '').trim();
    const featureId = String(req.nextUrl.searchParams.get('featureId') || '').trim();
    const entityKey = req.nextUrl.searchParams.get('entityKey') || undefined;

    if (!businessId || !featureId) {
      return NextResponse.json(
        { error: 'businessId and featureId required' },
        { status: 400 }
      );
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    const records = await listFeatureRecords({
      businessId,
      featureId,
      entityKey: entityKey || undefined,
    });
    return NextResponse.json({ records });
  } catch (e) {
    return errRes(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const featureId = String(body.featureId || '').trim();
    const entityKey = String(body.entityKey || '').trim();
    const action = String(body.action || 'create');

    if (!businessId || !featureId) {
      return NextResponse.json(
        { error: 'businessId and featureId required' },
        { status: 400 }
      );
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    if (action === 'create') {
      if (!entityKey) {
        return NextResponse.json({ error: 'entityKey required' }, { status: 400 });
      }
      const record = await createFeatureRecord({
        businessId,
        featureId,
        entityKey,
        data: body.data,
        userId: user.id,
      });
      return NextResponse.json({ record });
    }

    if (action === 'update') {
      const recordId = String(body.recordId || '').trim();
      if (!recordId) {
        return NextResponse.json({ error: 'recordId required' }, { status: 400 });
      }
      const record = await updateFeatureRecord({
        businessId,
        featureId,
        recordId,
        data: body.data,
        userId: user.id,
      });
      return NextResponse.json({ record });
    }

    if (action === 'delete') {
      const recordId = String(body.recordId || '').trim();
      if (!recordId) {
        return NextResponse.json({ error: 'recordId required' }, { status: 400 });
      }
      await deleteFeatureRecord({ businessId, featureId, recordId });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    return errRes(e);
  }
}

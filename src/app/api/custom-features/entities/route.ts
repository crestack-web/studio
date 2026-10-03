/**
 * Tenant-scoped entity lookup for feature relation fields.
 * GET ?businessId=&target=supplier|customer|product|material|staff&q=
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import {
  listEntityOptions,
  getBusinessContextSummary,
} from '@/lib/custom-features/business-context-provider';
import { ALLOWED_RELATION_TARGETS, type BusmoRelationTarget } from '@/lib/custom-features/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const businessId = String(searchParams.get('businessId') || '').trim();
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }
    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) {
      return NextResponse.json({ error: access.reason }, { status: 403 });
    }

    if (searchParams.get('summary') === '1') {
      const summary = await getBusinessContextSummary(businessId);
      return NextResponse.json({ ok: true, summary });
    }

    const target = String(searchParams.get('target') || '').trim() as BusmoRelationTarget;
    if (!ALLOWED_RELATION_TARGETS.includes(target) || target === 'custom') {
      return NextResponse.json(
        { error: 'Invalid target', allowed: ALLOWED_RELATION_TARGETS },
        { status: 400 }
      );
    }
    const q = searchParams.get('q') || undefined;
    const options = await listEntityOptions(businessId, target, { q });
    return NextResponse.json({ ok: true, target, options });
  } catch (e: unknown) {
    console.error('[custom-features/entities]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}

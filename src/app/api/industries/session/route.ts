import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/app/api/mo-sales/_auth';
import { loadIndustrySession } from '@/lib/industries/session';
import { pathForEdition } from '@/lib/industries/resolve-edition';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/industries/session
 * Authoritative product edition + org membership for the authenticated user.
 * Does not trust client-supplied edition.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await loadIndustrySession(user.id, user.user_metadata as Record<string, unknown>);
    return NextResponse.json({
      ok: true,
      session,
      dashboardPath: pathForEdition(session.productEdition),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Session load failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

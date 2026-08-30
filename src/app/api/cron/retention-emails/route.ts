import { NextRequest, NextResponse } from 'next/server';
import { runRetentionEmailJobs } from '@/services/email/email-scheduler';

/**
 * GET/POST /api/cron/retention-emails
 *
 * External cron (Vercel Cron, cron-job.org) should hit this daily.
 * Protect with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
 * or ?secret=<CRON_SECRET>
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.RETENTION_CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = req.headers.get('authorization') || '';
  if (auth === `Bearer ${secret}`) return true;
  const q = req.nextUrl.searchParams.get('secret');
  return q === secret;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runRetentionEmailJobs();
    return NextResponse.json({
      ok: true,
      message: 'Retention email jobs completed',
      result,
      ranAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[cron/retention-emails]', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Retention job failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

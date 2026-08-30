import { NextRequest, NextResponse } from 'next/server';
import { sendTrialReminderEmail } from '@/services/email/subscription-emails';
import { sendTrialExpiredEmail } from '@/services/email/subscription-lifecycle-emails';
import {
  sendGraceExtensionEmail,
  sendGraceReminderEmail,
  sendRenewalDueReminderEmail,
} from '@/services/email/retention-emails';

/**
 * POST /api/email/test-retention
 * Body: { email?: string, types?: string[] }
 * Sends sample retention emails (no DB rows required).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || 'crestack@gmail.com').trim().toLowerCase();
    if (!email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Invalid email' }, { status: 400 });
    }

    const types: string[] = Array.isArray(body.types)
      ? body.types
      : ['trial_reminder', 'trial_expired', 'grace_extension', 'grace_reminder', 'renewal_due'];

    const name = 'Crestack';
    const businessName = 'Demo Business';
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const trialEnd = fmt(today);
    const graceEnd = fmt(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000));
    const due = fmt(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000));

    const sent: { type: string; ok: boolean; error?: string }[] = [];

    const run = async (type: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
        sent.push({ type, ok: true });
      } catch (e: any) {
        sent.push({ type, ok: false, error: e?.message || String(e) });
      }
    };

    if (types.includes('trial_reminder')) {
      await run('trial_reminder', () =>
        sendTrialReminderEmail({
          email,
          name,
          businessName,
          daysRemaining: 1,
          trialEndDate: trialEnd,
        })
      );
    }
    if (types.includes('trial_expired')) {
      await run('trial_expired', () =>
        sendTrialExpiredEmail({
          email,
          name,
          businessName,
          trialEndDate: trialEnd,
        })
      );
    }
    if (types.includes('grace_extension')) {
      await run('grace_extension', () =>
        sendGraceExtensionEmail({
          email,
          name,
          businessName,
          trialEndDate: trialEnd,
          graceEndDate: graceEnd,
          daysRemainingInGrace: 3,
        })
      );
    }
    if (types.includes('grace_reminder')) {
      await run('grace_reminder', () =>
        sendGraceReminderEmail({
          email,
          name,
          businessName,
          graceEndDate: graceEnd,
          daysRemaining: 1,
        })
      );
    }
    if (types.includes('renewal_due')) {
      await run('renewal_due', () =>
        sendRenewalDueReminderEmail({
          email,
          name,
          businessName,
          planName: 'Busmo Control',
          amount: 20000,
          currency: 'NGN',
          dueDate: due,
          daysUntilDue: 3,
        })
      );
    }

    const allOk = sent.every((s) => s.ok);
    return NextResponse.json({
      ok: allOk,
      email,
      sent,
      note: 'Sample retention emails. Production cron uses /api/cron/retention-emails + Supabase users.',
    });
  } catch (error: any) {
    console.error('[email/test-retention]', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Test send failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: 'POST { "email": "crestack@gmail.com", "types": ["grace_extension"] }',
  });
}

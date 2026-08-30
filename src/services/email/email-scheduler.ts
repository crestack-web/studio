/**
 * Email scheduler — Supabase-backed retention + reports.
 * Prefer invoking runRetentionEmailJobs() from /api/cron/retention-emails
 * (external cron). node-cron still available via initialize() for long-lived hosts.
 */
import * as cron from 'node-cron';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendTrialReminderEmail } from './subscription-emails';
import { sendTrialExpiredEmail } from './subscription-lifecycle-emails';
import {
  sendGraceExtensionEmail,
  sendGraceReminderEmail,
  sendRenewalDueReminderEmail,
} from './retention-emails';
import { planDisplayName, getPlanById } from '@/lib/pricing';

interface ScheduledTask {
  name: string;
  cronExpression: string;
  task: () => Promise<void>;
  enabled: boolean;
}

export type RetentionUser = {
  id: string;
  email: string;
  full_name: string | null;
  business_id: string | null;
  businessName: string;
  plan: string | null;
  subscription_status: string | null;
  trial_end_date: string | null;
  grace_end_date: string | null;
  subscription_end_date: string | null;
};

const GRACE_PERIOD_DAYS = 3;

function dayCeil(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function displayName(u: { full_name?: string | null; email: string }): string {
  return (u.full_name || u.email?.split('@')[0] || 'Business Owner').trim();
}

async function loadBusinessName(
  sb: ReturnType<typeof getSupabaseAdmin>,
  businessId: string | null
): Promise<string> {
  if (!businessId) return 'Your Business';
  const { data } = await sb
    .from('businesses')
    .select('name')
    .eq('id', businessId)
    .maybeSingle();
  return (data as { name?: string } | null)?.name || 'Your Business';
}

/** Fetch candidate users from Supabase (service role). */
export async function fetchRetentionUsers(filter: {
  statuses: string[];
}): Promise<RetentionUser[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('users')
    .select(
      'id, email, full_name, business_id, plan, subscription_status, trial_end_date, grace_end_date, subscription_end_date'
    )
    .in('subscription_status', filter.statuses)
    .not('email', 'is', null);

  if (error) {
    console.error('[retention] fetch users failed:', error.message);
    throw error;
  }

  const rows = (data || []) as Array<Record<string, unknown>>;
  const out: RetentionUser[] = [];

  for (const row of rows) {
    const email = String(row.email || '').trim();
    if (!email) continue;
    const business_id = (row.business_id as string) || null;
    const businessName = await loadBusinessName(sb, business_id);
    out.push({
      id: String(row.id),
      email,
      full_name: (row.full_name as string) || null,
      business_id,
      businessName,
      plan: (row.plan as string) || null,
      subscription_status: (row.subscription_status as string) || null,
      trial_end_date: (row.trial_end_date as string) || null,
      grace_end_date: (row.grace_end_date as string) || null,
      subscription_end_date: (row.subscription_end_date as string) || null,
    });
  }

  return out;
}

export type RetentionRunResult = {
  trialReminders: number;
  trialExpired: number;
  graceExtensions: number;
  graceReminders: number;
  renewalReminders: number;
  errors: string[];
};

/** One-shot run of all retention jobs (safe for serverless cron). */
export async function runRetentionEmailJobs(): Promise<RetentionRunResult> {
  const result: RetentionRunResult = {
    trialReminders: 0,
    trialExpired: 0,
    graceExtensions: 0,
    graceReminders: 0,
    renewalReminders: 0,
    errors: [],
  };

  const now = new Date();

  // ── Trial ──────────────────────────────────────────────────
  try {
    const trialUsers = await fetchRetentionUsers({ statuses: ['trial'] });
    for (const u of trialUsers) {
      const trialEnd = parseDate(u.trial_end_date);
      if (!trialEnd) continue;
      const daysRemaining = Math.max(0, dayCeil(now, trialEnd));
      const name = displayName(u);

      if ([3, 2, 1].includes(daysRemaining)) {
        try {
          await sendTrialReminderEmail({
            email: u.email,
            name,
            businessName: u.businessName,
            daysRemaining,
            trialEndDate: trialEnd.toISOString().split('T')[0],
          });
          result.trialReminders += 1;
        } catch (e: any) {
          result.errors.push(`trial-reminder ${u.email}: ${e?.message || e}`);
        }
      }

      if (daysRemaining === 0) {
        const trialEndStr = trialEnd.toISOString().split('T')[0];
        const graceEnd = new Date(
          trialEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
        );
        const graceEndStr = graceEnd.toISOString().split('T')[0];

        try {
          await sendTrialExpiredEmail({
            email: u.email,
            name,
            businessName: u.businessName,
            trialEndDate: trialEndStr,
          });
          result.trialExpired += 1;
        } catch (e: any) {
          result.errors.push(`trial-expired ${u.email}: ${e?.message || e}`);
        }

        try {
          await sendGraceExtensionEmail({
            email: u.email,
            name,
            businessName: u.businessName,
            trialEndDate: trialEndStr,
            graceEndDate: graceEndStr,
            daysRemainingInGrace: GRACE_PERIOD_DAYS,
          });
          result.graceExtensions += 1;
        } catch (e: any) {
          result.errors.push(`grace-extension ${u.email}: ${e?.message || e}`);
        }

        try {
          const sb = getSupabaseAdmin();
          await sb
            .from('users')
            .update({
              subscription_status: 'grace',
              grace_end_date: graceEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', u.id);
        } catch (e: any) {
          result.errors.push(`grace-status ${u.email}: ${e?.message || e}`);
        }
      }
    }
  } catch (e: any) {
    result.errors.push(`trial-scan: ${e?.message || e}`);
  }

  // ── Grace ──────────────────────────────────────────────────
  try {
    const graceUsers = await fetchRetentionUsers({ statuses: ['grace'] });
    for (const u of graceUsers) {
      const graceEnd = parseDate(u.grace_end_date);
      if (!graceEnd) continue;
      const daysRemaining = Math.max(0, dayCeil(now, graceEnd));
      if (![2, 1, 0].includes(daysRemaining)) continue;

      try {
        await sendGraceReminderEmail({
          email: u.email,
          name: displayName(u),
          businessName: u.businessName,
          graceEndDate: graceEnd.toISOString().split('T')[0],
          daysRemaining,
        });
        result.graceReminders += 1;
      } catch (e: any) {
        result.errors.push(`grace-reminder ${u.email}: ${e?.message || e}`);
      }
    }
  } catch (e: any) {
    result.errors.push(`grace-scan: ${e?.message || e}`);
  }

  // ── Renewal ────────────────────────────────────────────────
  try {
    const paidUsers = await fetchRetentionUsers({
      statuses: ['active', 'pending_payment', 'expired'],
    });
    for (const u of paidUsers) {
      const due = parseDate(u.subscription_end_date);
      if (!due) continue;
      const daysUntilDue = dayCeil(now, due);
      if (![3, 1, 0, -1, -3].includes(daysUntilDue)) continue;

      const planId = u.plan || 'starter';
      const plan = getPlanById(planId);
      const amount = plan?.monthlyPrice ?? 0;

      try {
        await sendRenewalDueReminderEmail({
          email: u.email,
          name: displayName(u),
          businessName: u.businessName,
          planName: planDisplayName(planId),
          amount: typeof amount === 'number' ? amount : 0,
          currency: 'NGN',
          dueDate: due.toISOString().split('T')[0],
          daysUntilDue,
        });
        result.renewalReminders += 1;
      } catch (e: any) {
        result.errors.push(`renewal ${u.email}: ${e?.message || e}`);
      }
    }
  } catch (e: any) {
    result.errors.push(`renewal-scan: ${e?.message || e}`);
  }

  return result;
}

// Optional in-process cron (long-lived Node only)
class EmailScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) {
      console.log('⚠️ [Email Scheduler] Already initialized');
      return;
    }

    console.log('🚀 [Email Scheduler] Initializing (Supabase)...');
    this.registerTask({
      name: 'retention-emails',
      cronExpression: '0 10 * * *',
      enabled: true,
      task: async () => {
        const r = await runRetentionEmailJobs();
        console.log('[Email Scheduler] retention run', r);
      },
    });

    this.isInitialized = true;
    console.log('✅ [Email Scheduler] Initialized');
  }

  private registerTask(task: ScheduledTask) {
    if (!task.enabled) {
      console.log(`⏭️ [Email Scheduler] Skipping disabled task: ${task.name}`);
      return;
    }
    const scheduledTask = cron.schedule(task.cronExpression, async () => {
      console.log(`⏰ [Email Scheduler] Running task: ${task.name}`);
      try {
        await task.task();
        console.log(`✅ [Email Scheduler] Task completed: ${task.name}`);
      } catch (error) {
        console.error(`❌ [Email Scheduler] Task failed: ${task.name}`, error);
      }
    });
    this.tasks.set(task.name, scheduledTask);
    console.log(`📅 [Email Scheduler] Registered: ${task.name} (${task.cronExpression})`);
  }

  stopAll() {
    this.tasks.forEach((t) => t.stop());
  }

  startAll() {
    this.tasks.forEach((t) => t.start());
  }

  getRunningTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

export const emailScheduler = new EmailScheduler();
export default emailScheduler;

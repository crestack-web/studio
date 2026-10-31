import { isCompedLifetimeEmail } from '@/lib/subscription/comped-emails';
/**
 * Single source of truth for plan + trial/grace access.
 * Reads both real columns (migration 0013) and legacy metadata keys.
 */

export type PlanId = 'starter' | 'standard' | 'pro';

export type ResolvedAccess = {
  plan: PlanId;
  /** Raw status if known: trial | grace | active | expired | pending_payment | '' */
  subscriptionStatus: string;
  isInTrialWindow: boolean;
  isInGraceWindow: boolean;
  isActivePaid: boolean;
  lifetimeAccess: boolean;
  /** True when user should get full product nav (trial, grace, active paid, lifetime) */
  hasFullAccess: boolean;
  /** Plan used for nav gates (never collapses to starter during trial/grace/active) */
  effectivePlanForNav: PlanId;
  trialEndDate?: Date;
  graceEndDate?: Date;
  subscriptionEndDate?: Date;
};

function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  if (typeof value === 'object' && value !== null && typeof (value as any).toDate === 'function') {
    try {
      const d = (value as any).toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
    } catch {
      return undefined;
    }
  }
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? undefined : d;
}

function normalizePlan(raw: unknown): PlanId {
  const p = String(raw || '')
    .toLowerCase()
    .trim();
  if (p === 'pro' || p === 'business' || p === 'enterprise') return 'pro';
  if (p === 'standard' || p === 'growth' || p === 'plus') return 'standard';
  if (p === 'starter' || p === 'free' || p === 'basic') return 'starter';
  return 'starter';
}

/**
 * Resolve access from a public.users row (columns + metadata).
 */
export function resolveUserAccess(userRow: Record<string, any> | null | undefined): ResolvedAccess {
  const row = userRow || {};
  const meta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, any>)
      : {};

  const planRaw =
    row.plan ||
    meta.plan ||
    meta.selectedPlan ||
    meta.currentPlan ||
    null;

  const subscriptionStatus = String(
    row.subscription_status ||
      row.subscriptionStatus ||
      meta.subscriptionStatus ||
      meta.subscription_status ||
      ''
  )
    .toLowerCase()
    .trim();

  const trialEndDate =
    asDate(row.trial_end_date) ||
    asDate(row.trialEndDate) ||
    asDate(meta.trialEndDate) ||
    asDate(meta.trial_end_date);

  const trialStartDate =
    asDate(row.trial_start_date) ||
    asDate(meta.trialStartDate) ||
    asDate(meta.trial_start_date);

  const graceEndDate =
    asDate(row.grace_end_date) ||
    asDate(row.graceEndDate) ||
    asDate(meta.graceEndDate) ||
    asDate(meta.grace_end_date);

  const subscriptionEndDate =
    asDate(row.subscription_end_date) ||
    asDate(row.subscriptionEndDate) ||
    asDate(meta.subscriptionEndDate) ||
    asDate(meta.subscription_end_date);

  const email =
    String(row.email || meta.email || '').toLowerCase().trim() || null;
  const lifetimeAccess =
    row.lifetime_access === true ||
    meta.lifetimeAccess === true ||
    meta.lifetime_access === true ||
    String(meta.accessType || '').toLowerCase() === 'lifetime' ||
    isCompedLifetimeEmail(email);

  const now = new Date();

  // Trial window ONLY while trial_end_date is still in the future.
  // Status alone must never keep access open after the end date (hard cut-off).
  const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;
  const statusIsTrial =
    subscriptionStatus === 'trial' || subscriptionStatus === 'trialing';

  let inTrialWindow = false;
  if (lifetimeAccess) {
    inTrialWindow = false;
    // Complimentary / lifetime accounts get full Scale (pro) entitlements
    if (isCompedLifetimeEmail(email) || row.lifetime_access === true || meta.lifetimeAccess === true) {
      // plan forced below after normalize
    }
  } else if (trialEndDate != null) {
    inTrialWindow = trialEndDate > now;
  } else if (statusIsTrial && trialStartDate != null) {
    // Status says trial but no end date → derive 14 days from start
    inTrialWindow = now.getTime() - trialStartDate.getTime() < TRIAL_MS;
  } else if (
    subscriptionStatus === '' &&
    trialStartDate != null &&
    trialEndDate == null
  ) {
    inTrialWindow =
      trialStartDate <= now && now.getTime() - trialStartDate.getTime() < TRIAL_MS;
  }

  const inGraceWindow =
    subscriptionStatus === 'grace' ||
    ((subscriptionStatus === 'expired' || subscriptionStatus === 'pending_payment') &&
      graceEndDate != null &&
      graceEndDate > now) ||
    (trialEndDate != null &&
      trialEndDate <= now &&
      graceEndDate != null &&
      graceEndDate > now);

  const isActivePaid =
    lifetimeAccess ||
    (subscriptionStatus === 'active' &&
      (!subscriptionEndDate || subscriptionEndDate > now));

  // Null plan during trial/grace was wiping sidebar — treat as standard entitlement
  let plan = normalizePlan(planRaw);
  if (lifetimeAccess) {
    plan = planRaw && normalizePlan(planRaw) === 'standard' ? 'standard' : 'pro';
    // HQ / comped always Scale
    if (isCompedLifetimeEmail(email)) plan = 'pro';
  }
  if ((!planRaw || plan === 'starter') && (inTrialWindow || inGraceWindow || isActivePaid)) {
    // Keep pro if explicitly set; otherwise standard for full nav during entitled periods
    if (planRaw && normalizePlan(planRaw) === 'pro') {
      plan = 'pro';
    } else if (!planRaw || plan === 'starter') {
      if (inTrialWindow || inGraceWindow) {
        plan = 'standard';
      }
    }
  }

  const hasFullAccess = Boolean(inTrialWindow || inGraceWindow || isActivePaid);

  const effectivePlanForNav: PlanId = hasFullAccess
    ? plan === 'pro'
      ? 'pro'
      : 'standard'
    : plan;

  return {
    plan,
    subscriptionStatus,
    isInTrialWindow: Boolean(inTrialWindow),
    isInGraceWindow: Boolean(inGraceWindow),
    isActivePaid: Boolean(isActivePaid),
    lifetimeAccess: Boolean(lifetimeAccess),
    hasFullAccess,
    effectivePlanForNav,
    trialEndDate,
    graceEndDate,
    subscriptionEndDate,
  };
}

/** Columns safe to select from public.users after migration 0013 */
export const USER_ACCESS_SELECT =
  'id, email, business_id, plan, role, status, subscription_status, trial_start_date, trial_end_date, grace_end_date, subscription_start_date, subscription_end_date, metadata';

/**
 * Patch for extending trial (admin / ops). Does not clear category or features.
 */
export function buildTrialExtensionPatch(days: number, from: Date = new Date()): Record<string, unknown> {
  const trialEnd = new Date(from);
  trialEnd.setDate(trialEnd.getDate() + Math.max(1, days));
  const nowIso = new Date().toISOString();
  const trialEndIso = trialEnd.toISOString();
  return {
    plan: 'standard',
    subscription_status: 'trial',
    trial_start_date: nowIso,
    trial_end_date: trialEndIso,
    grace_end_date: null,
    updated_at: nowIso,
    metadata: {
      plan: 'standard',
      subscriptionStatus: 'trial',
      trialStartDate: nowIso,
      trialEndDate: trialEndIso,
    },
  };
}

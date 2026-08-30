import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Restore / extend access for a user in Supabase (columns + metadata).
 * Does not touch business category or feature preferences.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const plan = String(body.plan || 'standard').toLowerCase();
    const mode = String(body.mode || 'active').toLowerCase(); // active | trial
    const days = Math.max(1, Number(body.days) || (mode === 'trial' ? 7 : 365));

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: userRow, error: findErr } = await supabase
      .from('users')
      .select('id, email, plan, metadata, subscription_status, trial_end_date')
      .eq('email', email)
      .maybeSingle();

    if (findErr) throw findErr;
    if (!userRow?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    const nowIso = now.toISOString();
    const endIso = end.toISOString();

    const meta =
      userRow.metadata && typeof userRow.metadata === 'object'
        ? { ...(userRow.metadata as Record<string, unknown>) }
        : {};

    const targetPlan = ['starter', 'standard', 'pro'].includes(plan) ? plan : 'standard';

    if (mode === 'trial') {
      meta.plan = targetPlan;
      meta.subscriptionStatus = 'trial';
      meta.trialStartDate = nowIso;
      meta.trialEndDate = endIso;
      delete meta.graceEndDate;

      const { error } = await supabase
        .from('users')
        .update({
          plan: targetPlan,
          subscription_status: 'trial',
          trial_start_date: nowIso,
          trial_end_date: endIso,
          grace_end_date: null,
          metadata: meta,
          updated_at: nowIso,
        })
        .eq('id', userRow.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        userId: userRow.id,
        email,
        plan: targetPlan,
        subscription_status: 'trial',
        trial_end_date: endIso,
      });
    }

    meta.plan = targetPlan;
    meta.subscriptionStatus = 'active';
    meta.subscriptionStartDate = nowIso;
    meta.subscriptionEndDate = endIso;

    const { error } = await supabase
      .from('users')
      .update({
        plan: targetPlan,
        subscription_status: 'active',
        subscription_start_date: nowIso,
        subscription_end_date: endIso,
        metadata: meta,
        updated_at: nowIso,
      })
      .eq('id', userRow.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      userId: userRow.id,
      email,
      plan: targetPlan,
      subscription_status: 'active',
      subscription_end_date: endIso,
    });
  } catch (error: any) {
    console.error('[restore-user-access]', error);
    return NextResponse.json({ error: error?.message || 'Failed to restore access' }, { status: 500 });
  }
}

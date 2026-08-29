import { NextRequest, NextResponse } from 'next/server';
import { sendSubscriptionReceiptEmail } from '@/services/email/subscription-emails';
import { sendSubscriptionRenewedEmail } from '@/services/email/subscription-lifecycle-emails';
import { sendReferralConvertedToPaidEmail, sendReferralRewardEarnedEmail } from '@/services/email/referral-emails';
import { createPostHogClient } from '@/lib/posthog-server';
import { recordSubscriptionPayment } from '@/lib/payments/record-subscription-payment';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { planDisplayName, getPlanById } from '@/lib/pricing';

const COMMISSION_RATE = 0.2;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const reference = String(body.reference || '').trim();

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    console.log('🔍 [verify-subscription] Verifying payment with reference:', reference);

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!paystackSecretKey) {
      console.error('❌ [verify-subscription] PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment verification failed - configuration error' },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json().catch(() => ({}));
    console.log('📊 [verify-subscription] Paystack status:', verifyData?.data?.status, verifyData?.message);

    if (!verifyData.status || verifyData?.data?.status !== 'success') {
      console.error('❌ [verify-subscription] Paystack verification failed:', verifyData.message || verifyData?.data?.status);
      return NextResponse.json(
        { error: verifyData.message || 'Payment not successful' },
        { status: 400 }
      );
    }

    const transaction = verifyData.data;
    const metadata = transaction.metadata || {};

    const planId = String(metadata.planId || metadata.plan || 'starter').toLowerCase();
    const plan = getPlanById(planId);
    const billing =
      String(metadata.billing || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    const email =
      transaction.customer?.email || metadata.email || null;
    let userId = metadata.userId || null;

    let recordResult: Awaited<ReturnType<typeof recordSubscriptionPayment>> | null = null;
    try {
      recordResult = await recordSubscriptionPayment({
        reference: String(reference),
        amountKobo: Number(transaction.amount) || 0,
        currency: String(transaction.currency || 'NGN'),
        email,
        userId,
        planId: plan.id,
        planName: plan.name,
        billing,
        paidAt: transaction.paid_at
          ? new Date(
              typeof transaction.paid_at === 'number'
                ? transaction.paid_at * 1000
                : transaction.paid_at
            ).toISOString()
          : new Date().toISOString(),
      });
      if (recordResult.userId) userId = recordResult.userId;
    } catch (recErr: any) {
      console.error('[verify-subscription] Supabase payment record failed:', recErr?.message);
    }

    const paymentAmount = (Number(transaction.amount) || 0) / 100;
    const subscriptionEndDate = new Date();
    if (billing === 'monthly') {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    }

    const sb = getSupabaseAdmin();
    let userEmail = email;
    let userName = 'User';
    let businessName = 'Your Business';
    let previousPlan: string | null = null;
    let previousStatus: string | null = null;

    if (userId || email) {
      let q = sb.from('users').select('*');
      if (userId) q = q.eq('id', userId);
      else q = q.eq('email', String(email).toLowerCase());
      const { data: userRow } = await q.maybeSingle();
      if (userRow) {
        userId = (userRow as any).id || userId;
        userEmail = (userRow as any).email || userEmail;
        userName =
          (userRow as any).name ||
          (userRow as any).displayName ||
          (userRow as any).display_name ||
          userName;
        businessName =
          (userRow as any).businessName ||
          (userRow as any).business_name ||
          businessName;
        previousPlan = (userRow as any).plan || null;
        previousStatus =
          (userRow as any).subscription_status ||
          (userRow as any).subscriptionStatus ||
          null;
      }
    }

    try {
      if (userId) {
        const posthog = createPostHogClient();
        posthog.capture({
          distinctId: String(userId),
          event: 'subscription_payment_verified',
          properties: {
            plan: plan.id,
            billing_cycle: billing,
            amount: paymentAmount,
            currency: transaction.currency,
          },
        });
        await posthog.shutdown();
      }
    } catch (phErr: any) {
      console.warn('[verify-subscription] posthog skipped', phErr?.message);
    }

    if (userId) {
      try {
        await processReferralCommissionSupabase(sb, String(userId), plan.id, paymentAmount);
      } catch (referralError) {
        console.error('⚠️ [verify-subscription] Referral processing failed:', referralError);
      }
    }

    if (userEmail) {
      const nextBillingDate = subscriptionEndDate.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const displayPlan = planDisplayName(plan.id);

      sendSubscriptionReceiptEmail({
        email: userEmail,
        name: userName,
        businessName,
        planName: displayPlan,
        amount: paymentAmount,
        currency: transaction.currency || 'NGN',
        transactionId: reference,
        billingPeriod: billing === 'yearly' ? 'Yearly' : 'Monthly',
        nextBillingDate,
      }).catch((emailError) => {
        console.error('❌ [verify-subscription] Failed to send receipt email:', emailError);
      });

      const wasPaid =
        previousStatus === 'active' ||
        (previousPlan && previousPlan !== 'free' && previousStatus !== 'trial' && previousStatus !== 'trialing');
      if (wasPaid) {
        sendSubscriptionRenewedEmail({
          email: userEmail,
          name: userName,
          businessName,
          planName: displayPlan,
          amount: paymentAmount,
          billingPeriod: billing === 'yearly' ? 'Yearly' : 'Monthly',
          nextBillingDate,
          currency: transaction.currency || 'NGN',
        }).catch((emailError) => {
          console.error('❌ [verify-subscription] Failed to send renewal email:', emailError);
        });
      }
    }

    return NextResponse.json({
      success: true,
      plan: plan.id,
      planName: plan.name,
      billing,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      recorded: recordResult?.ok ?? false,
    });
  } catch (error) {
    console.error('❌ [verify-subscription] Error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

async function processReferralCommissionSupabase(
  sb: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  plan: string,
  paymentAmount: number
) {
  const { data: referrals, error } = await sb
    .from('referrals')
    .select('*')
    .eq('referred_id', userId)
    .limit(1);

  if (error || !referrals?.length) {
    const { data: alt } = await sb
      .from('referrals')
      .select('*')
      .eq('referredId', userId)
      .limit(1);
    if (!alt?.length) {
      console.log('ℹ️ [referral] No referral found for user:', userId);
      return;
    }
    return applyReferral(sb, alt[0], userId, plan, paymentAmount);
  }
  return applyReferral(sb, referrals[0], userId, plan, paymentAmount);
}

async function applyReferral(
  sb: ReturnType<typeof getSupabaseAdmin>,
  referralData: any,
  userId: string,
  plan: string,
  paymentAmount: number
) {
  const referrerId = referralData.referrer_id || referralData.referrerId;
  if (!referrerId) return;

  const commissionAmount = paymentAmount * COMMISSION_RATE;
  const nowIso = new Date().toISOString();

  await sb
    .from('referrals')
    .update({
      status: 'active',
      has_subscribed: true,
      hasSubscribed: true,
      subscription_plan: plan,
      subscriptionPlan: plan,
      subscription_date: nowIso,
      commission_earned: commissionAmount,
      commissionEarned: commissionAmount,
      updated_at: nowIso,
    })
    .eq('id', referralData.id);

  const { data: referrer } = await sb.from('users').select('*').eq('id', referrerId).maybeSingle();
  if (!referrer) return;

  const currentBalance = Number((referrer as any).referral_balance ?? (referrer as any).referralBalance ?? 0);
  const totalEarned = Number((referrer as any).total_earned ?? (referrer as any).totalEarned ?? 0);

  await sb
    .from('users')
    .update({
      referral_balance: currentBalance + commissionAmount,
      referralBalance: currentBalance + commissionAmount,
      total_earned: totalEarned + commissionAmount,
      totalEarned: totalEarned + commissionAmount,
      updated_at: nowIso,
    })
    .eq('id', referrerId);

  const referrerEmail = (referrer as any).email;
  const referrerName =
    (referrer as any).name || (referrer as any).displayName || 'Referrer';
  const referrerBusinessName =
    (referrer as any).businessName || (referrer as any).business_name || 'Your Business';

  const { data: referred } = await sb.from('users').select('*').eq('id', userId).maybeSingle();
  const referredUserName =
    (referred as any)?.name || (referred as any)?.displayName || 'User';

  if (referrerEmail) {
    sendReferralConvertedToPaidEmail({
      email: referrerEmail,
      name: referrerName,
      businessName: referrerBusinessName,
      referralName: referredUserName,
      referralEmail: userId,
      planName: planDisplayName(plan),
      conversionDate: new Date().toLocaleDateString(),
      rewardAmount: commissionAmount,
      currency: 'NGN',
    }).catch(() => {});

    sendReferralRewardEarnedEmail({
      email: referrerEmail,
      name: referrerName,
      businessName: referrerBusinessName,
      referralName: referredUserName,
      referralEmail: userId,
      rewardAmount: commissionAmount,
      rewardType: 'credit',
      earnedDate: new Date().toLocaleDateString(),
      currency: 'NGN',
    }).catch(() => {});
  }

  console.log('✅ [referral] Commission credited:', { referrerId, amount: commissionAmount, plan });
}

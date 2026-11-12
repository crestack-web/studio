import { NextRequest, NextResponse } from 'next/server';
import { sendSubscriptionReceiptEmail } from '@/services/email/subscription-emails';
import { sendSubscriptionRenewedEmail } from '@/services/email/subscription-lifecycle-emails';
import { sendReferralConvertedToPaidEmail, sendReferralRewardEarnedEmail } from '@/services/email/referral-emails';
import { createPostHogClient } from '@/lib/posthog-server';
import { recordSubscriptionPayment } from '@/lib/payments/record-subscription-payment';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { planDisplayName, getPlanById } from '@/lib/pricing';
import { sendTikTokServerEvent } from '@/lib/tiktok/events-api';

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
    const billing = String(metadata.billing || 'monthly').toLowerCase();
    const email = String(transaction.customer?.email || metadata.email || '').toLowerCase();
    let userId = metadata.userId || metadata.user_id || null;

    try {
      const recordResult = await recordSubscriptionPayment({
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
    try {
      const contentId = String(plan?.id || plan?.name || 'busmo_subscription').trim() || 'busmo_subscription';
      const contentName = String(plan?.name || plan?.id || 'Busmo subscription').trim() || contentId;
      const ttProps = {
        value: paymentAmount,
        currency: String(transaction.currency || 'NGN'),
        content_id: contentId,
        content_name: contentName,
        content_type: 'product' as const,
        content_category: 'subscription',
        quantity: 1,
        contents: [
          {
            content_id: contentId,
            content_name: contentName,
            content_type: 'product',
            quantity: 1,
            price: paymentAmount,
          },
        ],
      };
      await sendTikTokServerEvent({
        event: 'CompletePayment',
        eventId: `pay_${String(reference)}`,
        email: email,
        externalId: userId,
        properties: ttProps,
        pageUrl: 'https://www.busmo.io/subscribe/success',
      });
      await sendTikTokServerEvent({
        event: 'PlaceAnOrder',
        eventId: `order_${String(reference)}`,
        email: email,
        externalId: userId,
        properties: ttProps,
        pageUrl: 'https://www.busmo.io/subscribe/success',
      });
    } catch (ttErr: any) {
      console.warn('[verify-subscription] tiktok event', ttErr?.message);
    }

    const subscriptionEndDate = new Date();
    if (billing === 'yearly' || billing === 'annual') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    try {
      if (email) {
        const sb = getSupabaseAdmin();
        const { data: userRow } = await sb
          .from('users')
          .select('id, email, full_name, business_id, metadata')
          .eq('email', email)
          .maybeSingle();

        if (userRow) {
          userId = userId || (userRow as any).id;
          const meta = ((userRow as any).metadata || {}) as Record<string, unknown>;
          await sb
            .from('users')
            .update({
              plan: plan.id,
              status: 'active',
              metadata: {
                ...meta,
                subscriptionStatus: 'active',
                billing,
                lastPaymentReference: reference,
                subscriptionEndsAt: subscriptionEndDate.toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', (userRow as any).id);
        }

        if (userId) {
          await processReferralCommissionSupabase(sb, String(userId), plan.id, paymentAmount);
        }
      }
    } catch (userErr: any) {
      console.warn('[verify-subscription] user update', userErr?.message);
    }

    const displayPlan = planDisplayName(plan.id);
    try {
      if (email) {
        await sendSubscriptionReceiptEmail({
          email,
          planName: displayPlan,
          amount: paymentAmount,
          currency: String(transaction.currency || 'NGN'),
          reference: String(reference),
          billingPeriod: billing === 'yearly' || billing === 'annual' ? 'yearly' : 'monthly',
        });
        await sendSubscriptionRenewedEmail({
          email,
          planName: displayPlan,
          amount: paymentAmount,
          currency: String(transaction.currency || 'NGN'),
          endsAt: subscriptionEndDate.toISOString(),
        });
      }
    } catch (mailErr: any) {
      console.warn('[verify-subscription] email', mailErr?.message);
    }

    try {
      const posthog = createPostHogClient();
      posthog?.capture({
        distinctId: String(userId || email || reference),
        event: 'subscription_payment_verified',
        properties: {
          plan: plan.id,
          planId: plan.id,
          planName: plan.name,
          amount: paymentAmount,
          billing,
          reference,
        },
      });
      await posthog?.shutdown();
    } catch {
      /* optional */
    }

    return NextResponse.json({
      ok: true,
      status: 'success',
      reference,
      plan: plan.id,
      planName: plan.name,
      amount: paymentAmount,
      currency: String(transaction.currency || 'NGN'),
      billing,
      subscriptionEndsAt: subscriptionEndDate.toISOString(),
    });
  } catch (e: any) {
    console.error('[verify-subscription]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Verification failed' }, { status: 500 });
  }
}

async function processReferralCommissionSupabase(
  sb: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  plan: string,
  paymentAmount: number
) {
  const { data: referralData } = await sb
    .from('referrals')
    .select('*')
    .eq('referred_id', userId)
    .maybeSingle();

  if (!referralData) return;

  const referrerId = (referralData as any).referrer_id || (referralData as any).referrerId;
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

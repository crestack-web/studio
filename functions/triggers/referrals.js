const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

function getCommissionRate(paidReferralsCount) {
  if (paidReferralsCount >= 25) return 0.5;
  if (paidReferralsCount >= 10) return 0.4;
  return 0.3;
}

function roundMoney(value) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.round(numberValue * 100) / 100;
}

/**
 * Applies recurring referral commissions for successful subscription payments.
 * Trigger source: subscriptionTransactions/{txId}
 * Writes:
 * - users/{referrerUid}/referralEarnings/{txId}
 * - users/{referrerUid}/referrals/{referredUid}
 * - users/{referrerUid}/referralStats/summary
 */
exports.onSubscriptionTransactionCreatedApplyReferralCommission = functions.firestore.document('subscriptionTransactions/{txId}').onCreate(async (snap, context) => {
    const txId = event?.params?.txId;
    const txData = event?.data?.data?.() || {};

    if (!txId) return null;
    if (txData?.status !== 'successful') return null;

    const userId = txData?.userId;
    if (!userId) return null;

    const amountPaid = roundMoney(txData?.amountPaid);
    if (!amountPaid || amountPaid <= 0) return null;

    const userSnap = await db.doc(`users/${userId}`).get().catch(() => null);
    const referredBy = userSnap?.exists ? userSnap.data()?.referredBy : null;

    if (!referredBy || typeof referredBy !== 'string') return null;
    if (referredBy === userId) return null;

    const referrerUid = referredBy;

    try {
      await db.runTransaction(async (t) => {
        const earningRef = db.doc(`users/${referrerUid}/referralEarnings/${txId}`);
        const earningSnap = await t.get(earningRef);
        if (earningSnap.exists) return;

        const statsRef = db.doc(`users/${referrerUid}/referralStats/summary`);
        const referralRef = db.doc(`users/${referrerUid}/referrals/${userId}`);

        const [statsSnap, referralSnap] = await Promise.all([t.get(statsRef), t.get(referralRef)]);

        const stats = statsSnap.exists ? (statsSnap.data() || {}) : {};
        const referral = referralSnap.exists ? (referralSnap.data() || {}) : {};

        const prevPaidReferralsCount = Number(stats.paidReferralsCount || 0);
        const prevTotalReferralsCount = Number(stats.totalReferralsCount || 0);

        const hadFirstPaidAt = !!referral.firstPaidAt;
        const isFirstPaid = !hadFirstPaidAt;

        const paidReferralsCountAfter = prevPaidReferralsCount + (isFirstPaid ? 1 : 0);
        const commissionRate = getCommissionRate(paidReferralsCountAfter);
        const commissionAmount = roundMoney(amountPaid * commissionRate);

        const now = admin.firestore.FieldValue.serverTimestamp();

        // Ensure referral doc exists.
        if (!referralSnap.exists) {
          t.set(
            referralRef,
            {
              referredUid: userId,
              status: isFirstPaid ? 'paid' : 'signed_up',
              createdAt: now,
              paidCount: 0,
              totalCommission: 0,
              firstPaidAt: isFirstPaid ? now : null,
              lastCommissionAt: now,
            },
            { merge: true }
          );

          t.set(
            statsRef,
            {
              balance: 0,
              totalCommission: 0,
              paidReferralsCount: 0,
              totalReferralsCount: prevTotalReferralsCount + 1,
              currentRate: getCommissionRate(prevPaidReferralsCount),
              updatedAt: now,
            },
            { merge: true }
          );
        } else {
          if (isFirstPaid) {
            t.set(
              referralRef,
              {
                status: 'paid',
                firstPaidAt: now,
              },
              { merge: true }
            );
          }
        }

        t.set(
          earningRef,
          {
            txId,
            referredUid: userId,
            amountPaid,
            commissionRate,
            commissionAmount,
            currency: txData?.currency || 'NGN',
            planId: txData?.planId || null,
            createdAt: now,
          },
          { merge: false }
        );

        t.set(
          referralRef,
          {
            paidCount: admin.firestore.FieldValue.increment(1),
            totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
            lastCommissionAt: now,
          },
          { merge: true }
        );

        t.set(
          statsRef,
          {
            balance: admin.firestore.FieldValue.increment(commissionAmount),
            totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
            paidReferralsCount: isFirstPaid ? paidReferralsCountAfter : prevPaidReferralsCount,
            totalReferralsCount: referralSnap.exists ? prevTotalReferralsCount : prevTotalReferralsCount + 1,
            currentRate: commissionRate,
            updatedAt: now,
          },
          { merge: true }
        );
      });

      return null;
    } catch (error) {
      console.error('Referral commission apply failed', {
        txId,
        userId,
        referrerUid,
        error: error?.message || String(error),
      });
      return null;
    }
  }
);

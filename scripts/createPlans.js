// Script to create/update Firestore plans documents for all subscription plans.
// IMPORTANT: Paystack plan codes must be created/updated in the Paystack dashboard
// to match the new amounts before NEW subscribers are billed at the new prices.
// Existing subscribers remain on their original Paystack plan codes — do not
// overwrite live plan codes without a deliberate migration plan.
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const plans = [
  {
    id: 'starter',
    name: 'Busmo Start',
    monthlyPrice: 7500,
    yearlyPrice: 75000,
    // Keep existing codes until new Paystack plans are created for ₦7,500 / ₦75,000
    paystack_plan_code_monthly: 'PLN_79p5yysj5q5z1qz',
    paystack_plan_code_yearly: 'PLN_k9c24tyc4g5x8v9',
  },
  {
    id: 'standard',
    name: 'Busmo Control',
    monthlyPrice: 20000,
    yearlyPrice: 200000,
    paystack_plan_code_monthly: 'PLN_x5vbs3rigk8g9q2',
    paystack_plan_code_yearly: 'PLN_0z6g4j3j6a59v04',
  },
  {
    id: 'pro',
    name: 'Busmo Scale',
    monthlyPrice: 40000,
    yearlyPrice: 400000,
    paystack_plan_code_monthly: 'PLN_p0j2j9y6f7a6g9v',
    paystack_plan_code_yearly: 'PLN_2s4q2y0g1m1c8s7',
  },
];

async function createPlans() {
  for (const plan of plans) {
    await db.collection('plans').doc(plan.id).set(plan, { merge: true });
    console.log(`Created/updated plan: ${plan.id}`);
  }
  console.log('All plans created/updated.');
  console.log('NOTE: Update Paystack plan codes in dashboard for new prices, then replace codes above and re-run.');
  process.exit(0);
}

createPlans().catch((err) => {
  console.error(err);
  process.exit(1);
});

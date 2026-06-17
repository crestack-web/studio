// Script to create Firestore plans documents for all subscription plans
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    paystack_plan_code_monthly: 'PLN_79p5yysj5q5z1qz',
    paystack_plan_code_yearly: 'PLN_k9c24tyc4g5x8v9',
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 10000,
    yearlyPrice: 100000,
    paystack_plan_code_monthly: 'PLN_x5vbs3rigk8g9q2',
    paystack_plan_code_yearly: 'PLN_0z6g4j3j6a59v04',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 25000,
    yearlyPrice: 250000,
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
  process.exit(0);
}

createPlans().catch((err) => {
  console.error(err);
  process.exit(1);
});

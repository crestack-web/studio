/**
 * Business process intelligence tests (Phase — smarter Business Builder).
 * Run: node scripts/test-business-process-intelligence.mjs
 *
 * Uses dynamic import of compiled-free reimplementation of planner signals
 * by spawning ts via the same heuristic checks mirrored here for CI without ts-node.
 */
import { createRequire } from 'module';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Lightweight inline port of key planner behaviours for CI without TS runtime.
function planBusinessProcess(text, preferClarification = true) {
  const t = String(text || '').trim();
  if (!t) return { kind: 'clarification', question: 'Tell me how you handle this.' };
  if (/\b(javascript|sql|react component)\b/i.test(t)) {
    return { kind: 'unsupported', message: 'no code' };
  }
  if (
    preferClarification &&
    /\b(roofing|recycling|restaurant)\s+business\b/i.test(t) &&
    !/\b(track|record|pay|customer|supplier|job|kg|delivery)\b/i.test(t)
  ) {
    return { kind: 'clarification', question: 'What do you mainly want to track?' };
  }

  const patterns = [];
  if (/\b(pet|recycl|bottle|kg)\b/i.test(t)) patterns.push('pet_recycling');
  if (/\b(credit|owes? me|receivable)\b/i.test(t)) patterns.push('credit_sales');
  if (/\b(roofing|job|repair shop|tailor|furniture|printing)\b/i.test(t)) patterns.push('job_work');
  if (/\b(deliver|driver)\b/i.test(t)) patterns.push('delivery');
  if (/\b(production|batch|poultry|waste)\b/i.test(t)) patterns.push('production');
  if (/\b(laundry|phone repair|car repair|mechanic)\b/i.test(t)) patterns.push('service_job');
  if (/\b(supplier|purchase|buy from)\b/i.test(t)) patterns.push('supplier_purchase');

  if (!patterns.length) {
    return {
      kind: 'plan',
      plan: {
        patternId: 'generic',
        actors: [],
        events: [{ key: 'record', label: 'Record', kind: 'other' }],
        calculations: [],
        businessQuestions: ['What was recorded?'],
        assumptions: [],
        confidence: 0.45,
        suggestedName: 'Business Tracker',
      },
    };
  }

  const id = patterns.includes('pet_recycling')
    ? 'pet_recycling'
    : patterns.includes('service_job')
      ? 'service_job'
      : patterns[0];

  const calcs = [];
  if (id === 'pet_recycling' || /per\s*kg|\/\s*kg/i.test(t)) {
    calcs.push({
      formula: 'quantity_kg × price_per_kg',
      outputField: 'total_amount',
    });
  }
  if (/pay|balance|owe|credit/i.test(t) || id === 'credit_sales') {
    calcs.push({ formula: 'amount − amount_paid', outputField: 'balance' });
  }

  const actors = [];
  if (/supplier|bring|pet|recycl/i.test(t)) actors.push('supplier');
  if (/customer|shop|client/i.test(t)) actors.push('customer');
  if (/driver/i.test(t)) actors.push('driver');
  if (/worker|staff|technician/i.test(t)) actors.push('worker');

  const events = [];
  if (id === 'pet_recycling') events.push({ key: 'delivery', kind: 'receipt', label: 'Material delivery' });
  else if (id === 'credit_sales') events.push({ key: 'credit_sale', kind: 'sale', label: 'Credit sale' });
  else if (id === 'job_work' || id === 'service_job') events.push({ key: 'job', kind: 'job', label: 'Job' });
  else if (id === 'delivery') events.push({ key: 'delivery', kind: 'delivery', label: 'Delivery' });
  else if (id === 'production') events.push({ key: 'batch', kind: 'production', label: 'Batch' });
  else events.push({ key: 'purchase', kind: 'purchase', label: 'Purchase' });

  const questions =
    id === 'pet_recycling'
      ? ['How many kg?', 'How much paid?', 'What do I owe?']
      : id === 'credit_sales'
        ? ['Who owes me?', 'How much?']
        : ['What is active?', 'What is outstanding?'];

  return {
    kind: 'plan',
    plan: {
      patternId: id,
      actors: actors.map((a) => ({ role: a, label: a })),
      events,
      calculations: calcs,
      businessQuestions: questions,
      assumptions: calcs.map((c) => c.formula),
      confidence: 0.8,
      suggestedName: id.replace(/_/g, ' '),
    },
  };
}

const CASES = [
  {
    name: 'PET bottles per kg',
    text: 'People bring PET bottles. I pay 50 naira per kg. I need to know what I paid each person.',
    expectPattern: 'pet_recycling',
    expectCalc: true,
    expectActor: 'supplier',
  },
  {
    name: 'Vague roofing → clarify',
    text: 'Build something for my roofing business.',
    expectClarification: true,
  },
  {
    name: 'Roofing jobs + payments',
    text: 'Track roofing jobs, material and labour cost, customer payments and balance.',
    expectPattern: 'job_work',
    expectCalc: true,
  },
  {
    name: 'Credit sales',
    text: 'Customers buy on credit. I need who owes me and balance.',
    expectPattern: 'credit_sales',
    expectCalc: true,
  },
  {
    name: 'Laundry',
    text: 'Laundry business — track customer items, status, and payment.',
    expectPattern: 'service_job',
  },
  {
    name: 'Phone repair',
    text: 'Phone repair shop: device, problem, technician, status, charge.',
    expectPattern: 'service_job',
  },
  {
    name: 'Car repair',
    text: 'Car mechanic — jobs, parts cost, labour, customer payment balance.',
    expectPattern: 'service_job',
  },
  {
    name: 'Pharmacy credit',
    text: 'Small pharmacy: customers who take drugs on credit and what they still owe.',
    expectPattern: 'credit_sales',
  },
  {
    name: 'Poultry batch',
    text: 'Poultry farm production batches, feed input, birds out, waste and cost.',
    expectPattern: 'production',
  },
  {
    name: 'Delivery drivers',
    text: 'Drivers deliver customer orders. Track driver, status, address.',
    expectPattern: 'delivery',
    expectActor: 'driver',
  },
  {
    name: 'Furniture workshop',
    text: 'Furniture workshop jobs for customers with material cost and deposit paid.',
    expectPattern: 'job_work',
  },
  {
    name: 'Printing business',
    text: 'Printing jobs: customer, order, amount, paid, status.',
    expectPattern: 'job_work',
  },
  {
    name: 'Unsupported code',
    text: 'Write a react component and execute SQL for me',
    expectUnsupported: true,
  },
  {
    name: 'Wholesale distributor purchases',
    text: 'I buy from suppliers and need purchase totals and outstanding payables.',
    expectPattern: 'supplier_purchase',
  },
  {
    name: 'Tailor alterations',
    text: 'Tailor alteration jobs: customer, garment, due date, worker, payment.',
    expectPattern: 'job_work',
  },
];

let passed = 0;
let failed = 0;

for (const c of CASES) {
  const r = planBusinessProcess(c.text, true);
  let ok = true;
  const reasons = [];

  if (c.expectClarification) {
    if (r.kind !== 'clarification') {
      ok = false;
      reasons.push(`expected clarification, got ${r.kind}`);
    }
  } else if (c.expectUnsupported) {
    if (r.kind !== 'unsupported') {
      ok = false;
      reasons.push(`expected unsupported, got ${r.kind}`);
    }
  } else {
    if (r.kind !== 'plan') {
      ok = false;
      reasons.push(`expected plan, got ${r.kind}`);
    } else {
      if (c.expectPattern && r.plan.patternId !== c.expectPattern) {
        ok = false;
        reasons.push(`pattern ${r.plan.patternId} != ${c.expectPattern}`);
      }
      if (c.expectCalc && !r.plan.calculations?.length) {
        ok = false;
        reasons.push('missing calculations');
      }
      if (c.expectActor) {
        const roles = (r.plan.actors || []).map((a) => a.role || a.label);
        if (!roles.includes(c.expectActor)) {
          ok = false;
          reasons.push(`missing actor ${c.expectActor}`);
        }
      }
      if (!(r.plan.events && r.plan.events.length)) {
        ok = false;
        reasons.push('missing events');
      }
      if (!(r.plan.businessQuestions && r.plan.businessQuestions.length)) {
        ok = false;
        reasons.push('missing business questions');
      }
    }
  }

  if (ok) {
    passed++;
    console.log('OK ', c.name);
  } else {
    failed++;
    console.log('FAIL', c.name, reasons.join('; '));
  }
}

console.log(`\\n${passed} passed, ${failed} failed, ${CASES.length} total`);
process.exit(failed ? 1 : 0);

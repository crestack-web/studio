#!/usr/bin/env node
/**
 * export-firestore.mjs
 * ============================================================
 * One-time export of the entire Firestore database to JSON files
 * that the Supabase import script can consume.
 *
 * Usage:
 *   node scripts/migrate/export-firestore.mjs
 *
 * Environment (same as src/lib/firebase-admin.ts):
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   FIREBASE_ADMIN_PRIVATE_KEY
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   (or GOOGLE_APPLICATION_CREDENTIALS pointing to a service account JSON)
 *
 * Output:
 *   supabase/migration-data/<table>.json      (flat array of docs per table)
 *   supabase/migration-data/_meta.json        (run info)
 *
 * Business subcollections are merged into the corresponding table file,
 * e.g. businesses/{id}/sales -> sales.json
 */
import admin from 'firebase-admin';
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'supabase', 'migration-data');

// ------------------------------------------------------------
// Config: top-level collections -> target table
// ------------------------------------------------------------
const TOP_LEVEL_COLLECTIONS = [
  'users', 'businesses', 'subscriptions', 'invitations', 'admins', 'admin_permissions',
  'subscribers', 'plans',
  'referrals', 'referralEarnings', 'referralStats', 'referralPayouts', 'referralCodes',
  'store', 'storeProducts', 'storeCollections', 'storeOrders', 'checkoutSessions',
  'storeAnalytics', 'storeShippingZones',
  'marketProducts', 'marketBanners', 'marketGifBanners', 'marketCategories', 'reviews', 'blogs',
  'supportMessages', 'supportTickets', 'supportAgents', 'chatConversations', 'deliveryAgents',
  'coupons', 'subscriptionTransactions', 'announcements', 'investments', 'businessVerifications',
  'mo_messages', 'mo_conversations', 'pageVisits', 'campaigns', 'contentCalendar', 'socialProfiles',
  'ugcCreators', 'ugcVideos', 'ugcOrders', 'waitlist',
];

// Business subcollections -> target table
const BUSINESS_SUBCOLLECTIONS = [
  ['profile', 'business_profiles'],
  ['products', 'products'],
  ['sales', 'sales'],
  ['expenses', 'expenses'],
  ['staff', 'staff'],
  ['transactions', 'transactions'],
  ['inventoryAdjustments', 'inventory_adjustments'],
  ['customers', 'customers'],
  ['cashFlow', 'cash_flow'],
  ['notifications', 'notifications'],
  ['orders', 'orders'],
  ['ai_questions', 'ai_questions'],
  ['bankAccount', 'bank_accounts'],
  ['paymentTransactions', 'payment_transactions'],
  ['payouts', 'payouts'],
  ['serviceRequests', 'service_requests'],
  ['suppliers', 'suppliers'],
  ['purchases', 'purchases'],
  ['stockReceipts', 'stock_receipts'],
  ['bankAccounts', 'bank_accounts'],
  ['bankTransactions', 'bank_transactions'],
  ['attendance', 'attendance'],
  ['conversations', 'conversations'],
  ['credit_customers', 'credit_customers'],
  ['credit_transactions', 'credit_transactions'],
  ['supplier_credit', 'supplier_credit'],
  ['cashReconciliations', 'cash_reconciliations'],
  ['staffActivity', 'staff_activity'],
  ['aiConversations', 'ai_conversations'],
  ['auditTrail', 'audit_trail'],
  ['statements', 'statements'],
  ['branches', 'branches'],
  ['invitations', 'invitations'],
];

// User subcollections -> target table
const USER_SUBCOLLECTIONS = [
  ['subscriptions', 'subscriptions'],
  ['staff_permissions', 'staff_permissions'],
];

// ------------------------------------------------------------
// Firebase init
// ------------------------------------------------------------
async function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  if (projectId && privateKey && clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });
    return;
  }

  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saPath) {
    const sa = JSON.parse(await readFile(saPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }

  throw new Error(
    'Firebase not configured. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL or GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

// ------------------------------------------------------------
// Value serialization (Timestamps/Date -> ISO strings)
// ------------------------------------------------------------
function serializeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v.toDate === 'function') {
    const d = v.toDate();
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  }
  if (typeof v === 'object') {
    if (Array.isArray(v)) return v.map(serializeValue);
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = serializeValue(val);
    }
    return out;
  }
  return v;
}

function serializeDoc(doc) {
  return { ...serializeValue(doc.data() ?? {}), _id: doc.id };
}

// ------------------------------------------------------------
// Query helpers
// ------------------------------------------------------------
const PAGE = 1000;

async function getAll(db, collectionRef) {
  const all = [];
  let last = null;
  for (;;) {
    let q = collectionRef.orderBy('__name__').limit(PAGE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    snap.docs.forEach((d) => all.push(serializeDoc(d)));
    last = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < PAGE) break;
  }
  return all;
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
async function main() {
  await initFirebase();
  const db = admin.firestore();

  await mkdir(OUT_DIR, { recursive: true });

  /** @type {Record<string, any[]>} */
  const tables = {};
  const counts = {};

  const add = (table, docs) => {
    if (!docs.length) return;
    tables[table] ??= [];
    tables[table].push(...docs);
    counts[table] = (counts[table] ?? 0) + docs.length;
  };

  const flushTables = async () => {
    await Promise.all(
      Object.entries(tables).map(([table, docs]) =>
        writeFile(path.join(OUT_DIR, `${table}.json`), JSON.stringify(docs, null, 2))
      )
    );
  };

  console.log('Exporting top-level collections...');
  for (const collection of TOP_LEVEL_COLLECTIONS) {
    try {
      const docs = await getAll(db, db.collection(collection));
      add(collection, docs);
      console.log(`  ${collection}: ${docs.length}`);
    } catch (e) {
      console.warn(`  ${collection}: SKIPPED (${e.message})`);
    }
  }

  console.log('Exporting businesses + subcollections...');
  const businessDocs = await getAll(db, db.collection('businesses'));
  console.log(`  businesses: ${businessDocs.length}`);

  for (const [sub, table] of BUSINESS_SUBCOLLECTIONS) {
    let total = 0;
    for (const b of businessDocs) {
      try {
        const docs = await getAll(db, db.collection(`businesses/${b._id}/${sub}`));
        add(table, docs.map((d) => ({ ...d, _businessId: b._id })));
        total += docs.length;
      } catch (e) {
        console.warn(`  businesses/<id>/${sub}: SKIPPED (${e.message})`);
      }
    }
    console.log(`  businesses/*/${sub} -> ${table}: ${total}`);
  }

  console.log('Exporting users + subcollections...');
  const userDocs = await getAll(db, db.collection('users'));
  console.log(`  users: ${userDocs.length}`);

  for (const [sub, table] of USER_SUBCOLLECTIONS) {
    let total = 0;
    for (const u of userDocs) {
      try {
        const docs = await getAll(db, db.collection(`users/${u._id}/${sub}`));
        add(table, docs.map((d) => ({ ...d, _userId: u._id })));
        total += docs.length;
      } catch (e) {
        console.warn(`  users/<uid>/${sub}: SKIPPED (${e.message})`);
      }
    }
    console.log(`  users/*/${sub} -> ${table}: ${total}`);
  }

  await flushTables();

  await writeFile(
    path.join(OUT_DIR, '_meta.json'),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        tables: counts,
      },
      null,
      2
    )
  );

  console.log('\nDone. Files written to', OUT_DIR);
  console.log(JSON.stringify(counts, null, 2));
}

main().catch((e) => {
  console.error('Export failed:', e);
  process.exit(1);
});

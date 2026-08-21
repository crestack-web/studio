/* Temp verification of critical write paths. Delete after use. */
import { recordSale } from '../src/lib/services/record-sale-service';
import { recordPurchase } from '../src/lib/services/record-purchase-service';
import { addExpense } from '../src/lib/services/add-expense-service';
import { addProduct } from '../src/lib/services/add-product-service';
import { getAdminDb } from '../src/lib/firebase-admin';

const BUSINESS = '0ZZX6Ge8XZxqH0r7HQkm';
const PRODUCT = '0HdHpwhDoE0IpUPCod6J';
const FB_UID = Object.keys(JSON.parse(require('fs').readFileSync('supabase/migration-data/auth-users.json', 'utf8')))[0];

const db = getAdminDb();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error('ASSERT FAILED: ' + msg);
  console.log('  OK:', msg);
}

async function readProduct() {
  const s = await db.collection('businesses').doc(BUSINESS).collection('products').doc(PRODUCT).get();
  return s.exists ? s.data() : null;
}

async function main() {
  const created: string[] = [];
  let originalStock = 0;

  // ---------- baseline ----------
  const p0 = await readProduct();
  originalStock = Number(p0?.stock || p0?.quantity || 0);
  console.log('baseline product:', JSON.stringify({ id: PRODUCT, stock: originalStock, hasVariants: p0?.hasVariants }));

  // ---------- recordSale (txn: stock decrement + sale + audit) ----------
  const sale = await recordSale({
    businessId: BUSINESS,
    userId: FB_UID,
    items: [{ productId: PRODUCT, name: 'Water', quantity: 2, price: 100, costPrice: 50 }],
    paymentType: 'cash',
    source: 'pos',
  });
  assert(sale.success, `recordSale success (${sale.message})`);
  const saleId = sale.saleId!;
  created.push(saleId);
  const pAfterSale = await readProduct();
  assert(Number(pAfterSale.stock) === originalStock - 2, `stock decremented to ${pAfterSale.stock}`);
  const saleSnap = await db.collection('businesses').doc(BUSINESS).collection('sales').doc(saleId).get();
  const saleData = saleSnap.data();
  assert(saleSnap.exists && saleData?.totalRevenue === 200, `sale row has totalRevenue 200 (got ${saleData?.totalRevenue})`);
  assert(JSON.stringify(saleData?.products || saleData?.items).includes('Water'), 'sale row has items');

  // audit trail written
  const audit = await db.collection('businesses').doc(BUSINESS).collection('auditTrail').get();
  console.log('  audit trail count:', audit.size);

  // ---------- recordPurchase (stock increment via FieldValue.increment) ----------
  const purchase = await recordPurchase({
    businessId: BUSINESS,
    userId: FB_UID,
    items: [{ productName: 'Water', quantity: 3, price: 50 }],
    supplier: '__smoke__',
    totalAmount: 150,
  });
  assert(purchase.success, `recordPurchase success (${purchase.message})`);
  const purchaseId = purchase.purchaseId!;
  created.push(purchaseId);
  const pAfterPurchase = await readProduct();
  assert(Number(pAfterPurchase.stock) === originalStock + 1, `stock incremented to ${pAfterPurchase.stock}`);
  const purSnap = await db.collection('businesses').doc(BUSINESS).collection('purchases').doc(purchaseId).get();
  assert(purSnap.exists, 'purchase row exists');
  const purData = purSnap.data();
  assert(JSON.stringify(purData?.items).includes('Water'), 'purchase row has items');
  console.log('  purchase fields:', Object.keys(purData).sort().join(','));

  // cashFlow row from purchase
  const cf = await db.collection('businesses').doc(BUSINESS).collection('cashFlow').get();
  console.log('  cashFlow rows:', cf.size, cf.docs.map(d => d.id).join(','));

  // ---------- addExpense (metadata column) ----------
  const expense = await addExpense({
    businessId: BUSINESS,
    userId: FB_UID,
    category: 'Transport',
    amount: 1500,
    date: '2026-08-15',
    paymentMethod: 'cash',
    description: '__smoke__',
  });
  assert(expense.success, `addExpense success (${expense.message})`);
  created.push(expense.expenseId!);
  const expSnap = await db.collection('businesses').doc(BUSINESS).collection('expenses').doc(expense.expenseId!).get();
  const expData = expSnap.data();
  assert(expSnap.exists && Number(expData?.amount) === 1500, `expense row amount 1500 (got ${expData?.amount})`);
  assert(!!expData?.timestamp, 'expense timestamp persisted');
  console.log('  expense fields:', Object.keys(expData).sort().join(','));

  // ---------- addProduct ----------
  const prod = await addProduct({
    businessId: BUSINESS,
    userId: FB_UID,
    name: '__smoke_product__',
    category: 'test',
    sellPrice: 250,
    costPrice: 100,
    openingStock: 5,
  });
  assert(prod.success, `addProduct success (${prod.message})`);
  const prodId = prod.productId!;
  created.push(prodId);
  const newP = await db.collection('businesses').doc(BUSINESS).collection('products').doc(prodId).get();
  const newPData = newP.data();
  assert(newP.exists && Number(newPData?.stock) === 5, `new product stock 5 (got ${newPData?.stock})`);
  assert(newPData?.active === true, 'new product active');

  // ---------- meta subcollection (wasteRecords) ----------
  const wasteRef = await db.collection('businesses').doc(BUSINESS).collection('wasteRecords').add({
    productName: 'Water',
    quantity: 1,
    reason: '__smoke__',
    createdAt: db.FieldValue.serverTimestamp(),
  });
  created.push(wasteRef.id);
  const wasteSnap = await db.collection('businesses').doc(BUSINESS).collection('wasteRecords').doc(wasteRef.id).get();
  assert(wasteSnap.exists && wasteSnap.data()?.quantity === 1, 'wasteRecord write+read');

  // ---------- date-range + orderBy query (dashboard pattern) ----------
  const monthStart = new Date('2026-08-01T00:00:00Z');
  const range = await db.collection('businesses').doc(BUSINESS).collection('sales')
    .where('createdAt', '>=', monthStart)
    .orderBy('createdAt', 'desc')
    .limit(10)
    .get();
  console.log('  dashboard range query rows:', range.size);

  // ---------- ai-security user increment (metadata increment) ----------
  const userRef = db.collection('users').doc(FB_UID);
  const beforeUser = (await userRef.get()).data() || {};
  const beforeCred = Number(beforeUser.moCreditsRemaining ?? 0);
  await userRef.update({ moCreditsRemaining: db.FieldValue.increment(5) });
  const midUser = (await userRef.get()).data() || {};
  assert(Number(midUser.moCreditsRemaining) === beforeCred + 5, `user moCreditsRemaining +5 (${beforeCred} -> ${midUser.moCreditsRemaining})`);
  await userRef.update({ moCreditsRemaining: db.FieldValue.increment(-5) });
  const afterUser = (await userRef.get()).data() || {};
  assert(Number(afterUser.moCreditsRemaining) === beforeCred, `user moCreditsRemaining restored (${afterUser.moCreditsRemaining})`);

  console.log('\nALL VERIFICATIONS PASSED');
  console.log('created ids:', created.join(', '));
}

main().then(() => process.exit(0)).catch((e) => { console.error('\nVERIFY FAIL', e); process.exit(1); });

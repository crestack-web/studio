const admin = require('firebase-admin');
const notificationService = require('./notificationService');
const db = admin.firestore();
const LOW_STOCK_THRESHOLD = 5;

async function getAllSellers() {
  const snap = await db.collection('users').where('role', '==', 'seller').get();
  return snap.docs.map(d => d.data()).filter(u => u.phoneNumber);
}

async function generateSellerSummary(sellerPhone) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const salesSnap = await db.collection('sales')
    .where('sellerPhone', '==', sellerPhone)
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today))
    .get();
  let totalOrders = 0, totalRevenue = 0, productsSold = 0, bestSeller = '', lowStockCount = 0;
  const productCount = {};
  salesSnap.forEach(doc => {
    const d = doc.data();
    totalOrders++;
    totalRevenue += d.totalAmount || 0;
    productsSold += d.quantity || 1;
    if (d.productName) productCount[d.productName] = (productCount[d.productName] || 0) + 1;
  });
  bestSeller = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const productsSnap = await db.collection('products').where('sellerPhone', '==', sellerPhone).get();
  lowStockCount = productsSnap.docs.filter(d => (d.data().quantity || 0) <= LOW_STOCK_THRESHOLD).length;
  return { totalOrders, totalRevenue, productsSold, bestSeller, lowStockCount };
}

async function checkLowStock(sellerPhone) {
  const snap = await db.collection('products').where('sellerPhone', '==', sellerPhone).get();
  for (const doc of snap.docs) {
    const p = doc.data();
    if ((p.quantity || 0) <= LOW_STOCK_THRESHOLD) {
      await notificationService.sendLowStockAlert(sellerPhone, p);
    }
  }
}

async function runDailySummary() {
  const sellers = await getAllSellers();
  for (const seller of sellers) {
    const summary = await generateSellerSummary(seller.phoneNumber);
    await notificationService.sendDailySummary(seller.phoneNumber, summary);
  }
}

async function runLowStockCheck() {
  const sellers = await getAllSellers();
  for (const seller of sellers) {
    await checkLowStock(seller.phoneNumber);
  }
}

function startScheduler() {
  console.log('⏰ Scheduler started — daily summary at 6:00 PM');
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 18 && now.getMinutes() === 0) {
      await runDailySummary();
    }
    if ((now.getHours() === 9 || now.getHours() === 15) && now.getMinutes() === 0) {
      await runLowStockCheck();
    }
  }, 60 * 1000);
}

module.exports = {
  getAllSellers,
  generateSellerSummary,
  checkLowStock,
  runDailySummary,
  runLowStockCheck,
  startScheduler,
};

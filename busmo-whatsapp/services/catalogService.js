const admin = require('firebase-admin');
const { sendMessage } = require('./whatsappService');
const db = admin.firestore();

async function searchProducts(query) {
  const snap = await db.collection('products').where('status', '==', 'active').limit(20).get();
  const q = query.toLowerCase();
  const filtered = snap.docs
    .map(d => d.data())
    .filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    )
    .slice(0, 5);
  return filtered;
}

async function getCategories() {
  const snap = await db.collection('products').where('status', '==', 'active').get();
  const cats = new Set();
  snap.docs.forEach(d => {
    const c = d.data().category;
    if (c) cats.add(c);
  });
  return Array.from(cats);
}

async function getProductsByCategory(category) {
  const snap = await db.collection('products')
    .where('status', '==', 'active')
    .where('category', '==', category)
    .limit(5)
    .get();
  return snap.docs.map(d => d.data());
}

function formatProductList(products, title) {
  if (!products.length) return `No products found.`;
  let msg = `🛒 *${title}*\n\n`;
  products.forEach((p, i) => {
    msg += `${i + 1}. ${p.name}\n   ₦${(p.price || 0).toLocaleString()} | Stock: ${p.quantity || 0}\n   Seller: ${p.sellerName || '-'}\n\n`;
  });
  return msg.trim();
}

async function handleCustomerBrowse(text, from) {
  const lower = text.trim().toLowerCase();
  if (['shop', 'browse', 'catalog'].includes(lower)) {
    const cats = await getCategories();
    if (!cats.length) {
      await sendMessage(from, 'No categories found yet.');
      return true;
    }
    let msg = `🗂️ *Product Categories*\n\n`;
    cats.forEach((c, i) => { msg += `${i + 1}. ${c}\n`; });
    msg += `\nReply with "search <product>" or "category <name>" to see products.`;
    await sendMessage(from, msg);
    return true;
  }
  if (lower.startsWith('search ')) {
    const q = lower.replace('search ', '').trim();
    const results = await searchProducts(q);
    await sendMessage(from, formatProductList(results, `Results for "${q}"`));
    return true;
  }
  if (lower.startsWith('category ')) {
    const cat = lower.replace('category ', '').trim();
    const products = await getProductsByCategory(cat);
    await sendMessage(from, formatProductList(products, `Category: ${cat}`));
    return true;
  }
  return false;
}

module.exports = {
  searchProducts,
  getCategories,
  getProductsByCategory,
  formatProductList,
  handleCustomerBrowse,
};

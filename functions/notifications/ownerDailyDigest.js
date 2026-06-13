const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { sendTransactionalEmail } = require('../email/service');

const db = admin.firestore();

function toDate(value) {
  if (!value) return null;
  if (value.toDate && typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function formatMoney(amount, currencySymbol) {
  const safe = Number.isFinite(amount) ? Number(amount) : 0;
  const formatted = Math.round(safe).toLocaleString();
  if (!currencySymbol) return formatted;
  return currencySymbol === 'CFA' ? `${formatted} ${currencySymbol}` : `${currencySymbol}${formatted}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function subDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function isWithinInterval(date, interval) {
  if (!date) return false;
  return date >= interval.start && date <= interval.end;
}

async function computeDigestForBusiness(businessId) {
  const windowDays = 30;
  const window = {
    start: startOfDay(subDays(new Date(), windowDays - 1)),
    end: endOfDay(new Date()),
  };

  const businessSnap = await db.collection('businesses').doc(businessId).get();
  const business = businessSnap.exists ? businessSnap.data() : {};

  const profileSnap = await db.collection('businessProfiles').doc(businessId).get().catch(() => null);
  const profile = profileSnap && profileSnap.exists ? profileSnap.data() : {};

  const businessName = business.businessName || profile.businessName || 'your business';
  const currencySymbol = profile.currency || business.currency || '';

  const [productsSnap, salesSnap, expensesSnap, transactionsSnap] = await Promise.all([
    db.collection(`businesses/${businessId}/products`).get(),
    db.collection(`businesses/${businessId}/sales`).orderBy('timestamp', 'desc').limit(500).get(),
    db.collection(`businesses/${businessId}/expenses`).orderBy('createdAt', 'desc').limit(500).get(),
    db.collection(`businesses/${businessId}/transactions`).orderBy('createdAt', 'desc').limit(500).get(),
  ]);

  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const costByProduct = new Map();
  const costByVariant = new Map();
  for (const p of products) {
    costByProduct.set(p.id, Number(p.cost || 0));
    if (p.hasVariants && Array.isArray(p.variants)) {
      for (const v of p.variants) {
        costByVariant.set(`${p.id}:${v.id}`, Number(v.cost || 0));
      }
    }
  }

  // Cash balance from transactions (all returned docs; likely recent).
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  for (const tDoc of transactionsSnap.docs) {
    const t = tDoc.data();
    if (t.type === 'deposit') totalDeposits += Number(t.amount || 0);
    if (t.type === 'withdrawal') totalWithdrawals += Number(t.amount || 0);
  }
  const cashBalance = totalDeposits - totalWithdrawals;

  // Window metrics.
  let salesInWindowTotal = 0;
  let cogsInWindowTotal = 0;
  const unitsSoldByItem = new Map(); // key: productId or productId:variantId

  for (const sDoc of salesSnap.docs) {
    const s = sDoc.data();
    const saleDate = toDate(s.timestamp);
    if (!isWithinInterval(saleDate, window)) continue;

    const amount = Number(s.amount || 0);
    const quantity = Number(s.quantity || 0);
    const productId = s.productId;
    const variantId = s.variantId;

    salesInWindowTotal += amount;

    let unitCost = 0;
    if (productId && variantId && costByVariant.has(`${productId}:${variantId}`)) {
      unitCost = costByVariant.get(`${productId}:${variantId}`);
    } else if (productId && costByProduct.has(productId)) {
      unitCost = costByProduct.get(productId);
    }
    cogsInWindowTotal += unitCost * quantity;

    const key = productId && variantId ? `${productId}:${variantId}` : productId;
    if (key) unitsSoldByItem.set(key, (unitsSoldByItem.get(key) || 0) + quantity);
  }

  let expensesInWindowTotal = 0;
  for (const eDoc of expensesSnap.docs) {
    const e = eDoc.data();
    const createdAt = toDate(e.createdAt);
    if (!isWithinInterval(createdAt, window)) continue;
    expensesInWindowTotal += Number(e.amount || 0);
  }

  const windowGrossProfit = salesInWindowTotal - cogsInWindowTotal;
  const windowNetProfit = windowGrossProfit - expensesInWindowTotal;
  const dailyAvgBurn = windowNetProfit < 0 ? (-windowNetProfit) / windowDays : 0;
  const cashRunwayDays = dailyAvgBurn > 0 ? Math.floor(cashBalance / dailyAvgBurn) : null;

  // Low stock list (<=10).
  const lowStockItems = [];
  for (const p of products) {
    if (p.hasVariants && Array.isArray(p.variants)) {
      for (const v of p.variants) {
        const stockByBranch = v.stockByBranch || {};
        const totalQty = Object.values(stockByBranch).reduce((sum, q) => sum + Number(q || 0), 0);
        if (totalQty <= 10) {
          lowStockItems.push({
            name: `${p.name} (${v.name})`,
            quantity: totalQty,
            key: `${p.id}:${v.id}`,
          });
        }
      }
    } else {
      const stockByBranch = p.stockByBranch || {};
      const totalQty = Object.values(stockByBranch).reduce((sum, q) => sum + Number(q || 0), 0);
      if (totalQty <= 10) {
        lowStockItems.push({
          name: p.name,
          quantity: totalQty,
          key: p.id,
        });
      }
    }
  }

  // Stock outlook (rolling windowDays).
  let stockOutlook = null;
  if (lowStockItems.length > 0) {
    let minDays = Infinity;
    let mostAtRisk = null;
    let sawSales = false;

    for (const item of lowStockItems) {
      const unitsSold = unitsSoldByItem.get(item.key) || 0;
      if (unitsSold > 0) {
        sawSales = true;
        const dailyConsumption = unitsSold / windowDays;
        const daysToDepletion = dailyConsumption > 0 ? item.quantity / dailyConsumption : Infinity;
        if (daysToDepletion < minDays) {
          minDays = daysToDepletion;
          mostAtRisk = { name: item.name, days: Math.floor(daysToDepletion) };
        }
      }
    }

    if (mostAtRisk && mostAtRisk.days !== Infinity && mostAtRisk.days >= 0) {
      stockOutlook = `You are likely to run out of ${mostAtRisk.name} in ${mostAtRisk.days} days.`;
    } else if (!sawSales) {
      stockOutlook = "Low stock, but no recent sales — can't estimate depletion.";
    }
  }

  // Highlights (2-4 short, actionable).
  const highlights = [];

  if (cashRunwayDays !== null && cashRunwayDays < 14) {
    highlights.push(`Cash runway is low: ~${cashRunwayDays} days.`);
  } else if (dailyAvgBurn === 0 && (salesInWindowTotal > 0 || expensesInWindowTotal > 0)) {
    highlights.push('Not burning cash based on the last 30 days.');
  }

  if (salesInWindowTotal > 0) {
    const marginPct = (windowNetProfit / salesInWindowTotal) * 100;
    if (Number.isFinite(marginPct) && marginPct < 10) {
      highlights.push(`Low profit margin (~${marginPct.toFixed(0)}%) in the last 30 days.`);
    }

    const expenseRatio = expensesInWindowTotal / salesInWindowTotal;
    if (Number.isFinite(expenseRatio) && expenseRatio > 0.6) {
      highlights.push(`High expenses (~${(expenseRatio * 100).toFixed(0)}% of sales) in the last 30 days.`);
    }
  }

  if (lowStockItems.length > 0) {
    const topLow = lowStockItems
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 2)
      .map(i => `${i.name} (${i.quantity})`)
      .join(', ');
    highlights.push(`Low stock: ${topLow}.`);
  }

  if (stockOutlook) {
    highlights.push(stockOutlook);
  }

  const dateLabel = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return {
    businessName,
    currencySymbol,
    dateLabel,
    cashBalanceFormatted: formatMoney(cashBalance, currencySymbol),
    sales30dFormatted: formatMoney(salesInWindowTotal, currencySymbol),
    expenses30dFormatted: formatMoney(expensesInWindowTotal, currencySymbol),
    runwayDays: cashRunwayDays,
    highlights: highlights.slice(0, 5),
    hasHighlights: highlights.length > 0,
    dashboardUrl: `${process.env.PUBLIC_APP_URL || process.env.PUBLIC_BRAND_HOST || 'https://busmo.web.app'}/owner/home`,
  };
}

exports.sendOwnerDailyDigest = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('Etc/UTC')
  .onRun(async () => {
    const ownersSnap = await db.collection('users').where('role', '==', 'Owner').get();

    const digestCache = new Map();
    const results = { sent: 0, skipped: 0, failed: 0 };

    for (const doc of ownersSnap.docs) {
      const owner = doc.data();
      const to = owner.email;
      const businessId = owner.businessId;
      const notificationsEnabled = owner.emailNotificationsEnabled !== false;

      if (!notificationsEnabled || !to || !businessId) {
        results.skipped++;
        continue;
      }

      try {
        if (!digestCache.has(businessId)) {
          digestCache.set(businessId, await computeDigestForBusiness(businessId));
        }
        const digest = digestCache.get(businessId);

        await sendTransactionalEmail({
          to,
          templateId: 'owner_daily_digest',
          data: {
            businessName: digest.businessName,
            dateLabel: digest.dateLabel,
            cashBalanceFormatted: digest.cashBalanceFormatted,
            sales30dFormatted: digest.sales30dFormatted,
            expenses30dFormatted: digest.expenses30dFormatted,
            runwayDays: digest.runwayDays,
            hasRunway: digest.runwayDays !== null,
            hasHighlights: digest.hasHighlights,
            highlights: digest.highlights,
            dashboardUrl: digest.dashboardUrl,
          },
        });

        results.sent++;
      } catch (error) {
        console.error('Failed to send owner daily digest', {
          ownerId: doc.id,
          businessId,
          to,
          error: error && error.message ? error.message : String(error),
        });
        results.failed++;
      }
    }

    console.log('Owner daily digest finished', results);
    return null;
  });

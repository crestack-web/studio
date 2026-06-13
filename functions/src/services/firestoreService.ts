/**
 * Firestore Service
 * Secure database operations for merchant data
 */

import { db } from '../config/firebase';
import { QuerySnapshot, DocumentData, Timestamp } from 'firebase-admin/firestore';

// Collection paths
const MERCHANTS_COLLECTION = 'merchants';
const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';

/**
 * Create a new sale record
 */
export async function createSale(
  merchantId: string,
  saleData: {
    products: Array<{
      productId?: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    paymentMethod?: string;
    customerName?: string;
    notes?: string;
  }
): Promise<string> {
  const saleRef = db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(SALES_COLLECTION)
    .doc();

  const sale = {
    ...saleData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'completed',
  };

  await saleRef.set(sale);

  // Update product stock if productId is provided
  for (const product of saleData.products) {
    if (product.productId) {
      await updateProductStock(merchantId, product.productId, -product.quantity);
    }
  }

  return saleRef.id;
}

/**
 * Create a new product record
 */
export async function createProduct(
  merchantId: string,
  productData: {
    name: string;
    description?: string;
    category?: string;
    price: number;
    cost?: number;
    stock: number;
    lowStockThreshold?: number;
    imageUrl?: string;
    attributes?: Record<string, string>;
  }
): Promise<string> {
  const productRef = db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(PRODUCTS_COLLECTION)
    .doc();

  const product = {
    ...productData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    active: true,
    lowStockThreshold: productData.lowStockThreshold || 10,
  };

  await productRef.set(product);
  return productRef.id;
}

/**
 * Update product stock
 */
async function updateProductStock(
  merchantId: string,
  productId: string,
  quantityChange: number
): Promise<void> {
  const productRef = db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(PRODUCTS_COLLECTION)
    .doc(productId);

  await db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found`);
    }

    const currentStock = productDoc.data()?.stock || 0;
    const newStock = currentStock + quantityChange;

    transaction.update(productRef, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Get business metrics for AI context
 */
export async function getBusinessMetrics(
  merchantId: string,
  dateRange?: {
    startDate: Date;
    endDate: Date;
  }
): Promise<{
  totalSales: number;
  totalRevenue: number;
  topProducts: Array<{ name: string; revenue: number }>;
  recentSales: number;
  period: string;
}> {
  const salesRef = db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(SALES_COLLECTION);

  let query = salesRef.where('status', '==', 'completed');

  if (dateRange) {
    query = query
      .where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate))
      .where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate));
  }

  const salesSnapshot: QuerySnapshot<DocumentData> = await query.get();

  let totalRevenue = 0;
  const productRevenue = new Map<string, number>();
  let recentSales = 0;

  salesSnapshot.forEach((doc) => {
    const sale = doc.data();
    totalRevenue += sale.total || 0;
    recentSales += 1;

    // Track product revenue
    if (sale.products) {
      sale.products.forEach((p: any) => {
        const name = p.name || 'Unknown';
        const revenue = (p.price || 0) * (p.quantity || 0);
        productRevenue.set(name, (productRevenue.get(name) || 0) + revenue);
      });
    }
  });

  // Get top products
  const topProducts = Array.from(productRevenue.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalSales: recentSales,
    totalRevenue,
    topProducts,
    recentSales,
    period: dateRange ? 'custom' : 'all_time',
  };
}

/**
 * Get merchant's recent sales
 */
export async function getRecentSales(
  merchantId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  total: number;
  products: any[];
  createdAt: Date;
}>> {
  const salesSnapshot: QuerySnapshot<DocumentData> = await db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(SALES_COLLECTION)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return salesSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      total: data.total || 0,
      products: data.products || [],
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  });
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  merchantId: string
): Promise<Array<{
  id: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
}>> {
  const productsSnapshot: QuerySnapshot<DocumentData> = await db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .collection(PRODUCTS_COLLECTION)
    .where('active', '==', true)
    .get();

  const lowStockProducts: Array<any> = [];

  productsSnapshot.forEach((doc) => {
    const product = doc.data();
    const threshold = product.lowStockThreshold || 10;
    if (product.stock <= threshold) {
      lowStockProducts.push({
        id: doc.id,
        name: product.name,
        stock: product.stock,
        lowStockThreshold: threshold,
      });
    }
  });

  return lowStockProducts.sort((a, b) => a.stock - b.stock);
}

/**
 * Validate merchant exists and user has access
 */
export async function validateMerchantAccess(
  merchantId: string,
  userId: string
): Promise<boolean> {
  const merchantDoc = await db
    .collection(MERCHANTS_COLLECTION)
    .doc(merchantId)
    .get();

  if (!merchantDoc.exists) {
    return false;
  }

  const merchantData = merchantDoc.data();
  // Check if user is owner or staff
  return (
    merchantData?.ownerId === userId ||
    merchantData?.staff?.includes(userId)
  );
}

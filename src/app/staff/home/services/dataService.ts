/**
 * Staff Data Service
 * Shared data access layer for staff dashboard
 * Connects staff to owner's Firestore data
 */

import { Firestore, collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, orderBy, limit } from 'firebase/firestore';

// ═══════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  emoji?: string;
  lowStockThreshold?: number;
  active?: boolean;
  category?: string;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  products: Array<{
    productId: string;
    name: string;
    price: number;
    costPrice?: number;
    quantity: number;
  }>;
  total: number;
  profit?: number;
  paymentMethod: string;
  note?: string;
  soldBy?: string; // Staff ID who made the sale
  soldByName?: string; // Staff name
  businessId?: string;
  createdAt: Timestamp;
}

export interface Business {
  id: string;
  businessName: string;
  ownerId: string;
  staff?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: any;
  }>;
}

// ═══════════════════════════════════════════
//  Product Services
// ═══════════════════════════════════════════

/**
 * Fetch all active products for a business
 */
export async function fetchProducts(
  db: Firestore,
  businessId: string
): Promise<Product[]> {
  try {
    console.log('Fetching products for businessId:', businessId);
    
    // Use 'businesses' collection to match owner's Firestore structure
    // Don't filter by 'active' status to ensure all products are accessible
    const productsQuery = collection(db, 'businesses', businessId, 'products');

    const snapshot = await getDocs(productsQuery);
    console.log('Products snapshot size:', snapshot.size);
    const products: Product[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Product data:', doc.id, data);
      products.push({
        id: doc.id,
        name: data.name || 'Unnamed Product',
        price: data.price || 0,
        costPrice: data.cost || 0, // Map 'cost' field from existing structure
        stock: data.stock || 0,
        emoji: data.attributes?.emoji || '📦', // Get emoji from attributes
        lowStockThreshold: data.lowStockThreshold || 10,
        active: data.active ?? true,
        category: data.category,
        imageUrl: data.imageUrl || '',
      });
    });

    console.log('Fetched products:', products);
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Update product stock after a sale
 */
export async function updateProductStock(
  db: Firestore,
  businessId: string,
  productId: string,
  quantitySold: number
): Promise<void> {
  try {
    const productRef = doc(db, 'businesses', businessId, 'products', productId);
    await updateDoc(productRef, {
      stock: quantitySold, // This should be new stock value (current - sold)
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════
//  Sale Services
// ═══════════════════════════════════════════

/**
 * Record a new sale
 */
export async function recordSale(
  db: Firestore,
  businessId: string,
  saleData: {
    products: Array<{
      productId: string;
      name: string;
      price: number;
      costPrice?: number;
      quantity: number;
    }>;
    total: number;
    paymentMethod: string;
    paymentMethods?: Record<string, number>;
    note?: string;
    soldBy?: string;
    soldByName?: string;
    recordedBy?: any;
  }
): Promise<string> {
  try {
    // Calculate profit
    const profit = saleData.products.reduce((acc, p) => {
      return acc + ((p.price - (p.costPrice || 0)) * p.quantity);
    }, 0);

    // Use 'businesses' collection to match owner's Firestore structure
    const saleRef = await addDoc(collection(db, 'businesses', businessId, 'sales'), {
      products: saleData.products,
      total: saleData.total,
      profit,
      paymentMethod: saleData.paymentMethod,
      paymentMethods: saleData.paymentMethods,
      notes: saleData.note || '', // Map 'note' to 'notes' for existing structure
      soldBy: saleData.soldBy || 'unknown',
      soldByName: saleData.soldByName || 'Unknown Staff',
      recordedBy: saleData.recordedBy,
      businessId,
      createdAt: Timestamp.now(),
      status: 'completed',
    });

    return saleRef.id;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
}

/**
 * Fetch recent sales for a business
 */
export async function fetchRecentSales(
  db: Firestore,
  businessId: string,
  limitCount: number = 50
): Promise<Sale[]> {
  try {
    // Use 'businesses' collection
    const salesQuery = query(
      collection(db, 'businesses', businessId, 'sales'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(salesQuery);
    const sales: Sale[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      sales.push({
        id: doc.id,
        products: data.products || [],
        total: data.total || 0,
        profit: data.profit || 0,
        paymentMethod: data.paymentMethod || 'cash',
        note: data.notes || '',
        soldBy: data.soldBy || 'unknown',
        soldByName: data.soldByName || 'Unknown',
        businessId: data.businessId,
        createdAt: data.createdAt,
      });
    });

    return sales;
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
}

/**
 * Fetch today's sales for a business
 */
export async function fetchTodaysSales(
  db: Firestore,
  businessId: string
): Promise<{ sales: number; profit: number; transactions: number }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = Timestamp.fromDate(today);

    // Use 'businesses' collection
    const salesQuery = query(
      collection(db, 'businesses', businessId, 'sales'),
      where('createdAt', '>=', todayStart)
    );

    const snapshot = await getDocs(salesQuery);
    let sales = 0;
    let profit = 0;
    let transactions = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      sales += data.total || 0;
      profit += data.profit || 0;
      transactions += 1;
    });

    return { sales, profit, transactions };
  } catch (error) {
    console.error('Error fetching today\'s sales:', error);
    return { sales: 0, profit: 0, transactions: 0 };
  }
}

// ═══════════════════════════════════════════
//  Business Services
// ═══════════════════════════════════════════

/**
 * Fetch business information
 */
export async function fetchBusiness(
  db: Firestore,
  businessId: string
): Promise<Business | null> {
  try {
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDocs(collection(db, 'businesses'));
    
    // Find the business by ID
    let business: Business | null = null;
    businessSnap.forEach(doc => {
      if (doc.id === businessId) {
        const data = doc.data();
        business = {
          id: doc.id,
          businessName: data.businessName || 'Unnamed Business',
          ownerId: data.ownerId || '',
          staff: data.staff || [],
        };
      }
    });

    return business;
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

/**
 * Get staff member's business ID from user document
 */
export async function getStaffBusinessId(
  db: Firestore,
  userId: string
): Promise<string | null> {
  try {
    // Check if user has a businessId field
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocs(collection(db, 'users'));
    
    let businessId: string | null = null;
    userSnap.forEach(doc => {
      if (doc.id === userId) {
        const data = doc.data();
        businessId = data.businessId || null;
      }
    });

    return businessId;
  } catch (error) {
    console.error('Error fetching staff business ID:', error);
    return null;
  }
}

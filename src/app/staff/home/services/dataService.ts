/**
 * Staff Data Service
 * Shared data access layer for staff dashboard
 * Connects staff to owner's Supabase data
 */

import { fetchDocs, fetchDoc, addDoc, updateDoc, type QueryFilter } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';

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
  soldBy?: string;
  soldByName?: string;
  businessId?: string;
  createdAt: string;
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
  db?: any,
  businessId?: string
): Promise<Product[]> {
  try {
    console.log('Fetching products for businessId:', businessId);

    const rawProducts = await fetchDocs<Record<string, any>>(
      `businesses/${businessId}/products`
    );
    console.log('Products snapshot size:', rawProducts.length);

    const products: Product[] = rawProducts.map((data) => {
      console.log('Product data:', data.id, data);
      return {
        id: data.id,
        name: data.name || 'Unnamed Product',
        price: data.price || 0,
        costPrice: data.costPrice || data.cost || 0,
        stock: data.stock || data.stockLevel || data.stock_level || 0,
        emoji: data.attributes?.emoji || data.emoji || '📦',
        lowStockThreshold: data.lowStockThreshold || data.reorder_level || 10,
        active: data.active != null ? data.active : (data.status === 'active'),
        category: data.category,
        imageUrl: data.imageUrl || data.image_url || '',
      };
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
  db?: any,
  businessId?: string,
  productId?: string,
  quantitySold?: number
): Promise<void> {
  try {
    const productDoc = await fetchDoc<Record<string, any>>(
      `businesses/${businessId}/products`,
      productId!
    );

    if (productDoc) {
      const currentStock = productDoc.stock || productDoc.stockLevel || productDoc.stock_level || 0;
      const newStock = Math.max(0, currentStock - (quantitySold || 0));

      await updateDoc(`businesses/${businessId}/products`, productId!, {
        stock: newStock,
        updatedAt: new Date().toISOString(),
      });
    }
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
  db?: any,
  businessId?: string,
  saleData?: {
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
    const products = saleData?.products || [];
    const profit = products.reduce((acc, p) => {
      return acc + ((p.price - (p.costPrice || 0)) * p.quantity);
    }, 0);

    const total = saleData?.total || 0;
    const id = await addDoc(`businesses/${businessId}/sales`, {
      id: crypto.randomUUID(),
      products: products,
      items: products,
      total,
      totalRevenue: total,
      total_amount: total,
      profit,
      paymentMethod: saleData?.paymentMethod || 'cash',
      paymentMethods: saleData?.paymentMethods,
      paymentBreakdown: saleData?.paymentMethods
        ? Object.entries(saleData.paymentMethods).map(([method, amount]) => ({
            method,
            amount,
            received: true,
          }))
        : [{ method: saleData?.paymentMethod || 'cash', amount: total, received: true }],
      notes: saleData?.note || '',
      soldBy: saleData?.soldBy || 'unknown',
      soldByName: saleData?.soldByName || 'Unknown Staff',
      recordedBy: saleData?.recordedBy,
      businessId,
      createdAt: new Date().toISOString(),
      status: 'completed',
    });

    return id;
  } catch (error) {
    console.error('Error recording sale:', error);
    throw error;
  }
}

/**
 * Fetch recent sales for a business
 */
export async function fetchRecentSales(
  db?: any,
  businessId?: string,
  limitCount: number = 50
): Promise<Sale[]> {
  try {
    const rawSales = await fetchDocs<Record<string, any>>(
      `businesses/${businessId}/sales`,
      {
        orderBy: { field: 'created_at', ascending: false },
        limit: limitCount,
      }
    );

    const sales: Sale[] = rawSales.map((data) => ({
      id: data.id,
      products: data.products || data.items || [],
      total: data.totalRevenue ?? data.total_revenue ?? data.total ?? 0,
      profit: data.profit || 0,
      paymentMethod: data.paymentMethod || data.payment_method || 'cash',
      note: data.notes || data.note || '',
      soldBy: data.soldBy || 'unknown',
      soldByName: data.soldByName || 'Unknown',
      businessId: data.businessId || data.business_id,
      createdAt: data.createdAt || data.created_at || '',
    }));

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
  db?: any,
  businessId?: string,
  staffId?: string
): Promise<{ sales: number; profit: number; transactions: number }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const filters: QueryFilter[] = [
      { field: 'created_at', op: '>=', value: todayStart },
    ];

    if (staffId) {
      filters.push({
        field: 'metadata',
        op: 'like',
        value: `%"staffId":"${staffId}"%`,
      });
    }

    const rawSales = await fetchDocs<Record<string, any>>(
      `businesses/${businessId}/sales`,
      { filters }
    );

    let sales = 0;
    let profit = 0;
    let transactions = 0;

    for (const data of rawSales) {
      sales += data.totalRevenue ?? data.total_revenue ?? data.total ?? 0;
      profit += data.profit || 0;
      transactions += 1;
    }

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
  db?: any,
  businessId?: string
): Promise<Business | null> {
  try {
    const data = await fetchDoc<Record<string, any>>(
      'businesses',
      businessId!
    );

    if (!data) return null;

    return {
      id: data.id,
      businessName: data.businessName || data.business_name || 'Unnamed Business',
      ownerId: data.ownerId || data.owner_id || '',
      staff: data.staff || [],
    };
  } catch (error) {
    console.error('Error fetching business:', error);
    return null;
  }
}

/**
 * Get staff member's business ID from user document
 */
export async function getStaffBusinessId(
  db?: any,
  userId?: string
): Promise<string | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId!)
      .single();

    if (error || !data) return null;

    return data.businessId || data.business_id || null;
  } catch (error) {
    console.error('Error fetching staff business ID:', error);
    return null;
  }
}

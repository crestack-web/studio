/**
 * Low Stock Alerts and Auto-Reordering Service
 * Detects products below reorder level and suggests reorder quantities
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface LowStockAlert {
  productId: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  lowStockThreshold: number;
  suggestedReorderQuantity: number;
  estimatedCost: number;
  salesVelocity: number;
  daysUntilStockout: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface ReorderSuggestion {
  productId: string;
  name: string;
  currentStock: number;
  suggestedQuantity: number;
  estimatedCost: number;
  reason: string;
  supplier?: string;
}

/**
 * Get low stock alerts for a business
 */
export async function getLowStockAlerts(businessId: string): Promise<{ success: boolean; data?: LowStockAlert[]; error?: string }> {
  try {
    const db = getAdminDb();

    // Fetch all products
    const productsSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .get();

    const alerts: LowStockAlert[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Fetch sales from last 30 days to calculate sales velocity
    const salesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('sales')
      .where('createdAt', '>=', thirtyDaysAgo)
      .get();

    // Calculate sales velocity per product
    const salesVelocity: Record<string, number> = {};
    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      const items = sale.items || [];
      items.forEach((item: any) => {
        const key = item.productId;
        if (key) {
          salesVelocity[key] = (salesVelocity[key] || 0) + (item.quantity || 0);
        }
      });
    });

    // Convert to daily velocity
    Object.keys(salesVelocity).forEach(key => {
      salesVelocity[key] = salesVelocity[key] / 30; // Average daily sales
    });

    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const currentStock = product.stock || product.quantity || 0;
      const reorderLevel = product.reorderLevel || product.lowStockThreshold || 5;
      const lowStockThreshold = product.lowStockThreshold || 5;
      const costPrice = product.cost || product.costPrice || 0;

      // Check if stock is below threshold
      if (currentStock <= reorderLevel) {
        const dailySales = salesVelocity[doc.id] || 0;
        const suggestedReorderQuantity = calculateReorderQuantity(currentStock, dailySales, reorderLevel);
        const estimatedCost = suggestedReorderQuantity * costPrice;
        const daysUntilStockout = dailySales > 0 ? Math.floor(currentStock / dailySales) : 999;

        // Determine urgency
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (currentStock === 0) {
          urgency = 'critical';
        } else if (daysUntilStockout <= 3) {
          urgency = 'critical';
        } else if (daysUntilStockout <= 7) {
          urgency = 'high';
        } else if (daysUntilStockout <= 14) {
          urgency = 'medium';
        }

        alerts.push({
          productId: doc.id,
          name: product.name,
          currentStock,
          reorderLevel,
          lowStockThreshold,
          suggestedReorderQuantity,
          estimatedCost,
          salesVelocity: dailySales,
          daysUntilStockout,
          urgency,
        });
      }
    });

    // Sort by urgency and days until stockout
    alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }
      return a.daysUntilStockout - b.daysUntilStockout;
    });

    return { success: true, data: alerts };
  } catch (error: any) {
    console.error('Error getting low stock alerts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate suggested reorder quantity based on sales velocity
 */
function calculateReorderQuantity(currentStock: number, dailySales: number, reorderLevel: number): number {
  if (dailySales === 0) {
    // No sales history, suggest standard reorder quantity
    return Math.max(reorderLevel * 2, 10);
  }

  // Calculate days of stock to maintain (30 days buffer)
  const targetDaysOfStock = 30;
  const targetStock = dailySales * targetDaysOfStock;
  const reorderQuantity = targetStock - currentStock;

  // Ensure minimum reorder quantity
  return Math.max(reorderQuantity, reorderLevel * 2);
}

/**
 * Generate reorder suggestions for low stock products
 */
export async function generateReorderSuggestions(businessId: string): Promise<{ success: boolean; data?: ReorderSuggestion[]; error?: string }> {
  try {
    const alertsResult = await getLowStockAlerts(businessId);
    
    if (!alertsResult.success || !alertsResult.data) {
      return { success: false, error: alertsResult.error || 'Failed to get low stock alerts' };
    }

    const suggestions: ReorderSuggestion[] = [];

    for (const alert of alertsResult.data) {
      let reason = '';
      
      if (alert.urgency === 'critical') {
        reason = `Stock is ${alert.currentStock === 0 ? 'depleted' : 'critically low'}. Based on daily sales velocity of ${alert.salesVelocity.toFixed(1)} units, stockout expected in ${alert.daysUntilStockout} days.`;
      } else if (alert.urgency === 'high') {
        reason = `Stock is below reorder level. Based on sales velocity, stockout expected in ${alert.daysUntilStockout} days.`;
      } else {
        reason = `Stock is approaching reorder level. Proactive restocking recommended.`;
      }

      suggestions.push({
        productId: alert.productId,
        name: alert.name,
        currentStock: alert.currentStock,
        suggestedQuantity: alert.suggestedReorderQuantity,
        estimatedCost: alert.estimatedCost,
        reason,
      });
    }

    return { success: true, data: suggestions };
  } catch (error: any) {
    console.error('Error generating reorder suggestions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a purchase order for restocking
 */
export async function createRestockPurchaseOrder(
  businessId: string,
  userId: string,
  items: Array<{ productId: string; name: string; quantity: number; estimatedCost: number }>,
  supplier?: string
): Promise<{ success: boolean; purchaseOrderId?: string; error?: string }> {
  try {
    const db = getAdminDb();

    const totalAmount = items.reduce((sum, item) => sum + item.estimatedCost, 0);

    const purchaseOrderData = {
      businessId,
      supplier: supplier || 'Default Supplier',
      items: items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        estimatedCost: item.estimatedCost,
        unitCost: item.estimatedCost / item.quantity,
      })),
      totalAmount,
      status: 'pending',
      type: 'restock',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const purchaseOrderRef = await db
      .collection('businesses')
      .doc(businessId)
      .collection('purchaseOrders')
      .add(purchaseOrderData);

    return { success: true, purchaseOrderId: purchaseOrderRef.id };
  } catch (error: any) {
    console.error('Error creating restock purchase order:', error);
    return { success: false, error: error.message };
  }
}

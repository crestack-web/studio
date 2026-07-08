/**
 * Record Purchase Service
 * Handles purchase/stock recording
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { findProductByName } from './record-sale-service';

export interface PurchaseItem {
  productName: string;
  quantity: number;
  price?: number | string;
}

export interface RecordPurchaseParams {
  businessId: string;
  userId: string;
  items: PurchaseItem[];
  supplier?: string;
  totalAmount?: number;
  paymentMethod?: string;
}

export interface RecordPurchaseResult {
  success: boolean;
  purchaseId?: string;
  message: string;
  error?: string;
}

/**
 * Record a purchase/stock addition
 */
export async function recordPurchase(params: RecordPurchaseParams): Promise<RecordPurchaseResult> {
  const { businessId, userId, items, supplier, totalAmount } = params;

  try {
    const db = getAdminDb();

    // Resolve and validate all items
    const purchaseItems: any[] = [];
    const itemSummaries: any[] = [];

    for (const item of items) {
      const productSearch = await findProductByName(businessId, item.productName);
      
      if (!productSearch.found) {
        if (productSearch.matches && productSearch.matches.length > 0) {
          return {
            success: false,
            message: `I found multiple products matching "${item.productName}". Please specify which one.`,
            error: 'Multiple products found',
          };
        }
        return {
          success: false,
          message: `Product "${item.productName}" not found in inventory. Please add this product first.`,
          error: 'Product not found',
        };
      }

      const product = productSearch.product;
      const quantity = item.quantity || 1;
      const costPrice = product.cost || product.costPrice || 0;
      const purchasePrice = item.price !== undefined ? (typeof item.price === 'string' ? parseFloat(item.price) : item.price) : costPrice;

      purchaseItems.push({
        productId: product.id,
        name: product.name,
        quantity,
        costPrice: purchasePrice,
        emoji: product.attributes?.emoji || '📦',
      });

      itemSummaries.push({
        name: product.name,
        quantity,
        costPrice: purchasePrice,
      });
    }

    // Calculate total if not provided
    const calculatedTotal = totalAmount || purchaseItems.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);

    // Create purchase record
    const purchaseData = {
      businessId,
      supplierName: supplier || 'Unknown',
      items: purchaseItems,
      totalAmount: calculatedTotal,
      paymentMethod: params.paymentMethod || 'cash',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      status: 'completed',
    };

    const purchaseRef = await db.collection('businesses').doc(businessId).collection('purchases').add(purchaseData);

    // Update inventory for each item
    for (const item of purchaseItems) {
      const productRef = db.collection('businesses').doc(businessId).collection('products').doc(item.productId);
      await productRef.update({
        stock: admin.firestore.FieldValue.increment(item.quantity),
        cost: item.costPrice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Update cashflow
    const cashflowRef = await db.collection('businesses').doc(businessId).collection('cashFlow').add({
      businessId,
      moneyIn: 0,
      moneyOut: calculatedTotal,
      date: admin.firestore.FieldValue.serverTimestamp(),
      description: `Purchase from ${supplier || 'supplier'}`,
      category: 'Purchase',
      referenceId: purchaseRef.id,
      referenceType: 'purchase',
      performedBy: userId,
    });

    return {
      success: true,
      purchaseId: purchaseRef.id,
      message: `Purchase recorded successfully. ${itemSummaries.map(i => `${i.quantity}x ${i.name}`).join(', ')}. Total: ₦${calculatedTotal.toLocaleString()}`,
    };
  } catch (error: any) {
    console.error('Error recording purchase:', error);
    return {
      success: false,
      message: `Failed to record purchase: ${error.message}`,
      error: error.message,
    };
  }
}

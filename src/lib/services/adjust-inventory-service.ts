/**
 * Adjust Inventory Service
 * Handles inventory adjustments
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { findProductByName } from './record-sale-service';

export interface AdjustInventoryParams {
  businessId: string;
  userId: string;
  productName: string;
  adjustment: number;
  reason?: string;
}

export interface AdjustInventoryResult {
  success: boolean;
  message: string;
  error?: string;
  newStock?: number;
}

/**
 * Adjust inventory for a product
 */
export async function adjustInventory(params: AdjustInventoryParams): Promise<AdjustInventoryResult> {
  const { businessId, userId, productName, adjustment, reason } = params;

  try {
    const db = getAdminDb();

    // Find product
    const productSearch = await findProductByName(businessId, productName);
    
    if (!productSearch.found) {
      if (productSearch.matches && productSearch.matches.length > 0) {
        return {
          success: false,
          message: `I found multiple products matching "${productName}". Please specify which one.`,
          error: 'Multiple products found',
        };
      }
      return {
        success: false,
        message: `Product "${productName}" not found in inventory.`,
        error: 'Product not found',
      };
    }

    const product = productSearch.product;
    const productRef = db.collection('businesses').doc(businessId).collection('products').doc(product.id);
    
    const currentStock = product.stock || product.quantity || 0;
    const newStock = currentStock + adjustment;

    if (newStock < 0) {
      return {
        success: false,
        message: `Cannot adjust inventory below zero. Current stock: ${currentStock}, adjustment: ${adjustment}`,
        error: 'Invalid adjustment',
      };
    }

    // Update stock
    await productRef.update({
      stock: newStock,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    // Create inventory adjustment record
    const adjustmentData = {
      businessId,
      productId: product.id,
      productName: product.name,
      previousStock: currentStock,
      adjustment,
      newStock,
      reason: reason || 'Manual adjustment',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    await db.collection('businesses').doc(businessId).collection('inventoryAdjustments').add(adjustmentData);

    const action = adjustment > 0 ? 'added to' : 'removed from';
    return {
      success: true,
      message: `Inventory adjusted successfully. ${Math.abs(adjustment)} units ${action} "${product.name}". New stock: ${newStock}.`,
      newStock,
    };
  } catch (error: any) {
    console.error('Error adjusting inventory:', error);
    return {
      success: false,
      message: `Failed to adjust inventory: ${error.message}`,
      error: error.message,
    };
  }
}

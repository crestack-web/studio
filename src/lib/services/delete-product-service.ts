/**
 * Delete Product Service
 * Handles product deletion from inventory
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface DeleteProductParams {
  businessId: string;
  userId: string;
  productId: string;
  productName?: string;
}

export interface DeleteProductResult {
  success: boolean;
  productId?: string;
  message: string;
  error?: string;
}

/**
 * Delete a product from the business inventory
 */
export async function deleteProduct(params: DeleteProductParams): Promise<DeleteProductResult> {
  const { businessId, userId, productId, productName } = params;

  try {
    const db = getAdminDb();

    // Check if product exists
    const productRef = db.collection('businesses').doc(businessId).collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return {
        success: false,
        message: `Product "${productName || productId}" not found in inventory.`,
        error: 'Product not found',
      };
    }

    // Soft delete by setting active to false
    await productRef.update({
      active: false,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: userId,
    });

    return {
      success: true,
      productId,
      message: `Product "${productName || productDoc.data()?.name || productId}" has been deleted from inventory.`,
    };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      message: `Failed to delete product: ${error.message}`,
      error: error.message,
    };
  }
}

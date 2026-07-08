/**
 * Update Product Service
 * Handles product updates in inventory
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface UpdateProductParams {
  businessId: string;
  userId: string;
  productId: string;
  productName?: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  category?: string;
  description?: string;
  sku?: string;
  unit?: string;
  lowStockThreshold?: number;
}

export interface UpdateProductResult {
  success: boolean;
  productId?: string;
  message: string;
  error?: string;
}

/**
 * Update a product in the business inventory
 */
export async function updateProduct(params: UpdateProductParams): Promise<UpdateProductResult> {
  const { businessId, userId, productId, productName, price, costPrice, stock, category, description, sku, unit, lowStockThreshold } = params;

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

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    };

    if (price !== undefined) updateData.price = price;
    if (costPrice !== undefined) updateData.cost = costPrice;
    if (stock !== undefined) updateData.stock = stock;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (sku !== undefined) updateData.sku = sku;
    if (unit !== undefined) updateData.unit = unit;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;

    await productRef.update(updateData);

    return {
      success: true,
      productId,
      message: `Product "${productName || productDoc.data()?.name || productId}" has been updated successfully.`,
    };
  } catch (error: any) {
    console.error('Error updating product:', error);
    return {
      success: false,
      message: `Failed to update product: ${error.message}`,
      error: error.message,
    };
  }
}

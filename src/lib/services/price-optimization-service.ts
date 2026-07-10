/**
 * Price Optimization Service
 * Suggests price changes based on cost increases and market factors
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface PriceOptimization {
  productId: string;
  name: string;
  currentPrice: number;
  currentCost: number;
  currentMargin: number;
  suggestedPrice: number;
  suggestedMargin: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BulkPriceUpdate {
  category?: string;
  marginTarget: number;
  applyToAll: boolean;
}

/**
 * Get price optimization suggestions
 */
export async function getPriceOptimizations(businessId: string): Promise<{ success: boolean; data?: PriceOptimization[]; error?: string }> {
  try {
    const db = getAdminDb();

    // Fetch all products
    const productsSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .get();

    const optimizations: PriceOptimization[] = [];

    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const currentPrice = product.price || 0;
      const currentCost = product.cost || product.costPrice || 0;
      
      if (currentPrice === 0 || currentCost === 0) {
        return;
      }

      const currentMargin = ((currentPrice - currentCost) / currentPrice) * 100;
      let suggestedPrice = currentPrice;
      let reason = '';
      let priority: 'high' | 'medium' | 'low' = 'low';

      // Check for low margin products
      if (currentMargin < 20) {
        suggestedPrice = currentCost / (1 - 0.30); // Target 30% margin
        reason = `Current margin is ${currentMargin.toFixed(1)}%, which is below healthy levels. Suggesting price increase to achieve 30% margin.`;
        priority = 'high';
      } else if (currentMargin < 30) {
        suggestedPrice = currentCost / (1 - 0.35); // Target 35% margin
        reason = `Current margin is ${currentMargin.toFixed(1)}%. Suggesting price increase to improve profitability.`;
        priority = 'medium';
      }

      // Check for high margin products (potential to reduce price for competitiveness)
      if (currentMargin > 60) {
        suggestedPrice = currentCost / (1 - 0.50); // Target 50% margin
        reason = `Current margin is ${currentMargin.toFixed(1)}%, which may be too high. Consider reducing price to be more competitive while maintaining healthy margin.`;
        priority = 'low';
      }

      // Only include if there's a meaningful suggestion
      if (Math.abs(suggestedPrice - currentPrice) / currentPrice > 0.05) { // More than 5% difference
        optimizations.push({
          productId: doc.id,
          name: product.name,
          currentPrice,
          currentCost,
          currentMargin,
          suggestedPrice,
          suggestedMargin: ((suggestedPrice - currentCost) / suggestedPrice) * 100,
          reason,
          priority,
        });
      }
    });

    // Sort by priority
    optimizations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return { success: true, data: optimizations };
  } catch (error: any) {
    console.error('Error getting price optimizations:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Apply bulk price updates based on margin target
 */
export async function applyBulkPriceUpdate(
  businessId: string,
  userId: string,
  params: BulkPriceUpdate
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const db = getAdminDb();

    const productsRef = db.collection('businesses').doc(businessId).collection('products');
    let query: admin.firestore.Query = productsRef as any;
    
    if (params.category) {
      query = query.where('category', '==', params.category);
    }

    const productsSnapshot = await query.get();
    let updatedCount = 0;

    const batch = db.batch();

    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const currentCost = product.cost || product.costPrice || 0;
      
      if (currentCost === 0) {
        return;
      }

      const suggestedPrice = currentCost / (1 - params.marginTarget / 100);
      const productDocRef = db.collection('businesses').doc(businessId).collection('products').doc(doc.id);

      batch.update(productDocRef, {
        price: suggestedPrice,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });

      updatedCount++;
    });

    await batch.commit();

    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error applying bulk price update:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update single product price
 */
export async function updateProductPrice(
  businessId: string,
  userId: string,
  productId: string,
  newPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();

    const productRef = db.collection('businesses').doc(businessId).collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    await productRef.update({
      price: newPrice,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating product price:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get price history for a product (if tracking is enabled)
 */
export async function getProductPriceHistory(businessId: string, productId: string): Promise<{ success: boolean; data?: Array<{ price: number; date: string; reason?: string }>; error?: string }> {
  try {
    const db = getAdminDb();

    // This would require a price history collection to be implemented
    // For now, return empty array
    return { success: true, data: [] };
  } catch (error: any) {
    console.error('Error getting product price history:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Expiry Management Service
 * Identifies products expiring soon and suggests discount strategies
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface ExpiringProduct {
  productId: string;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  potentialLoss: number;
  suggestedDiscount: number;
  discountedPrice: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface WasteReport {
  productId: string;
  name: string;
  quantityWasted: number;
  costLoss: number;
  wasteDate: string;
  reason: string;
}

/**
 * Get products expiring soon
 */
export async function getExpiringProducts(businessId: string, daysThreshold: number = 30): Promise<{ success: boolean; data?: ExpiringProduct[]; error?: string }> {
  try {
    const db = getAdminDb();

    // Fetch all products with expiry dates
    const productsSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .where('hasExpiry', '==', true)
      .get();

    const now = new Date();
    const thresholdDate = new Date(now.setDate(now.getDate() + daysThreshold));
    const expiringProducts: ExpiringProduct[] = [];

    productsSnapshot.forEach(doc => {
      const product = doc.data();
      const expiryDate = product.expiryDate;
      
      if (!expiryDate) return;

      const expiry = new Date(expiryDate);
      const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const currentStock = product.stock || product.quantity || 0;

      // Only include products that will expire within threshold and have stock
      if (daysUntilExpiry <= daysThreshold && daysUntilExpiry >= 0 && currentStock > 0) {
        const costPrice = product.cost || product.costPrice || 0;
        const sellingPrice = product.price || 0;
        const potentialLoss = currentStock * costPrice;
        
        // Calculate suggested discount based on urgency
        let suggestedDiscount = 0;
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';

        if (daysUntilExpiry <= 3) {
          suggestedDiscount = 50; // 50% off for products expiring in 3 days
          urgency = 'critical';
        } else if (daysUntilExpiry <= 7) {
          suggestedDiscount = 30; // 30% off for products expiring in 7 days
          urgency = 'high';
        } else if (daysUntilExpiry <= 14) {
          suggestedDiscount = 20; // 20% off for products expiring in 14 days
          urgency = 'medium';
        } else {
          suggestedDiscount = 10; // 10% off for products expiring in 30 days
          urgency = 'low';
        }

        const discountedPrice = sellingPrice * (1 - suggestedDiscount / 100);

        expiringProducts.push({
          productId: doc.id,
          name: product.name,
          expiryDate: expiry.toISOString().split('T')[0],
          daysUntilExpiry,
          currentStock,
          costPrice,
          sellingPrice,
          potentialLoss,
          suggestedDiscount,
          discountedPrice,
          urgency,
        });
      }
    });

    // Sort by days until expiry (most urgent first)
    expiringProducts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return { success: true, data: expiringProducts };
  } catch (error: any) {
    console.error('Error getting expiring products:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate waste/spoilage report
 */
export async function generateWasteReport(businessId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<{ success: boolean; data?: { totalWaste: number; totalLoss: number; items: WasteReport[] }; error?: string }> {
  try {
    const db = getAdminDb();

    // Calculate date range
    const now = new Date();
    let start: Date;
    
    if (period === 'week') {
      start = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      start = new Date(now.setMonth(now.getMonth() - 1));
    } else if (period === 'year') {
      start = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      start = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Fetch waste records
    const wasteSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('wasteRecords')
      .where('createdAt', '>=', start)
      .get();

    const wasteItems: WasteReport[] = [];
    let totalWaste = 0;
    let totalLoss = 0;

    wasteSnapshot.forEach(doc => {
      const waste = doc.data();
      const quantity = waste.quantity || 0;
      const costLoss = waste.costLoss || 0;
      
      totalWaste += quantity;
      totalLoss += costLoss;

      wasteItems.push({
        productId: waste.productId,
        name: waste.productName,
        quantityWasted: quantity,
        costLoss,
        wasteDate: waste.createdAt?.toDate?.().toISOString().split('T')[0] || '',
        reason: waste.reason || 'Unknown',
      });
    });

    return {
      success: true,
      data: {
        totalWaste,
        totalLoss,
        items: wasteItems,
      },
    };
  } catch (error: any) {
    console.error('Error generating waste report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Record waste/spoilage
 */
export async function recordWaste(
  businessId: string,
  userId: string,
  productId: string,
  productName: string,
  quantity: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();

    // Get product details
    const productDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    const product = productDoc.data();
    if (!product) {
      return { success: false, error: 'Product data not found' };
    }
    const costPrice = product.cost || product.costPrice || 0;
    const costLoss = quantity * costPrice;

    // Record waste
    await db
      .collection('businesses')
      .doc(businessId)
      .collection('wasteRecords')
      .add({
        businessId,
        productId,
        productName,
        quantity,
        costLoss,
        reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: userId,
      });

    // Update product stock
    const currentStock = product.stock || product.quantity || 0;
    const newStock = Math.max(0, currentStock - quantity);

    await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .doc(productId)
      .update({
        stock: newStock,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });

    return { success: true };
  } catch (error: any) {
    console.error('Error recording waste:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Apply discount to expiring product
 */
export async function applyExpiryDiscount(
  businessId: string,
  userId: string,
  productId: string,
  discountPercentage: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getAdminDb();

    // Get product details
    const productDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .doc(productId)
      .get();

    if (!productDoc.exists) {
      return { success: false, error: 'Product not found' };
    }

    const product = productDoc.data();
    if (!product) {
      return { success: false, error: 'Product data not found' };
    }
    const originalPrice = product.price || 0;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    // Update product price
    await db
      .collection('businesses')
      .doc(businessId)
      .collection('products')
      .doc(productId)
      .update({
        price: discountedPrice,
        originalPrice,
        discountPercentage,
        discountAppliedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });

    return { success: true };
  } catch (error: any) {
    console.error('Error applying discount:', error);
    return { success: false, error: error.message };
  }
}

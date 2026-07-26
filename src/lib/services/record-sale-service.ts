/**
 * Shared Record Sale Service
 * This service provides a single source of truth for recording sales
 * Used by both the Record Sale page and MO AI
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

// Helper function to record audit trail
async function recordAuditTrail(businessId: string, userId: string, action: string, entityType: string, entityId: string, entityName: string, newValues: any) {
  try {
    const db = getAdminDb();
    
    // Get user details for audit log
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await db.collection('businesses').doc(businessId).collection('auditTrail').add({
      userId,
      userName: userData?.displayName || userData?.name || 'Unknown',
      userEmail: userData?.email || '',
      action,
      entityType,
      entityId,
      entityName,
      previousValues: null,
      newValues,
      timestamp: admin.firestore.Timestamp.now(),
      ipAddress: null,
      userAgent: null,
    });
    
    console.log(`✅ Audit trail recorded for ${entityType}: ${entityId}`);
  } catch (auditError) {
    console.error('⚠️ Failed to record audit trail:', auditError);
    // Don't fail the main operation if audit fails
  }
}

export interface SaleItem {
  productId: string;
  name: string;
  variantId?: string | null;
  variantName?: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  emoji?: string;
}

export interface RecordSaleParams {
  businessId: string;
  userId: string;
  items: SaleItem[];
  paymentType: 'cash' | 'transfer' | 'pos' | 'credit';
  source?: 'pos' | 'mo_ai' | 'staff';
  recordedBy?: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    staffId?: string | null;
  };
}

export interface RecordSaleResult {
  success: boolean;
  saleId?: string;
  message: string;
  data?: {
    items: SaleItem[];
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    remainingStock: { [productId: string]: number };
  };
  error?: string;
}

/**
 * Record a sale using the same logic as the Record Sale page
 * This ensures consistency across all sale recording methods
 */
export async function recordSale(params: RecordSaleParams): Promise<RecordSaleResult> {
  const db = getAdminDb();
  const { businessId, userId, items, paymentType, source = 'mo_ai', recordedBy } = params;

  try {
    // Validate inputs
    if (!businessId || !userId || !items || items.length === 0) {
      return {
        success: false,
        message: 'Invalid sale parameters',
        error: 'Missing required fields: businessId, userId, or items'
      };
    }

    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    const remainingStock: { [productId: string]: number } = {};

    // Validate all products and check stock
    for (const item of items) {
      const productRef = db.collection('businesses').doc(businessId).collection('products').doc(item.productId);
      const productSnap = await productRef.get();

      if (!productSnap.exists) {
        return {
          success: false,
          message: `Product "${item.name}" not found in inventory`,
          error: `Product ${item.productId} does not exist`
        };
      }

      const productData = productSnap.data() as any;
      
      // Check stock availability
      let currentStock = 0;
      if (productData.hasVariants && item.variantId) {
        const variant = productData.variants?.find((v: any) => v.id === item.variantId);
        if (!variant) {
          return {
            success: false,
            message: `Variant not found for "${item.name}"`,
            error: `Variant ${item.variantId} does not exist`
          };
        }
        currentStock = variant.quantity || 0;
      } else {
        currentStock = productData.stock || productData.quantity || 0;
      }

      if (currentStock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${currentStock} units available.`,
          error: `Stock check failed for ${item.productId}`
        };
      }

      // Calculate totals
      const itemRevenue = item.price * item.quantity;
      const itemCost = item.costPrice * item.quantity;
      totalRevenue += itemRevenue;
      totalCost += itemCost;

      // Calculate remaining stock
      remainingStock[item.productId] = currentStock - item.quantity;
    }

    const totalProfit = totalRevenue - totalCost;

    // Record audit trail for sale creation
    await recordAuditTrail(
      businessId,
      userId,
      'create',
      'sale',
      'sale-' + Date.now().toString(36),
      `Sale - ${items.length} items`,
      {
        products: items.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice,
        })),
        totalRevenue,
        totalCost,
        profit: totalProfit,
        paymentMethod: paymentType,
        source,
      }
    );

    // Use transaction to ensure atomicity
    let saleId = '';
    await db.runTransaction(async (transaction) => {
      // Update inventory for each product
      for (const item of items) {
        const productRef = db.collection('businesses').doc(businessId).collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new Error(`Product ${item.name} not found during transaction`);
        }

        const productData = productSnap.data() as any;
        
        if (productData.hasVariants && item.variantId) {
          const variantIndex = productData.variants?.findIndex((v: any) => v.id === item.variantId);
          if (variantIndex === undefined || variantIndex < 0) {
            throw new Error(`Variant not found for ${item.name}`);
          }
          const newVariants = [...(productData.variants || [])];
          newVariants[variantIndex].quantity -= item.quantity;
          transaction.update(productRef, { 
            variants: newVariants,
            updatedAt: admin.firestore.Timestamp.now()
          });
        } else {
          const newQuantity = (productData.stock || productData.quantity || 0) - item.quantity;
          transaction.update(productRef, { 
            stock: newQuantity,
            quantity: newQuantity,
            updatedAt: admin.firestore.Timestamp.now()
          });
        }
      }

      // Create sale document — pre-generate the ID so we can return it
      const salesCollectionRef = db.collection('businesses').doc(businessId).collection('sales');
      const newSaleRef = salesCollectionRef.doc();
      saleId = newSaleRef.id;
      transaction.create(newSaleRef, {
        products: items.map(item => ({
          productId: item.productId,
          name: item.name,
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice,
          emoji: item.emoji || '📦',
        })),
        totalRevenue,
        totalCost,
        profit: totalProfit,
        paymentBreakdown: [{ method: paymentType, amount: totalRevenue }],
        paymentMethod: paymentType,
        expectedCash: paymentType === 'cash' ? totalRevenue : 0,
        expectedBank: paymentType !== 'cash' ? totalRevenue : 0,
        note: `Recorded via ${source === 'mo_ai' ? 'MO AI' : 'Point of Sale'}`,
        businessId,
        sourceLocation: 'main_store',
        sourceLocationName: 'Main Store',
        source,
        recordedBy: recordedBy || {
          uid: userId,
          email: 'system@busmo.ai',
          displayName: source === 'mo_ai' ? 'MO AI' : 'System',
          role: 'AI Assistant',
          staffId: null,
        },
        createdAt: admin.firestore.Timestamp.now(),
      });

    });

    return {
      success: true,
      saleId,
      message: `Sale recorded successfully`,
      data: {
        items,
        totalRevenue,
        totalCost,
        totalProfit,
        remainingStock
      }
    };

  } catch (error: any) {
    console.error('Error recording sale:', error);
    return {
      success: false,
      message: `Failed to record sale: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Get product by name (fuzzy match)
 * Used by MO to find products in inventory
 */
export async function findProductByName(
  businessId: string,
  productName: string
): Promise<{ found: boolean; product?: any; matches?: any[] }> {
  const db = getAdminDb();
  
  try {
    // Try exact match first
    const exactMatch = await db.collection('businesses')
      .doc(businessId)
      .collection('products')
      .where('name', '==', productName)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (!exactMatch.empty) {
      return {
        found: true,
        product: { id: exactMatch.docs[0].id, ...exactMatch.docs[0].data() }
      };
    }

    // Try case-insensitive search
    const allProducts = await db.collection('businesses')
      .doc(businessId)
      .collection('products')
      .where('active', '==', true)
      .get();

    const searchTerm = productName.toLowerCase();
    const matches = allProducts.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((p: any) => p.name.toLowerCase().includes(searchTerm))
      .slice(0, 5); // Return top 5 matches

    if (matches.length > 0) {
      return {
        found: true,
        matches
      };
    }

    return { found: false };
  } catch (error) {
    console.error('Error finding product:', error);
    return { found: false };
  }
}

/**
 * Get product details with stock information
 */
export async function getProductDetails(
  businessId: string,
  productId: string
): Promise<{ found: boolean; product?: any }> {
  const db = getAdminDb();
  
  try {
    const productRef = db.collection('businesses')
      .doc(businessId)
      .collection('products')
      .doc(productId);
    
    const productSnap = await productRef.get();
    
    if (!productSnap.exists) {
      return { found: false };
    }

    return {
      found: true,
      product: { id: productSnap.id, ...productSnap.data() }
    };
  } catch (error) {
    console.error('Error getting product details:', error);
    return { found: false };
  }
}
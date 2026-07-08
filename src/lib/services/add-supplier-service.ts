/**
 * Add Supplier Service
 * Handles supplier creation
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface AddSupplierParams {
  businessId: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface AddSupplierResult {
  success: boolean;
  supplierId?: string;
  message: string;
  error?: string;
}

/**
 * Add a new supplier to the business
 */
export async function addSupplier(params: AddSupplierParams): Promise<AddSupplierResult> {
  const { businessId, userId, name, phone, email, address } = params;

  try {
    const db = getAdminDb();

    const supplierData = {
      businessId,
      supplierName: name,
      businessName: name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      status: 'active',
      totalAmountSpent: 0,
      creditLimit: 0,
      openingBalance: 0,
      currentBalance: 0,
      creditUtilization: 0,
    };

    const supplierRef = await db.collection('businesses').doc(businessId).collection('suppliers').add(supplierData);

    return {
      success: true,
      supplierId: supplierRef.id,
      message: `Supplier "${name}" has been added successfully.`,
    };
  } catch (error: any) {
    console.error('Error adding supplier:', error);
    return {
      success: false,
      message: `Failed to add supplier: ${error.message}`,
      error: error.message,
    };
  }
}

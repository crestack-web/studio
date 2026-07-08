/**
 * Add Customer Service
 * Handles customer creation
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface AddCustomerParams {
  businessId: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface AddCustomerResult {
  success: boolean;
  customerId?: string;
  message: string;
  error?: string;
}

/**
 * Add a new customer to the business
 */
export async function addCustomer(params: AddCustomerParams): Promise<AddCustomerResult> {
  const { businessId, userId, name, phone, email, address } = params;

  try {
    const db = getAdminDb();

    const customerData = {
      businessId,
      name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      isActive: true,
      totalPurchases: 0,
      totalSpent: 0,
    };

    const customerRef = await db.collection('businesses').doc(businessId).collection('customers').add(customerData);

    return {
      success: true,
      customerId: customerRef.id,
      message: `Customer "${name}" has been added successfully.`,
    };
  } catch (error: any) {
    console.error('Error adding customer:', error);
    return {
      success: false,
      message: `Failed to add customer: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Record Payment Service
 * Handles payment recording
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export interface RecordPaymentParams {
  businessId: string;
  userId: string;
  amount: number;
  method: string;
  customer?: string;
  reference?: string;
  description?: string;
}

export interface RecordPaymentResult {
  success: boolean;
  paymentId?: string;
  message: string;
  error?: string;
}

/**
 * Record a payment transaction
 */
export async function recordPayment(params: RecordPaymentParams): Promise<RecordPaymentResult> {
  const { businessId, userId, amount, method, customer, reference, description } = params;

  try {
    const db = getAdminDb();

    const paymentData = {
      businessId,
      amount,
      paymentMethod: method,
      customerName: customer || '',
      reference: reference || `PAY-${Date.now()}`,
      description: description || `Payment from ${customer || 'customer'}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
      status: 'completed',
    };

    const paymentRef = await db.collection('businesses').doc(businessId).collection('payments').add(paymentData);

    // Update cashflow
    const cashflowRef = await db.collection('businesses').doc(businessId).collection('cashFlow').add({
      businessId,
      moneyIn: amount,
      moneyOut: 0,
      date: admin.firestore.FieldValue.serverTimestamp(),
      description: description || `Payment from ${customer || 'customer'}`,
      category: 'Payment',
      referenceId: paymentRef.id,
      referenceType: 'payment',
      performedBy: userId,
    });

    return {
      success: true,
      paymentId: paymentRef.id,
      message: `Payment of ₦${amount.toLocaleString()} has been recorded successfully.`,
    };
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return {
      success: false,
      message: `Failed to record payment: ${error.message}`,
      error: error.message,
    };
  }
}

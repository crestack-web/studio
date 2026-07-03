/**
 * Shared Add Expense Service
 * This service provides a single source of truth for recording expenses
 * Used by both the Add Expense page and MO AI
 */

import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

export interface AddExpenseParams {
  businessId: string;
  userId: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  description?: string;
  linkedProduct?: string;
  quantityReceived?: number;
  isRecurring?: boolean;
  recurFrequency?: string;
  recurNextDate?: string;
  receiptUrl?: string;
  receiptData?: string;
}

export interface AddExpenseResult {
  success: boolean;
  expenseId?: string;
  message: string;
  expense?: any;
  error?: string;
}

/**
 * Add an expense using the same logic as the Add Expense page
 * This ensures consistency across all expense creation methods
 */
export async function addExpense(params: AddExpenseParams): Promise<AddExpenseResult> {
  const db = getAdminDb();
  const {
    businessId,
    userId,
    category,
    amount,
    date,
    paymentMethod = 'Cash',
    description = '',
    linkedProduct,
    quantityReceived,
    isRecurring = false,
    recurFrequency,
    recurNextDate,
    receiptUrl,
    receiptData,
  } = params;

  try {
    // Validate inputs
    if (!businessId || !userId) {
      return {
        success: false,
        message: 'Invalid parameters',
        error: 'Missing required fields: businessId or userId'
      };
    }

    if (!category) {
      return {
        success: false,
        message: 'Please select an expense category',
        error: 'Category is empty'
      };
    }

    if (!amount || amount <= 0) {
      return {
        success: false,
        message: 'Please enter a valid amount',
        error: 'Invalid amount'
      };
    }

    if (!date) {
      return {
        success: false,
        message: 'Please select a date',
        error: 'Date is empty'
      };
    }

    // Handle receipt upload if provided
    let finalReceiptUrl = receiptUrl;
    if (receiptData && !receiptUrl) {
      try {
        const base64Data = receiptData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const storage = getStorage();
        const receiptRef = ref(storage, `expenses/${businessId}/${Date.now()}_receipt.jpg`);
        
        await uploadBytes(receiptRef, buffer);
        finalReceiptUrl = await getDownloadURL(receiptRef);
        console.log('✅ Receipt uploaded successfully');
      } catch (uploadError) {
        console.error('❌ Receipt upload failed:', uploadError);
        // Continue without receipt rather than failing
      }
    }

    // Parse date
    const expenseDate = new Date(date);
    
    // Parse recurring next date if provided
    let recurNextDateTimestamp = null;
    if (isRecurring && recurNextDate) {
      recurNextDateTimestamp = admin.firestore.Timestamp.fromDate(new Date(recurNextDate));
    }

    // Build expense data matching Add Expense page structure
    const expenseData: any = {
      category,
      amount,
      date: admin.firestore.Timestamp.fromDate(expenseDate),
      paymentMethod,
      description,
      linkedProduct: linkedProduct || null,
      quantityReceived: quantityReceived ? parseInt(quantityReceived.toString()) : null,
      isRecurring,
      recurFrequency: isRecurring ? recurFrequency : null,
      recurNextDate: recurNextDateTimestamp,
      receiptUrl: finalReceiptUrl || null,
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: userId,
    };

    // Save expense to Firestore
    const docRef = await db.collection('businesses').doc(businessId).collection('expenses').add(expenseData);

    // Record audit trail for expense creation
    await recordAuditTrail(
      businessId,
      userId,
      'create',
      'expense',
      docRef.id,
      `Expense - ${category}`,
      {
        category,
        amount,
        date: expenseDate.toISOString(),
        paymentMethod,
        description,
        linkedProduct: linkedProduct || null,
        quantityReceived: quantityReceived ? parseInt(quantityReceived.toString()) : null,
        isRecurring,
        recurFrequency: isRecurring ? recurFrequency : null,
        receiptUrl: finalReceiptUrl || null,
      }
    );

    return {
      success: true,
      expenseId: docRef.id,
      message: `Expense recorded successfully\n\nCategory: ${category}\nAmount: ₦${amount.toLocaleString()}\nDate: ${expenseDate.toLocaleDateString()}\nPayment: ${paymentMethod}`,
      expense: {
        id: docRef.id,
        category,
        amount,
        date: expenseDate.toISOString(),
        paymentMethod,
        description,
        linkedProduct,
        quantityReceived,
        isRecurring,
        recurFrequency,
        receiptUrl: finalReceiptUrl || null,
      }
    };

  } catch (error: any) {
    console.error('Error adding expense:', error);
    return {
      success: false,
      message: `Failed to record expense: ${error.message}`,
      error: error.message
    };
  }
}
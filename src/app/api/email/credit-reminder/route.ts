import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ success: false, message: 'Business ID is required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // Get business info
    const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
    if (!businessDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Business not found' }, { status: 404 });
    }

    const businessData = businessDoc.data();
    const businessName = businessData.name || 'Your Business';

    // Fetch all sales with credit payments
    const salesQuery = query(
      collection(firestore, 'businesses', businessId, 'sales'),
      where('paymentBreakdown', '!=', null)
    );

    const salesSnapshot = await getDocs(salesQuery);

    const pendingPayments: Array<{
      customerName: string;
      customerEmail: string;
      amount: number;
      dueDate: string;
    }> = [];

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      
      if (sale.paymentBreakdown && Array.isArray(sale.paymentBreakdown)) {
        sale.paymentBreakdown.forEach((pb: any) => {
          if (pb.method === 'credit' && !pb.received) {
            pendingPayments.push({
              customerName: sale.customerName || 'Customer',
              customerEmail: sale.customerEmail || '',
              amount: pb.amount || 0,
              dueDate: pb.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            });
          }
        });
      }
    });

    if (pendingPayments.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending credit payments' });
    }

    // Send payment reminder emails
    const emailResults = [];
    for (const payment of pendingPayments) {
      if (payment.customerEmail) {
        try {
          await BrevoService.sendCreditPaymentReminderEmail(
            payment.customerEmail,
            payment.customerName,
            businessName,
            payment.amount,
            payment.dueDate
          );
          emailResults.push({ email: payment.customerEmail, status: 'sent' });
        } catch (error) {
          console.error(`Failed to send reminder to ${payment.customerEmail}:`, error);
          emailResults.push({ email: payment.customerEmail, status: 'failed' });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent ${emailResults.filter(r => r.status === 'sent').length} payment reminders`,
      results: emailResults 
    });
  } catch (error) {
    console.error('Credit payment reminder API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send credit payment reminders', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

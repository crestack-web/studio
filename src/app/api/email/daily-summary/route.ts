import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { BrevoService } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, date } = body;

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
    const ownerId = businessData.ownerId;

    if (!ownerId) {
      return NextResponse.json({ success: false, message: 'Owner ID not found' }, { status: 400 });
    }

    // Get owner email
    const ownerDoc = await getDoc(doc(firestore, 'users', ownerId));
    if (!ownerDoc.exists()) {
      return NextResponse.json({ success: false, message: 'Owner not found' }, { status: 404 });
    }

    const ownerEmail = ownerDoc.data().email;
    if (!ownerEmail) {
      return NextResponse.json({ success: false, message: 'Owner email not found' }, { status: 400 });
    }

    // Calculate date range for the summary
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Fetch sales for the day
    const salesQuery = query(
      collection(firestore, 'businesses', businessId, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(dayStart)),
      where('createdAt', '<=', Timestamp.fromDate(dayEnd))
    );

    const salesSnapshot = await getDocs(salesQuery);

    if (salesSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'No sales for this day' });
    }

    // Calculate sales metrics
    let totalSales = 0;
    let totalProfit = 0;
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    salesSnapshot.forEach(doc => {
      const sale = doc.data();
      totalSales += sale.totalRevenue || 0;
      totalProfit += sale.profit || 0;

      // Track product sales
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.name || item.emoji || 'Unknown Product';
          if (!productSales[productName]) {
            productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity || item.qty || 1;
          productSales[productName].revenue += item.price * (item.quantity || item.qty || 1);
        });
      }
    });

    // Get top 5 products
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Prepare sales data for email
    const salesData = {
      date: targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalSales,
      totalProfit,
      transactionCount: salesSnapshot.size,
      topProducts,
    };

    // Send daily sales summary email
    await BrevoService.sendDailySalesSummaryEmail(
      ownerEmail,
      businessName,
      salesData
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Daily sales summary email sent',
      data: salesData 
    });
  } catch (error) {
    console.error('Daily sales summary API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send daily sales summary', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

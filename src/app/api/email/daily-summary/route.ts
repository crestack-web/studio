import { NextRequest, NextResponse } from 'next/server';
import { sendDailyBusinessSummaryEmail } from '@/services/email/subscription-emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, businessName, date, totalSales, totalProfit, totalExpenses, transactionCount, topProducts, insights, currency } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`📊 [Daily Summary API] Sending summary to ${email}`);

    await sendDailyBusinessSummaryEmail({
      email,
      name,
      businessName: businessName || 'Your Business',
      date,
      totalSales: totalSales || 0,
      totalProfit: totalProfit || 0,
      totalExpenses: totalExpenses || 0,
      transactionCount: transactionCount || 0,
      topProducts: topProducts || [],
      insights: insights || [],
      currency: currency || 'NGN',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Daily Summary API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send daily summary' },
      { status: 500 }
    );
  }
}

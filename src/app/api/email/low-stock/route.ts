import { NextRequest, NextResponse } from 'next/server';
import { sendLowStockAlertEmail } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, businessName, lowStockItems } = body;

    if (!email || !businessName || !Array.isArray(lowStockItems)) {
      return NextResponse.json(
        { error: 'Missing required fields: email, businessName, lowStockItems' },
        { status: 400 }
      );
    }

    await sendLowStockAlertEmail(email, businessName, lowStockItems);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[low-stock] Failed:', message);
    return NextResponse.json(
      { error: 'Failed to send low stock alert', details: message },
      { status: 500 }
    );
  }
}

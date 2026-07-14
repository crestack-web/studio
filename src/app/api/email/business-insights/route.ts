import { NextRequest, NextResponse } from 'next/server';
import { sendBusinessInsightsEmail } from '@/services/email/subscription-emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, businessName, insights, generatedAt } = body;

    if (!email || !name || !insights) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🎯 [Business Insights API] Sending insights to ${email}`);

    await sendBusinessInsightsEmail({
      email,
      name,
      businessName: businessName || 'Your Business',
      insights,
      generatedAt: generatedAt || new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Business Insights API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send business insights' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendTrialReminderEmail } from '@/services/email/subscription-emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, businessName, daysRemaining, trialEndDate } = body;

    if (!email || !name || !daysRemaining || !trialEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`📧 [Trial Reminder API] Sending reminder to ${email} (${daysRemaining} days remaining)`);

    await sendTrialReminderEmail({
      email,
      name,
      businessName: businessName || 'Your Business',
      daysRemaining,
      trialEndDate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [Trial Reminder API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send trial reminder' },
      { status: 500 }
    );
  }
}

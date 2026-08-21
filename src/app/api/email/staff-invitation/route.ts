import { NextRequest, NextResponse } from 'next/server';
import { sendStaffInvitationEmail } from '@/services/email/brevo-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, staffName, businessName, tempPassword } = body;

    if (!email || !staffName || !businessName || !tempPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await sendStaffInvitationEmail(email, staffName, businessName, tempPassword);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[staff-invitation] Failed:', message);
    return NextResponse.json(
      { error: 'Failed to send staff invitation', details: message },
      { status: 500 }
    );
  }
}

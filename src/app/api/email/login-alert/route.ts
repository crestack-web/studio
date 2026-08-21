import { NextRequest, NextResponse } from 'next/server';
import { sendLoginAlertEmail } from '@/services/email/security-emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, device, browser, location, loginTime, ipAddress } = body;

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name' },
        { status: 400 }
      );
    }

    await sendLoginAlertEmail({
      email,
      name,
      device: device || 'Unknown device',
      browser: browser || 'Unknown browser',
      location,
      loginTime: loginTime || new Date().toISOString(),
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[login-alert] Failed to send:', message);
    return NextResponse.json(
      { error: 'Failed to send login alert', details: message },
      { status: 500 }
    );
  }
}

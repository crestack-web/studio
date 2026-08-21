import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import {
  createEmailConfirmToken,
  buildConfirmEmailUrl,
  buildConfirmationEmailHtml,
} from '@/lib/email-confirmation';

/**
 * POST /api/auth/send-confirmation
 * Body: { email, userId, name? }
 * Sends a Resend confirmation email (not Supabase Auth mail).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const userId = String(body.userId || '').trim();
    const name = String(body.name || '').trim() || 'there';

    if (!email || !email.includes('@') || !userId) {
      return NextResponse.json(
        { error: 'email and userId are required' },
        { status: 400 }
      );
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://www.busmo.io';

    const token = createEmailConfirmToken(userId, email);
    const confirmUrl = buildConfirmEmailUrl(token, origin);
    const htmlContent = buildConfirmationEmailHtml({ name, confirmUrl });

    const result = await sendTransactionalEmail({
      to: [{ email, name }],
      subject: 'Confirm your Busmo email address',
      htmlContent,
      sender: { name: 'Busmo', email: 'noreply@busmo.io' },
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: 'Confirmation email sent',
    });
  } catch (err: any) {
    console.error('[send-confirmation]', err);
    return NextResponse.json(
      {
        error: 'Failed to send confirmation email',
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

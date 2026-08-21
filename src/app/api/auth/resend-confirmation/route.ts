import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import {
  createEmailConfirmToken,
  buildConfirmEmailUrl,
  buildConfirmationEmailHtml,
} from '@/lib/email-confirmation';

/**
 * POST /api/auth/resend-confirmation
 * Body: { email }
 * Looks up user by email (Admin) and sends a new Resend confirmation link.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let userId: string | null = null;
    let name = 'there';

    const byEmail = (admin.auth.admin as any).getUserByEmail;
    if (typeof byEmail === 'function') {
      const { data, error } = await admin.auth.admin.getUserByEmail(email);
      if (error || !data?.user) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists for this email, a confirmation link was sent.',
        });
      }
      userId = data.user.id;
      name =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        'there';
      if (data.user.email_confirmed_at) {
        return NextResponse.json({
          success: true,
          alreadyConfirmed: true,
          message: 'This email is already confirmed. You can log in.',
        });
      }
    } else {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const found = data.users.find((u) => u.email?.toLowerCase() === email);
      if (!found) {
        return NextResponse.json({
          success: true,
          message: 'If an account exists for this email, a confirmation link was sent.',
        });
      }
      if (found.email_confirmed_at) {
        return NextResponse.json({
          success: true,
          alreadyConfirmed: true,
          message: 'This email is already confirmed. You can log in.',
        });
      }
      userId = found.id;
      name =
        found.user_metadata?.full_name || found.user_metadata?.name || 'there';
    }

    if (!userId) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, a confirmation link was sent.',
      });
    }

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://www.busmo.io';

    const token = createEmailConfirmToken(userId, email);
    const confirmUrl = buildConfirmEmailUrl(token, origin);
    const htmlContent = buildConfirmationEmailHtml({ name, confirmUrl });

    await sendTransactionalEmail({
      to: [{ email, name }],
      subject: 'Confirm your Busmo email address',
      htmlContent,
      sender: { name: 'Busmo', email: 'noreply@busmo.io' },
    });

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent.',
    });
  } catch (err: any) {
    console.error('[resend-confirmation]', err);
    return NextResponse.json(
      { error: 'Failed to resend confirmation email', details: err?.message },
      { status: 500 }
    );
  }
}

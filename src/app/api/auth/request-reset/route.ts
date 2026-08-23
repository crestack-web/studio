import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import {
  createPasswordResetToken,
  buildResetUrl,
  buildResetPasswordEmailHtml,
} from '@/lib/password-reset-token';

/**
 * POST /api/auth/request-reset
 * Body: { email }
 * Generates a password-reset token and emails it via Resend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up user by email (paginate until found or exhausted)
    let user: { id: string; email: string; user_metadata: Record<string, any> } | null = null;
    let page = 1;
    const maxPages = 20; // safety cap

    while (page <= maxPages) {
      const { data: userData, error: lookupErr } =
        await supabase.auth.admin.listUsers({ page, perPage: 1000 });

      if (lookupErr) {
        console.error('[request-reset] listUsers error:', lookupErr);
        throw new Error(`Failed to look up user: ${lookupErr.message}`);
      }

      const found = userData?.users.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (found) {
        user = found as any;
        break;
      }

      if (!userData?.users || userData.users.length < 1000) break;
      page++;
    }

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      'there';

    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://www.busmo.io';

    const token = createPasswordResetToken(user.id, email);
    const resetUrl = buildResetUrl(token, origin);
    const htmlContent = buildResetPasswordEmailHtml({ name, resetUrl });

    const result = await sendTransactionalEmail({
      to: [{ email, name }],
      subject: 'Reset your Busmo password',
      htmlContent,
    });

    return NextResponse.json({
      success: true,
      messageId: result.id,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error('[request-reset] Error:', msg, err);

    // Surface specific errors to help debug
    if (msg.includes('RESEND_API_KEY') || msg.includes('Resend is not configured')) {
      return NextResponse.json(
        { error: 'Email service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    if (msg.includes('EMAIL_CONFIRM_SECRET') || msg.includes('required for password')) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process password reset. Please try again or contact support.' },
      { status: 500 }
    );
  }
}

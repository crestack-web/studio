import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import {
  ADMIN_EMAIL_ROLES,
  isAdminEmail,
  getAdminRole,
} from '@/lib/adminEmails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory OTP store (10 min). Prefer Redis in multi-instance production.
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

function normalizeEmail(email: string) {
  return String(email || '').toLowerCase().trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const emailRaw = String(body.email || '');
    const email = normalizeEmail(emailRaw);
    const otp = body.otp ? String(body.otp).trim() : '';

    // ── Verify OTP ────────────────────────────────────────────
    if (otp) {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email is required' },
          { status: 400 }
        );
      }

      const stored = otpStore.get(email);

      if (!stored) {
        return NextResponse.json(
          { success: false, error: 'OTP not found or expired' },
          { status: 400 }
        );
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return NextResponse.json(
          { success: false, error: 'OTP expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (stored.otp !== otp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP. Please try again.' },
          { status: 400 }
        );
      }

      otpStore.delete(email);

      const role = getAdminRole(email);
      const permissions =
        role === 'SUPER_ADMIN'
          ? ['all', 'read_support', 'write_support', 'read_users', 'write_users']
          : ['support_view', 'support_reply', 'support_status'];

      const sessionToken = Buffer.from(
        JSON.stringify({
          email,
          role,
          permissions,
          lastLogin: new Date().toISOString(),
        })
      ).toString('base64');

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        sessionToken,
        user: {
          email,
          role,
          permissions,
        },
      });
    }

    // ── Request OTP (send via Resend) ─────────────────────────
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!isAdminEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Your account does not have admin access. Please contact support if you believe this is an error.',
        },
        { status: 403 }
      );
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp: generatedOtp, expires, email });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Login OTP - Busmo</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
          .content { padding: 40px 30px; background: #fff; }
          .otp-box { background: linear-gradient(135deg, #6B3FE7 0%, #8B5CF6 100%); color: white; padding: 30px; margin: 20px 0; border-radius: 12px; text-align: center; }
          .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 15px 0; font-family: monospace; }
          .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .warning-box h3 { margin-top: 0; color: #D97706; }
          .footer { background: #F9FAFB; padding: 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h2>Admin Login Verification</h2>
            <p>You requested access to the Busmo Admin Dashboard. Use this one-time code to confirm your email:</p>
            <div class="otp-box">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 10px;">Your One-Time Password</div>
              <div class="otp-code">${generatedOtp}</div>
              <div style="font-size: 12px; opacity: 0.8;">Valid for 10 minutes</div>
            </div>
            <div class="warning-box">
              <h3>Security notice</h3>
              <p style="margin:0;">If you did not request this code, ignore this email. Never share your OTP.</p>
            </div>
          </div>
          <div class="footer">
            <p>Busmo Admin · sent via Resend</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await sendTransactionalEmail({
        to: [{ email, name: 'Busmo Admin' }],
        subject: 'Your Busmo Admin login code',
        htmlContent,
        sender: {
          name: 'Busmo Admin',
          email: (process.env.EMAIL_FROM || process.env.RESEND_FROM || 'support@busmo.io')
            .replace(/^.*</, '')
            .replace(/>.*$/, '')
            .trim() || 'support@busmo.io',
        },
      });

      console.log(
        JSON.stringify({
          event: 'admin_otp_sent',
          emailSuffix: email.slice(-12),
          role: ADMIN_EMAIL_ROLES[email],
          resendId: result?.id || null,
        })
      );

      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email via Resend',
        // Never return OTP in production responses
      });
    } catch (sendErr: any) {
      otpStore.delete(email);
      console.error(
        JSON.stringify({
          event: 'admin_otp_send_failed',
          error: sendErr?.message || 'send failed',
        })
      );
      const missingKey =
        String(sendErr?.message || '').includes('RESEND_API_KEY') ||
        String(sendErr?.message || '').includes('Resend is not configured');
      return NextResponse.json(
        {
          success: false,
          error: missingKey
            ? 'Email service not configured (RESEND_API_KEY). Contact engineering.'
            : 'Failed to send OTP email. Please try again.',
        },
        { status: 502 }
      );
    }
  } catch (e: any) {
    console.error('[admin/auth/otp]', e?.message || e);
    return NextResponse.json(
      { success: false, error: 'OTP request failed' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';

const ADMIN_EMAILS = [
  'taheeratorganic@gmail.com',
  'admin@busmo.io',
  'majnuncode@gmail.com',
  'sxeedtxheer@gmail.com',
  'ahmedusmus@gmail.com',
  'majnun@busmo.io'
];

interface OTPRequest {
  email: string;
}

interface OTPVerify {
  email: string;
  otp: string;
}

// Store OTPs temporarily (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    // Verify OTP if provided
    if (otp) {
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

      // OTP is valid - clean up and return success
      otpStore.delete(email);
      
      // Generate admin session token
      const sessionToken = Buffer.from(
        JSON.stringify({
          email,
          role: 'Administrator',
          permissions: ['read_support', 'write_support', 'read_users', 'write_users'],
          lastLogin: new Date().toISOString()
        })
      ).toString('base64');

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        sessionToken,
        user: {
          email,
          role: 'Administrator',
          permissions: ['read_support', 'write_support', 'read_users', 'write_users']
        }
      });
    }

    // Request OTP
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email is whitelisted
    if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Your account does not have admin access. Please contact support if you believe this is an error.' },
        { status: 403 }
      );
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(email, { otp: generatedOtp, expires, email });

    // Send OTP via email
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
            <p>You requested to access the Busmo Admin Dashboard. Use the following OTP to complete your login:</p>
            
            <div class="otp-box">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 10px;">Your One-Time Password</div>
              <div class="otp-code">${generatedOtp}</div>
              <div style="font-size: 12px; opacity: 0.8;">Valid for 10 minutes</div>
            </div>

            <div class="warning-box">
              <h3>⚠️ Security Notice</h3>
              <p style="margin: 8px 0; color: #555; font-size: 14px;">
                If you did not request this OTP, please ignore this email. Your account security is important to us.
              </p>
            </div>

            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              This code will expire in 10 minutes. Do not share it with anyone.
            </p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Busmo. Built for African commerce</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendTransactionalEmail({
      to: [{ email, name: 'Admin User' }],
      subject: 'Your Admin Login OTP - Busmo',
      htmlContent
    });

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Error in OTP admin login:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
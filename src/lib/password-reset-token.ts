/**
 * Custom password-reset tokens (HMAC).
 * Sent via Resend, not Supabase Auth mail.
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { BUSMO_LOGO } from '@/services/email/email-constants';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function getSecret(): string {
  const secret =
    process.env.EMAIL_CONFIRM_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    '';
  if (!secret) {
    throw new Error(
      'EMAIL_CONFIRM_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required for password reset tokens.'
    );
  }
  return secret;
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  exp: number;
}

export function createPasswordResetToken(userId: string, email: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = b64url(JSON.stringify({ userId, email: email.toLowerCase().trim(), exp }));
  const sig = createHmac('sha256', getSecret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid reset link.');
  }
  const [payloadB64, sigB64] = parts;
  const expected = createHmac('sha256', getSecret()).update(payloadB64).digest();
  const actual = fromB64url(sigB64);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid or tampered reset link.');
  }
  let data: PasswordResetPayload;
  try {
    data = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch {
    throw new Error('Invalid reset link.');
  }
  if (!data?.userId || !data?.email || !data?.exp) {
    throw new Error('Invalid reset link.');
  }
  if (Date.now() > data.exp) {
    throw new Error('This reset link has expired. Please request a new one.');
  }
  return data;
}

export function buildResetUrl(token: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.busmo.io';
  return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildResetPasswordEmailHtml(params: {
  name: string;
  resetUrl: string;
}): string {
  const { name, resetUrl } = params;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6B3FE7 0%,#8B5CF6 100%);padding:36px 28px;text-align:center;color:#fff;">
      <img src="${BUSMO_LOGO}" alt="Busmo" width="80" height="80" style="border-radius:16px;background:white;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);margin-bottom:16px;" />
      <h1 style="margin:0;font-size:26px;font-weight:700;">Reset your password</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:15px;">You requested a password reset for your Busmo account</p>
    </div>
    <div style="padding:32px 28px;color:#333;line-height:1.6;">
      <p style="font-size:16px;">Hi ${name || 'there'},</p>
      <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6B3FE7 0%,#8B5CF6 100%);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
          Set new password
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;">If you didn't request a password reset, you can safely ignore this email.</p>
      <p style="font-size:12px;color:#9ca3af;word-break:break-all;margin-top:20px;">Or paste this URL into your browser:<br/>${resetUrl}</p>
    </div>
    <div style="padding:20px 28px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
      © ${new Date().getFullYear()} Busmo · Built for African commerce
    </div>
  </div>
</body>
</html>`;
}

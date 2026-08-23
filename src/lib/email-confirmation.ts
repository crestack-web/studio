/**
 * Custom email confirmation tokens (HMAC).
 * Used so confirmation emails are sent via Resend, not Supabase Auth mail.
 */

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function getSecret(): string {
  const secret =
    process.env.EMAIL_CONFIRM_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    '';
  if (!secret) {
    throw new Error(
      'EMAIL_CONFIRM_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is required for email confirmation tokens.'
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

export interface ConfirmTokenPayload {
  userId: string;
  email: string;
  exp: number;
}

/** Create a signed, time-limited confirmation token. */
export function createEmailConfirmToken(userId: string, email: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = b64url(JSON.stringify({ userId, email: email.toLowerCase().trim(), exp }));
  const sig = createHmac('sha256', getSecret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

/** Verify token; throws if invalid or expired. */
export function verifyEmailConfirmToken(token: string): ConfirmTokenPayload {
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid confirmation link.');
  }
  const [payloadB64, sigB64] = parts;
  const expected = createHmac('sha256', getSecret()).update(payloadB64).digest();
  const actual = fromB64url(sigB64);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid or tampered confirmation link.');
  }
  let data: ConfirmTokenPayload;
  try {
    data = JSON.parse(fromB64url(payloadB64).toString('utf8'));
  } catch {
    throw new Error('Invalid confirmation link.');
  }
  if (!data?.userId || !data?.email || !data?.exp) {
    throw new Error('Invalid confirmation link.');
  }
  if (Date.now() > data.exp) {
    throw new Error('This confirmation link has expired. Please request a new one.');
  }
  return data;
}

export function buildConfirmEmailUrl(token: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.busmo.io';
  return `${base.replace(/\/$/, '')}/confirm-email?token=${encodeURIComponent(token)}`;
}

export function buildConfirmationEmailHtml(params: {
  name: string;
  confirmUrl: string;
}): string {
  const { name, confirmUrl } = params;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6B3FE7 0%,#8B5CF6 100%);padding:36px 28px;text-align:center;color:#fff;">
      <img src="https://www.busmo.io/email-logo.png" alt="Busmo" width="56" height="56" style="border-radius:12px;margin-bottom:16px;" />
      <h1 style="margin:0;font-size:26px;font-weight:700;">Confirm your email</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:15px;">One quick step to activate your Busmo account</p>
    </div>
    <div style="padding:32px 28px;color:#333;line-height:1.6;">
      <p style="font-size:16px;">Hi ${name || 'there'},</p>
      <p>Thanks for signing up for <strong>Busmo</strong>. Please confirm your email address so we know it's really you.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6B3FE7 0%,#8B5CF6 100%);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
          Confirm email address
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280;">This link expires in 48 hours. If you didn't create a Busmo account, you can ignore this email.</p>
      <p style="font-size:12px;color:#9ca3af;word-break:break-all;margin-top:20px;">Or paste this URL into your browser:<br/>${confirmUrl}</p>
    </div>
    <div style="padding:20px 28px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
      © ${new Date().getFullYear()} Busmo · Built for African commerce
    </div>
  </div>
</body>
</html>`;
}

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { verifyEmailConfirmToken } from '@/lib/email-confirmation';

/**
 * GET /api/auth/confirm-email?token=...
 * POST /api/auth/confirm-email  { token }
 *
 * Marks the user's email as confirmed in Supabase (Admin API).
 * Does not use Supabase's built-in confirmation emails.
 */
async function confirm(token: string) {
  const payload = verifyEmailConfirmToken(token);
  const admin = getSupabaseAdmin();

  const { data, error } = await admin.auth.admin.updateUserById(payload.userId, {
    email_confirm: true,
  });

  if (error) {
    console.error('[confirm-email] updateUserById:', error.message);
    throw new Error(error.message || 'Failed to confirm email');
  }

  return {
    userId: payload.userId,
    email: payload.email,
    confirmed: true,
    emailConfirmedAt: data.user?.email_confirmed_at ?? new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token') || '';
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    const result = await confirm(token);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[confirm-email GET]', err);
    return NextResponse.json(
      { error: err?.message || 'Confirmation failed' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    const result = await confirm(token);
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[confirm-email POST]', err);
    return NextResponse.json(
      { error: err?.message || 'Confirmation failed' },
      { status: 400 }
    );
  }
}

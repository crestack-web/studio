import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * POST /api/auth/signup
 *
 * Creates an email/password owner account via the Admin API with
 * email_confirm: false so Supabase does NOT send its built-in confirmation
 * email. The client then sends our custom Resend confirmation via
 * /api/auth/send-confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || body.name || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name: fullName || undefined,
        name: fullName || undefined,
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists') ||
        error.status === 422
      ) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please log in instead.',
            code: 'email_exists',
          },
          { status: 409 }
        );
      }
      console.error('[auth/signup] createUser:', error.message);
      return NextResponse.json(
        { error: error.message || 'Failed to create account.' },
        { status: 400 }
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });
    }

    return NextResponse.json({
      userId,
      email: data.user?.email || email,
      // Not confirmed — client must send Resend confirmation only
      emailConfirmed: false,
    });
  } catch (err: any) {
    console.error('[auth/signup]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}

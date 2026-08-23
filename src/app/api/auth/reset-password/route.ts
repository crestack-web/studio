import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPasswordResetToken } from '@/lib/password-reset-token';

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 * Verifies the reset token and updates the user's password.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || '').trim();
    const password = String(body.password || '');

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Verify the HMAC token
    const payload = verifyPasswordResetToken(token);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Update the user's password
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      payload.userId,
      { password }
    );

    if (updateErr) {
      console.error('[reset-password] update error:', updateErr);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('expired') || msg.includes('Invalid')) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    console.error('[reset-password]', err);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

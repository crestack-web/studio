import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdminUser } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST { email, plan?: 'lifetime' | 'pro' | 'standard' }
 * Grants complimentary / plan access for an existing user (admin only).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').toLowerCase().trim();
    const plan = String(body.plan || 'lifetime').toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('id, email, metadata')
      .eq('email', email)
      .maybeSingle();

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 });
    }
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. They must sign up once before access can be granted.' },
        { status: 404 }
      );
    }

    const lifetime = plan === 'lifetime' || plan === 'pro' || plan === 'free';
    const planId = plan === 'standard' ? 'standard' : plan === 'starter' ? 'starter' : 'pro';
    const meta = {
      ...((user as any).metadata && typeof (user as any).metadata === 'object'
        ? (user as any).metadata
        : {}),
      lifetimeAccess: lifetime,
      accessType: lifetime ? 'lifetime' : planId,
      plan: planId,
      grantedBy: admin.email,
      grantedAt: new Date().toISOString(),
    };

    const { error: upErr } = await supabase
      .from('users')
      .update({
        plan: planId,
        subscription_status: lifetime ? 'active' : 'active',
        lifetime_access: lifetime,
        trial_end_date: null,
        subscription_end_date: lifetime
          ? null
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: meta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (user as any).id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${lifetime ? 'lifetime' : planId} access to ${email}`,
      userId: (user as any).id,
    });
  } catch (error: any) {
    console.error('[admin/update-user-plan]', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

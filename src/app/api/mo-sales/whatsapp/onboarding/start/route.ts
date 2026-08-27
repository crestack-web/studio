import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../../_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getEmbeddedSignupPublicConfig } from '@/lib/infobip/embedded-signup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Start WhatsApp Embedded Signup for the authenticated merchant's business.
 * Does not register a number from free-text input.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const publicCfg = getEmbeddedSignupPublicConfig();
    if (!publicCfg.configured) {
      return NextResponse.json(
        {
          error: 'embedded_signup_not_configured',
          message:
            'Meta Embedded Signup is not fully configured for Busmo yet. Trial / operator activation still works for approved senders.',
          config: publicCfg,
        },
        { status: 503 }
      );
    }

    const admin = getSupabaseAdmin();
    const sessionId = crypto.randomUUID();
    const pendingSender = `pending:${businessId}:${sessionId}`;

    const { data: existing } = await admin
      .from('whatsapp_connections')
      .select('id, status, onboarding_status, whatsapp_sender')
      .eq('business_id', businessId)
      .eq('provider', 'infobip')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status === 'active' && existing.onboarding_status === 'active') {
      return NextResponse.json({
        ok: true,
        alreadyConnected: true,
        connectionId: existing.id,
        config: publicCfg,
      });
    }

    const meta = {
      onboarding_session_id: sessionId,
      requested_by: user.id,
      requested_at: new Date().toISOString(),
      flow: 'meta_embedded_signup',
    };

    let connectionId = existing?.id;
    if (existing) {
      await admin
        .from('whatsapp_connections')
        .update({
          status: 'pending',
          onboarding_status: 'onboarding',
          onboarding_error: null,
          metadata: meta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      connectionId = crypto.randomUUID();
      const { error } = await admin.from('whatsapp_connections').insert({
        id: connectionId,
        business_id: businessId,
        provider: 'infobip',
        whatsapp_sender: pendingSender,
        status: 'pending',
        onboarding_status: 'onboarding',
        metadata: meta,
      });
      if (error) {
        console.error('[onboarding/start]', error.message);
        return NextResponse.json({ error: 'Could not start onboarding' }, { status: 500 });
      }
    }

    console.log(
      JSON.stringify({
        event: 'onboarding_started',
        businessId,
        connectionId,
        sessionId,
      })
    );

    return NextResponse.json({
      ok: true,
      connectionId,
      sessionId,
      config: publicCfg,
      steps: [
        'Connect your WhatsApp Business account',
        'Choose your business',
        'Verify your phone number',
        'Give Busmo permission to manage messaging',
      ],
    });
  } catch (e: any) {
    console.error('[onboarding/start]', e?.message);
    return NextResponse.json({ error: 'Failed to start onboarding' }, { status: 500 });
  }
}

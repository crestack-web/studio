import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../../_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getEmbeddedSignupPublicConfig } from '@/lib/infobip/embedded-signup';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = new URL(req.url).searchParams.get('businessId') || '';
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const admin = getSupabaseAdmin();
    const { data: conn } = await admin
      .from('whatsapp_connections')
      .select(
        'id, business_id, provider, whatsapp_sender, status, onboarding_status, waba_id, phone_display, display_name, onboarding_error, connected_at, metadata, updated_at'
      )
      .eq('business_id', businessId)
      .eq('provider', 'infobip')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      embeddedSignup: getEmbeddedSignupPublicConfig(),
      connection: conn
        ? {
            id: conn.id,
            status: conn.status,
            onboardingStatus: conn.onboarding_status || 'not_connected',
            sender: conn.whatsapp_sender?.startsWith('pending:') ? null : conn.whatsapp_sender,
            phoneDisplay: conn.phone_display,
            displayName: conn.display_name,
            error: conn.onboarding_error,
            connectedAt: conn.connected_at,
            updatedAt: conn.updated_at,
          }
        : null,
    });
  } catch (e: any) {
    console.error('[onboarding/status]', e?.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

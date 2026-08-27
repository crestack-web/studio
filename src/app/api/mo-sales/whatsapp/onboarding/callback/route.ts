import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../../_auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { shareWabaWithInfobip } from '@/lib/infobip/embedded-signup';
import { normalizePhone } from '@/lib/infobip/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Process Embedded Signup completion from the authenticated merchant session.
 * Client may pass WABA / phone identifiers returned by Meta JS SDK; ownership is
 * bound to the authenticated business via assertBusinessAccess + session row.
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

    const event = String(body.event || 'FINISH').toUpperCase();
    if (event === 'CANCEL' || event === 'CANCELLED') {
      const admin = getSupabaseAdmin();
      await admin
        .from('whatsapp_connections')
        .update({
          onboarding_status: 'failed',
          onboarding_error: 'User cancelled Meta Embedded Signup',
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)
        .eq('provider', 'infobip')
        .eq('onboarding_status', 'onboarding');
      console.log(JSON.stringify({ event: 'onboarding_failed', businessId, reason: 'user_cancelled' }));
      return NextResponse.json({ ok: true, status: 'cancelled' });
    }

    const wabaId = String(body.wabaId || body.businessAccountId || '').trim();
    const phoneNumberId = String(body.phoneNumberId || '').trim() || null;
    const metaBusinessId = String(body.metaBusinessId || body.businessIdMeta || '').trim() || null;
    const displayPhone = String(body.displayPhoneNumber || body.phoneNumber || '').trim();
    const phoneDigits = normalizePhone(displayPhone);

    if (!wabaId) {
      return NextResponse.json(
        { error: 'wabaId required from Embedded Signup result' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Sender uniqueness: active sender cannot belong to another business
    if (phoneDigits) {
      const { data: conflict } = await admin
        .from('whatsapp_connections')
        .select('id, business_id, status')
        .eq('provider', 'infobip')
        .eq('whatsapp_sender', phoneDigits)
        .neq('business_id', businessId)
        .maybeSingle();
      if (conflict && conflict.status === 'active') {
        return NextResponse.json(
          {
            error: 'number_belongs_to_another_business',
            message: 'This WhatsApp number is already connected to another Busmo business.',
          },
          { status: 409 }
        );
      }
    }

    const share = await shareWabaWithInfobip(wabaId);
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from('whatsapp_connections')
      .select('id, metadata')
      .eq('business_id', businessId)
      .eq('provider', 'infobip')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const meta = {
      ...((existing?.metadata as object) || {}),
      flow: 'meta_embedded_signup',
      last_callback_at: now,
      share_ok: share.ok,
      share_error: share.error || null,
    };

    const patch: Record<string, unknown> = {
      waba_id: wabaId,
      meta_business_id: metaBusinessId,
      phone_number_id: phoneNumberId,
      phone_display: displayPhone || null,
      metadata: meta,
      updated_at: now,
      onboarding_error: share.ok ? null : share.error || 'Infobip WABA share failed',
    };

    if (phoneDigits) {
      patch.whatsapp_sender = phoneDigits;
    }

    if (share.ok) {
      // Sender may still be provisioning on Infobip — do not claim active until confirmed
      patch.status = phoneDigits ? 'pending' : 'pending';
      patch.onboarding_status = phoneDigits ? 'sender_registration_pending' : 'sender_registration_pending';
    } else {
      patch.status = 'failed';
      patch.onboarding_status = 'failed';
    }

    if (existing) {
      await admin.from('whatsapp_connections').update(patch).eq('id', existing.id);
    } else {
      await admin.from('whatsapp_connections').insert({
        id: crypto.randomUUID(),
        business_id: businessId,
        provider: 'infobip',
        whatsapp_sender: phoneDigits || `pending:${businessId}:${crypto.randomUUID()}`,
        ...patch,
      });
    }

    console.log(
      JSON.stringify({
        event: share.ok ? 'onboarding_pending' : 'onboarding_failed',
        businessId,
        wabaIdSuffix: wabaId.slice(-6),
        shareOk: share.ok,
      })
    );

    return NextResponse.json({
      ok: share.ok,
      status: share.ok ? 'sender_registration_pending' : 'failed',
      error: share.ok ? null : share.error,
      message: share.ok
        ? 'WhatsApp registration submitted to Infobip. You will see Connected when the sender is ready.'
        : share.error || 'Registration failed',
    });
  } catch (e: any) {
    console.error('[onboarding/callback]', e?.message);
    return NextResponse.json({ error: 'Callback failed' }, { status: 500 });
  }
}

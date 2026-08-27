import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getAuthUser, assertBusinessAccess } from '../_auth';
import { normalizePhone } from '@/lib/infobip/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId as string;
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const admin = getSupabaseAdmin();

    if (body.action === 'request_connect') {
      const raw = String(body.whatsappNumber || '').trim();
      const sender = normalizePhone(raw);
      if (!sender || sender.length < 8) {
        return NextResponse.json({ error: 'Enter a valid WhatsApp number with country code' }, { status: 400 });
      }

      const { data: existing } = await admin
        .from('whatsapp_connections')
        .select('id, metadata, status')
        .eq('business_id', businessId)
        .eq('provider', 'infobip')
        .maybeSingle();

      const meta = {
        ...((existing?.metadata as object) || {}),
        requested_by: user.id,
        requested_at: new Date().toISOString(),
      };

      if (existing) {
        await admin
          .from('whatsapp_connections')
          .update({
            whatsapp_sender: sender,
            status: existing.status === 'active' ? 'active' : 'pending',
            metadata: meta,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await admin.from('whatsapp_connections').insert({
          id: crypto.randomUUID(),
          business_id: businessId,
          provider: 'infobip',
          whatsapp_sender: sender,
          status: 'pending',
          metadata: meta,
        });
      }

      return NextResponse.json({
        ok: true,
        status: 'pending',
        message:
          'We received your WhatsApp number. Busmo will finish connecting it shortly. You will see Connected when it is live.',
      });
    }

    const { data: conn } = await admin
      .from('whatsapp_connections')
      .select('id, metadata, status')
      .eq('business_id', businessId)
      .eq('provider', 'infobip')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conn) {
      return NextResponse.json({ error: 'Connect WhatsApp first' }, { status: 400 });
    }

    const prev = (conn.metadata as Record<string, unknown>) || {};
    const next = { ...prev };

    if (typeof body.moEnabled === 'boolean') next.mo_enabled = body.moEnabled;
    if (body.personality) next.personality = String(body.personality).slice(0, 32);
    if (body.maxDiscountPct !== undefined) {
      const n = Math.max(0, Math.min(100, Number(body.maxDiscountPct) || 0));
      next.max_discount_pct = n;
    }
    if (typeof body.allowNegotiate === 'boolean') next.allow_negotiate = body.allowNegotiate;
    if (typeof body.humanHandoff === 'boolean') next.human_handoff = body.humanHandoff;
    if (body.language) next.language = String(body.language).slice(0, 16);

    await admin
      .from('whatsapp_connections')
      .update({ metadata: next, updated_at: new Date().toISOString() })
      .eq('id', conn.id);

    return NextResponse.json({ ok: true, settings: next });
  } catch (e: any) {
    console.error('[mo-sales/settings]', e?.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

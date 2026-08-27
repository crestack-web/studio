/**
 * Development-only: replay an Infobip-shaped inbound payload through the
 * same webhook handler without sending a real WhatsApp message.
 *
 * POST /api/mo-sales/test/replay-infobip-webhook
 * Body: full Infobip results[] payload (or a single result object)
 *
 * Guarded by NODE_ENV !== 'production' OR ALLOW_INFOBIP_REPLAY=1.
 * Never exposes API keys. Phone numbers in response are suffix-only.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function allowed(): boolean {
  if (process.env.ALLOW_INFOBIP_REPLAY === '1') return true;
  if (process.env.NODE_ENV === 'production') return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!allowed()) {
    return NextResponse.json({ error: 'Replay disabled in production' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Forward to the real webhook handler internally so diagnostics and MO path run.
  const origin = req.nextUrl.origin;
  const webhookUrl = `${origin}/api/webhooks/infobip/whatsapp`;
  const secret = process.env.INFOBIP_WEBHOOK_SECRET?.trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (secret) {
    headers['x-webhook-secret'] = secret;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      webhookResponse: data,
      note: 'Check server logs for whatsapp_phone_routing_diagnostic and infobip_inbound_payload_structure',
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: e?.message || 'replay_failed',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'infobip-webhook-replay',
    enabled: allowed(),
    usage: 'POST an Infobip results[] body to replay inbound without a real WhatsApp send',
  });
}

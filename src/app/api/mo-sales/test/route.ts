import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../_auth';
import { generateSalesReply } from '@/lib/services/whatsapp/mo-sales-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Preview MO reply for the authenticated merchant's business.
 * Does NOT send WhatsApp messages.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const message = String(body.message || '').trim().slice(0, 1500);

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!message) return NextResponse.json({ error: 'Enter a customer question to test' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const result = await generateSalesReply({
      businessId,
      customerMessage: message,
      history: [],
    });

    return NextResponse.json({
      ok: result.ok,
      reply: result.reply,
      error: result.error || null,
      preview: true,
      note: 'This is a preview only. No WhatsApp message was sent.',
    });
  } catch (e: any) {
    console.error('[mo-sales/test]', e?.message);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}

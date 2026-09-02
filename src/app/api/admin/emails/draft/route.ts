import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { getMistralClient } from '@/ai/mistral';
import { wrapBusmoEmailHtml } from '@/lib/admin/wrap-admin-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const brief = String(body.brief || '').trim();
    const audience = String(body.audience || 'Busmo business owners').trim();
    if (!brief || brief.length < 10) {
      return NextResponse.json({ error: 'Provide a brief (at least 10 characters)' }, { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'MISTRAL_API_KEY not configured' }, { status: 503 });
    }

    const mistral = getMistralClient();
    const result = await mistral.chat.complete({
      model: 'mistral-large-latest',
      temperature: 0.4,
      responseFormat: { type: 'json_object' } as any,
      messages: [
        {
          role: 'system',
          content: `You write product emails for Busmo, an AI business management product for African SMEs.
Return JSON only: {"subject":"...","previewText":"...","bodyHtml":"..."}.
bodyHtml must be simple HTML fragments only (p, strong, ul, li, a) — no full document, no style tags, no scripts.
Tone: clear, warm, professional, short paragraphs. No emoji spam. No inventing features that were not requested.`,
        },
        {
          role: 'user',
          content: `Audience: ${audience}\n\nWrite an email about:\n${brief}`,
        },
      ],
    });

    const raw = String((result as any)?.choices?.[0]?.message?.content || '').trim();
    let parsed: { subject?: string; previewText?: string; bodyHtml?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'MO returned invalid JSON', raw: raw.slice(0, 500) }, { status: 502 });
    }

    const subject = String(parsed.subject || 'Message from Busmo').slice(0, 180);
    const bodyHtml = String(parsed.bodyHtml || '<p></p>');
    const html = wrapBusmoEmailHtml({
      title: subject,
      subtitle: String(parsed.previewText || 'A message from Busmo'),
      bodyHtml,
    });

    return NextResponse.json({
      subject,
      previewText: parsed.previewText || '',
      bodyHtml,
      html,
    });
  } catch (e: any) {
    console.error('[admin/emails/draft]', e);
    return NextResponse.json({ error: e?.message || 'Draft failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ROLLOUT_DATE = '15 September 2026';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io').replace(/\/$/, '');
const LOGO = `${APP_URL}/email-logo.png`;

function buildHtml(name: string) {
  const first = (name || 'there').split(' ')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>MO Sales is coming to Busmo</title></head>
<body style="margin:0;padding:0;background:#f4f2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2f8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,16,56,0.080.08);">
<tr><td style="background:linear-gradient(135deg,#6B3FE7 0%,#4B27B0 100%);padding:32px 28px;text-align:center;">
<img src="${LOGO}" alt="Busmo" width="64" height="64" style="display:inline-block;border:0;border-radius:14px;background:#fff;padding:6px;" />
<h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">Meet MO Sales</h1>
<p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.45;">
Your AI salesperson on WhatsApp — rolling out to selected businesses on <strong>${ROLLOUT_DATE}</strong>
</p>
</td></tr>
<tr><td style="padding:28px 28px 8px;">
<p style="margin:0 0 14px;font-size:16px;line-height:1.5;">Hi ${first},</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
We&rsquo;re excited to introduce <strong>MO Sales</strong> — Busmo&rsquo;s AI sales agent that works on <strong>WhatsApp</strong> with your full business data, so customers get fast, accurate replies and you keep selling even when the shop is busy.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3550;">
Starting <strong>${ROLLOUT_DATE}</strong>, we will enable MO Sales for <strong>selected businesses</strong> first, then expand as we learn what drives consistent sales for owners like you.
</p>

<h2 style="margin:0 0 12px;font-size:17px;color:#1a1523;">What MO Sales can do</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
<tr><td style="padding:14px 16px;border:1px solid #ece8f5;border-radius:12px;background:#faf9fd;">
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Reply to customers on WhatsApp at scale</strong><br/>MO answers product questions, prices, and availability using your live Busmo catalogue — not guesswork.</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Accept orders in the chat</strong><br/>Customers can place orders through the conversation. MO follows your products, stock, and business rules.</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Send payment links</strong><br/>When it&rsquo;s time to pay, MO can share a payment link so checkout stays simple on WhatsApp.</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Full business context</strong><br/>MO works with your real inventory, prices, and sales context in Busmo so answers stay consistent and trustworthy.</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Inbox, takeover &amp; control</strong><br/>See every conversation in <strong>MO Sales</strong>, take over any chat yourself, hand it back to MO, and turn MO on or off when you want.</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#3d3550;"><strong style="color:#6B3FE7;">Built for consistent sales</strong><br/>Faster responses, fewer missed chats, and a clearer path from question → order → payment — without hiring another full-time salesperson.</p>
</td></tr>
</table>

<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
You don&rsquo;t need to do anything right now. If your business is in the first group, we&rsquo;ll guide you inside Busmo when it&rsquo;s time to connect WhatsApp and go live.
</p>
<div style="text-align:center;margin:0 0 24px;">
<a href="${APP_URL}" style="display:inline-block;background:#6B3FE7;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">Open Busmo</a>
</div>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#3d3550;">Questions? Reply to this email or write to <a href="mailto:support@busmo.io" style="color:#6B3FE7;">support@busmo.io</a>.</p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#3d3550;">— The Busmo team</p>
</td></tr>
<tr><td style="padding:18px 28px 28px;border-top:1px solid #ece8f5;">
<p style="margin:0;font-size:11px;line-height:1.45;color:#8a8498;text-align:center;">
You&rsquo;re receiving this because you have a Busmo account.<br/>Busmo · AI-powered business management for African SMEs
</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const secret = process.env.MO_SALES_BROADCAST_SECRET || '';
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!secret || !token || token !== secret) {
    return unauthorized();
  }

  let body: { mode?: string; limit?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const mode = body.mode === 'all' ? 'all' : 'test';

  const subject = `MO Sales is coming — selected businesses go live ${ROLLOUT_DATE}`;

  if (mode === 'test') {
    const result = await sendTransactionalEmail({
      to: [{ email: 'crestack@gmail.com', name: 'Crestack' }],
      subject,
      htmlContent: buildHtml('Crestack'),
    });
    return NextResponse.json({
      ok: true,
      mode: 'test',
      sent: 1,
      messageId: result.id,
      to: ['crestack@gmail.com'],
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const recipients: { email: string; name: string }[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('email, name, full_name, display_name')
      .not('email', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) {
      return NextResponse.json(
        { error: 'Failed to load users', details: error.message },
        { status: 500 }
      );
    }
    if (!data?.length) break;
    for (const row of data) {
      const email = String((row as any).email || '')
        .trim()
        .toLowerCase();
      if (!email || !email.includes('@')) continue;
      const name =
        (row as any).name ||
        (row as any).full_name ||
        (row as any).display_name ||
        email.split('@')[0];
      recipients.push({ email, name });
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const seen = new Set<string>();
  const unique = recipients.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });

  const limit =
    typeof body.limit === 'number' && body.limit > 0
      ? Math.min(body.limit, unique.length)
      : unique.length;

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < limit; i++) {
    const r = unique[i];
    try {
      await sendTransactionalEmail({
        to: [{ email: r.email, name: r.name }],
        subject,
        htmlContent: buildHtml(r.name),
      });
      sent += 1;
      // gentle pacing for provider limits
      await new Promise((res) => setTimeout(res, 350));
    } catch (e: any) {
      failed += 1;
      if (errors.length < 10) {
        errors.push(`${r.email}: ${e?.message || 'fail'}`);
      }
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    mode: 'all',
    totalRecipients: unique.length,
    attempted: limit,
    sent,
    failed,
    errors,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'mo-sales-broadcast',
    modes: ['test', 'all'],
  });
}

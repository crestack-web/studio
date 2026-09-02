import { NextRequest, NextResponse } from 'next/server';
import { sendTransactionalEmail } from '@/services/email/brevo-service';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ROLLOUT_DATE = '15 September 2026';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io').replace(/\/$/, '');
const LOGO = `${APP_URL}/email-logo.png`;
const MO_ICON = `${APP_URL}/mo-thinking.svg`;

function buildHtml(name: string) {
  const first = (name || 'there').split(' ')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>MO Sales is coming to Busmo</title>
</head>
<body style="margin:0;padding:0;background:#f4f2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2f8;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,16,56,0.08);">
<tr>
<td style="background:linear-gradient(135deg,#6B3FE7 0%,#4B27B0 100%);padding:32px 28px;text-align:center;">
<img src="${MO_ICON}" alt="MO" width="72" height="72" style="display:block;margin:0 auto 8px;width:72px;height:72px;border:0;border-radius:50%;background:#ffffff;padding:4px;box-shadow:0 4px 14px rgba(0,0,0,0.18);" />
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Powered by MO</p>
            <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">Meet MO Sales</h1>
<p style="margin:0;font-size:15px;color:rgba(255,255,255,0.92);line-height:1.45;">
Your AI salesperson on WhatsApp — ready to reply, take orders, and share payment links at scale
</p>
<p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">
Selected businesses go live <strong>${ROLLOUT_DATE}</strong>
</p>
</td>
</tr>
<tr>
<td style="padding:28px 28px 8px;">
<p style="margin:0 0 14px;font-size:16px;line-height:1.5;">Hi ${first},</p>
<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
We&rsquo;re introducing <strong>MO Sales</strong> — Busmo&rsquo;s AI sales agent on <strong>WhatsApp</strong>. MO uses your <strong>full business data</strong> (products, prices, stock, and how you sell) so customers get accurate answers and you can keep sales moving even when you&rsquo;re busy.
</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3550;">
From <strong>${ROLLOUT_DATE}</strong>, we will enable MO Sales for <strong>selected businesses</strong> first, then expand as we learn what drives consistent sales for owners like you.
</p>

<h2 style="margin:0 0 12px;font-size:17px;color:#1a1523;">What MO Sales can do</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
<tr><td style="padding:14px 16px;border:1px solid #ece8f5;border-radius:12px;background:#faf9fd;">
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Reply to customers on WhatsApp</strong><br/>
When a customer messages your business number, MO answers quickly — product questions, availability, prices, and next steps — so no enquiry is left hanging.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Grounded in your real Busmo data</strong><br/>
MO works with your catalogue, stock, and business context in Busmo. It sells what you actually offer, with the information you already manage in the app.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Accept orders in the conversation</strong><br/>
Customers can move from “Do you have this?” to placing an order in the same WhatsApp chat, so interest turns into sales without long back-and-forth.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Send payment links</strong><br/>
MO can share payment links in WhatsApp so customers pay faster, with fewer abandoned chats and less manual follow-up from you.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Consistent sales responses at scale</strong><br/>
Whether it is one customer or many at once, MO keeps a steady, professional response — helpful, on-brand, and available when you cannot reply yourself.
</p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Inbox, human takeover, and control</strong><br/>
See conversations in <strong>MO Sales</strong> inside Busmo. Take over any chat yourself, hand it back to MO, turn MO on or off, and guide how it sells.
</p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#3d3550;">
<strong style="color:#6B3FE7;">Built for growing businesses</strong><br/>
Designed for owners who want more WhatsApp sales without hiring another full-time salesperson — with you always in control.
</p>
</td></tr>
</table>

<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
You do not need to do anything right now. If your business is in the first group, we will guide you inside Busmo when it is time to connect WhatsApp and go live.
</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3d3550;">
Our goal is simple: help you reply faster, take more orders, collect payment, and grow sales on WhatsApp — with MO working from your real business data.
</p>
<div style="text-align:center;margin:0 0 24px;">
<a href="${APP_URL}" style="display:inline-block;background:#6B3FE7;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">Open Busmo</a>
</div>
<p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#3d3550;">Questions? Reply to this email or write to <a href="mailto:support@busmo.io" style="color:#6B3FE7;">support@busmo.io</a>.</p>
<p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#3d3550;">— The Busmo team</p>
</td>
</tr>
<tr>
<td style="padding:18px 28px 28px;border-top:1px solid #ece8f5;">
<p style="margin:0;font-size:11px;line-height:1.45;color:#8a8498;text-align:center;">
You&rsquo;re receiving this because you have a Busmo account.<br/>Busmo · AI-powered business management for African SMEs
</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
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

  const subject = `MO Sales on WhatsApp: orders, payment links & replies at scale — live ${ROLLOUT_DATE}`;

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

import { NextRequest, NextResponse } from 'next/server';

interface NewOrderBody {
  merchantEmail: string;
  orderNumber: string;
  customerName: string;
  total: number;
  storeName: string;
}

function fmt(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function buildHtml(body: NewOrderBody): string {
  const { orderNumber, customerName, total, storeName } = body;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://busmo.io'}/sell`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F9FF;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(14,165,233,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0EA5E9 0%,#6366F1 100%);padding:32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">💰</div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">New Order Received!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${storeName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="font-size:15px;color:#3D5A7A;margin:0 0 24px;line-height:1.6;">
              You have a new paid order. Here's the summary:
            </p>

            <!-- Summary cards -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E0EFFA;border-radius:12px;overflow:hidden;margin-bottom:24px;">
              <tr style="background:#F8FBFF;">
                <td style="padding:14px 20px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;font-weight:600;border-bottom:1px solid #E0EFFA;">Order Number</td>
                <td style="padding:14px 20px;font-size:15px;font-weight:700;color:#0C1A2E;text-align:right;border-bottom:1px solid #E0EFFA;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;font-weight:600;border-bottom:1px solid #E0EFFA;">Customer</td>
                <td style="padding:14px 20px;font-size:15px;color:#0C1A2E;text-align:right;border-bottom:1px solid #E0EFFA;">${customerName}</td>
              </tr>
              <tr style="background:#F0F9FF;">
                <td style="padding:14px 20px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;font-weight:600;">Amount Paid</td>
                <td style="padding:14px 20px;font-size:18px;font-weight:800;color:#0EA5E9;text-align:right;">${fmt(total)}</td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${dashboardUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(14,165,233,0.30);">
                View in MO Sell →
              </a>
            </div>

            <p style="font-size:13px;color:#8AAABF;margin:20px 0 0;text-align:center;line-height:1.5;">
              Open your MO Sell dashboard to process the order and update its status.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #E0EFFA;text-align:center;">
            <p style="font-size:12px;color:#8AAABF;margin:0;">
              Powered by <strong>MO Sell</strong> · Built for African commerce
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  let body: NewOrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { merchantEmail, orderNumber, customerName, total, storeName } = body;
  if (!merchantEmail || !orderNumber || !customerName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[email/new-order] BREVO_API_KEY not set');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'MO Sell',
          email: process.env.BREVO_FROM_EMAIL || 'noreply@busmo.io',
        },
        to: [{ email: merchantEmail }],
        subject: `💰 New Order ${orderNumber} — ${fmt(total)} · ${storeName}`,
        htmlContent: buildHtml(body),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[email/new-order] Brevo error:', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/new-order] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

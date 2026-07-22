import { NextRequest, NextResponse } from 'next/server';

interface LineItem {
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface OrderConfirmationBody {
  customerEmail: string;
  orderNumber: string;
  lineItems: LineItem[];
  total: number;
  storeName: string;
  orderUrl: string;
}

function fmt(n: number) {
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function buildHtml(body: OrderConfirmationBody): string {
  const { orderNumber, lineItems, total, storeName, orderUrl } = body;

  const itemRows = lineItems.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E0EFFA;font-size:14px;color:#0C1A2E;">
        ${item.displayName}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #E0EFFA;font-size:14px;color:#3D5A7A;text-align:center;">
        ×${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #E0EFFA;font-size:14px;color:#0C1A2E;text-align:right;font-weight:600;">
        ${fmt(item.lineTotal)}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F9FF;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(14,165,233,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0EA5E9 0%,#6366F1 100%);padding:36px 32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">🛍️</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Order Confirmed!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${storeName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="font-size:15px;color:#3D5A7A;margin:0 0 24px;">
              Your order <strong style="color:#0C1A2E;">${orderNumber}</strong> has been received and payment confirmed.
              We'll update you when it's on its way.
            </p>

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr>
                  <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;padding-bottom:8px;border-bottom:2px solid #E0EFFA;">Item</th>
                  <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;padding-bottom:8px;border-bottom:2px solid #E0EFFA;">Qty</th>
                  <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#8AAABF;padding-bottom:8px;border-bottom:2px solid #E0EFFA;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>

            <!-- Total -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td style="font-size:15px;font-weight:700;color:#0C1A2E;padding:12px 0;">Order Total</td>
                <td style="font-size:18px;font-weight:800;color:#0EA5E9;text-align:right;padding:12px 0;">${fmt(total)}</td>
              </tr>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-top:28px;">
              <a href="${orderUrl}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#0EA5E9,#6366F1);color:#fff;font-weight:700;font-size:14px;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(14,165,233,0.30);">
                Track Your Order →
              </a>
            </div>
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
  let body: OrderConfirmationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { customerEmail, orderNumber, lineItems, total, storeName, orderUrl } = body;
  if (!customerEmail || !orderNumber || !lineItems?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('[email/order-confirmation] BREVO_API_KEY not set');
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
          name: storeName || 'MO Sell',
          email: process.env.BREVO_FROM_EMAIL || 'noreply@busmo.io',
        },
        to: [{ email: customerEmail }],
        subject: `Order Confirmed — ${orderNumber} · ${storeName}`,
        htmlContent: buildHtml({ customerEmail, orderNumber, lineItems, total, storeName, orderUrl }),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[email/order-confirmation] Brevo error:', err);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/order-confirmation] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

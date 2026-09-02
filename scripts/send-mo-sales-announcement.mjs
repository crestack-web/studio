/**
 * MO Sales rollout announcement
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/send-mo-sales-announcement.mjs --test
 *   RESEND_API_KEY=re_xxx node scripts/send-mo-sales-announcement.mjs --all
 *
 * --test  → only crestack@gmail.com (default if neither flag is set)
 * --all   → every user with an email in Supabase `users` table
 *
 * Requires:
 *   RESEND_API_KEY
 *   EMAIL_FROM or RESEND_FROM (optional, default Busmo <support@busmo.io>)
 *   For --all: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM =
  process.env.EMAIL_FROM ||
  process.env.RESEND_FROM ||
  'Busmo <support@busmo.io>';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io').replace(
  /\/$/,
  ''
);
const LOGO = `${APP_URL}/email-logo.png`;
const TEST_EMAIL = 'crestack@gmail.com';
const ROLLOUT_DATE = '15 September 2026';

const args = new Set(process.argv.slice(2));
const sendAll = args.has('--all');
const sendTest = args.has('--test') || !sendAll;

function buildHtml({ name }) {
  const first = (name || 'there').split(' ')[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MO Sales is coming to Busmo</title>
</head>
<body style="margin:0;padding:0;background:#f4f2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2f8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,16,56,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#6B3FE7 0%,#4B27B0 100%);padding:32px 28px;text-align:center;">
              <img src="${LOGO}" alt="Busmo" width="64" height="64" style="display:inline-block;border:0;border-radius:14px;background:#fff;padding:6px;" />
              <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">
                Meet MO Sales
              </h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.45;">
                Your AI salesperson on WhatsApp — rolling out to selected businesses on <strong>${ROLLOUT_DATE}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.5;">Hi ${first},</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
                We’re excited to introduce <strong>MO Sales</strong> — a new Busmo feature that lets MO answer customers on
                <strong>WhatsApp</strong>, using your real products and prices, so you can sell even when you’re busy in the shop.
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3550;">
                Starting <strong>${ROLLOUT_DATE}</strong>, we will begin enabling MO Sales for
                <strong>selected businesses</strong> first (a controlled rollout), then expand as we learn what works best for owners like you.
              </p>

              <h2 style="margin:0 0 12px;font-size:17px;color:#1a1523;">What MO Sales can do</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:12px 14px;border:1px solid #ece8f5;border-radius:12px;background:#faf9fd;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Reply on WhatsApp at scale</strong><br />
                      MO answers with your live catalogue, prices, and availability.
                    </p>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Accept orders in chat</strong><br />
                      Customers can place orders in the conversation using your real stock rules.
                    </p>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Send payment links</strong><br />
                      MO can share a payment link so checkout stays simple on WhatsApp.
                    </p>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Full business context</strong><br />
                      Inventory, prices, and sales context from Busmo — consistent, trustworthy replies.
                    </p>
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Inbox, takeover &amp; control</strong><br />
                      See chats in MO Sales, take over, hand back, turn MO on or off.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.5;color:#3d3550;">
                      <strong style="color:#6B3FE7;">• Consistent sales</strong><br />
                      Faster responses and a clearer path from question → order → payment.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
                You don’t need to do anything right now. If your business is part of the first group, we’ll guide you inside Busmo when it’s time to connect WhatsApp and go live.
              </p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3d3550;">
                Our goal is simple: help you sell more through WhatsApp, without hiring another full-time salesperson.
              </p>

              <div style="text-align:center;margin:0 0 24px;">
                <a href="${APP_URL}" style="display:inline-block;background:#6B3FE7;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">
                  Open Busmo
                </a>
              </div>

              <p style="margin:0 0 6px;font-size:14px;line-height:1.5;color:#3d3550;">
                Questions? Reply to this email or write to
                <a href="mailto:support@busmo.io" style="color:#6B3FE7;">support@busmo.io</a>.
              </p>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.5;color:#3d3550;">
                — The Busmo team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 28px;border-top:1px solid #ece8f5;">
              <p style="margin:0;font-size:11px;line-height:1.45;color:#8a8498;text-align:center;">
                You’re receiving this because you have a Busmo account.<br />
                Busmo · AI-powered business management for African SMEs
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendOne({ email, name }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: `MO Sales on WhatsApp: orders, payment links & replies at scale — live ${ROLLOUT_DATE}`,
      html: buildHtml({ name }),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || 'send failed';
    throw new Error(`${email}: ${msg}`);
  }
  return data;
}

async function loadAllRecipients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'For --all, set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  const recipients = [];
  let from = 0;
  const page = 1000;
  while (true) {
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/users?select=email,name,full_name,display_name&email=not.is.null&offset=${from}&limit=${page}`;
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'count=exact',
      },
    });
    if (!res.ok) {
      throw new Error(`Supabase users fetch failed: ${res.status} ${await res.text()}`);
    }
    const rows = await res.json();
    for (const row of rows) {
      const email = String(row.email || '')
        .trim()
        .toLowerCase();
      if (!email || !email.includes('@')) continue;
      const name =
        row.name || row.full_name || row.display_name || email.split('@')[0];
      recipients.push({ email, name });
    }
    if (rows.length < page) break;
    from += page;
  }
  // de-dupe
  const seen = new Set();
  return recipients.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY. Export it, then re-run.');
    process.exit(1);
  }

  let list;
  if (sendAll) {
    console.log('Loading all users from Supabase…');
    list = await loadAllRecipients();
    console.log(`Found ${list.length} unique emails.`);
  } else {
    list = [{ email: TEST_EMAIL, name: 'Crestack' }];
    console.log(`TEST MODE — sending only to ${TEST_EMAIL}`);
  }

  let ok = 0;
  let fail = 0;
  for (const r of list) {
    try {
      const result = await sendOne(r);
      ok += 1;
      console.log(`OK ${r.email} id=${result.id || 'n/a'}`);
      // gentle rate limit for bulk
      if (sendAll) await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      fail += 1;
      console.error(`FAIL ${e.message || e}`);
    }
  }
  console.log(`Done. sent=${ok} failed=${fail}`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
const MO_ICON = `${APP_URL}/mo-thinking.svg`;
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
              <img src="${MO_ICON}" alt="MO" width="72" height="72" style="display:block;margin:0 auto 8px;width:72px;height:72px;border:0;border-radius:50%;background:#ffffff;padding:4px;box-shadow:0 4px 14px rgba(0,0,0,0.18);" />
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Powered by MO</p>
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
                We&rsquo;re introducing <strong>MO Sales</strong> — MO working as a full sales agent on
                <strong>WhatsApp</strong>, grounded in your real Busmo business data, so you can answer customers
                and close sales at scale even when you&rsquo;re busy.
              </p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3d3550;">
                Starting <strong>${ROLLOUT_DATE}</strong>, we will enable MO Sales for
                <strong>selected businesses</strong> first, then expand as we learn what works best for owners like you.
              </p>

              <h2 style="margin:0 0 12px;font-size:17px;color:#1a1523;">What MO Sales can do</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;border:1px solid #ece8f5;border-radius:12px;background:#faf9fd;">
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Reply to customers on WhatsApp, 24/7</strong><br />
                      Customers message your business number. MO responds quickly and naturally — product questions, prices, availability, and follow-ups.
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Full business data context</strong><br />
                      MO uses your live Busmo catalogue, stock, prices, and sales history — so answers stay accurate to <em>your</em> business, not generic AI guesses.
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Accept orders</strong><br />
                      When a customer is ready to buy, MO can take the order details and move the sale forward inside the conversation.
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Send payment links</strong><br />
                      MO can share payment links so customers can pay without leaving WhatsApp — fewer abandoned chats, more completed sales.
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Consistent sales responses at scale</strong><br />
                      Same quality of reply for the 1st customer and the 100th — no missed messages during rush hours, market days, or after close.
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">Inbox in your Busmo dashboard</strong><br />
                      See every conversation under <strong>MO Sales</strong>. Take over any chat yourself anytime, then hand it back to MO when you&rsquo;re ready.
                    </p>
                    <p style="margin:0;font-size:14px;line-height:1.55;color:#3d3550;">
                      <strong style="color:#6B3FE7;">You stay in control</strong><br />
                      Turn MO on or off, guide how it sells, and keep ownership of every customer relationship.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">
                You don&rsquo;t need to do anything right now. If your business is in the first group, we&rsquo;ll guide you inside Busmo when it&rsquo;s time to connect WhatsApp and go live.
              </p>
              <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#3d3550;">
                Our goal is simple: help you make more consistent sales through WhatsApp — with MO handling the volume, and you keeping control.
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
                You&rsquo;re receiving this because you have a Busmo account.<br />
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
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/users?select=email,full_name&email=not.is.null&offset=${from}&limit=${page}`;
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
        row.full_name || email.split('@')[0];
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

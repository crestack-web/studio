/**
 * Send password reset magic links to all users who have never logged in.
 * Run: npx tsx scripts/send-reset-links.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env from .env.local
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendKey = process.env.RESEND_API_KEY!;
const from = process.env.EMAIL_FROM || process.env.RESEND_FROM || 'Busmo <support@busmo.io>';

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function buildResetHtml(name: string, link: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;background:#f4f4f4">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6B3FE7,#9B6DFF);padding:32px;text-align:center;color:#fff">
    <h1 style="margin:0">Reset Your Password</h1>
  </div>
  <div style="padding:32px">
    <p>Hi ${name},</p>
    <p>Busmo now uses a new login system. Please set a new password to access your account.</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${link}" style="display:inline-block;padding:14px 32px;background:#6B3FE7;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Set New Password</a>
    </p>
    <p style="color:#888;font-size:13px">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    <p>Best regards,<br>The Busmo Team</p>
  </div>
</div>
</body></html>`;
}

async function sendEmail(email: string, name: string, link: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Set your new Busmo password',
      html: buildResetHtml(name, link),
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: (data as any)?.error || (data as any)?.message };
}

async function main() {
  let page = 1;
  const neverLoggedIn: { id: string; email: string; name: string }[] = [];

  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (!data.users.length) break;
    for (const u of data.users) {
      if (!u.last_sign_in_at) {
        neverLoggedIn.push({
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.full_name || u.user_metadata?.name || 'there',
        });
      }
    }
    if (data.users.length < 100) break;
    page++;
  }

  console.log(`Sending reset links to ${neverLoggedIn.length} users who never logged in...`);

  let sent = 0;
  let errors = 0;

  for (const u of neverLoggedIn) {
    try {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: u.email,
      });
      if (linkErr) {
        console.log(`LINK_ERR: ${u.email} - ${linkErr.message}`);
        errors++;
        continue;
      }
      const actionLink = linkData?.properties?.action_link || 'https://www.busmo.io/login';
      const r = await sendEmail(u.email, u.name, actionLink);
      if (r.ok) {
        console.log(`SENT: ${u.email}`);
        sent++;
      } else {
        console.log(`SEND_ERR: ${u.email} - ${r.error}`);
        errors++;
      }
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 200));
    } catch (e: any) {
      console.log(`ERR: ${u.email} - ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone. Sent: ${sent}, Errors: ${errors}`);
}

main();

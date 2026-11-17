/**
 * Welcome emails for Busmo industry solutions.
 * Same transactional pipeline and visual language as Busmo Business owner emails.
 */
import { sendTransactionalEmail } from './brevo-service';
import { getIndustryConfig } from '@/lib/industries/config';

export type SolutionWelcomeParams = {
  email: string;
  name?: string;
  businessName?: string;
  productEdition: string;
  loginPath?: string;
};

const SOLUTION_FEATURES: Record<string, { core: string[]; tip: string }> = {
  hospitality: {
    core: ['Rooms & rates', 'Reservations & check-in', 'Housekeeping board', 'Guest folios'],
    tip: 'Start by adding rooms, then take your first reservation from the owner console.',
  },
  healthcare: {
    core: ['Patient registry', 'Appointments queue', 'Visits', 'Clinic billing'],
    tip: 'Add patients first, then open today’s appointment board for reception.',
  },
  professional: {
    core: ['Clients', 'Projects & tasks', 'Time tracking', 'Invoices'],
    tip: 'Create a client and project, then assign the first task to your team.',
  },
  education: {
    core: ['Students', 'Classes', 'Fees & receipts', 'Attendance'],
    tip: 'Add your first class and students, then record a fee from the front office.',
  },
};

function productLabel(edition: string): string {
  try {
    const cfg = getIndustryConfig(edition as any);
    return cfg?.productName || 'Busmo';
  } catch {
    return 'Busmo';
  }
}

function loginHref(edition: string, explicit?: string): string {
  if (explicit) return explicit;
  try {
    const cfg = getIndustryConfig(edition as any);
    return cfg?.loginPath || '/welcome/login';
  } catch {
    return '/welcome/login';
  }
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.busmo.io'
  ).replace(/\/$/, '');
}

/** Shared layout with Busmo Business transactional emails. */
function wrapBusinessEmail(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
  product: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f8; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #0a0a0f; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 24px 16px 40px; }
    .card { background: #fff; border-radius: 16px; border: 1px solid #e8e8f0; overflow: hidden; }
    .head { padding: 20px 24px; border-bottom: 1px solid #e8e8f0; }
    .brand { color: #6B3FE7; font-weight: 800; font-size: 18px; letter-spacing: -0.02em; }
    .body { padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 12px; line-height: 1.25; }
    p { font-size: 15px; line-height: 1.55; color: #333348; margin: 0 0 12px; }
    .feature { background: #f5f3ff; border-radius: 12px; padding: 12px 14px; margin: 10px 0; font-size: 14px; color: #333348; }
    .btn { display: inline-block; background: #6B3FE7; color: #fff !important; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; margin: 16px 0 8px; }
    .foot { padding: 16px 24px 22px; font-size: 12px; color: #8888a0; line-height: 1.5; border-top: 1px solid #e8e8f0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</div>
    <div class="card">
      <div class="head"><span class="brand">${opts.product}</span></div>
      <div class="body">${opts.bodyHtml}</div>
      <div class="foot">You are receiving this because an account was created on ${opts.product}. Busmo helps African organisations run operations in one place.</div>
    </div>
  </div>
</body>
</html>`;
}

/** Immediate welcome after solution signup (same channel as Busmo Business). */
export async function sendSolutionWelcomeEmail(params: SolutionWelcomeParams) {
  const email = String(params.email || '').trim().toLowerCase();
  if (!email) return { skipped: true };

  const edition = String(params.productEdition || '').toLowerCase();
  const product = productLabel(edition);
  const name = (params.name || 'there').trim() || 'there';
  const biz = (params.businessName || 'your organisation').trim();
  const login = loginHref(edition, params.loginPath);
  const loginUrl = login.startsWith('http') ? login : `${appOrigin()}${login}`;
  const features = SOLUTION_FEATURES[edition] || {
    core: ['Owner console', 'Staff desk', 'Ask MO', 'Reports'],
    tip: 'Open your dashboard and complete branding under Settings.',
  };

  const bodyHtml = `
    <h1>Welcome to ${product}</h1>
    <p>Hi ${name},</p>
    <p><strong>${biz}</strong> is ready on ${product} — the same Busmo platform businesses use for daily operations, with tools tailored to your industry.</p>
    <p><strong>What you can do first</strong></p>
    <div class="feature"><strong>Core:</strong> ${features.core.join(' · ')}</div>
    <div class="feature"><strong>Tip:</strong> ${features.tip}</div>
    <p>Ask <strong>MO</strong> inside your workspace anytime — it uses your organisation context, just like Ask MO on Busmo Business.</p>
    <p><a class="btn" href="${loginUrl}">Open ${product}</a></p>
    <p style="font-size:13px;color:#8888a0">If you did not create this account, you can ignore this message.</p>
  `;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `Welcome to ${product} — ${biz}`,
    htmlContent: wrapBusinessEmail({
      title: `Welcome to ${product}`,
      preheader: `${biz} is set up on ${product}. Open your workspace to get started.`,
      bodyHtml,
      product,
    }),
  });
}

/** Fire-and-forget welcome (errors logged, not thrown). */
export function queueSolutionWelcomeEmail(params: SolutionWelcomeParams): void {
  void sendSolutionWelcomeEmail(params).catch((err) => {
    console.error('[solution-welcome]', err);
  });
}

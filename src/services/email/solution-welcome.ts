/**
 * Welcome + first-run emails for Busmo industry solutions
 * (Healthcare, Hospitality, Professional, Education).
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

/** Immediate welcome after solution signup (non-blocking for caller). */
export async function sendSolutionWelcomeEmail(params: SolutionWelcomeParams) {
  const email = String(params.email || '').trim().toLowerCase();
  if (!email) return { skipped: true };

  const product = productLabel(params.productEdition);
  const name = (params.name || 'there').trim() || 'there';
  const biz = (params.businessName || 'your organization').trim();
  const login = loginHref(params.productEdition, params.loginPath);
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.busmo.io';
  const loginUrl = login.startsWith('http') ? login : `${origin.replace(/\/$/, '')}${login}`;

  const html = `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#0A0A0F">
    <div style="padding:20px 0;border-bottom:1px solid #E8E8F0">
      <strong style="color:#6B3FE7;font-size:18px">${product}</strong>
    </div>
    <h1 style="font-size:22px;margin:24px 0 12px">Welcome to ${product}</h1>
    <p style="font-size:15px;line-height:1.55;color:#333348">Hi ${name},</p>
    <p style="font-size:15px;line-height:1.55;color:#333348">
      <strong>${biz}</strong> is set up on ${product}. Confirm your email if you have not already,
      then sign in to start using your workspace.
    </p>
    <p style="margin:28px 0">
      <a href="${loginUrl}" style="display:inline-block;background:#6B3FE7;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700">
        Open ${product}
      </a>
    </p>
    <p style="font-size:13px;color:#8888A0;line-height:1.5">
      If you did not create this account, you can ignore this message.
    </p>
  </div>`;

  return sendTransactionalEmail({
    to: [{ email, name }],
    subject: `Welcome to ${product}`,
    htmlContent: html,
  });
}

/** Fire-and-forget welcome (errors logged, not thrown to caller). */
export function queueSolutionWelcomeEmail(params: SolutionWelcomeParams): void {
  void sendSolutionWelcomeEmail(params).catch((err) => {
    console.error('[solution-welcome]', err);
  });
}

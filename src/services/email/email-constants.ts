/**
 * Shared email constants.
 * Logo must be an absolute HTTPS URL — most clients block data: URIs.
 * Uses the same asset as the welcome page / dashboard header: /email-logo.png
 */

const rawBase =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL ||
  'https://busmo.io';

const normalized = rawBase.startsWith('http') ? rawBase : `https://${rawBase}`;
export const APP_BASE_URL = normalized.replace(/\/$/, '');

/** Absolute URL to the Busmo mark (public/email-logo.png). */
export const BUSMO_LOGO_URL = `${APP_BASE_URL}/email-logo.png`;

/** Back-compat alias used across template modules. */
export const BUSMO_LOGO = BUSMO_LOGO_URL;

export const EMAIL_LOGO_IMG = `<img src="${BUSMO_LOGO_URL}" alt="Busmo" width="80" height="80" style="width:80px;height:80px;display:inline-block;border:0;border-radius:16px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);margin-bottom:16px;" />`;

export function getEmailHeader(title: string, subtitle: string, icon?: string): string {
  const iconHtml = icon
    ? `<div style="font-size:28px;margin-bottom:8px;">${icon}</div>`
    : '';
  return `
  <div style="padding:36px 28px;text-align:center;color:#ffffff;background:linear-gradient(135deg,#6B3FE7 0%,#8B5CF6 100%);">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
      <tr>
        <td align="center" style="text-align:center;">
          <img src="${BUSMO_LOGO_URL}" alt="Busmo" width="72" height="72" style="display:block;width:72px;height:72px;border:0;border-radius:14px;background:#ffffff;padding:6px;" />
        </td>
      </tr>
    </table>
    ${iconHtml}
    <h1 style="margin:14px 0 6px;font-size:24px;font-weight:700;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#ffffff;">${title}</h1>
    <p style="margin:0;font-size:15px;opacity:0.95;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#ffffff;">${subtitle}</p>
  </div>`;
}

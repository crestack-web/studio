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

/**
 * Official brand icon URLs (Simple Icons CDN — exact glyph paths).
 * Email clients render these more reliably than inline SVG.
 */
export const SOCIAL_ICON = {
  x: 'https://cdn.simpleicons.org/x/000000',
  instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  tiktok: 'https://cdn.simpleicons.org/tiktok/000000',
  youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
} as const;

/** All Busmo socials use @busmodotio */
export const SOCIAL_PROFILES = [
  {
    key: 'x',
    label: 'X',
    handle: '@busmodotio',
    href: 'https://x.com/busmodotio',
    icon: SOCIAL_ICON.x,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    handle: '@busmodotio',
    href: 'https://instagram.com/busmodotio',
    icon: SOCIAL_ICON.instagram,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    handle: '@busmodotio',
    href: 'https://tiktok.com/@busmodotio',
    icon: SOCIAL_ICON.tiktok,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    handle: '@busmodotio',
    href: 'https://youtube.com/@busmodotio',
    icon: SOCIAL_ICON.youtube,
  },
] as const;

/**
 * Email-safe social footer: table layout + exact brand icons as <img>.
 * Use in every transactional footer: ${SOCIAL_FOOTER}
 */
export const SOCIAL_FOOTER = `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 0;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:0 0 12px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:12px;color:#6B7280;">
        Follow us on social media
      </td>
    </tr>
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;">
          <tr>
            ${SOCIAL_PROFILES.map(
              (p) => `
            <td align="center" style="padding:0 6px;">
              <a href="${p.href}" target="_blank" rel="noopener noreferrer" title="${p.label} ${p.handle}" style="display:inline-block;text-decoration:none;">
                <img src="${p.icon}" width="22" height="22" alt="${p.label}" style="display:block;width:22px;height:22px;border:0;" />
              </a>
            </td>`
            ).join('')}
          </tr>
          <tr>
            ${SOCIAL_PROFILES.map(
              (p) => `
            <td align="center" style="padding:6px 6px 0;">
              <a href="${p.href}" target="_blank" rel="noopener noreferrer" style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:10px;color:#6B3FE7;text-decoration:none;">${p.handle}</a>
            </td>`
            ).join('')}
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

/** @deprecated Prefer SOCIAL_FOOTER — kept for older templates that inject SOCIAL_LINKS */
export const SOCIAL_LINKS = SOCIAL_FOOTER;

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

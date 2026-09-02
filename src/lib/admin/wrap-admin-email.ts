import {
  APP_BASE_URL,
  BUSMO_LOGO_URL,
  SOCIAL_FOOTER,
  getEmailHeader,
} from '@/services/email/email-constants';

/** Wrap plain HTML/body copy in standard Busmo transactional shell. */
export function wrapBusmoEmailHtml(opts: {
  title: string;
  subtitle?: string;
  bodyHtml: string;
}): string {
  const header = getEmailHeader(opts.title, opts.subtitle || 'A message from Busmo');
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2f8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,16,56,0.08);">
        <tr><td>${header}</td></tr>
        <tr><td style="padding:28px;font-size:15px;line-height:1.55;color:#3d3550;">${opts.bodyHtml}</td></tr>
        <tr><td style="padding:18px 28px 28px;border-top:1px solid #ece8f5;text-align:center;">
          ${SOCIAL_FOOTER}
          <p style="margin:16px 0 0;font-size:11px;line-height:1.45;color:#8a8498;">
            Busmo · AI-powered business management for African SMEs<br/>
            <a href="${APP_BASE_URL}" style="color:#6B3FE7;">${APP_BASE_URL.replace(/^https?:\/\//, '')}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildMoSalesAnnouncementHtml(name?: string): string {
  const first = (name || 'there').split(' ')[0];
  const app = APP_BASE_URL || 'https://www.busmo.io';
  const logo = BUSMO_LOGO_URL;
  const rollout = '15 September 2026';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1523;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2f8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(28,16,56,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#6B3FE7 0%,#4B27B0 100%);padding:32px 28px;text-align:center;">
            <img src="${logo}" alt="Busmo" width="64" height="64" style="display:inline-block;border:0;border-radius:14px;background:#fff;padding:6px;" />
            <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:#ffffff;font-weight:800;">Meet MO Sales</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.9);line-height:1.45;">
              Your AI salesperson on WhatsApp — rolling out to selected businesses on <strong>${rollout}</strong>
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
              Starting <strong>${rollout}</strong>, we will enable MO Sales for
              <strong>selected businesses</strong> first, then expand as we learn what works best for owners like you.
            </p>
            <h2 style="margin:0 0 12px;font-size:17px;color:#1a1523;">What MO Sales can do</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
              <tr><td style="padding:14px 16px;border:1px solid #ece8f5;border-radius:12px;background:#faf9fd;">
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Reply on WhatsApp, 24/7</strong><br/>Customers message your business; MO responds with product, price, and availability answers.</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Full business data context</strong><br/>Live catalogue, stock, prices, and sales history — accurate to your business.</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Accept orders</strong><br/>MO can take order details and move the sale forward in the chat.</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Send payment links</strong><br/>Share payment links so customers can pay without leaving WhatsApp.</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Consistent sales at scale</strong><br/>Same quality for the 1st and 100th customer — fewer missed messages at rush hour.</p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">Inbox in Busmo</strong><br/>See conversations under MO Sales, take over anytime, hand back to MO when ready.</p>
                <p style="margin:0;font-size:14px;line-height:1.55;color:#3d3550;"><strong style="color:#6B3FE7;">You stay in control</strong><br/>Turn MO on/off and keep ownership of every customer relationship.</p>
              </td></tr>
            </table>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3d3550;">You don&rsquo;t need to do anything right now. If you&rsquo;re in the first group, we&rsquo;ll guide you inside Busmo when it&rsquo;s time to connect WhatsApp.</p>
            <div style="text-align:center;margin:0 0 24px;">
              <a href="${app}" style="display:inline-block;background:#6B3FE7;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px;">Open Busmo</a>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#3d3550;">— The Busmo team</p>
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

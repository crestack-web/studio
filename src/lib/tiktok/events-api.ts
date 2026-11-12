/**
 * TikTok Events API (server). Requires TIKTOK_ACCESS_TOKEN in env.
 * Never import into client components.
 */
import 'server-only';
import { createHash } from 'crypto';
import type { TikTokEventName, TikTokEventParams } from './types';

export const TIKTOK_PIXEL_ID = 'DBQP843C77U4J2JRAUQ0';

function hashSha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 11) d = `234${d.slice(1)}`;
  return d;
}

export async function sendTikTokServerEvent(opts: {
  event: TikTokEventName;
  eventId: string;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  properties?: TikTokEventParams;
  pageUrl?: string;
  ip?: string | null;
  userAgent?: string | null;
  ttclid?: string | null;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const token = process.env.TIKTOK_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: true, skipped: true };
  }

  const user: Record<string, string> = {};
  if (opts.email) user.email = hashSha256(normalizeEmail(opts.email));
  if (opts.phone) user.phone = hashSha256(normalizePhone(opts.phone));
  if (opts.externalId) user.external_id = hashSha256(String(opts.externalId).trim());
  if (opts.ttclid) user.ttclid = opts.ttclid;
  if (opts.ip) user.ip = opts.ip;
  if (opts.userAgent) user.user_agent = opts.userAgent;

  const body = {
    event_source: 'web',
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: opts.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        user,
        page: opts.pageUrl ? { url: opts.pageUrl } : undefined,
        properties: opts.properties || {},
      },
    ],
  };

  try {
    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': token,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[tiktok-events-api]', res.status, text.slice(0, 200));
      return { ok: false, error: text.slice(0, 200) };
    }
    return { ok: true };
  } catch (e: any) {
    console.warn('[tiktok-events-api]', e?.message);
    return { ok: false, error: e?.message };
  }
}

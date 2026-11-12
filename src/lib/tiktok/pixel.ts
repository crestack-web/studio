/**
 * Browser TikTok Pixel helpers. Safe no-ops if script blocked.
 * Pixel ID: DBQP843C77U4J2JRAUQ0
 */
'use client';

import type { TikTokAttribution, TikTokEventName, TikTokEventParams } from './types';

export const TIKTOK_PIXEL_ID = 'DBQP843C77U4J2JRAUQ0';

const ATTR_KEY = 'busmo_tt_attribution';
const FIRST_ATTR_KEY = 'busmo_tt_attribution_first';
const DEDUPE_PREFIX = 'busmo_tt_evt_';

declare global {
  interface Window {
    ttq?: {
      page: () => void;
      track: (event: string, params?: Record<string, unknown>, options?: { event_id?: string }) => void;
      identify: (payload: Record<string, string>) => void;
      load: (pixelId: string, options?: Record<string, unknown>) => void;
      instance: (pixelId: string) => unknown;
      [key: string]: unknown;
    };
    TiktokAnalyticsObject?: string;
    __busmoTtPixelLoaded?: boolean;
  }
}

function getTtq() {
  if (typeof window === 'undefined') return null;
  return window.ttq || null;
}

/** Wait until ttq.track exists (script stub or full SDK). */
function waitForTtq(timeoutMs = 2500): Promise<NonNullable<ReturnType<typeof getTtq>> | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const existing = getTtq();
    if (existing && typeof existing.track === 'function') {
      resolve(existing);
      return;
    }
    const started = Date.now();
    const tick = () => {
      const ttq = getTtq();
      if (ttq && typeof ttq.track === 'function') {
        resolve(ttq);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(getTtq());
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

/** SHA-256 hex for advanced matching (Web Crypto). */
export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** E.164-ish for NG: keep digits; if starts with 0, assume 234. */
export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('0') && d.length === 11) d = `234${d.slice(1)}`;
  if (d.startsWith('2340')) d = `234${d.slice(4)}`;
  return d;
}

export function captureAttributionFromUrl(search?: string): TikTokAttribution | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(search ?? window.location.search);
  const next: TikTokAttribution = {};
  const ttclid = q.get('ttclid') || undefined;
  const utm_source = q.get('utm_source') || undefined;
  const utm_medium = q.get('utm_medium') || undefined;
  const utm_campaign = q.get('utm_campaign') || undefined;
  const utm_content = q.get('utm_content') || undefined;
  const utm_term = q.get('utm_term') || undefined;
  if (ttclid) next.ttclid = ttclid;
  if (utm_source) next.utm_source = utm_source;
  if (utm_medium) next.utm_medium = utm_medium;
  if (utm_campaign) next.utm_campaign = utm_campaign;
  if (utm_content) next.utm_content = utm_content;
  if (utm_term) next.utm_term = utm_term;
  if (!Object.keys(next).length) return null;

  const now = new Date().toISOString();
  next.last_touch_at = now;

  try {
    localStorage.setItem(ATTR_KEY, JSON.stringify(next));
    if (!localStorage.getItem(FIRST_ATTR_KEY)) {
      localStorage.setItem(FIRST_ATTR_KEY, JSON.stringify({ ...next, first_touch_at: now }));
    }
  } catch {
    /* private mode */
  }
  return next;
}

export function getAttribution(): TikTokAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FIRST_ATTR_KEY) || localStorage.getItem(ATTR_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TikTokAttribution;
  } catch {
    return {};
  }
}

function alreadyFired(eventId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(DEDUPE_PREFIX + eventId) === '1';
  } catch {
    return false;
  }
}

function markFired(eventId: string) {
  try {
    sessionStorage.setItem(DEDUPE_PREFIX + eventId, '1');
  } catch {
    /* ignore */
  }
}

export function trackPageView() {
  try {
    getTtq()?.page?.();
  } catch {
    /* never break app */
  }
}

export function trackEvent(
  event: TikTokEventName,
  params?: TikTokEventParams,
  options?: { eventId?: string }
) {
  try {
    const ttq = getTtq();
    if (!ttq?.track) return;
    const eventId = options?.eventId;
    if (eventId && alreadyFired(eventId)) return;
    if (eventId) {
      ttq.track(event, params as Record<string, unknown>, { event_id: eventId });
      markFired(eventId);
    } else {
      ttq.track(event, params as Record<string, unknown>);
    }
  } catch {
    /* ignore */
  }
}

export async function identifyTikTokUser(opts: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
}) {
  try {
    const ttq = await waitForTtq(1500);
    if (!ttq?.identify) return;
    const payload: Record<string, string> = {};
    if (opts.email) {
      payload.email = await sha256Hex(normalizeEmail(opts.email));
    }
    if (opts.phone) {
      payload.phone_number = await sha256Hex(normalizePhone(opts.phone));
    }
    if (opts.externalId) {
      payload.external_id = await sha256Hex(String(opts.externalId).trim());
    }
    if (!Object.keys(payload).length) return;
    ttq.identify(payload);
  } catch {
    /* ignore */
  }
}

/**
 * Fire CompleteRegistration for a new account.
 * Awaits pixel readiness + identify so redirects do not drop the event.
 */
export async function trackSignupSuccess(opts: {
  userId: string;
  email?: string | null;
  phone?: string | null;
}): Promise<void> {
  if (!opts.userId) return;
  const eventId = `reg_${opts.userId}`;
  try {
    await identifyTikTokUser({
      email: opts.email,
      phone: opts.phone,
      externalId: opts.userId,
    });
    await waitForTtq(2500);
    trackEvent(
      'CompleteRegistration',
      {
        content_type: 'product',
        content_name: 'Busmo account',
        status: 'completed',
      },
      { eventId }
    );
    // Give the pixel a moment to flush before any hard navigation
    await new Promise((r) => setTimeout(r, 350));
  } catch {
    /* never block signup */
  }
}

export function trackViewContent(name: string, contentId?: string) {
  trackEvent('ViewContent', {
    content_name: name,
    content_id: contentId || name,
    content_type: 'product',
  });
}

export function trackClickButton(name: string) {
  trackEvent('ClickButton', { content_name: name, description: name });
}

export function trackAddToCart(planId: string, planName: string, value?: number) {
  trackEvent('AddToCart', {
    content_id: planId,
    content_name: planName,
    content_type: 'product',
    value,
    currency: 'NGN',
  });
}

export function trackInitiateCheckout(planId: string, planName: string, value?: number) {
  trackEvent('InitiateCheckout', {
    content_id: planId,
    content_name: planName,
    content_type: 'product',
    value,
    currency: 'NGN',
  });
}

/** Commerce funnel alias — TikTok Ads Manager often labels this "Purchase". */
export function trackPurchase(opts: {
  reference: string;
  value: number;
  planId?: string;
  planName?: string;
  currency?: string;
}) {
  trackCompletePayment(opts);
  trackEvent(
    'PlaceAnOrder',
    {
      value: opts.value,
      currency: opts.currency || 'NGN',
      content_id: opts.planId,
      content_name: opts.planName,
      content_type: 'product',
    },
    { eventId: `order_${opts.reference}` }
  );
}

export function trackCompletePayment(opts: {
  reference: string;
  value: number;
  planId?: string;
  planName?: string;
  currency?: string;
}) {
  trackEvent(
    'CompletePayment',
    {
      value: opts.value,
      currency: opts.currency || 'NGN',
      content_id: opts.planId,
      content_name: opts.planName,
      content_type: 'product',
    },
    { eventId: `pay_${opts.reference}` }
  );
}

export function trackPaymentFailed(opts: { reference?: string; planId?: string }) {
  trackEvent('PaymentFailed', {
    content_id: opts.planId,
    content_type: 'product',
    status: 'failed',
    description: opts.reference,
  });
}

export function trackLead(name: string) {
  trackEvent('Lead', { content_name: name });
}

export function trackSearch(query: string) {
  trackEvent('Search', { query: query.slice(0, 100) });
}

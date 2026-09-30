/**
 * Canonical app origin for OAuth redirects and absolute links.
 *
 * Supabase Dashboard → Authentication → URL Configuration (required for Google):
 *   Site URL = https://www.busmo.io
 *   Redirect URLs must include:
 *     https://www.busmo.io/**
 *     https://busmo.io/**
 *     https://www.busmo.io/auth/callback**
 *     http://localhost:3000/**   (dev only)
 *
 * If Site URL stays http://localhost:3000, Google OAuth will land on localhost
 * even when the user started on production.
 */

const PRODUCTION_ORIGIN = "https://www.busmo.io";

function normalizeOrigin(raw: string): string {
  const cleaned = String(raw || "").trim().replace(/\/$/, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `https://${cleaned}`;
}

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function isProductionRuntime(): boolean {
  if (typeof process === "undefined") return false;
  const v = String(process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || "").toLowerCase();
  if (v === "production") return true;
  if (process.env.NODE_ENV === "production") return true;
  return false;
}

/** Prefer non-localhost env URLs so OAuth never falls back to local Site URL. */
function envOrigin(): string {
  if (typeof process === "undefined") return "";

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ];

  let localFallback = "";
  for (const c of candidates) {
    const n = normalizeOrigin(c || "");
    if (!n) continue;
    if (!isLocalHost(n)) return n;
    if (!localFallback) localFallback = n;
  }
  return localFallback;
}

/**
 * Origin used for absolute links and OAuth redirectTo.
 * Never returns localhost when running a production build or on a real host.
 */
export function getAppOrigin(): string {
  const fromEnv = envOrigin();

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    // Live host (busmo.io, preview, etc.) — always trust the browser.
    if (!isLocalHost(origin)) {
      return origin;
    }

    // Local browser, but env points at production → use production so OAuth
    // does not bounce back to localhost after Google account selection.
    if (fromEnv && !isLocalHost(fromEnv)) {
      return fromEnv;
    }

    // Local dev only
    return origin;
  }

  // Server / build time
  if (fromEnv && !isLocalHost(fromEnv)) return fromEnv;
  if (isProductionRuntime()) return PRODUCTION_ORIGIN;
  if (fromEnv) return fromEnv;
  return PRODUCTION_ORIGIN;
}

/** Absolute OAuth return URL for Supabase signInWithOAuth({ redirectTo }). */
export function getOAuthCallbackUrl(nextPath: string): string {
  const next = safeNextPath(nextPath, "/owner");
  let origin = getAppOrigin();

  // Final safety: never send Google/Supabase a localhost redirectTo in prod.
  if (isLocalHost(origin) && isProductionRuntime()) {
    origin = PRODUCTION_ORIGIN;
  }
  if (isLocalHost(origin) && typeof window !== "undefined" && !isLocalHost(window.location.origin)) {
    origin = window.location.origin;
  }

  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Safe internal path for post-OAuth redirect (blocks open redirects). */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/owner"
): string {
  if (!next || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) {
    return fallback;
  }
  // Block accidental localhost embedded in next
  if (/localhost|127\.0\.0\.1/i.test(t)) return fallback;
  return t;
}

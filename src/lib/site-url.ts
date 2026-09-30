/**
 * Canonical app origin for OAuth redirects and absolute links.
 *
 * Vercel: set NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SITE_URL) to your live site
 * e.g. https://busmo.io — plain APP_URL alone is not visible in the browser bundle
 * unless you also set the NEXT_PUBLIC_ variant (or rely on window.location on prod).
 *
 * Supabase Dashboard → Authentication → URL Configuration:
 *   Site URL = https://your-production-domain
 *   Redirect URLs include https://your-production-domain/auth/callback**
 * If Site URL is still http://localhost:3000, Google OAuth will land on localhost.
 */

function normalizeOrigin(raw: string): string {
  const cleaned = String(raw || "").trim().replace(/\/$/, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  return `https://${cleaned}`;
}

function isLocalHost(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Prefer non-localhost env URLs so OAuth never falls back to local Site URL. */
function envOrigin(): string {
  if (typeof process === "undefined") return "";

  // NEXT_PUBLIC_* is available in the browser after build; server-only names work on server.
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
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

export function getAppOrigin(): string {
  const fromEnv = envOrigin();

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    // Deployed host (production or Vercel preview) — trust the browser.
    if (!isLocalHost(origin)) {
      return origin;
    }

    // Developing locally but env points at production → use production so
    // Google/Supabase do not redirect to localhost after OAuth.
    if (fromEnv && !isLocalHost(fromEnv)) {
      return fromEnv;
    }

    return origin;
  }

  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
}

/** Absolute OAuth return URL for Supabase signInWithOAuth({ redirectTo }). */
export function getOAuthCallbackUrl(nextPath: string): string {
  const next = safeNextPath(nextPath, "/owner");
  const origin = getAppOrigin();
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
  return t;
}

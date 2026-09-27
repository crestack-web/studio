/**
 * Canonical app origin for OAuth redirects and absolute links.
 *
 * Priority (client):
 * 1. window.location.origin when it is not localhost (production / preview)
 * 2. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_BASE_URL when set
 * 3. Never force localhost if a non-localhost env URL exists
 *
 * Priority (server):
 * 1. NEXT_PUBLIC_* site/app URL
 * 2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL
 * 3. http://localhost:3000 (dev only)
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

function envOrigin(): string {
  if (typeof process === "undefined") return "";
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const c of candidates) {
    const n = normalizeOrigin(c || "");
    if (n) return n;
  }
  return "";
}

export function getAppOrigin(): string {
  const fromEnv = envOrigin();

  if (typeof window !== "undefined") {
    const origin = window.location.origin;

    // Real deployed host (production or Vercel preview) — always trust the browser.
    if (!isLocalHost(origin)) {
      return origin;
    }

    // Local browser, but env points at production → use env so OAuth does not
    // send users to localhost after Google.
    if (fromEnv && !isLocalHost(fromEnv)) {
      return fromEnv;
    }

    return origin;
  }

  if (fromEnv) return fromEnv;
  return "http://localhost:3000";
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

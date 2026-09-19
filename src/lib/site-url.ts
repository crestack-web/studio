/**
 * Canonical app origin for OAuth redirects.
 * Prefer NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_APP_URL so production never
 * falls back to localhost when Supabase or the browser origin is wrong.
 */
export function getAppOrigin(): string {
  const env =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL)) ||
    "";
  const cleaned = String(env).trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If the page is somehow on localhost but env points at production, use env.
    if (
      cleaned &&
      /localhost|127\.0\.0\.1/.test(origin) &&
      !/localhost|127\.0\.0\.1/.test(cleaned)
    ) {
      return cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
    }
    return origin;
  }

  if (cleaned) {
    return cleaned.startsWith("http") ? cleaned : `https://${cleaned}`;
  }
  return "http://localhost:3000";
}

/** Safe internal path for post-OAuth redirect (blocks open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/owner"): string {
  if (!next || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) return fallback;
  return t;
}

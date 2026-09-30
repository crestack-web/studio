"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { safeNextPath } from "@/lib/site-url";

/**
 * Supabase OAuth / PKCE return URL.
 * Exchanges ?code= for a session, then redirects to `next` (default /owner).
 * Signup flow uses: /auth/callback?next=/welcome/signup?google=callback
 *
 * Always uses a same-origin relative redirect so we never jump to localhost
 * after a successful Google sign-in on production.
 */
export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const url = new URL(window.location.href);
        // If OAuth incorrectly returned to localhost while a production app URL exists,
        // stop and show a clear error instead of a broken local session.
        if (/localhost|127\.0\.0\.1/i.test(url.hostname)) {
          const prodHint =
            (typeof process !== "undefined" &&
              (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL)) ||
            "https://www.busmo.io";
          if (!cancelled) {
            setError(
              `Sign-in returned to localhost. In Supabase → Authentication → URL Configuration, set Site URL to ${prodHint.replace(/\/$/, "")} and add Redirect URLs for that domain, then try again from the live site.`
            );
            setMessage("");
          }
          return;
        }
        const code = url.searchParams.get("code");
        const next = safeNextPath(url.searchParams.get("next"), "/owner");
        const oauthError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (oauthError) {
          if (!cancelled) {
            setError(String(oauthError));
            setMessage("");
          }
          return;
        }

        const supabase = getSupabase();

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
              throw exchangeError;
            }
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            await new Promise((r) => setTimeout(r, 400));
            const {
              data: { session: s2 },
            } = await supabase.auth.getSession();
            if (!s2) {
              throw new Error(
                "No session after Google sign-in. Please try again."
              );
            }
          }
        }

        if (cancelled) return;

        // Relative path only — stays on current host (never localhost).
        window.location.replace(next);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Sign-in failed. Please try again.";
        if (!cancelled) {
          setError(msg);
          setMessage("");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        background: "#F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {!error && (
        <p style={{ fontSize: 14, color: "#555568", margin: 0 }}>{message}</p>
      )}
      {error && (
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <p style={{ fontSize: 14, color: "#DC2626", marginBottom: 16 }}>
            {error}
          </p>
          <a
            href="/welcome/signup"
            style={{
              color: "#6B3FE7",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Back to sign up
          </a>
          {" · "}
          <a
            href="/login"
            style={{
              color: "#6B3FE7",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Log in
          </a>
        </div>
      )}
    </div>
  );
}

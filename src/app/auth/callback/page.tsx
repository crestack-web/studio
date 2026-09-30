"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { safeNextPath } from "@/lib/site-url";

/**
 * Supabase OAuth / PKCE return URL.
 *
 * Important: the browser client has detectSessionInUrl: true, so Supabase may
 * already exchange ?code= on init. Calling exchangeCodeForSession again causes:
 *   "Unable to exchange external code"
 * We only exchange when there is not already a session.
 */
export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let finished = false;

    async function finish(next: string) {
      if (cancelled || finished) return;
      finished = true;
      // Relative path only — stays on current host (never localhost).
      window.location.replace(next);
    }

    async function run() {
      try {
        const url = new URL(window.location.href);

        if (/localhost|127\.0\.0\.1/i.test(url.hostname)) {
          const prodHint =
            (typeof process !== "undefined" &&
              (process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL)) ||
            "https://www.busmo.io";
          if (!cancelled) {
            setError(
              `Sign-in returned to localhost. In Supabase → Authentication → URL Configuration, set Site URL to ${String(
                prodHint
              ).replace(/\/$/, "")} and add Redirect URLs for that domain, then try again from the live site.`
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

        // 1) Session may already exist (detectSessionInUrl or prior exchange)
        {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await finish(next);
            return;
          }
        }

        // 2) Exchange code once if present
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Code already used / race with detectSessionInUrl — check session again
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              await finish(next);
              return;
            }

            // Brief retry: client init may still be processing the URL
            await new Promise((r) => setTimeout(r, 500));
            const {
              data: { session: s2 },
            } = await supabase.auth.getSession();
            if (s2) {
              await finish(next);
              return;
            }

            const msg = exchangeError.message || "";
            if (/exchange external code|code verifier|pkce/i.test(msg)) {
              throw new Error(
                "Google sign-in could not complete (session code already used or expired). Close extra tabs, then try Log in with Google once more from https://www.busmo.io"
              );
            }
            throw exchangeError;
          }

          await finish(next);
          return;
        }

        // 3) Hash tokens (implicit) or delayed session
        await new Promise((r) => setTimeout(r, 400));
        {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await finish(next);
            return;
          }
        }

        throw new Error(
          "No session after Google sign-in. Please try Log in with Google again."
        );
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
        <div style={{ textAlign: "center", maxWidth: 400 }}>
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

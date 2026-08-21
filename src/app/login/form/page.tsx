"use client";

import { useState, useEffect } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import posthog from 'posthog-js';

// Helper function to get device information
function getDeviceInfo() {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let device = 'Unknown';
  let browser = 'Unknown';

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }

  // Detect browser
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  }

  return { device, browser };
}

// ── App Logo ─────────────────────────────────
function AppLogo({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#0A1E1E"></circle>
      <circle cx="40" cy="40" r="36" fill="none" stroke="#2ABFBF" strokeWidth="1.5"></circle>
      <text x="11" y="24" fontSize="9" opacity="0.7">✨</text>
      <text x="60" y="22" fontSize="8" opacity="0.6">✨</text>
      <circle cx="40" cy="36" r="20" fill="#F5C9A0"></circle>
      <path d="M20 32 C20 18 60 18 60 32 L60 25 C60 13 20 13 20 25 Z" fill="#2C1A0E"></path>
      <circle cx="31" cy="35" r="4" fill="white"></circle>
      <circle cx="49" cy="35" r="4" fill="white"></circle>
      <circle cx="31" cy="35.5" r="2.5" fill="#1A2B3C"></circle>
      <circle cx="49" cy="35.5" r="2.5" fill="#1A2B3C"></circle>
      <circle cx="32" cy="34" r="1" fill="white"></circle>
      <circle cx="50" cy="34" r="1" fill="white"></circle>
      <path d="M30 43 Q40 49 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="rgba(255,200,150,0.25)"></path>
      <ellipse cx="22" cy="40.5" rx="3.5" ry="2" fill="#F4A535" opacity="0.3"></ellipse>
      <ellipse cx="58" cy="40.5" rx="3.5" ry="2" fill="#F4A535" opacity="0.3"></ellipse>
      <ellipse cx="40" cy="66" rx="15" ry="6" fill="#1A8F8F" opacity="0.9"></ellipse>
      <rect x="32" y="56" width="16" height="10" rx="5" fill="#F5C9A0"></rect>
      <path d="M58 58 Q68 52 70 44" stroke="#F5C9A0" strokeWidth="5" strokeLinecap="round" fill="none"></path>
      <circle cx="70" cy="42" r="5" fill="#F5C9A0"></circle>
      <rect x="65" y="35" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(-8 65 35)"></rect>
      <rect x="70" y="34" width="5" height="10" rx="2.5" fill="#F5C9A0"></rect>
      <rect x="75" y="36" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(8 75 36)"></rect>
    </svg>
  );
}

// ── Field ────────────────────────────────────
function Field({
  label, id, type = "text", value, onChange, placeholder, autoComplete,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 600, color: "#555568", letterSpacing: "0.025em" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden",
          background: "white", transition: "all 0.2s",
          border: `1.5px solid ${focused ? "#6B3FE7" : "#E8E8F0"}`,
          boxShadow: focused ? "0 0 0 3px rgba(107,63,231,0.12)" : "none",
        }}
      >
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "13px 16px", fontSize: 15, color: "#0A0A0F",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>
    </div>
  );
}

// ── Primary Button ────────────────────────────
function PrimaryBtn({ children, onClick, disabled = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 26px", borderRadius: 13,
        background: disabled ? "#C4B3F5" : "#6B3FE7",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: "white", fontFamily: "'Sora', sans-serif",
        fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#4B24C1";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(107,63,231,0.28)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#6B3FE7";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Shell ───────────────────────────────────
function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,63,231,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.6,
        backgroundImage: "radial-gradient(circle, rgba(107,63,231,0.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 460, zIndex: 1,
        display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          background: "white", borderRadius: 28, padding: "28px 26px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(107,63,231,0.09)",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          {children}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#8888A0" }}>
          © {new Date().getFullYear()} Busmo · Built for African commerce
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════
export default function BusmoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle OAuth callback - redirect if session exists
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          window.location.href = '/owner';
        }
      }).catch(() => {
        // leave user on login form
      });
    } catch {
      // env missing — page still renders
    }
  }, []);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication is not configured. Please contact support.');
      }
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = data.user;
      if (!user) throw new Error('No user returned');

      // Fetch user role from Firestore (via Firebase client)
      const { doc, getDoc } = await import('firebase/firestore');
      const { initializeFirebase } = await import('@/firebase');
      const { firestore } = initializeFirebase();
      const userDocRef = doc(firestore, 'users', user.id);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData?.role || 'Owner';

        // Login alert email is best-effort and must not break login
        try {
          const deviceInfo = getDeviceInfo();
          void fetch('/api/email/login-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email || email,
              name: userData?.fullName || userData?.displayName || 'User',
              device: deviceInfo.device,
              browser: deviceInfo.browser,
              location: 'Unknown',
              loginTime: new Date().toLocaleString(),
              ipAddress: 'Unknown',
            }),
          }).catch(() => {});
        } catch {
          // ignore
        }

        try {
          posthog.identify(user.id, {
            email: user.email || email,
            role,
          });
          posthog.capture('user_logged_in', { authentication_method: 'password', role });
        } catch {
          // analytics must not block login
        }

        if (!['Owner', 'Admin'].includes(role)) {
          window.location.href = '/staff/home';
        } else {
          window.location.href = '/owner';
        }
      } else {
        window.location.href = '/owner';
      }
    } catch (err: any) {
      setError(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication is not configured. Please contact support.');
      }
      const supabase = getSupabase();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/owner`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <AppLogo size={30} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 4 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: "#8888A0", lineHeight: 1.55 }}>
          Log in to your Busmo dashboard.
        </p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Email address"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <Field
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {error && (
          <p style={{ color: "#DC2626", fontSize: 13, marginTop: 2 }}>{error}</p>
        )}
      </div>

      <PrimaryBtn onClick={handleLogin} disabled={!valid || loading}>
        {loading ? "Logging in..." : "Log in"}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PrimaryBtn>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
        <span style={{ fontSize: 12, color: "#8888A0" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          padding: "13px 26px",
          borderRadius: 13,
          background: "white",
          border: "1.5px solid #E8E8F0",
          cursor: loading ? "not-allowed" : "pointer",
          color: "#0A0A0F",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#6B3FE7";
            e.currentTarget.style.background = "#F4F4F8";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#E8E8F0";
            e.currentTarget.style.background = "white";
          }
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8888A0", marginTop: 2 }}>
        <a href="/forgot" style={{ color: "#6B3FE7", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
          Forgot password?
        </a>
        <span>
          New to Busmo?{" "}
          <a href="/welcome/signup"
            style={{ color: "#6B3FE7", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
            Create account
          </a>
        </span>
      </div>
    </LoginShell>
  );
}

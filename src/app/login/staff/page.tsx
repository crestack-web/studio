"use client";

import { useState } from "react";
import { getSupabase, isSupabaseConfigured, getSupabaseConfigErrorMessage } from "@/lib/supabase";

// ── Staff Logo ────────────────────────────────
function StaffLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#16A34A" />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Sora', sans-serif"
        fontWeight="bold"
        fontSize={size * 0.45}
        fill="white"
      >
        S
      </text>
    </svg>
  );
}

// ── Field ──────────────────────────────────────
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
        style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", letterSpacing: "0.025em" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden",
          background: "white", transition: "all 0.2s",
          border: `1.5px solid ${focused ? "#16A34A" : "#E8E8F0"}`,
          boxShadow: focused ? "0 0 0 3px rgba(22,163,74,0.12)" : "none",
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

// ── Primary Button ─────────────────────────────
function StaffBtn({ children, onClick, disabled = false }: {
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
        background: disabled ? "#A7F3D0" : "#16A34A",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: "white", fontFamily: "'Sora', sans-serif",
        fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#15803D";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(22,163,74,0.18)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#16A34A";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Shell ──────────────────────────────────────
function StaffLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "32px 16px",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", opacity: 0.6,
        backgroundImage: "radial-gradient(circle, rgba(22,163,74,0.12) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 460, zIndex: 1,
        display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          background: "white", borderRadius: 28, padding: "28px 26px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(22,163,74,0.09)",
          display: "flex", flexDirection: "column", gap: 20,
        }}>
          {children}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#8888A0" }}>
          © {new Date().getFullYear()} Busmo Staff · Empowering your team
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════
export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = email.trim().length > 5 && email.includes('@') && password.length >= 6;

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      if (!isSupabaseConfigured()) {
        setError(getSupabaseConfigErrorMessage() || "Authentication is not configured. Please contact support.");
        return;
      }
      console.log('🔐 [Staff Login] Attempting login with:', email);
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const user = data.user;
      if (!user) throw new Error('No user returned');
      console.log('✅ [Staff Login] Supabase auth successful:', user.id);

      // Read role from Supabase user_metadata (not Firestore)
      const role = (user.user_metadata?.role as string) || 'Owner';

      if (['Owner', 'Admin'].includes(role)) {
        console.log('⚠️ [Staff Login] Owner/Admin tried staff portal — redirecting');
        setError("This account is an owner account. Please use the owner login.");
        await supabase.auth.signOut();
      } else if (role !== 'Staff') {
        setError("You are not authorized to access the staff portal. Please contact your business owner.");
        await supabase.auth.signOut();
      } else {
        console.log('✅ [Staff Login] Redirecting to staff home');
        window.location.href = "/staff/home";
      }
    } catch (error: any) {
      console.error('❌ [Staff Login] Login error:', error);
      const msg = (error?.message || '').toLowerCase();
      if (
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/user-not-found' ||
        error?.code === 'auth/wrong-password' ||
        error?.code === 'invalid_credentials' ||
        msg.includes('invalid login') ||
        msg.includes('invalid credentials') ||
        msg.includes('invalid email or password')
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (
        error?.code === 'auth/too-many-requests' ||
        msg.includes('rate limit') ||
        msg.includes('too many')
      ) {
        setError("Too many failed attempts. Please try again later.");
      } else if (msg.includes('not configured') || msg.includes('missing next_public_supabase')) {
        setError(error.message || "Authentication is not configured. Please contact support.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffLoginShell>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <StaffLogo size={30} />
        <span style={{
          fontSize: 17, fontWeight: 800, color: "#16A34A",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.03em"
        }}>
         
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 4 }}>
          Staff Login
        </h1>
        <p style={{ fontSize: 14, color: "#16A34A", lineHeight: 1.55 }}>
          Enter your email and password to access your workspace.
        </p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field
          label="Email"
          id="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="username"
        />
        <Field
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {error && (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: "#FEF2F2", border: "1px solid #FECACA",
            color: "#B91C1C", fontSize: 13, lineHeight: 1.45,
          }}>
            {error}
          </div>
        )}

        <StaffBtn onClick={handleLogin} disabled={!valid || loading}>
          {loading ? "Signing in…" : "Sign in"}
        </StaffBtn>

        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: 0 }}>
          Forgot password?{" "}
          <a href="/staff/forgot" style={{ color: "#16A34A", fontWeight: 600 }}>Reset it</a>
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: "#6B7280", margin: 0 }}>
          Business owner?{" "}
          <a href="/login" style={{ color: "#16A34A", fontWeight: 600 }}>Owner login</a>
        </p>
      </div>
    </StaffLoginShell>
  );
}

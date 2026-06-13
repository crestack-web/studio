"use client";

import { useState } from "react";
import { initializeFirebase } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
      const { auth, firestore } = initializeFirebase();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'Staff') {
        window.location.href = "/staff/home";
      } else {
        setError("You are not authorized to access the staff portal. Please contact your business owner.");
        await auth.signOut();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError("Invalid email or password. Please try again.");
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
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {error && (
          <p style={{ color: "#DC2626", fontSize: 13, marginTop: 2 }}>{error}</p>
        )}
      </div>

      <StaffBtn onClick={handleLogin} disabled={!valid || loading}>
        {loading ? "Logging in..." : "Log in"}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </StaffBtn>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#8888A0", marginTop: 2 }}>
        <a href="/login"
          style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
          Not staff? Owner login
        </a>
        <span>
          Trouble logging in?{" "}
          <a href="/staff/forgot"
            style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
            Reset password
          </a>
        </span>
      </div>
    </StaffLoginShell>
  );
}
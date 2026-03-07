"use client";

import { useState } from "react";
import { initializeFirebase } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

// ── App Logo ───────────────────────────────────
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

// ── Primary Button ─────────────────────────────
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

// ── Shell ──────────────────────────────────────
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

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 6;

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { auth, firestore } = initializeFirebase();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const { doc, getDoc } = await import('firebase/firestore');
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData?.role || 'Owner';

        // Redirect based on role
        if (role === 'Staff') {
          window.location.href = '/staff/home';
        } else {
          window.location.href = '/owner';
        }
      } else {
        // Default to owner dashboard if user doc not found
        window.location.href = '/owner';
      }
    } catch (error: any) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell>
      {/* Top bar */}
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

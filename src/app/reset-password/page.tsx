"use client";

import { useState } from "react";
import React from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const token = params?.get("token") || "";

  if (!token) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,63,231,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: 420,
          width: "100%",
          background: "white",
          borderRadius: 24,
          padding: "40px 28px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(107,63,231,0.09)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>
            Invalid Reset Link
          </h2>
          <p style={{ fontSize: 15, color: "#555568", marginBottom: 24, lineHeight: 1.5 }}>
            This password reset link is invalid or missing a token.
          </p>
          <a
            href="/forgot"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#6B3FE7",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              borderRadius: 12,
              padding: "11px 24px",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "'Sora', sans-serif",
              boxShadow: "0 2px 8px rgba(107,63,231,0.10)",
            }}
          >
            Request a new reset link
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage("Your password has been updated successfully!");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to reset password. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,63,231,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "white",
          borderRadius: 24,
          padding: "40px 28px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(107,63,231,0.09)",
          textAlign: "center",
        }}
      >
        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>
              Password Updated!
            </h2>
            <p style={{ fontSize: 15, color: "#555568", marginBottom: 24, lineHeight: 1.5 }}>
              {message}
            </p>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#6B3FE7",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                borderRadius: 12,
                padding: "11px 24px",
                cursor: "pointer",
                textDecoration: "none",
                fontFamily: "'Sora', sans-serif",
                boxShadow: "0 2px 8px rgba(107,63,231,0.10)",
              }}
            >
              Log in to Busmo
            </a>
          </>
        )}

        {status !== "success" && (
          <>
            <div style={{
              width: 56,
              height: 56,
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "#F4F0FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6B3FE7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 4 }}>
              Set New Password
            </h2>
            <p style={{ fontSize: 14, color: "#555568", marginBottom: 28, lineHeight: 1.5 }}>
              Enter a new password for your Busmo account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, color: "#1A1A2E", fontSize: 14, marginBottom: 6 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: "1.5px solid #E8E8F0",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6B3FE7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E8F0")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, color: "#1A1A2E", fontSize: 14, marginBottom: 6 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    padding: "12px 14px",
                    border: "1.5px solid #E8E8F0",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6B3FE7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E8F0")}
                />
              </div>

              {status === "error" && (
                <div style={{
                  padding: "10px 12px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  color: "#DC2626",
                  fontSize: 13,
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !password || !confirmPassword}
                style={{
                  width: "100%",
                  background: "#6B3FE7",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px 0",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: status === "loading" ? "not-allowed" : "pointer",
                  opacity: status === "loading" || !password || !confirmPassword ? 0.6 : 1,
                  fontFamily: "'Sora', sans-serif",
                  boxShadow: "0 2px 8px rgba(107,63,231,0.10)",
                  transition: "all 0.2s",
                }}
              >
                {status === "loading" ? "Updating..." : "Update Password"}
              </button>
            </form>

            <div style={{ marginTop: 24 }}>
              <a
                href="/login"
                style={{
                  color: "#6B3FE7",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ← Back to Login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

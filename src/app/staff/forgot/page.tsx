"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function StaffForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      
      // Send password reset email via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login/staff`,
      });
      
      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        padding: "32px 16px",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: 400, margin: "0 auto", padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #e8e8f0", textAlign: "center" }}>
          <div style={{
            width: 64,
            height: 64,
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "#D1FAE5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}>
            ✉️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0F", marginBottom: 12 }}>Check your email</h2>
          <p style={{ fontSize: 15, color: "#555568", lineHeight: 1.6, marginBottom: 24 }}>
            We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
          </p>
          <Link href="/login/staff" style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>
            ← Back to staff login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      padding: "32px 16px",
      background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 65%), #F4F4F8",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 400, width: "100%", padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #e8e8f0" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F", marginBottom: 8 }}>Reset password</h1>
        <p style={{ fontSize: 14, color: "#555568", marginBottom: 24 }}>
          Enter your staff email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleResetPassword}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", display: "block", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1.5px solid #E8E8F0",
              fontSize: 15,
              marginBottom: 16,
              boxSizing: "border-box",
            }}
          />

          {error && (
            <div style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.includes("@")}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 12,
              background: loading ? "#A7F3D0" : "#16A34A",
              color: "white",
              border: "none",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B7280" }}>
          <Link href="/login/staff" style={{ color: "#16A34A", fontWeight: 600, textDecoration: "none" }}>
            ← Back to staff login
          </Link>
        </p>
      </div>
    </div>
  );
}

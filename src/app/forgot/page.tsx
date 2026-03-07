"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Call Firebase password reset or Cloud Function
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 400, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #e8e8f0", textAlign: "center" }}>
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
        
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#0A1F14" }}>
          Check Your Email
        </h2>
        
        <p style={{ fontSize: 15, color: "#3D6652", marginBottom: 24, lineHeight: 1.6 }}>
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        
        <div style={{
          padding: 16,
          background: "#F0F9FF",
          border: "1px solid #BAE6FD",
          borderRadius: 10,
          marginBottom: 24,
          textAlign: "left",
        }}>
          <p style={{ fontSize: 13, color: "#0369A1", margin: 0 }}>
            <strong>Didn't receive the email?</strong>
            <br />
            • Check your spam folder<br />
            • Make sure you entered the correct email<br />
            • Contact support if you need help
          </p>
        </div>
        
        <Link
          href="/login"
          style={{
            display: "inline-block",
            background: "#14A05A",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 10,
            padding: "12px 32px",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #e8e8f0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A1F14", marginBottom: 8 }}>
          Forgot Password?
        </h2>
        <p style={{ fontSize: 14, color: "#82A993", margin: 0 }}>
          No worries! We'll send you reset instructions.
        </p>
      </div>

      <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label htmlFor="email" style={{ display: "block", fontWeight: 600, color: "#0A1F14", marginBottom: 8 }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: "100%",
              borderRadius: 10,
              padding: "12px 14px",
              border: "1.5px solid #E8E8F0",
              fontSize: 15,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{
            padding: "10px 12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            color: "#DC2626",
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            width: "100%",
            background: "#14A05A",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link
          href="/login"
          style={{
            color: "#14A05A",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

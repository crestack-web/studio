"use client";

import React, { useState } from "react";
import Link from "next/link";
import { initializeFirebase } from "@/firebase";
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from "firebase/auth";

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
      const { auth } = initializeFirebase();
      
      // Send password reset email via Firebase Auth
      await firebaseSendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/staff/login`,
        handleCodeInApp: false,
      });
      
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
              • Contact your business owner for help
            </p>
          </div>
          
          <Link
            href="/staff/login"
            style={{
              display: "inline-block",
              background: "#16A34A",
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
      <div style={{ 
        position: "relative", 
        width: "100%", 
        maxWidth: 460, 
        zIndex: 1,
        display: "flex", 
        flexDirection: "column", 
        gap: 12 
      }}>
        <div style={{
          background: "white", 
          borderRadius: 28, 
          padding: "28px 26px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(22,163,74,0.09)",
          display: "flex", 
          flexDirection: "column", 
          gap: 20,
        }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
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
                background: "#16A34A",
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

          <div style={{ marginTop: 8, textAlign: "center" }}>
            <Link
              href="/staff/login"
              style={{
                color: "#16A34A",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
        
        <p style={{ textAlign: "center", fontSize: 11, color: "#8888A0" }}>
          © {new Date().getFullYear()} Busmo · Built for African commerce
        </p>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import React from "react";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    fetch(`/api/auth/confirm-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, []);

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
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>
              Verifying your email...
            </h2>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>
              Email Verified!
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

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>
              Verification Failed
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
              Go to Login
            </a>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import React from "react";

type PrimaryBtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

function PrimaryBtn({ children, ...props }: PrimaryBtnProps) {
  return (
    <button
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: props.disabled ? "#E8E8F0" : "#6B3FE7",
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        border: "none",
        borderRadius: 12,
        padding: "13px 22px",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        fontFamily: "'Sora', sans-serif",
        boxShadow: props.disabled
          ? "none"
          : "0 4px 14px rgba(107,63,231,0.28)",
        transition: "background 0.2s, box-shadow 0.2s, opacity 0.2s",
        minHeight: 48,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export default function SuccessScreen({
  name,
  bizName,
  email,
  needsEmailConfirm,
  onDashboard,
}: {
  name: string;
  bizName: string;
  email?: string;
  needsEmailConfirm?: boolean;
  onDashboard: () => void;
}) {
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setResendMsg(
        data.message ||
          (res.ok ? "Confirmation email sent." : "Failed to resend.")
      );
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <div style={{ textAlign: "center", padding: "28px 4px" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "#F3EFFE",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          📧
        </div>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            marginBottom: 8,
            fontFamily: "'Sora', sans-serif",
            color: "#0A0A0F",
          }}
        >
          Check your inbox
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "#555568",
            marginBottom: 8,
            lineHeight: 1.55,
          }}
        >
          We sent a confirmation link to <b>{email}</b>.
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#8888A0",
            marginBottom: 24,
            lineHeight: 1.55,
          }}
        >
          Open the email, tap the link, then log in to open{" "}
          <b>{bizName || "your business"}</b> on Busmo.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          <PrimaryBtn
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Go to Login →
          </PrimaryBtn>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: "none",
              border: "none",
              color: "#6B3FE7",
              fontWeight: 600,
              fontSize: 13,
              cursor: resending ? "not-allowed" : "pointer",
              opacity: resending ? 0.6 : 1,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {resending ? "Sending..." : "Didn't get it? Resend email"}
          </button>
          {resendMsg && (
            <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>
              {resendMsg}
            </p>
          )}
        </div>
      </div>
    );
  }

  const first = (name || "there").split(" ")[0];

  return (
    <div style={{ textAlign: "center", padding: "28px 4px" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "linear-gradient(135deg, #F3EFFE 0%, #EEFBF3 100%)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          marginBottom: 16,
        }}
      >
        🎉
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          marginBottom: 8,
          fontFamily: "'Sora', sans-serif",
          color: "#0A0A0F",
        }}
      >
        Welcome, {first}!
      </h2>
      <p
        style={{
          fontSize: 15,
          color: "#555568",
          marginBottom: 18,
          lineHeight: 1.5,
        }}
      >
        <b>{bizName}</b> is set up on Busmo. Your 3-day trial is ready.
      </p>
      <div
        style={{
          textAlign: "left",
          background: "#FAFAFC",
          border: "1px solid #E8E8F0",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 20,
          fontSize: 13,
          color: "#555568",
          lineHeight: 1.55,
        }}
      >
        <div style={{ fontWeight: 700, color: "#0A0A0F", marginBottom: 6 }}>
          Suggested first moves
        </div>
        <div>1. Add a product or menu item</div>
        <div>2. Record a test sale</div>
        <div>3. Invite a staff member if you have a team</div>
      </div>
      <PrimaryBtn onClick={onDashboard} style={{ width: "100%" }}>
        Open my dashboard →
      </PrimaryBtn>
    </div>
  );
}

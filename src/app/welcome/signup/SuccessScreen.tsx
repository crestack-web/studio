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
        gap: 6,
        background: props.disabled ? "#E8E8F0" : "#6B3FE7",
        color: "white",
        fontWeight: 700,
        fontSize: 14,
        border: "none",
        borderRadius: 12,
        padding: "11px 18px",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
        fontFamily: "'Sora', sans-serif",
        boxShadow: props.disabled
          ? "none"
          : "0 2px 8px rgba(107,63,231,0.10)",
        transition: "background 0.2s, box-shadow 0.2s, opacity 0.2s",
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
  const [resendMsg, setResendMsg] = useState('');

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setResendMsg(data.message || (res.ok ? 'Confirmation email sent.' : 'Failed to resend.'));
    } catch {
      setResendMsg('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Check your email
        </h2>
        <p style={{ fontSize: 15, color: "#555568", marginBottom: 8, lineHeight: 1.55 }}>
          We sent a confirmation link to <b>{email}</b>.
        </p>
        <p style={{ fontSize: 14, color: "#8888A0", marginBottom: 24, lineHeight: 1.55 }}>
          Click the link in the email to activate your account, then log in to open your dashboard.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <PrimaryBtn onClick={() => { window.location.href = "/login"; }}>
            Go to Login
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
            {resending ? "Sending..." : "Resend confirmation email"}
          </button>
          {resendMsg && (
            <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>{resendMsg}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Welcome, {name.split(" ")[0]}!
      </h2>
      <p style={{ fontSize: 16, color: "#555568", marginBottom: 18 }}>
        Your business <b>{bizName}</b> is ready to go on Busmo.
      </p>
      <PrimaryBtn onClick={onDashboard}>Go to Dashboard</PrimaryBtn>
    </div>
  );
}

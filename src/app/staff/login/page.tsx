"use client";

import React, { useState } from "react";

type Step = 1 | 2;

export default function StaffTwoStepLogin() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate sending code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // TODO: Replace with real API call
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1000);
  };

  // Simulate verifying code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // TODO: Replace with real API call
    setTimeout(() => {
      setLoading(false);
      if (code === "123456") {
        // Success: redirect or show success
        alert("Login successful!");
      } else {
        setError("Invalid code. Please try again.");
      }
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 340, margin: "60px auto", padding: 24, background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px #e8e8f0" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18, color: "#6B3FE7" }}>Staff Login</h2>
      {step === 1 && (
        <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label htmlFor="email" style={{ fontWeight: 600, color: "#555568" }}>Staff Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="staff@company.com"
            style={{
              borderRadius: 10,
              padding: "12px 14px",
              border: "1.5px solid #E8E8F0",
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !email}
            style={{
              background: "#6B3FE7",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label htmlFor="code" style={{ fontWeight: 600, color: "#555568" }}>
            Enter Verification Code
          </label>
          <input
            id="code"
            type="text"
            required
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            style={{
              borderRadius: 10,
              padding: "12px 14px",
              border: "1.5px solid #E8E8F0",
              fontSize: 15,
              outline: "none",
              letterSpacing: 2,
            }}
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            style={{
              background: "#6B3FE7",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 0",
              fontWeight: 700,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            style={{
              background: "none",
              color: "#6B3FE7",
              border: "none",
              marginTop: 4,
              cursor: "pointer",
              fontSize: 14,
              textDecoration: "underline",
            }}
          >
            Back to Email
          </button>
          {error && <div style={{ color: "#DC2626", fontSize: 13 }}>{error}</div>}
        </form>
      )}
    </div>
  );
}
"use client";

import { StepId } from "framer-motion";
import { useState, useCallback } from "react";
import { initializeFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp, collection, addDoc, getDoc } from "firebase/firestore";
import { formatCurrency } from "@/lib/currency";

// If you have these components elsewhere, import them here
// import Field from "./Field";
// import SelectField from "./SelectField";
// import PrimaryBtn from "./PrimaryBtn";
// import SuccessScreen from "./SuccessScreen";
import React from "react";

// Minimal Field component definition for this file
type FieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  autoComplete?: string;
};

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  autoComplete,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {prefix && (
          <span style={{ fontSize: 14, color: "#8888A0", padding: "0 8px" }}>{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={{
            flex: 1,
            borderRadius: 12,
            padding: "13px 16px",
            fontSize: 14,
            color: "#0A0A0F",
            background: "white",
            outline: "none",
            lineHeight: 1.55,
            fontFamily: "'DM Sans', sans-serif",
            border: "1.5px solid #E8E8F0",
            transition: "all 0.2s",
          }}
          onFocus={e => {
            e.target.style.borderColor = "#6B3FE7";
            e.target.style.boxShadow = "0 0 0 3px rgba(107,63,231,0.12)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "#E8E8F0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}

// Minimal SelectField component definition for this file
type SelectFieldProps = {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
};

function SelectField({
  label,
  id,
  value,
  onChange,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          borderRadius: 12,
          padding: "13px 16px",
          fontSize: 14,
          color: value ? "#0A0A0F" : "#8888A0",
          background: "white",
          outline: "none",
          lineHeight: 1.55,
          fontFamily: "'DM Sans', sans-serif",
          border: "1.5px solid #E8E8F0",
          transition: "all 0.2s",
        }}
        onFocus={e => {
          e.target.style.borderColor = "#6B3FE7";
          e.target.style.boxShadow = "0 0 0 3px rgba(107,63,231,0.12)";
        }}
        onBlur={e => {
          e.target.style.borderColor = "#E8E8F0";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="" disabled>
          {placeholder || "Select an option"}
        </option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

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
        gap: 7,
        background: props.disabled ? "#E8E8F0" : "#6B3FE7",
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        border: "none",
        borderRadius: 14,
        padding: "13px 22px",
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
// ─────────────────────────────────────────────
// DESIGN TOKENS
// ...existing code...

// ── Constants and Types ──────────────────────
const CATEGORIES = [
  { id: "retail", label: "Retail Shop", icon: "🏪" },
  { id: "food", label: "Food & Drink", icon: "🍽️" },
  { id: "grocery", label: "Grocery Store", icon: "🛒" },
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { id: "services", label: "Services", icon: "🛠️" },
  { id: "other", label: "Other", icon: "📦" },
];

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Tanzania", "Uganda", "Rwanda", "Senegal",
  "Côte d'Ivoire", "Cameroon", "Ethiopia", "Angola", "Benin", "Botswana", "Burkina Faso",
  "Burundi", "Cape Verde", "Central African Republic", "Chad", "Comoros", "Republic of the Congo",
  "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea",
  "Eswatini", "Gabon", "Gambia", "Guinea", "Guinea-Bissau", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "São Tomé and Príncipe", "Somalia", "South Sudan", "Sudan", "Seychelles", "Sierra Leone",
  "Togo", "Tunisia", "Zambia", "Zimbabwe", "Other"
];

// African countries with their phone country codes
const AFRICAN_COUNTRY_CODES = [
  { country: "Nigeria", code: "+234", flag: "🇳🇬" },
  { country: "Ghana", code: "+233", flag: "🇬🇭" },
  { country: "Kenya", code: "+254", flag: "🇰🇪" },
  { country: "South Africa", code: "+27", flag: "🇿🇦" },
  { country: "Tanzania", code: "+255", flag: "🇹🇿" },
  { country: "Uganda", code: "+256", flag: "🇺🇬" },
  { country: "Rwanda", code: "+250", flag: "🇷🇼" },
  { country: "Senegal", code: "+221", flag: "🇸🇳" },
  { country: "Côte d'Ivoire", code: "+225", flag: "🇨🇮" },
  { country: "Cameroon", code: "+237", flag: "🇨🇲" },
  { country: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { country: "Angola", code: "+244", flag: "🇦🇴" },
  { country: "Benin", code: "+229", flag: "🇧🇯" },
  { country: "Botswana", code: "+267", flag: "🇧🇼" },
  { country: "Burkina Faso", code: "+226", flag: "🇧🇫" },
  { country: "Burundi", code: "+257", flag: "🇧🇮" },
  { country: "Cape Verde", code: "+238", flag: "🇨🇻" },
  { country: "Central African Republic", code: "+236", flag: "🇨🇫" },
  { country: "Chad", code: "+235", flag: "🇹🇩" },
  { country: "Comoros", code: "+269", flag: "🇰🇲" },
  { country: "Republic of the Congo", code: "+242", flag: "🇨🇬" },
  { country: "Democratic Republic of the Congo", code: "+243", flag: "🇨🇩" },
  { country: "Djibouti", code: "+253", flag: "🇩🇯" },
  { country: "Egypt", code: "+20", flag: "🇪🇬" },
  { country: "Equatorial Guinea", code: "+240", flag: "🇬🇶" },
  { country: "Eritrea", code: "+291", flag: "🇪🇷" },
  { country: "Eswatini", code: "+268", flag: "🇸🇿" },
  { country: "Gabon", code: "+241", flag: "🇬🇦" },
  { country: "Gambia", code: "+220", flag: "🇬🇲" },
  { country: "Guinea", code: "+224", flag: "🇬🇳" },
  { country: "Guinea-Bissau", code: "+245", flag: "🇬🇼" },
  { country: "Lesotho", code: "+266", flag: "🇱🇸" },
  { country: "Liberia", code: "+231", flag: "🇱🇷" },
  { country: "Libya", code: "+218", flag: "🇱🇾" },
  { country: "Madagascar", code: "+261", flag: "🇲🇬" },
  { country: "Malawi", code: "+265", flag: "🇲🇼" },
  { country: "Mali", code: "+223", flag: "🇲🇱" },
  { country: "Mauritania", code: "+222", flag: "🇲🇷" },
  { country: "Mauritius", code: "+230", flag: "🇲🇺" },
  { country: "Morocco", code: "+212", flag: "🇲🇦" },
  { country: "Mozambique", code: "+258", flag: "🇲🇿" },
  { country: "Namibia", code: "+264", flag: "🇳🇦" },
  { country: "Niger", code: "+227", flag: "🇳🇪" },
  { country: "São Tomé and Príncipe", code: "+239", flag: "🇸🇹" },
  { country: "Somalia", code: "+252", flag: "🇸🇴" },
  { country: "South Sudan", code: "+211", flag: "🇸🇸" },
  { country: "Sudan", code: "+249", flag: "🇸🇩" },
  { country: "Seychelles", code: "+248", flag: "🇸🇨" },
  { country: "Sierra Leone", code: "+232", flag: "🇸🇱" },
  { country: "Togo", code: "+228", flag: "🇹🇬" },
  { country: "Tunisia", code: "+216", flag: "🇹🇳" },
  { country: "Zambia", code: "+260", flag: "🇿🇲" },
  { country: "Zimbabwe", code: "+263", flag: "🇿🇼" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Solo", desc: "Just me", icon: "🙋" },
  { id: "small", label: "2–10", desc: "Small team", icon: "👥" },
  { id: "medium", label: "11–50", desc: "Growing fast", icon: "🏢" },
  { id: "large", label: "50+", desc: "Established", icon: "🏗️" },
];

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: "$15",
    priceNum: 15,
    cycle: "/mo",
    tag: null,
    features: [
      "Record Sales, Expenses & Inventory",
      "Basic AI Insights (MO)",
      "Basic Online Storefront",
      "BusmoPay Payment Integration",
      "Manage up to 3 Staff",
      "Basic Sales Analytics",
    ],
    activeBg: "#F4F4F8",
    activeBorder: "#C4C4D4",
    priceColor: "#0A0A0F",
    tagBg: "",
  },
  {
    id: "standard",
    name: "Standard",
    price: "$40",
    priceNum: 40,
    cycle: "/mo",
    tag: "Most Popular",
    features: [
      "Everything in Starter",
      "Advanced AI Insights & Forecasts",
      "Professional Storefront Themes",
      "Priority Store Placement",
      "Manage up to 10 Staff",
      "Advanced Sales Analytics",
      "Advanced Forecasting",
      "Up to 3 Branches",
      "Custom Domain",
      "SEO Optimization Tools",
    ],
    activeBg: "#F3EFFE",
    activeBorder: "#6B3FE7",
    priceColor: "#6B3FE7",
    tagBg: "#6B3FE7",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$80",
    priceNum: 80,
    cycle: "/mo",
    tag: "Best Value",
    features: [
      "Everything in Standard",
      "Premium AI Insights & Consulting",
      "Custom Storefront Design",
      "Featured Store Placement",
      "Unlimited Staff",
      "Custom Reports & Analytics",
      "Advanced Forecasting",
      "Unlimited Branches",
      "Production Tracking",
      "Access to Equity Investment",
      "CAC Compliance (if needed)",
      "Integrated POS & Printer",
    ],
    activeBg: "#FEF3C7",
    activeBorder: "#D97706",
    priceColor: "#D97706",
    tagBg: "#D97706",
  },
];

type FormState = {
  businessName: string;
  description: string;
  email: string;
  password: string;
  fullName: string;
  countryCode: string;
  phone: string;
  country: string;
  businessAnalysis?: any;
};

// ── Step Progress Bar ─────────────────────────
const STEP_META = [
  { id: 1, label: "Business" },
  { id: 2, label: "Describe" },
  { id: 3, label: "Confirm" },
];

function StepProgress({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
      {STEP_META.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, fontFamily: "'Sora', sans-serif",
                background: done || active ? "#6B3FE7" : "white",
                border: `2px solid ${done || active ? "#6B3FE7" : "#E8E8F0"}`,
                color: done || active ? "white" : "#8888A0",
                boxShadow: active ? "0 0 0 4px rgba(107,63,231,0.14)" : "none",
                transition: "all 0.3s",
              }}>
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <polyline points="2.5,7 6,10.5 11.5,3.5" stroke="white" strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : s.id}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: current >= s.id ? "#6B3FE7" : "#8888A0", transition: "color 0.3s",
              }}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 1, margin: "0 10px", marginBottom: 22, borderRadius: 2,
                background: current > s.id ? "#6B3FE7" : "#E8E8F0", transition: "background 0.5s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1 ─────────────────────────────────────
function StepOne({ data, onChange }: { data: FormState; onChange: (k: keyof FormState, v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="What is your business name?" id="businessName" value={data.businessName}
        onChange={(v) => onChange("businessName", v)} placeholder="Femi's Suya Spot" autoComplete="organization" />
      <Field label="Your full name" id="fullName" value={data.fullName}
        onChange={(v) => onChange("fullName", v)} placeholder="Femi Adeleke" autoComplete="name" />
      <Field label="Email address" id="email" type="email" value={data.email}
        onChange={(v) => onChange("email", v)} placeholder="femi@example.com" autoComplete="email" />
      <Field label="Password" id="password" type="password" value={data.password}
        onChange={(v) => onChange("password", v)} placeholder="Min. 6 characters" autoComplete="new-password" />
      <p style={{ fontSize: 11, color: "#8888A0", lineHeight: 1.6 }}>
        By continuing you agree to Busmo's{" "}
        <a href="/terms" style={{ color: "#555568", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "#555568", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</a>.
      </p>
    </div>
  );
}

// ── Step 2 ─────────────────────────────────────
function StepTwo({ data, onChange }: { data: FormState; onChange: (k: keyof FormState, v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label htmlFor="description" style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0F" }}>
          Tell MO about your business
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="We sell jollof rice, grilled chicken and drinks."
          rows={4}
          style={{
            resize: "none", borderRadius: 12, padding: "16px", fontSize: 15,
            color: "#0A0A0F", background: "white", outline: "none", lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif", border: "1.5px solid #E8E8F0", transition: "all 0.2s",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#6B3FE7";
            e.target.style.boxShadow = "0 0 0 3px rgba(107,63,231,0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E8E8F0";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Examples
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "We sell jollof rice, grilled chicken and drinks.",
            "I own a pharmacy and sell medications.",
            "We bake cakes and handle catering events.",
            "I run a salon and beauty studio.",
            "We sell phones and accessories.",
          ].map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange("description", example)}
              style={{
                padding: "10px 14px", borderRadius: 8, cursor: "pointer",
                fontSize: 13, color: "#555568", background: "#FAFAFC",
                border: "1px solid #E8E8F0", textAlign: "left",
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F3EFFE";
                e.currentTarget.style.borderColor = "#6B3FE7";
                e.currentTarget.style.color = "#6B3FE7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#FAFAFC";
                e.currentTarget.style.borderColor = "#E8E8F0";
                e.currentTarget.style.color = "#555568";
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ─────────────────────────────────────
function StepThree({ data, onChange, onEdit }: { data: FormState; onChange: (k: keyof FormState, v: string) => void; onEdit: () => void }) {
  const analysis = data.businessAnalysis;
  
  if (!analysis) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>🤔</div>
        <p style={{ color: "#8888A0" }}>Analyzing your business...</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0A0A0F", marginBottom: 4 }}>
          MO analyzed your business:
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px", background: "#F3EFFE", borderRadius: 12, border: "1px solid #E8E8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Business Type
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#0A0A0F" }}>
            {analysis.businessType}
          </span>
        </div>

        <div style={{ height: 1, background: "#E8E8F0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Recommended Setup
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {analysis.recommendedFeatures?.map((feature: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#1DB954", fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 14, color: "#0A0A0F" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: "12px 16px", borderRadius: 8, cursor: "pointer",
          fontSize: 14, fontWeight: 600, color: "#6B3FE7",
          background: "white", border: "1px solid #6B3FE7",
          fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#F3EFFE";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "white";
        }}
      >
        Edit Description
      </button>
    </div>
  );
}

// ── Step Copy ─────────────────────────────────
const STEP_COPY: Record<number, { title: string; sub: string }> = {
  1: { title: "What's your business name?", sub: "Start by telling us your business name." },
  2: { title: "Tell MO about your business", sub: "Describe what you do and MO will configure Busmo for you." },
  3: { title: "Confirm MO's understanding", sub: "Review MO's analysis and enter Busmo." },
};

// ── Main Onboarding Component ─────────────────
export default function BusmoOnboarding() {
  const [step, setStep] = useState<number>(1);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FormState>({
    businessName: "", description: "", email: "", password: "",
    fullName: "", countryCode: "+234", phone: "", country: "nigeria",
  });

  const handleChange = useCallback((key: keyof FormState, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNext = async () => {
    if (isStepValid(step, data)) {
      if (step === 2) {
        // Moving to step 3 - call business analysis API
        setIsAnalyzing(true);
        setError(null);
        try {
          const response = await fetch('/api/analyze-business', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessName: data.businessName,
              description: data.description,
            }),
          });
          
          const result = await response.json();
          
          if (result.success && result.analysis) {
            setData(prev => ({ ...prev, businessAnalysis: result.analysis }));
            setStep(3);
          } else {
            throw new Error(result.error || 'Failed to analyze business');
          }
        } catch (error: any) {
          console.error('Business analysis error:', error);
          setError(error.message || 'Failed to analyze business. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      } else if (step < 3) {
        setStep((s) => s + 1);
      } else {
        // Step 3 - create account with resilient error handling
        setIsLoading(true);
        setError(null);
        
        // Show setup message
        setError("We're setting things up for you...");
        
        let retryCount = 0;
        const maxRetries = 3;
        let userCreated = false;
        let businessCreated = false;
        let userId: string | null = null;

        while (retryCount < maxRetries && (!userCreated || !businessCreated)) {
          try {
            const { auth, firestore } = initializeFirebase();
            
            // Step 1: Create Firebase Auth user (with duplicate handling)
            if (!userCreated && !userId) {
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                userId = userCredential.user.uid;
                userCreated = true;
                console.log('User created successfully:', userId);
              } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                  // User already exists - try to sign them in instead
                  console.log('User already exists, attempting to sign in...');
                  try {
                    const { signInWithEmailAndPassword } = await import('firebase/auth');
                    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
                    userId = userCredential.user.uid;
                    userCreated = true;
                    console.log('Existing user signed in:', userId);
                  } catch (signInError: any) {
                    console.error('Failed to sign in existing user:', signInError);
                    if (retryCount === maxRetries - 1) {
                      // Last retry failed, but we'll still let them proceed
                      userId = 'fallback-' + Date.now();
                      userCreated = true;
                      console.log('Using fallback user ID:', userId);
                    } else {
                      throw authError;
                    }
                  }
                } else if (authError.code === 'auth/weak-password') {
                  setError('Password should be at least 6 characters.');
                  setIsLoading(false);
                  return;
                } else if (authError.code === 'auth/invalid-email') {
                  setError('Invalid email address.');
                  setIsLoading(false);
                  return;
                } else {
                  throw authError;
                }
              }
            }

            // Step 2: Create user profile document (idempotent)
            if (userId && userCreated) {
              try {
                const userDocRef = doc(firestore, "users", userId);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                  await setDoc(userDocRef, {
                    fullName: data.fullName,
                    email: data.email,
                    phone: `${data.countryCode}${data.phone}`,
                    role: 'Owner',
                    businessId: userId,
                    plan: "starter", // Always start with starter
                    category: data.businessAnalysis?.businessType || "Other",
                    country: data.country,
                    createdAt: Timestamp.now(),
                    avatarContent: '👤',
                    avatarBg: '#6B3FE7',
                    avatarColor: '#fff',
                    displayName: data.fullName,
                    trialStartDate: Timestamp.now(),
                    trialEndDate: Timestamp.fromDate(new Date(Date.now() + (3 * 24 * 60 * 60 * 1000))),
                    subscriptionStatus: 'trial',
                    businessAnalysis: data.businessAnalysis,
                  });
                  console.log('User profile created');
                } else {
                  console.log('User profile already exists, skipping');
                }
              } catch (profileError: any) {
                console.error('Error creating user profile:', profileError);
                // Non-critical, continue anyway
              }
            }

            // Step 3: Create business profile document (idempotent)
            if (userId) {
              try {
                const businessRef = doc(firestore, "businesses", userId);
                const businessDoc = await getDoc(businessRef);
                
                if (!businessDoc.exists()) {
                  await setDoc(businessRef, {
                    ownerId: userId,
                    businessName: data.businessName,
                    category: data.businessAnalysis?.businessType || "Other",
                    country: data.country,
                    description: data.description || "",
                    plan: "starter",
                    staffIds: [userId],
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                    active: true,
                    recommendedCategories: data.businessAnalysis?.recommendedCategories || [],
                    recommendedFeatures: data.businessAnalysis?.recommendedFeatures || [],
                    operationalNeeds: data.businessAnalysis?.operationalNeeds || [],
                    productTypes: data.businessAnalysis?.productTypes || [],
                  });
                  businessCreated = true;
                  console.log('Business profile created');
                } else {
                  businessCreated = true;
                  console.log('Business profile already exists, skipping');
                }
              } catch (businessError: any) {
                console.error('Error creating business profile:', businessError);
                // Non-critical, continue anyway
                businessCreated = true; // Mark as created to avoid retries
              }
            }

            // Step 4: Auto-generate product categories (best effort)
            if (userId && data.businessAnalysis?.recommendedCategories && data.businessAnalysis.recommendedCategories.length > 0) {
              try {
                const categoriesRef = collection(firestore, "businesses", userId, "categories");
                for (const categoryName of data.businessAnalysis.recommendedCategories) {
                  await addDoc(categoriesRef, {
                    name: categoryName,
                    active: true,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                  });
                }
                console.log('Product categories created');
              } catch (categoriesError: any) {
                console.error('Error creating product categories:', categoriesError);
                // Non-critical, continue anyway
              }
            }

            // If we got here, success!
            break;

          } catch (error: any) {
            retryCount++;
            console.error(`Onboarding attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              console.error('Max retries reached, allowing user to proceed with partial setup');
              // Even if everything failed, we let them in
              break;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        // Always allow entry to Busmo, regardless of setup status
        setError(null);
        setDone(true);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleEdit = () => {
    setStep(2);
  };

  const valid = isStepValid(step, data);

  if (done) {
    return (
      <OnboardingShell>
        <SuccessScreen
          name={data.fullName}
          bizName={data.businessName}
          onDashboard={() => { window.location.href = "/owner"; }}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#ffffff"></circle>
            <circle cx="40" cy="40" r="36" fill="none" stroke="#ffffff" strokeWidth="1.5"></circle>
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
            <ellipse cx="40" cy="66" rx="15" ry="6" fill="#36119c" opacity="0.9"></ellipse>
            <rect x="32" y="56" width="16" height="10" rx="5" fill="#F5C9A0"></rect>
            <path d="M58 58 Q68 52 70 44" stroke="#F5C9A0" strokeWidth="5" strokeLinecap="round" fill="none"></path>
            <circle cx="70" cy="42" r="5" fill="#F5C9A0"></circle>
            <rect x="65" y="35" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(-8 65 35)"></rect>
            <rect x="70" y="34" width="5" height="10" rx="2.5" fill="#F5C9A0"></rect>
            <rect x="75" y="36" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(8 75 36)"></rect>
          </svg>
        </div>
        <span style={{
          fontSize: 12, color: "#8888A0", fontWeight: 500, letterSpacing: "0.04em"
        }}>
          {step} / 3
        </span>
      </div>

      <StepProgress current={step} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 4 }}>
          {STEP_COPY[step].title}
        </h1>
        <p style={{ fontSize: 14, color: "#8888A0", lineHeight: 1.55 }}>
          {STEP_COPY[step].sub}
        </p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {step === 1 && <StepOne data={data} onChange={handleChange} />}
      {step === 2 && <StepTwo data={data} onChange={handleChange} />}
      {step === 3 && <StepThree data={data} onChange={handleChange} onEdit={handleEdit} />}

      {/* Nav */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, paddingTop: 4,
        justifyContent: step === 1 ? "flex-end" : "space-between",
      }}>
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 14, fontWeight: 600, color: "#8888A0",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", padding: 0, transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#555568")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8888A0")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}

        <PrimaryBtn onClick={handleNext} disabled={!valid || isLoading || isAnalyzing}>
          {step < 2 ? "Continue" : step === 2 ? (isAnalyzing ? "Analyzing..." : "Analyze Business") : isLoading ? "Setting up..." : "Enter Busmo"}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PrimaryBtn>
      </div>

      {step === 1 && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#8888A0", marginTop: -4 }}>
          Already have an account?{" "}
          <a href="/login"
            style={{ color: "#6B3FE7", fontWeight: 600, textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
            Log in
          </a>
        </p>
      )}
    </OnboardingShell>
  );
}

// ── Shell ──────────────────────────────────────
function OnboardingShell({ children }: { children: React.ReactNode }) {
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

function isStepValid(step: number, data: FormState) {
  if (step === 1) {
    return (
      !!data.businessName.trim() &&
      !!data.fullName.trim() &&
      !!data.email.trim() &&
      !!data.password.trim() &&
      data.password.length >= 6
    );
  }
  if (step === 2) {
    return !!data.description.trim();
  }
  if (step === 3) {
    return !!data.businessAnalysis;
  }
  return false;
}

// ── SuccessScreen ─────────────────────────────
function SuccessScreen({
  name,
  bizName,
  onDashboard,
}: {
  name: string;
  bizName: string;
  onDashboard: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: 48, marginBottom: 16 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="#ffffff"></circle>
          <circle cx="40" cy="40" r="36" fill="none" stroke="#1DB954" strokeWidth="1.5"></circle>
          <rect x="10" y="10" width="7" height="4" rx="1.5" fill="#1DB954" transform="rotate(25 10 10)" opacity="0.8"></rect>
          <rect x="64" y="12" width="6" height="3.5" rx="1.5" fill="#F4A535" transform="rotate(-18 64 12)" opacity="0.8"></rect>
          <rect x="60" y="28" width="5" height="3" rx="1.2" fill="#E8503A" transform="rotate(38 60 28)" opacity="0.7"></rect>
          <rect x="14" y="34" width="5" height="3" rx="1.2" fill="#4A90D9" transform="rotate(-25 14 34)" opacity="0.7"></rect>
          <polygon points="40,7 28,36 52,36" fill="#F4A535" opacity="0.85"></polygon>
          <circle cx="40" cy="7" r="3" fill="#E8503A"></circle>
          <circle cx="40" cy="37" r="19" fill="#F5C9A0"></circle>
          <path d="M21 30 C23 21 57 21 59 30 L58 26 C56 16 24 16 22 26 Z" fill="#2C1A0E"></path>
          <path d="M29 33 Q32 29 35 33" stroke="#1A2B3C" stroke-width="2" stroke-linecap="round" fill="none"></path>
          <path d="M45 33 Q48 29 51 33" stroke="#1A2B3C" stroke-width="2" stroke-linecap="round" fill="none"></path>
          <path d="M28 42 Q40 51 52 42" stroke="#CC7A3A" stroke-width="2.2" stroke-linecap="round" fill="rgba(255,200,150,0.3)"></path>
          <ellipse cx="23" cy="40" rx="3.5" ry="2" fill="#F4A535" opacity="0.42"></ellipse>
          <ellipse cx="57" cy="40" rx="3.5" ry="2" fill="#F4A535" opacity="0.42"></ellipse>
          <ellipse cx="40" cy="67" rx="15" ry="5.5" fill="#159040" opacity="0.9"></ellipse>
          <rect x="32" y="58" width="16" height="9" rx="4.5" fill="#F5C9A0"></rect>
          <path d="M20 60 Q10 52 12 40" stroke="#F5C9A0" stroke-width="5" stroke-linecap="round" fill="none"></path>
          <path d="M60 60 Q70 52 68 40" stroke="#F5C9A0" stroke-width="5" stroke-linecap="round" fill="none"></path>
          <circle cx="12" cy="38" r="5" fill="#F5C9A0"></circle>
          <circle cx="68" cy="38" r="5" fill="#F5C9A0"></circle>
        </svg>
      </div>
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
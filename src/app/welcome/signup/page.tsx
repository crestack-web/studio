"use client";

// import { StepId } from "framer-motion"; // removed - not exported
import { useState, useCallback, useEffect } from "react";
import { initializeFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, Timestamp, collection, addDoc, getDoc } from "firebase/firestore";
import { formatCurrency } from "@/lib/currency";
import { sendOwnerWelcomeEmailSeries } from "@/services/email/owner-welcome-series";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {prefix && (
          <span style={{ fontSize: 13, color: "#8888A0", padding: "0 8px" }}>{prefix}</span>
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
            borderRadius: 11,
            padding: "11px 14px",
            fontSize: 13,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: "#555568" }}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          borderRadius: 11,
          padding: "11px 14px",
          fontSize: 13,
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
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// DESIGN TOKENS
// ...existing code...

// ΓöÇΓöÇ Constants and Types ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const CATEGORIES = [
  { id: "retail", label: "Retail Shop", icon: "🏪" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "grocery", label: "Grocery Store", icon: "🛒" },
  { id: "fashion", label: "Fashion", icon: "👗" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { id: "services", label: "Services", icon: "🛠️" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊" },
  { id: "supermarket", label: "Supermarket", icon: "🏬" },
  { id: "cafe", label: "Cafe", icon: "☕" },
  { id: "wholesale", label: "Wholesale", icon: "📦" },
  { id: "distributor", label: "Distributor", icon: "🚚" },
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "other", label: "Other", icon: "📦" },
];

// Features available for each category
const CATEGORY_FEATURES: Record<string, string[]> = {
  retail: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Credit Tracking",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  restaurant: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Menu Management",
    "Ingredient Tracking",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  grocery: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  fashion: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "E-commerce Storefront",
  ],
  electronics: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "E-commerce Storefront",
  ],
  manufacturing: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Production Tracking",
    "Expense Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "Multi-branch Support",
  ],
  services: [
    "Sales Recording",
    "Staff Management",
    "Cash Flow Analysis",
    "Expense Management",
    "Customer Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  pharmacy: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  supermarket: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "Multi-branch Support",
  ],
  cafe: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Menu Management",
    "Ingredient Tracking",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  wholesale: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Credit Tracking",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "Multi-branch Support",
  ],
  distributor: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Credit Tracking",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
    "Multi-branch Support",
  ],
  healthcare: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expiry Alerts",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  education: [
    "Sales Recording",
    "Staff Management",
    "Cash Flow Analysis",
    "Expense Management",
    "Customer Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
  other: [
    "Sales Recording",
    "Inventory Tracking",
    "Staff Management",
    "Cash Flow Analysis",
    "Expense Management",
    "Customer Management",
    "Supplier Management",
    "Profit/Loss Reports",
    "Business Analytics",
    "Ask MO AI Assistant",
  ],
};

// Features that require Pro plan
const PRO_ONLY_FEATURES = [
  "Multi-branch Support",
  "Production Tracking",
  "Payroll Management",
  "E-commerce Storefront",
];

// Features that require Standard or Pro plan
const STANDARD_OR_PRO_FEATURES = [
  "Credit Tracking",
  "Menu Management",
  "Ingredient Tracking",
];

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Tanzania", "Uganda", "Rwanda", "Senegal",
  "C├┤te d'Ivoire", "Cameroon", "Ethiopia", "Angola", "Benin", "Botswana", "Burkina Faso",
  "Burundi", "Cape Verde", "Central African Republic", "Chad", "Comoros", "Republic of the Congo",
  "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea",
  "Eswatini", "Gabon", "Gambia", "Guinea", "Guinea-Bissau", "Lesotho", "Liberia", "Libya",
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia",
  "Niger", "S├úo Tom├⌐ and Pr├¡ncipe", "Somalia", "South Sudan", "Sudan", "Seychelles", "Sierra Leone",
  "Togo", "Tunisia", "Zambia", "Zimbabwe", "Other"
];

// African countries with their phone country codes
const AFRICAN_COUNTRY_CODES = [
  { country: "Nigeria", code: "+234", flag: "≡ƒç│≡ƒç¼" },
  { country: "Ghana", code: "+233", flag: "≡ƒç¼≡ƒç¡" },
  { country: "Kenya", code: "+254", flag: "≡ƒç░≡ƒç¬" },
  { country: "South Africa", code: "+27", flag: "≡ƒç┐≡ƒçª" },
  { country: "Tanzania", code: "+255", flag: "≡ƒç╣≡ƒç┐" },
  { country: "Uganda", code: "+256", flag: "≡ƒç║≡ƒç¼" },
  { country: "Rwanda", code: "+250", flag: "≡ƒç╖≡ƒç╝" },
  { country: "Senegal", code: "+221", flag: "≡ƒç╕≡ƒç│" },
  { country: "C├┤te d'Ivoire", code: "+225", flag: "≡ƒç¿≡ƒç«" },
  { country: "Cameroon", code: "+237", flag: "≡ƒç¿≡ƒç▓" },
  { country: "Ethiopia", code: "+251", flag: "≡ƒç¬≡ƒç╣" },
  { country: "Angola", code: "+244", flag: "≡ƒçª≡ƒç┤" },
  { country: "Benin", code: "+229", flag: "≡ƒçº≡ƒç»" },
  { country: "Botswana", code: "+267", flag: "≡ƒçº≡ƒç╝" },
  { country: "Burkina Faso", code: "+226", flag: "≡ƒçº≡ƒç½" },
  { country: "Burundi", code: "+257", flag: "≡ƒçº≡ƒç«" },
  { country: "Cape Verde", code: "+238", flag: "≡ƒç¿≡ƒç╗" },
  { country: "Central African Republic", code: "+236", flag: "≡ƒç¿≡ƒç½" },
  { country: "Chad", code: "+235", flag: "≡ƒç╣≡ƒç⌐" },
  { country: "Comoros", code: "+269", flag: "≡ƒç░≡ƒç▓" },
  { country: "Republic of the Congo", code: "+242", flag: "≡ƒç¿≡ƒç¼" },
  { country: "Democratic Republic of the Congo", code: "+243", flag: "≡ƒç¿≡ƒç⌐" },
  { country: "Djibouti", code: "+253", flag: "≡ƒç⌐≡ƒç»" },
  { country: "Egypt", code: "+20", flag: "≡ƒç¬≡ƒç¼" },
  { country: "Equatorial Guinea", code: "+240", flag: "≡ƒç¼≡ƒç╢" },
  { country: "Eritrea", code: "+291", flag: "≡ƒç¬≡ƒç╖" },
  { country: "Eswatini", code: "+268", flag: "≡ƒç╕≡ƒç┐" },
  { country: "Gabon", code: "+241", flag: "≡ƒç¼≡ƒçª" },
  { country: "Gambia", code: "+220", flag: "≡ƒç¼≡ƒç▓" },
  { country: "Guinea", code: "+224", flag: "≡ƒç¼≡ƒç│" },
  { country: "Guinea-Bissau", code: "+245", flag: "≡ƒç¼≡ƒç╝" },
  { country: "Lesotho", code: "+266", flag: "≡ƒç▒≡ƒç╕" },
  { country: "Liberia", code: "+231", flag: "≡ƒç▒≡ƒç╖" },
  { country: "Libya", code: "+218", flag: "≡ƒç▒≡ƒç╛" },
  { country: "Madagascar", code: "+261", flag: "≡ƒç▓≡ƒç¼" },
  { country: "Malawi", code: "+265", flag: "≡ƒç▓≡ƒç╝" },
  { country: "Mali", code: "+223", flag: "≡ƒç▓≡ƒç▒" },
  { country: "Mauritania", code: "+222", flag: "≡ƒç▓≡ƒç╖" },
  { country: "Mauritius", code: "+230", flag: "≡ƒç▓≡ƒç║" },
  { country: "Morocco", code: "+212", flag: "≡ƒç▓≡ƒçª" },
  { country: "Mozambique", code: "+258", flag: "≡ƒç▓≡ƒç┐" },
  { country: "Namibia", code: "+264", flag: "≡ƒç│≡ƒçª" },
  { country: "Niger", code: "+227", flag: "≡ƒç│≡ƒç¬" },
  { country: "S├úo Tom├⌐ and Pr├¡ncipe", code: "+239", flag: "≡ƒç╕≡ƒç╣" },
  { country: "Somalia", code: "+252", flag: "≡ƒç╕≡ƒç┤" },
  { country: "South Sudan", code: "+211", flag: "≡ƒç╕≡ƒç╕" },
  { country: "Sudan", code: "+249", flag: "≡ƒç╕≡ƒç⌐" },
  { country: "Seychelles", code: "+248", flag: "≡ƒç╕≡ƒç¿" },
  { country: "Sierra Leone", code: "+232", flag: "≡ƒç╕≡ƒç▒" },
  { country: "Togo", code: "+228", flag: "≡ƒç╣≡ƒç¼" },
  { country: "Tunisia", code: "+216", flag: "≡ƒç╣≡ƒç│" },
  { country: "Zambia", code: "+260", flag: "≡ƒç┐≡ƒç▓" },
  { country: "Zimbabwe", code: "+263", flag: "≡ƒç┐≡ƒç╝" },
];

const TEAM_SIZES = [
  { id: "solo", label: "Solo", desc: "Just me", icon: "≡ƒÖï" },
  { id: "small", label: "2ΓÇô10", desc: "Small team", icon: "≡ƒæÑ" },
  { id: "medium", label: "11ΓÇô50", desc: "Growing fast", icon: "≡ƒÅó" },
  { id: "large", label: "50+", desc: "Established", icon: "≡ƒÅù∩╕Å" },
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
  selectedCategory?: string;
  selectedFeatures?: string[];
  googleUserId?: string;
};

// ΓöÇΓöÇ Step Progress Bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

// ΓöÇΓöÇ Step 1 ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function StepOne({ data, onChange, onGoogleSignIn }: { 
  data: FormState; 
  onChange: (k: keyof FormState, v: string) => void;
  onGoogleSignIn: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Field label="What is your business name?" id="businessName" value={data.businessName}
        onChange={(v) => onChange("businessName", v)} placeholder="Femi's Suya Spot" autoComplete="organization" />
      <Field label="Your full name" id="fullName" value={data.fullName}
        onChange={(v) => onChange("fullName", v)} placeholder="Femi Adeleke" autoComplete="name" />
      <Field label="Email address" id="email" type="email" value={data.email}
        onChange={(v) => onChange("email", v)} placeholder="femi@example.com" autoComplete="email" />
      <Field label="Phone number" id="phone" type="tel" value={data.phone}
        onChange={(v) => onChange("phone", v)} placeholder="08012345678" autoComplete="tel" />
      <Field label="Password" id="password" type="password" value={data.password}
        onChange={(v) => onChange("password", v)} placeholder="Min. 6 characters" autoComplete="new-password" />
      
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
        <span style={{ fontSize: 11, color: "#8888A0" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
      </div>

      <button
        type="button"
        onClick={onGoogleSignIn}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "11px 22px",
          borderRadius: 12,
          background: "white",
          border: "1.5px solid #E8E8F0",
          cursor: "pointer",
          color: "#0A0A0F",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6B3FE7";
          e.currentTarget.style.background = "#F4F4F8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#E8E8F0";
          e.currentTarget.style.background = "white";
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign up with Google
      </button>

      <p style={{ fontSize: 10, color: "#8888A0", lineHeight: 1.6 }}>
        By continuing you agree to Busmo's{" "}
        <a href="/terms" style={{ color: "#555568", textDecoration: "underline", textUnderlineOffset: 2 }}>Terms of Service</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "#555568", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy Policy</a>.
      </p>
    </div>
  );
}

// ΓöÇΓöÇ Step 2 ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function StepTwo({ data, onChange }: { data: FormState; onChange: (k: keyof FormState, v: string | string[]) => void }) {
  const [selectedCategory, setSelectedCategory] = useState(data.selectedCategory || "retail");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Array.isArray(data.selectedFeatures) ? data.selectedFeatures : 
    (typeof data.selectedFeatures === 'string' ? JSON.parse(data.selectedFeatures) : CATEGORY_FEATURES["retail"])
  );

  // Sync local state with parent data when it changes (e.g., after Google auth)
  useEffect(() => {
    if (data.selectedCategory && data.selectedCategory !== selectedCategory) {
      setSelectedCategory(data.selectedCategory);
    }
    if (data.selectedFeatures && Array.isArray(data.selectedFeatures) && data.selectedFeatures !== selectedFeatures) {
      setSelectedFeatures(data.selectedFeatures);
    }
  }, [data.selectedCategory, data.selectedFeatures]);

  // Get features for selected category
  const availableFeatures = CATEGORY_FEATURES[selectedCategory] || CATEGORY_FEATURES["retail"];

  const getRecommendedPlan = (features: string[]): { plan: string; reason: string } => {
    const hasProFeatures = features.some(f => PRO_ONLY_FEATURES.includes(f));
    const hasStandardOrProFeatures = features.some(f => STANDARD_OR_PRO_FEATURES.includes(f));
    const hasManyFeatures = features.length >= 8;
    
    if (hasProFeatures) {
      return {
        plan: "pro",
        reason: "Your selected features require advanced capabilities available in the Pro plan."
      };
    }
    if (hasStandardOrProFeatures || hasManyFeatures) {
      return {
        plan: "standard",
        reason: "Your selected features require advanced capabilities available in the Standard plan."
      };
    }
    return {
      plan: "starter",
      reason: "The Starter plan covers all your selected features perfectly."
    };
  };

  const { plan: recommendedPlan, reason: planReason } = getRecommendedPlan(selectedFeatures);

  const toggleFeature = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(newFeatures);
    // Update parent state
    onChange("selectedFeatures", newFeatures);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onChange("selectedCategory", category);
    // Reset features to category defaults when category changes
    const categoryDefaults = CATEGORY_FEATURES[category] || CATEGORY_FEATURES["retail"];
    setSelectedFeatures(categoryDefaults);
    onChange("selectedFeatures", categoryDefaults);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Category Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0F" }}>
          Select your business category
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: selectedCategory === cat.id ? "#6B3FE7" : "#555568",
                background: selectedCategory === cat.id ? "#F3EFFE" : "white",
                border: selectedCategory === cat.id ? "2px solid #6B3FE7" : "1.5px solid #E8E8F0",
                textAlign: "left", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.borderColor = "#6B3FE7";
                  e.currentTarget.style.background = "#FAFAFC";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.id) {
                  e.currentTarget.style.borderColor = "#E8E8F0";
                  e.currentTarget.style.background = "white";
                }
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0F" }}>
          Select features you need ({selectedFeatures.length} selected)
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, maxHeight: 220, overflowY: "auto", padding: 3 }}>
          {availableFeatures.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              style={{
                padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                fontSize: 12, color: selectedFeatures.includes(feature) ? "#6B3FE7" : "#555568",
                background: selectedFeatures.includes(feature) ? "#F3EFFE" : "white",
                border: selectedFeatures.includes(feature) ? "1.5px solid #6B3FE7" : "1px solid #E8E8F0",
                textAlign: "left", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6B3FE7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = selectedFeatures.includes(feature) ? "1.5px solid #6B3FE7" : "#E8E8F0";
              }}
              title={
                PRO_ONLY_FEATURES.includes(feature) ? "Pro plan feature" :
                STANDARD_OR_PRO_FEATURES.includes(feature) ? "Standard or Pro plan feature" :
                ""
              }
            >
              <span style={{ fontSize: 13 }}>
                {selectedFeatures.includes(feature) ? "✓" : "○"}
              </span>
              <span>{feature}</span>
              {PRO_ONLY_FEATURES.includes(feature) && <span style={{ fontSize: 9, color: "#D97706", marginLeft: "auto" }}>PRO</span>}
              {STANDARD_OR_PRO_FEATURES.includes(feature) && !PRO_ONLY_FEATURES.includes(feature) && <span style={{ fontSize: 9, color: "#6B3FE7", marginLeft: "auto" }}>STD+</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Recommendation */}
      <div style={{ 
        padding: "14px", borderRadius: 10, background: "#F3EFFE", 
        border: "1.5px solid #6B3FE7", display: "flex", flexDirection: "column", gap: 6 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#6B3FE7", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Recommended Plan
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0A0A0F", textTransform: "capitalize" }}>
          {recommendedPlan} Plan
        </div>
        <p style={{ fontSize: 12, color: "#555568", margin: 0, lineHeight: 1.5 }}>
          {planReason}
        </p>
      </div>
    </div>
  );
}

// ── Step 3 ───────────────────────────────────────────────────────────────────────────────
function StepThree({ data, onChange, onEdit }: { data: FormState; onChange: (k: keyof FormState, v: string) => void; onEdit: () => void }) {
  const analysis = data.businessAnalysis;
  
  if (!analysis) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 20, marginBottom: 12 }}>🤔</div>
        <p style={{ color: "#8888A0", fontSize: 13 }}>Analyzing your business...</p>
      </div>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter': return { bg: '#F4F4F8', border: '#C4C4D4', text: '#0A0A0F' };
      case 'standard': return { bg: '#F3EFFE', border: '#6B3FE7', text: '#6B3FE7' };
      case 'pro': return { bg: '#FEF3C7', border: '#D97706', text: '#D97706' };
      default: return { bg: '#F4F4F8', border: '#C4C4D4', text: '#0A0A0F' };
    }
  };

  const planColors = getPlanColor(analysis.recommendedPlan || 'starter');

  // Parse selected features if stored as string
  let selectedFeatures = data.selectedFeatures;
  if (typeof selectedFeatures === 'string') {
    try {
      selectedFeatures = JSON.parse(selectedFeatures);
    } catch (e) {
      selectedFeatures = [];
    }
  }

  // Get category label
  const categoryLabel = CATEGORIES.find(c => c.id === data.selectedCategory)?.label || analysis.businessType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", marginBottom: 3 }}>
          Your Busmo setup:
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", background: "#F3EFFE", borderRadius: 10, border: "1px solid #E8E8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Business Category
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0F" }}>
            {categoryLabel}
          </span>
        </div>

        <div style={{ height: 1, background: "#E8E8F0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Recommended Plan
          </span>
          <div style={{ 
            padding: "10px 12px", 
            background: planColors.bg, 
            border: `2px solid ${planColors.border}`, 
            borderRadius: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: planColors.text, textTransform: "capitalize" }}>
                {analysis.recommendedPlan} Plan
              </span>
              {analysis.recommendedPlanReason && (
                <p style={{ fontSize: 11, color: "#555568", marginTop: 3 }}>
                  {analysis.recommendedPlanReason}
                </p>
              )}
            </div>
            <div style={{ fontSize: 20 }}>💡</div>
          </div>
        </div>

        <div style={{ height: 1, background: "#E8E8F0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Selected Features ({selectedFeatures?.length || 0})
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(selectedFeatures || analysis.recommendedFeatures || []).map((feature: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#1DB954", fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 12, color: "#0A0A0F" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {analysis.recommendedCategories && analysis.recommendedCategories.length > 0 && (
          <>
            <div style={{ height: 1, background: "#E8E8F0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Product Categories
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.recommendedCategories.map((category: string, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#6B3FE7", fontSize: 14 }}>📁</span>
                    <span style={{ fontSize: 12, color: "#0A0A0F" }}>{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: "10px 14px", borderRadius: 7, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#6B3FE7",
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
        Edit Selections
      </button>
    </div>
  );
}

// ΓöÇΓöÇ Step Copy ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
const STEP_COPY: Record<number, { title: string; sub: string }> = {
  1: { title: "What's your business name?", sub: "Start by telling us your business name." },
  2: { title: "Configure your Busmo", sub: "Select your business category and features you need." },
  3: { title: "Review your setup", sub: "Review your selections and enter Busmo." },
};

// ΓöÇΓöÇ Main Onboarding Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function BusmoOnboarding() {
  const [step, setStep] = useState<number>(1);
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const [data, setData] = useState<FormState>({
    businessName: "", description: "", email: "", password: "",
    fullName: "", countryCode: "+234", phone: "", country: "nigeria",
    selectedCategory: "retail",
    selectedFeatures: ["Sales Recording", "Inventory Tracking", "Staff Management"],
  });

  const handleChange = useCallback((key: keyof FormState, value: string | string[]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Check for trial information and referral code
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isTrial = searchParams.get('trial');
    const ref = searchParams.get('ref');
    
    // Capture referral code from URL
    if (ref) {
      setReferralCode(ref);
      console.log('Referral code captured:', ref);
    }
    
    if (isTrial === 'true') {
      const trialInfoStr = localStorage.getItem('busmo_trial_info');
      if (trialInfoStr) {
        try {
          const trialInfo = JSON.parse(trialInfoStr);
          console.log('Trial info found:', trialInfo);
          // Store trial info in state for use during account creation
          setTrialInfo(trialInfo);
        } catch (error) {
          console.error('Error parsing trial info:', error);
        }
      }
    }
  }, []);

  const handleNext = async () => {
    if (isStepValid(step, data)) {
      if (step === 2) {
        // Moving to step 3 - create business analysis from manual selections
        setIsAnalyzing(true);
        setError(null);
        
        try {
          // Parse selected features from JSON string if needed
          let selectedFeatures = data.selectedFeatures;
          if (typeof selectedFeatures === 'string') {
            selectedFeatures = JSON.parse(selectedFeatures);
          }
          
          // Get category label from ID
          const categoryLabel = CATEGORIES.find(c => c.id === data.selectedCategory)?.label || 'Retail Shop';
          
          // Determine recommended plan based on selected features using new logic
          const hasProFeatures = selectedFeatures?.some((f: string) => PRO_ONLY_FEATURES.includes(f));
          const hasStandardOrProFeatures = selectedFeatures?.some((f: string) => STANDARD_OR_PRO_FEATURES.includes(f));
          const hasManyFeatures = (selectedFeatures?.length ?? 0) >= 8;
          
          let recommendedPlan = 'starter';
          let recommendedPlanReason = 'The Starter plan covers all your selected features perfectly.';
          
          if (hasProFeatures) {
            recommendedPlan = 'pro';
            recommendedPlanReason = 'Your selected features require advanced capabilities available in the Pro plan.';
          } else if (hasStandardOrProFeatures || hasManyFeatures) {
            recommendedPlan = 'standard';
            recommendedPlanReason = 'Your selected features require advanced capabilities available in the Standard plan.';
          }
          
          // Create business analysis from manual selections
          const manualAnalysis = {
            businessType: categoryLabel,
            businessTypeConfidence: 1.0, // High confidence since user manually selected
            operationalNeeds: selectedFeatures?.slice(0, 4) || ['Inventory Management', 'Staff Management'],
            productTypes: ['Products'],
            recommendedCategories: [categoryLabel, 'General'],
            recommendedFeatures: selectedFeatures || ['Sales Recording', 'Inventory Tracking', 'Staff Management'],
            recommendedPlan: recommendedPlan,
            recommendedPlanReason: recommendedPlanReason,
            teamSizeEstimate: 'solo',
            complexityScore: (selectedFeatures?.length ?? 0) >= 8 ? 6 : 3
          };
          
          setData(prev => ({ ...prev, businessAnalysis: manualAnalysis }));
          setStep(3);
        } catch (error: any) {
          console.error('Error creating manual analysis:', error);
          // Use fallback analysis and continue onboarding
          const fallbackAnalysis = {
            businessType: 'Retail Store',
            businessTypeConfidence: 0.5,
            operationalNeeds: ['Inventory Management', 'Staff Management', 'Sales Tracking', 'Expense Tracking'],
            productTypes: ['Products', 'Services'],
            recommendedCategories: ['General', 'Featured Items', 'Services'],
            recommendedFeatures: ['Sales Recording', 'Inventory Tracking', 'Staff Management', 'Cash Flow Analysis', 'Expense Management', 'Business Analytics'],
            recommendedPlan: 'starter',
            recommendedPlanReason: 'Based on limited information, Starter plan is recommended as a starting point. You can upgrade anytime as your business grows.',
            teamSizeEstimate: 'solo',
            complexityScore: 3
          };
          setData(prev => ({ ...prev, businessAnalysis: fallbackAnalysis }));
          setStep(3);
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
            
            // Step 1: Handle Firebase Auth user creation
            if (!userCreated && !userId) {
              try {
                // For Google auth users, use the Google user ID directly
                if (data.googleUserId) {
                  userId = data.googleUserId;
                  userCreated = true;
                  console.log('Using Google authenticated user ID:', userId);
                } else {
                  // Check if user is already authenticated
                  const currentUser = auth.currentUser;
                  if (currentUser && currentUser.email === data.email) {
                    userId = currentUser.uid;
                    userCreated = true;
                    console.log('User already authenticated:', userId);
                  } else {
                    // Create new user with email/password
                    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                    userId = userCredential.user.uid;
                    userCreated = true;
                    console.log('User created successfully:', userId);
                  }
                }
              } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use' && !data.googleUserId) {
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
                } else if (data.googleUserId) {
                  // For Google auth users, use the Google ID even if other errors occur
                  console.log('Using Google ID despite error:', data.googleUserId);
                  userId = data.googleUserId;
                  userCreated = true;
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
                  // Use trial info from pricing page if available, otherwise use default 3-day trial
                  const trialStart = trialInfo?.trialStart ? new Date(trialInfo.trialStart) : new Date();
                  const trialEnd = trialInfo?.trialEnd ? new Date(trialInfo.trialEnd) : new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
                  const selectedPlan = trialInfo?.plan || "starter";
                  
                  await setDoc(userDocRef, {
                    fullName: data.fullName,
                    email: data.email,
                    phone: `${data.countryCode}${data.phone}`,
                    role: 'Owner',
                    businessId: userId,
                    plan: selectedPlan,
                    category: CATEGORIES.find(c => c.id === data.selectedCategory)?.label || data.businessAnalysis?.businessType || "Retail Shop",
                    country: data.country,
                    createdAt: Timestamp.now(),
                    avatarContent: '👤',
                    avatarBg: '#6B3FE7',
                    avatarColor: '#fff',
                    displayName: data.fullName,
                    trialStartDate: Timestamp.fromDate(trialStart),
                    trialEndDate: Timestamp.fromDate(trialEnd),
                    subscriptionStatus: 'trial',
                    businessAnalysis: data.businessAnalysis,
                    selectedCategory: data.selectedCategory,
                    selectedFeatures: data.selectedFeatures,
                  });
                  console.log('User profile created with trial info');
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
                    category: CATEGORIES.find(c => c.id === data.selectedCategory)?.label || data.businessAnalysis?.businessType || "Retail Shop",
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
                    selectedCategory: data.selectedCategory,
                    selectedFeatures: data.selectedFeatures,
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
        
        // Track referral if user was referred
        if (referralCode && userId) {
          try {
            const trackResponse = await fetch('/api/referrals/track-signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                referredId: userId,
                referrerId: referralCode,
                signupData: {
                  email: data.email,
                  name: data.fullName,
                }
              }),
            });
            
            if (trackResponse.ok) {
              console.log('✅ Referral tracked successfully');
            } else {
              const trackData = await trackResponse.json();
              console.warn('Failed to track referral:', trackData.error);
            }
          } catch (referralError) {
            console.error('Error tracking referral:', referralError);
            // Non-critical: user can still use the app even if referral tracking fails
          }
        }
        
        // Send welcome email series to owner (non-blocking)
        sendOwnerWelcomeEmailSeries({
          email: data.email,
          name: data.fullName,
          businessName: data.businessName,
        }).catch((emailError) => {
          console.error('Failed to send owner welcome email series:', emailError);
          // Non-critical: user can still use the app even if emails fail
        });
        
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { auth, firestore } = initializeFirebase();
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Update form data with Google user info and default category/features
      setData(prev => ({
        ...prev,
        email: user.email || prev.email,
        fullName: user.displayName || prev.fullName,
        businessName: prev.businessName || `${user.displayName || 'My'} Business`,
        selectedCategory: prev.selectedCategory || "retail",
        selectedFeatures: Array.isArray(prev.selectedFeatures) ? prev.selectedFeatures : CATEGORY_FEATURES["retail"],
        googleUserId: user.uid,
      }));

      // Set Google auth flag
      setIsGoogleAuth(true);

      // Auto-advance to step 2 after Google auth
      setStep(2);
    } catch (error: any) {
      setError("Google sign-up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const valid = isStepValid(step, data, isGoogleAuth);

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="70" height="70" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          fontSize: 11, color: "#8888A0", fontWeight: 500, letterSpacing: "0.04em"
        }}>
          {step} / 3
        </span>
      </div>

      <StepProgress current={step} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: -3 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0A0A0F",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 3 }}>
          {STEP_COPY[step].title}
        </h1>
        <p style={{ fontSize: 13, color: "#8888A0", lineHeight: 1.55 }}>
          {STEP_COPY[step].sub}
        </p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      {step === 1 && <StepOne data={data} onChange={handleChange} onGoogleSignIn={handleGoogleSignIn} />}
      {step === 2 && <StepTwo data={data} onChange={handleChange} />}
      {step === 3 && <StepThree data={data} onChange={handleChange} onEdit={handleEdit} />}

      {/* Nav */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, paddingTop: 3,
        justifyContent: step === 1 ? "flex-end" : "space-between",
      }}>
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 13, fontWeight: 600, color: "#8888A0",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", padding: 0, transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#555568")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8888A0")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}

        <PrimaryBtn onClick={handleNext} disabled={!valid || isLoading || isAnalyzing}>
          {step < 2 ? "Continue" : step === 2 ? "Continue" : isLoading ? "Setting up..." : "Enter Busmo"}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </PrimaryBtn>
      </div>

      {step === 1 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#8888A0", marginTop: -3 }}>
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

// ΓöÇΓöÇ Shell ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 12px",
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

      <div style={{ position: "relative", width: "100%", maxWidth: 420, zIndex: 1,
        display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          background: "white", borderRadius: 24, padding: "24px 22px",
          border: "1px solid #E8E8F0",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(107,63,231,0.09)",
          display: "flex", flexDirection: "column", gap: 18,
        }}>
          {children}
        </div>
        <p style={{ textAlign: "center", fontSize: 10, color: "#8888A0" }}>
          © {new Date().getFullYear()} Busmo • Built for African commerce
        </p>
      </div>
    </div>
  );
}

function isStepValid(step: number, data: FormState, isGoogleAuth: boolean = false) {
  if (step === 1) {
    if (isGoogleAuth) {
      // For Google auth, only email and fullName are required (auto-filled)
      // Business name and phone can be collected later or made optional
      return (
        !!data.email.trim() &&
        !!data.fullName.trim()
      );
    }
    
    // For email/password signup, all fields are required
    const basicFields = (
      !!data.businessName.trim() &&
      !!data.fullName.trim() &&
      !!data.email.trim() &&
      !!data.phone.trim()
    );
    
    return (
      basicFields &&
      !!data.password.trim() &&
      data.password.length >= 6
    );
  }
  if (step === 2) {
    // Step 2 is valid if category and features are selected
    return (
      !!data.selectedCategory &&
      Array.isArray(data.selectedFeatures) && data.selectedFeatures.length > 0
    );
  }
  if (step === 3) {
    return !!data.businessAnalysis;
  }
  return false;
}

// ΓöÇΓöÇ SuccessScreen ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

"use client";

import { useState, useEffect } from "react";
import { Field, SelectField } from "./onboarding-ui";
import {
  CATEGORIES,
  CATEGORY_FEATURES,
  PRO_ONLY_FEATURES,
  STANDARD_OR_PRO_FEATURES,
} from "./onboarding-constants";

export type FormState = {
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
                {done ? "✓" : s.id}
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
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "11px 22px", borderRadius: 12, background: "white",
          border: "1.5px solid #E8E8F0", cursor: "pointer", color: "#0A0A0F",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
        }}
      >
        Sign up with Google
      </button>

      <p style={{ fontSize: 10, color: "#8888A0", lineHeight: 1.6 }}>
        By continuing you agree to Busmo's{" "}
        <a href="/terms" style={{ color: "#555568", textDecoration: "underline" }}>Terms</a>
        {" "}and{" "}
        <a href="/privacy" style={{ color: "#555568", textDecoration: "underline" }}>Privacy Policy</a>.
      </p>
    </div>
  );
}

function StepTwo({ data, onChange }: { data: FormState; onChange: (k: keyof FormState, v: string | string[]) => void }) {
  const [selectedCategory, setSelectedCategory] = useState(data.selectedCategory || "retail");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    Array.isArray(data.selectedFeatures) ? data.selectedFeatures :
    (typeof data.selectedFeatures === "string" ? JSON.parse(data.selectedFeatures as any) : CATEGORY_FEATURES["retail"])
  );

  useEffect(() => {
    if (data.selectedCategory && data.selectedCategory !== selectedCategory) {
      setSelectedCategory(data.selectedCategory);
    }
    if (data.selectedFeatures && Array.isArray(data.selectedFeatures) && data.selectedFeatures !== selectedFeatures) {
      setSelectedFeatures(data.selectedFeatures);
    }
  }, [data.selectedCategory, data.selectedFeatures]);

  const availableFeatures = CATEGORY_FEATURES[selectedCategory] || CATEGORY_FEATURES["retail"];

  const getRecommendedPlan = (features: string[]) => {
    const hasPro = features.some(f => PRO_ONLY_FEATURES.includes(f));
    const hasStd = features.some(f => STANDARD_OR_PRO_FEATURES.includes(f));
    if (hasPro) return { plan: "pro", reason: "Your selected features require the Pro plan." };
    if (hasStd || features.length >= 8) return { plan: "standard", reason: "Your selected features require the Standard plan." };
    return { plan: "starter", reason: "The Starter plan covers your selected features." };
  };

  const { plan: recommendedPlan, reason: planReason } = getRecommendedPlan(selectedFeatures);

  const toggleFeature = (feature: string) => {
    const next = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(next);
    onChange("selectedFeatures", next);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onChange("selectedCategory", category);
    const defaults = CATEGORY_FEATURES[category] || CATEGORY_FEATURES["retail"];
    setSelectedFeatures(defaults);
    onChange("selectedFeatures", defaults);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0F" }}>Select your business category</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                fontSize: 12, fontWeight: 500,
                color: selectedCategory === cat.id ? "#6B3FE7" : "#555568",
                background: selectedCategory === cat.id ? "#F3EFFE" : "white",
                border: selectedCategory === cat.id ? "2px solid #6B3FE7" : "1.5px solid #E8E8F0",
                textAlign: "left", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0F" }}>
          Select features ({selectedFeatures.length} selected)
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, maxHeight: 220, overflowY: "auto", padding: 3 }}>
          {availableFeatures.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => toggleFeature(feature)}
              style={{
                padding: "8px 10px", borderRadius: 7, cursor: "pointer",
                fontSize: 12,
                color: selectedFeatures.includes(feature) ? "#6B3FE7" : "#555568",
                background: selectedFeatures.includes(feature) ? "#F3EFFE" : "white",
                border: selectedFeatures.includes(feature) ? "1.5px solid #6B3FE7" : "1px solid #E8E8F0",
                textAlign: "left", display: "flex", alignItems: "center", gap: 5,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <span>{selectedFeatures.includes(feature) ? "✓" : "○"}</span>
              <span>{feature}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 14, borderRadius: 10, background: "#F3EFFE", border: "1.5px solid #6B3FE7" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#6B3FE7", marginBottom: 4 }}>Recommended Plan</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0A0A0F", textTransform: "capitalize" }}>{recommendedPlan} Plan</div>
        <p style={{ fontSize: 12, color: "#555568", margin: "4px 0 0" }}>{planReason}</p>
      </div>
    </div>
  );
}

function StepThree({ data, onChange, onEdit }: { data: FormState; onChange: (k: keyof FormState, v: string) => void; onEdit: () => void }) {
  const analysis = data.businessAnalysis;
  if (!analysis) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <p style={{ color: "#8888A0", fontSize: 13 }}>Analyzing your business...</p>
      </div>
    );
  }

  let selectedFeatures = data.selectedFeatures;
  if (typeof selectedFeatures === "string") {
    try { selectedFeatures = JSON.parse(selectedFeatures as any); } catch { selectedFeatures = []; }
  }
  const categoryLabel = CATEGORIES.find(c => c.id === data.selectedCategory)?.label || analysis.businessType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", marginBottom: 3 }}>Your Busmo setup:</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "#F3EFFE", borderRadius: 10, border: "1px solid #E8E8F0" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase" }}>Business Category</span>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0A0A0F" }}>{categoryLabel}</div>
        </div>
        <div style={{ height: 1, background: "#E8E8F0" }} />
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase" }}>Recommended Plan</span>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#6B3FE7", textTransform: "capitalize" }}>{analysis.recommendedPlan} Plan</div>
          {analysis.recommendedPlanReason && (
            <p style={{ fontSize: 11, color: "#555568", marginTop: 3 }}>{analysis.recommendedPlanReason}</p>
          )}
        </div>
        <div style={{ height: 1, background: "#E8E8F0" }} />
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8888A0", textTransform: "uppercase" }}>
            Selected Features ({selectedFeatures?.length || 0})
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {(selectedFeatures || analysis.recommendedFeatures || []).map((feature: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#1DB954", fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 12, color: "#0A0A0F" }}>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: "10px 14px", borderRadius: 7, cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#6B3FE7",
          background: "white", border: "1px solid #6B3FE7",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Edit Selections
      </button>
    </div>
  );
}

export { STEP_META, StepProgress, StepOne, StepTwo, StepThree };

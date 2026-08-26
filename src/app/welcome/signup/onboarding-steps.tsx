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
  const categoryMeta = CATEGORIES.find((c) => c.id === selectedCategory);

  const getRecommendedPlan = (features: string[]) => {
    const hasPro = features.some(f => PRO_ONLY_FEATURES.includes(f));
    const hasStd = features.some(f => STANDARD_OR_PRO_FEATURES.includes(f));
    if (hasPro) return { plan: "pro", reason: "Your selected features require Busmo Scale." };
    if (hasStd || features.length >= 8) return { plan: "standard", reason: "Your selected features require Busmo Control." };
    return { plan: "starter", reason: "Busmo Start covers your selected features." };
  };

  const { plan: recommendedPlan, reason: planReason } = getRecommendedPlan(selectedFeatures);

  const toggleFeature = (feature: string) => {
    const next = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    // Keep at least one feature selected
    if (next.length === 0) return;
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

  const selectAll = () => {
    setSelectedFeatures(availableFeatures);
    onChange("selectedFeatures", availableFeatures);
  };

  const selectEssentials = () => {
    const essentials = availableFeatures.filter((f) =>
      ["Sales Recording", "Inventory Tracking", "Expense Management", "Cash Flow Analysis", "Staff Management"].includes(f)
    );
    const next = essentials.length ? essentials : availableFeatures.slice(0, 3);
    setSelectedFeatures(next);
    onChange("selectedFeatures", next);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Category selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", fontFamily: "'Sora', sans-serif" }}>
            Business category
          </span>
          {categoryMeta && (
            <span style={{ fontSize: 11, color: "#6B3FE7", fontWeight: 600 }}>
              {categoryMeta.icon} {categoryMeta.label}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#8888A0", lineHeight: 1.45 }}>
          Choose your niche — we tailor features and your dashboard to match.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
            gap: 8,
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                aria-pressed={active}
                style={{
                  padding: "12px 10px",
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#6B3FE7" : "#555568",
                  background: active
                    ? "linear-gradient(180deg, #F3EFFE 0%, #EDE7FE 100%)"
                    : "#FAFAFC",
                  border: active ? "2px solid #6B3FE7" : "1.5px solid #E8E8F0",
                  boxShadow: active ? "0 4px 14px rgba(107,63,231,0.18)" : "none",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.18s ease",
                  minHeight: 72,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.icon}</span>
                <span style={{ lineHeight: 1.25 }}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", fontFamily: "'Sora', sans-serif" }}>
            Features for your dashboard
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6B3FE7",
              background: "#F3EFFE",
              border: "1px solid #D4C6FA",
              borderRadius: 999,
              padding: "3px 10px",
            }}
          >
            {selectedFeatures.length} selected
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#8888A0", lineHeight: 1.45 }}>
          These unlock the matching tools in your sidebar after onboarding. You can change them later in Settings.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={selectEssentials}
            style={{
              fontSize: 11, fontWeight: 600, color: "#555568", background: "white",
              border: "1px solid #E8E8F0", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Essentials only
          </button>
          <button
            type="button"
            onClick={selectAll}
            style={{
              fontSize: 11, fontWeight: 600, color: "#6B3FE7", background: "#F3EFFE",
              border: "1px solid #D4C6FA", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Select all for {categoryMeta?.label || "category"}
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
            maxHeight: 240,
            overflowY: "auto",
            padding: 4,
            margin: "-4px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {availableFeatures.map((feature) => {
            const on = selectedFeatures.includes(feature);
            const isPro = PRO_ONLY_FEATURES.includes(feature);
            const isStd = STANDARD_OR_PRO_FEATURES.includes(feature);
            return (
              <button
                key={feature}
                type="button"
                onClick={() => toggleFeature(feature)}
                aria-pressed={on}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: on ? 600 : 500,
                  color: on ? "#3B1FA0" : "#555568",
                  background: on ? "#F3EFFE" : "white",
                  border: on ? "1.5px solid #6B3FE7" : "1.5px solid #E8E8F0",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.15s ease",
                  minHeight: 44,
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    flexShrink: 0,
                    marginTop: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: on ? "white" : "#C4C4D4",
                    background: on ? "#6B3FE7" : "#F4F4F8",
                    border: on ? "none" : "1.5px solid #E8E8F0",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                <span style={{ flex: 1, lineHeight: 1.35 }}>
                  {feature}
                  {(isPro || isStd) && (
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: 6,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: isPro ? "#B45309" : "#6B3FE7",
                        background: isPro ? "#FEF3C7" : "#F3EFFE",
                        borderRadius: 4,
                        padding: "1px 5px",
                        verticalAlign: "middle",
                      }}
                    >
                      {isPro ? "Pro" : "Std"}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended plan */}
      <div
        style={{
          padding: 14,
          borderRadius: 12,
          background: "linear-gradient(135deg, #F3EFFE 0%, #F8F6FF 100%)",
          border: "1.5px solid #D4C6FA",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B3FE7", marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Recommended plan
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#0A0A0F", textTransform: "capitalize", fontFamily: "'Sora', sans-serif" }}>
          {recommendedPlan} Plan
        </div>
        <p style={{ fontSize: 12, color: "#555568", margin: "4px 0 0", lineHeight: 1.45 }}>{planReason}</p>
      </div>
    </div>
  );
}

function StepThree({ data, onChange, onEdit }: { data: FormState; onChange: (k: keyof FormState, v: string) => void; onEdit: () => void }) {
  const analysis = data.businessAnalysis;
  if (!analysis) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <p style={{ color: "#8888A0", fontSize: 13 }}>Preparing your dashboard...</p>
      </div>
    );
  }

  let selectedFeatures = data.selectedFeatures;
  if (typeof selectedFeatures === "string") {
    try { selectedFeatures = JSON.parse(selectedFeatures as any); } catch { selectedFeatures = []; }
  }
  const cat = CATEGORIES.find(c => c.id === data.selectedCategory);
  const categoryLabel = cat?.label || analysis.businessType;
  const featureList = (selectedFeatures || analysis.recommendedFeatures || []) as string[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0A0A0F", margin: 0, fontFamily: "'Sora', sans-serif" }}>
        Your Busmo setup
      </h3>
      <p style={{ margin: 0, fontSize: 12, color: "#8888A0", lineHeight: 1.45 }}>
        These features will appear in your dashboard sidebar after you enter Busmo.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 16,
          background: "linear-gradient(180deg, #F8F6FF 0%, #FFFFFF 100%)",
          borderRadius: 14,
          border: "1.5px solid #E8E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#F3EFFE",
              border: "1.5px solid #D4C6FA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            {cat?.icon || "📦"}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8888A0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Business category
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0A0A0F" }}>{categoryLabel}</div>
          </div>
        </div>

        <div style={{ height: 1, background: "#E8E8F0" }} />

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8888A0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            Recommended plan
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#6B3FE7", textTransform: "capitalize" }}>
            {analysis.recommendedPlan} Plan
          </div>
          {analysis.recommendedPlanReason && (
            <p style={{ fontSize: 12, color: "#555568", margin: "4px 0 0", lineHeight: 1.4 }}>{analysis.recommendedPlanReason}</p>
          )}
        </div>

        <div style={{ height: 1, background: "#E8E8F0" }} />

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8888A0", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Dashboard features ({featureList.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {featureList.map((feature: string, i: number) => (
              <span
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#3B1FA0",
                  background: "#F3EFFE",
                  border: "1px solid #D4C6FA",
                  borderRadius: 999,
                  padding: "5px 10px",
                }}
              >
                <span style={{ color: "#1DB954" }}>✓</span>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: "11px 14px",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
          color: "#6B3FE7",
          background: "white",
          border: "1.5px solid #6B3FE7",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Edit category & features
      </button>
    </div>
  );
}

export { STEP_META, StepProgress, StepOne, StepTwo, StepThree };

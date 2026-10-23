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
  { id: 1, label: "Account" },
  { id: 2, label: "Workspace" },
  { id: 3, label: "Launch" },
];

const PLAN_DISPLAY: Record<string, string> = {
  starter: "Busmo Start",
  standard: "Busmo Control",
  pro: "Busmo Scale",
};

const FEATURE_BLURBS: Record<string, string> = {
  "Sales Recording": "Log every sale in seconds",
  "Inventory Tracking": "Know what is in stock",
  "Staff Management": "Roles and accountability",
  "Cash Flow Analysis": "See money in and out",
  "Credit Tracking": "Track who owes you",
  "Expense Management": "Capture daily costs",
  "Customer Management": "Know your buyers",
  "Supplier Management": "Track vendors & orders",
  "Profit/Loss Reports": "See if you are making money",
  "Business Analytics": "Trends at a glance",
  "Ask MO AI Assistant": "Ask questions about your business",
  "Payroll Management": "Pay your team on time",
  "Menu Management": "Build your dish list",
  "Ingredient Tracking": "Kitchen stock control",
  "Expiry Alerts": "Catch spoilage early",
  "E-commerce Storefront": "Sell online",
  "Production Tracking": "Track what you produce",
  "Multi-branch Support": "Several locations, one view",
};

function StepProgress({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", width: "100%" }} aria-label={`Step ${current} of 3`}>
      {STEP_META.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none", minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, fontFamily: "'Sora', sans-serif",
                background: done || active ? "#6B3FE7" : "white",
                border: `2px solid ${done || active ? "#6B3FE7" : "#E8E8F0"}`,
                color: done || active ? "white" : "#8888A0",
                boxShadow: active ? "0 0 0 4px rgba(107,63,231,0.14)" : "none",
                transition: "all 0.3s",
              }}>
                {done ? "✓" : s.id}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: current >= s.id ? "#6B3FE7" : "#8888A0", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 2, margin: "0 8px", marginBottom: 20, borderRadius: 2, minWidth: 12,
                background: current > s.id ? "#6B3FE7" : "#E8E8F0", transition: "background 0.5s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: 0, fontSize: 12, color: "#6B3FE7", background: "#F3EFFE",
      border: "1px solid #E4DBFC", borderRadius: 10, padding: "10px 12px", lineHeight: 1.45,
    }}>
      {children}
    </p>
  );
}

function StepOne({ data, onChange, onGoogleSignIn }: {
  data: FormState;
  onChange: (k: keyof FormState, v: string) => void;
  onGoogleSignIn: () => void;
}) {
  const isGoogle = Boolean(data.googleUserId);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Tip>
        ⚡ Takes about 2 minutes. You get a <b>14-day free trial</b> — no card required to start.
      </Tip>

      {!isGoogle && (
        <>
          <button type="button" onClick={onGoogleSignIn} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "12px 22px", borderRadius: 12, background: "white",
            border: "1.5px solid #E8E8F0", cursor: "pointer", color: "#0A0A0F",
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <GoogleIcon />
            Continue with Google
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
            <span style={{ fontSize: 11, color: "#8888A0" }}>or use email</span>
            <div style={{ flex: 1, height: 1, background: "#E8E8F0" }} />
          </div>
        </>
      )}

      {isGoogle && (
        <Tip>
          Signed in with Google as <b>{data.email || "your Google account"}</b>. Confirm your business name below.
        </Tip>
      )}

      <Field label="Business name" id="businessName" value={data.businessName}
        onChange={(v) => onChange("businessName", v)} placeholder="e.g. Femi's Suya Spot"
        autoComplete="organization" hint="Customers and staff will see this name." />

      {!isGoogle && (
        <>
          <Field label="Your full name" id="fullName" value={data.fullName}
            onChange={(v) => onChange("fullName", v)} placeholder="e.g. Femi Adeleke" autoComplete="name" />
          <Field label="Email address" id="email" type="email" value={data.email}
            onChange={(v) => onChange("email", v)} placeholder="you@example.com" autoComplete="email"
            hint="We'll send a confirmation link here." />
          <Field label="Phone number" id="phone" type="tel" value={data.phone}
            onChange={(v) => onChange("phone", v)} placeholder="08012345678" autoComplete="tel"
            hint="Used for account recovery and support." />
          <Field label="Password" id="password" type="password" value={data.password}
            onChange={(v) => onChange("password", v)} placeholder="At least 6 characters" autoComplete="new-password"
            hint="Choose something only you know." />
        </>
      )}

      <p style={{ fontSize: 11, color: "#8888A0", lineHeight: 1.6, margin: 0 }}>
        By continuing you agree to Busmo&apos;s{" "}
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
    if (data.selectedCategory && data.selectedCategory !== selectedCategory) setSelectedCategory(data.selectedCategory);
    if (data.selectedFeatures && Array.isArray(data.selectedFeatures) && data.selectedFeatures !== selectedFeatures) {
      setSelectedFeatures(data.selectedFeatures);
    }
  }, [data.selectedCategory, data.selectedFeatures]);

  const availableFeatures = CATEGORY_FEATURES[selectedCategory] || CATEGORY_FEATURES["retail"];
  const categoryMeta = CATEGORIES.find((c) => c.id === selectedCategory);

  const getRecommendedPlan = (features: string[]) => {
    const hasPro = features.some(f => PRO_ONLY_FEATURES.includes(f));
    const hasStd = features.some(f => STANDARD_OR_PRO_FEATURES.includes(f));
    if (hasPro) return { plan: "pro", reason: "Some tools you picked are on Busmo Scale." };
    if (hasStd || features.length >= 8) return { plan: "standard", reason: "Your selection fits Busmo Control." };
    return { plan: "starter", reason: "Busmo Start covers what you selected." };
  };
  const { plan: recommendedPlan, reason: planReason } = getRecommendedPlan(selectedFeatures);

  const toggleFeature = (feature: string) => {
    const next = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Tip>
        Pick how you sell today. We pre-select useful tools — you can turn any off, and change later in Settings.
      </Tip>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", fontFamily: "'Sora', sans-serif" }}>
            What kind of business is this?
          </span>
          {categoryMeta && (
            <span style={{ fontSize: 11, color: "#6B3FE7", fontWeight: 600 }}>
              {categoryMeta.icon} {categoryMeta.label}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button key={cat.id} type="button" onClick={() => handleCategoryChange(cat.id)} aria-pressed={active}
                style={{
                  padding: "12px 8px", borderRadius: 12, cursor: "pointer", fontSize: 11,
                  fontWeight: active ? 700 : 500, color: active ? "#6B3FE7" : "#555568",
                  background: active ? "linear-gradient(180deg, #F3EFFE 0%, #EDE7FE 100%)" : "#FAFAFC",
                  border: active ? "2px solid #6B3FE7" : "1.5px solid #E8E8F0",
                  boxShadow: active ? "0 4px 14px rgba(107,63,231,0.18)" : "none",
                  textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 6, fontFamily: "'DM Sans', sans-serif", transition: "all 0.18s ease", minHeight: 76,
                }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{cat.icon}</span>
                <span style={{ lineHeight: 1.25 }}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A0A0F", fontFamily: "'Sora', sans-serif" }}>
            Tools on your dashboard
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#6B3FE7", background: "#F3EFFE",
            border: "1px solid #D4C6FA", borderRadius: 999, padding: "3px 10px",
          }}>
            {selectedFeatures.length} selected
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#8888A0", lineHeight: 1.45 }}>
          Tap to add or remove. These become menu items after you finish — nothing is locked during your trial.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={selectEssentials} style={{
            fontSize: 11, fontWeight: 600, color: "#555568", background: "white",
            border: "1px solid #E8E8F0", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>Essentials only</button>
          <button type="button" onClick={selectAll} style={{
            fontSize: 11, fontWeight: 600, color: "#6B3FE7", background: "#F3EFFE",
            border: "1px solid #D4C6FA", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}>Select all for {categoryMeta?.label || "category"}</button>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
          maxHeight: 260, overflowY: "auto", padding: 4, margin: "-4px",
          WebkitOverflowScrolling: "touch",
        }}>
          {availableFeatures.map((feature) => {
            const on = selectedFeatures.includes(feature);
            const isPro = PRO_ONLY_FEATURES.includes(feature);
            const isStd = STANDARD_OR_PRO_FEATURES.includes(feature);
            const blurb = FEATURE_BLURBS[feature];
            return (
              <button key={feature} type="button" onClick={() => toggleFeature(feature)} aria-pressed={on}
                style={{
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12,
                  fontWeight: on ? 600 : 500, color: on ? "#3B1FA0" : "#555568",
                  background: on ? "#F3EFFE" : "white",
                  border: on ? "1.5px solid #6B3FE7" : "1.5px solid #E8E8F0",
                  textAlign: "left", display: "flex", alignItems: "flex-start", gap: 8,
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s ease", minHeight: 52,
                }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: on ? "white" : "#C4C4D4",
                  background: on ? "#6B3FE7" : "#F4F4F8", border: on ? "none" : "1.5px solid #E8E8F0",
                }}>{on ? "✓" : ""}</span>
                <span style={{ flex: 1, lineHeight: 1.35 }}>
                  {feature}
                  {(isPro || isStd) && (
                    <span style={{
                      display: "inline-block", marginLeft: 6, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      color: isPro ? "#B45309" : "#6B3FE7",
                      background: isPro ? "#FEF3C7" : "#F3EFFE",
                      borderRadius: 4, padding: "1px 5px", verticalAlign: "middle",
                    }}>{isPro ? "Scale" : "Control"}</span>
                  )}
                  {blurb && (
                    <span style={{ display: "block", fontSize: 10, fontWeight: 500, color: "#8888A0", marginTop: 2 }}>
                      {blurb}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: "12px 14px", borderRadius: 12, background: "#FAFAFC", border: "1px solid #E8E8F0",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0A0A0F" }}>
          Suggested plan: {PLAN_DISPLAY[recommendedPlan] || recommendedPlan}
        </span>
        <span style={{ fontSize: 11, color: "#8888A0", lineHeight: 1.4 }}>
          {planReason} During the trial you can try everything; plan limits apply after.
        </span>
      </div>
    </div>
  );
}

function StepThree({ data, onChange, onEdit }: {
  data: FormState;
  onChange: (k: keyof FormState, v: string | string[]) => void;
  onEdit: (step: number) => void;
}) {
  const category = CATEGORIES.find((c) => c.id === data.selectedCategory);
  const features = Array.isArray(data.selectedFeatures) ? data.selectedFeatures : [];

  const getRecommendedPlan = (feats: string[]) => {
    const hasPro = feats.some((f) => PRO_ONLY_FEATURES.includes(f));
    const hasStd = feats.some((f) => STANDARD_OR_PRO_FEATURES.includes(f));
    if (hasPro) return "pro";
    if (hasStd || feats.length >= 8) return "standard";
    return "starter";
  };
  const planId = getRecommendedPlan(features);

  const Row = ({ label, value, step }: { label: string; value: React.ReactNode; step?: number }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
      padding: "12px 0", borderBottom: "1px solid #F0F0F5",
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: "#8888A0", marginBottom: 4,
          textTransform: "uppercase", letterSpacing: "0.04em",
        }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0F", wordBreak: "break-word" }}>{value}</div>
      </div>
      {step != null && (
        <button type="button" onClick={() => onEdit(step)} style={{
          fontSize: 12, fontWeight: 600, color: "#6B3FE7", background: "none", border: "none",
          cursor: "pointer", padding: "4px 0", flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
        }}>Edit</button>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Tip>
        Almost there. Confirm everything looks right, then enter Busmo and start recording sales.
      </Tip>

      <div style={{ background: "#FAFAFC", borderRadius: 14, border: "1px solid #E8E8F0", padding: "4px 16px" }}>
        <Row label="Business" value={data.businessName || "—"} step={1} />
        <Row label="Owner" value={
          <>
            {data.fullName || "—"}
            {data.email ? (
              <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8888A0", marginTop: 2 }}>
                {data.email}
              </span>
            ) : null}
          </>
        } step={1} />
        <Row label="Category" value={category ? `${category.icon} ${category.label}` : data.selectedCategory || "—"} step={2} />
        <Row label="Tools" value={
          features.length
            ? `${features.length} selected · ${features.slice(0, 3).join(", ")}${features.length > 3 ? "…" : ""}`
            : "—"
        } step={2} />
        <Row label="Suggested plan" value={PLAN_DISPLAY[planId] || planId} />
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", borderRadius: 12,
        background: "linear-gradient(135deg, #F3EFFE 0%, #EEFBF3 100%)", border: "1px solid #E4DBFC",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0A0A0F" }}>What happens next</span>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#555568", lineHeight: 1.55 }}>
          <li>Your dashboard opens with the tools you picked</li>
          <li>14-day free trial starts — explore freely</li>
          <li>Confirm your email if we ask you to</li>
        </ul>
      </div>

      {typeof data.description === "string" && (
        <div style={{ display: "none" }}>
          <SelectField label="Country" id="country" value={data.country}
            onChange={(v) => onChange("country", v)}
            options={[
              { value: "nigeria", label: "Nigeria" },
              { value: "ghana", label: "Ghana" },
              { value: "kenya", label: "Kenya" },
              { value: "other", label: "Other" },
            ]}
          />
        </div>
      )}
    </div>
  );
}

export { StepProgress, StepOne, StepTwo, StepThree };

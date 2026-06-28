"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initializeFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { sendWelcomeEmailSeries } from "@/services/email/welcome-series";

// ── App Logo ───────────────────────────────────
function AppLogo({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#0A1E1E"></circle>
      <circle cx="40" cy="40" r="36" fill="none" stroke="#2ABFBF" strokeWidth="1.5"></circle>
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
      <ellipse cx="40" cy="66" rx="15" ry="6" fill="#1A8F8F" opacity="0.9"></ellipse>
      <rect x="32" y="56" width="16" height="10" rx="5" fill="#F5C9A0"></rect>
      <path d="M58 58 Q68 52 70 44" stroke="#F5C9A0" strokeWidth="5" strokeLinecap="round" fill="none"></path>
      <circle cx="70" cy="42" r="5" fill="#F5C9A0"></circle>
      <rect x="65" y="35" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(-8 65 35)"></rect>
      <rect x="70" y="34" width="5" height="10" rx="2.5" fill="#F5C9A0"></rect>
      <rect x="75" y="36" width="5" height="9" rx="2.5" fill="#F5C9A0" transform="rotate(8 75 36)"></rect>
    </svg>
  );
}

// ── Field ──────────────────────────────────────
function Field({
  label, id, type = "text", value, onChange, placeholder, autoComplete,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 600, color: "#555568", letterSpacing: "0.025em" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden",
          background: "white", transition: "all 0.2s",
          border: `1.5px solid ${focused ? "#6B3FE7" : "#E8E8F0"}`,
          boxShadow: focused ? "0 0 0 3px rgba(107,63,231,0.12)" : "none",
        }}
      >
        <input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "13px 16px", fontSize: 15, color: "#0A0A0F",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
      </div>
    </div>
  );
}

// ── Select Field ─────────────────────────────
function SelectField({
  label, id, value, onChange, options,
}: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 600, color: "#555568", letterSpacing: "0.025em" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", borderRadius: 12, overflow: "hidden",
          background: "white", transition: "all 0.2s",
          border: `1.5px solid ${focused ? "#6B3FE7" : "#E8E8F0"}`,
          boxShadow: focused ? "0 0 0 3px rgba(107,63,231,0.12)" : "none",
        }}
      >
        <select
          id={id} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            padding: "13px 16px", fontSize: 15, color: "#0A0A0F",
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
          }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Primary Button ─────────────────────────────
function PrimaryBtn({ children, onClick, disabled = false, style }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "13px 26px", borderRadius: 13,
        background: disabled ? "#C4B3F5" : "#6B3FE7",
        border: "none", cursor: disabled ? "not-allowed" : "pointer",
        color: "white", fontFamily: "'Sora', sans-serif",
        fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
        transition: "all 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#4B24C1";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(107,63,231,0.28)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "#6B3FE7";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </button>
  );
}

// ── Secondary Button ───────────────────────────
function SecondaryBtn({ children, onClick }: {
  children: React.ReactNode; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "10px 20px", borderRadius: 11,
        background: "transparent", border: "1.5px solid #E8E8F0",
        cursor: "pointer", color: "#555568", fontFamily: "'Sora', sans-serif",
        fontSize: 14, fontWeight: 600, transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F4F4F8";
        e.currentTarget.style.borderColor = "#D4D4E8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "#E8E8F0";
      }}
    >
      {children}
    </button>
  );
}

// ── Shell ──────────────────────────────────────
function SignupShell({ children }: { children: React.ReactNode }) {
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

// ── Step Indicator ─────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < current ? "#6B3FE7" : i === current ? "#6B3FE7" : "#E8E8F0",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════
export default function BusmoSignup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    businessName: "", businessType: "", city: "", country: "Nigeria",
    plan: "starter",
  });

  const setField = (field: string) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const businessTypes = [
    { value: "", label: "Select business type" },
    { value: "retail", label: "Retail Store" },
    { value: "restaurant", label: "Restaurant / Cafe" },
    { value: "grocery", label: "Grocery / Supermarket" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "fashion", label: "Fashion / Clothing" },
    { value: "electronics", label: "Electronics" },
    { value: "agriculture", label: "Agriculture / Farm" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "services", label: "Services" },
    { value: "other", label: "Other" },
  ];

  const countries = [
    { value: "Nigeria", label: "Nigeria" },
    { value: "Ghana", label: "Ghana" },
    { value: "Kenya", label: "Kenya" },
    { value: "South Africa", label: "South Africa" },
    { value: "Other", label: "Other" },
  ];

  const plans = [
    { key: "starter", name: "Starter", price: "₦20,000/mo", desc: "For small retailers & startups" },
    { key: "standard", name: "Standard", price: "₦50,000/mo", desc: "For growing businesses" },
    { key: "pro", name: "Pro", price: "₦100,000/mo", desc: "For established businesses" },
  ];

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { auth, firestore } = initializeFirebase();

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );
      const firebaseUser = userCredential.user;

      // Set displayName on auth profile
      await updateProfile(firebaseUser, { 
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}` 
      });

      // Create user profile in users collection
      await setDoc(doc(firestore, 'users', firebaseUser.uid), {
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        displayName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        email: form.email.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        businessType: form.businessType,
        city: form.city.trim(),
        country: form.country,
        role: 'Owner',
        plan: form.plan,
        trialStartedAt: Timestamp.now(),
        trialEndsAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        createdAt: Timestamp.now(),
        businessId: firebaseUser.uid,
      });

      // Send welcome email series (non-blocking)
      sendWelcomeEmailSeries({
        email: form.email.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      }).catch((emailError) => {
        console.error('Failed to send welcome email series:', emailError);
      });

      // Redirect to dashboard
      router.push('/owner/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError("");
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setError("Please fill in all required fields.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }
    if (step === 2) {
      if (!form.businessName || !form.businessType || !form.city) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <SignupShell>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <AppLogo size={30} />
      </div>

      <StepIndicator current={step} total={3} />

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0A0A0F",
          fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 4 }}>
          {step === 1 ? "Create your account" : step === 2 ? "Your business" : "Choose your plan"}
        </h1>
        <p style={{ fontSize: 14, color: "#8888A0", lineHeight: 1.55 }}>
          {step === 1 ? "Step 1 of 3 — Your personal details" : 
           step === 2 ? "Step 2 of 3 — Tell us about your business" :
           "Step 3 of 3 — Start with a 7-day free trial"}
        </p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      {error && (
        <p style={{ color: "#DC2626", fontSize: 13, marginTop: 2 }}>{error}</p>
      )}

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="First name"
                id="firstName"
                value={form.firstName}
                onChange={setField("firstName")}
                placeholder="Femi"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="Last name"
                id="lastName"
                value={form.lastName}
                onChange={setField("lastName")}
                placeholder="Adeyemi"
              />
            </div>
          </div>
          <Field
            label="Email address"
            id="email"
            type="email"
            value={form.email}
            onChange={setField("email")}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            label="Phone number"
            id="phone"
            type="tel"
            value={form.phone}
            onChange={setField("phone")}
            placeholder="+234 800 000 0000"
          />
          <Field
            label="Password"
            id="password"
            type="password"
            value={form.password}
            onChange={setField("password")}
            placeholder="Min 6 characters"
            autoComplete="new-password"
          />
        </div>
      )}

      {/* Step 2: Business Details */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field
            label="Business name"
            id="businessName"
            value={form.businessName}
            onChange={setField("businessName")}
            placeholder="e.g. Femi's Suya Spot"
          />
          <SelectField
            label="Business type"
            id="businessType"
            value={form.businessType}
            onChange={setField("businessType")}
            options={businessTypes}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Field
                label="City"
                id="city"
                value={form.city}
                onChange={setField("city")}
                placeholder="Lagos"
              />
            </div>
            <div style={{ flex: 1 }}>
              <SelectField
                label="Country"
                id="country"
                value={form.country}
                onChange={setField("country")}
                options={countries}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Choose Plan */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {plans.map(plan => (
            <div
              key={plan.key}
              onClick={() => setField("plan")(plan.key)}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${form.plan === plan.key ? "#6B3FE7" : "#E8E8F0"}`,
                background: form.plan === plan.key ? "rgba(107,63,231,0.05)" : "white",
                transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 12,
              }}
              onMouseEnter={(e) => {
                if (form.plan !== plan.key) {
                  e.currentTarget.style.borderColor = "#D4D4E8";
                  e.currentTarget.style.background = "#F4F4F8";
                }
              }}
              onMouseLeave={(e) => {
                if (form.plan !== plan.key) {
                  e.currentTarget.style.borderColor = "#E8E8F0";
                  e.currentTarget.style.background = "white";
                }
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                border: `2px solid ${form.plan === plan.key ? "#6B3FE7" : "#E8E8F0"}`,
                background: form.plan === plan.key ? "#6B3FE7" : "white",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0A0A0F" }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: "#8888A0" }}>{plan.desc}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#6B3FE7" }}>{plan.price}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        {step > 1 && (
          <SecondaryBtn onClick={prevStep}>
            ← Back
          </SecondaryBtn>
        )}
        <PrimaryBtn 
          onClick={step === 3 ? handleSignup : nextStep} 
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? "Creating account..." : step === 3 ? "Start free trial" : "Continue →"}
          {step < 3 && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </PrimaryBtn>
      </div>

      <div style={{ fontSize: 13, color: "#8888A0", marginTop: 2, textAlign: "center" }}>
        Already have an account?{" "}
        <a href="/login/form"
          style={{ color: "#6B3FE7", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
          Sign in
        </a>
      </div>
    </SignupShell>
  );
}
"use client";

import { useState, useCallback, useEffect } from "react";
import React from "react";
import { getSupabase } from "@/lib/supabase";
import { initializeFirebase } from "@/firebase";
import { doc, setDoc, Timestamp, collection, addDoc, getDoc } from "firebase/firestore";
import { sendOwnerWelcomeEmailSeries } from "@/services/email/owner-welcome-series";
import SuccessScreen from "./SuccessScreen";
import { PrimaryBtn } from "./onboarding-ui";
import { StepProgress, StepOne, StepTwo, StepThree, type FormState } from "./onboarding-steps";
import {
  CATEGORIES,
  CATEGORY_FEATURES,
  PRO_ONLY_FEATURES,
  STANDARD_OR_PRO_FEATURES,
} from "./onboarding-constants";

const STEP_COPY: Record<number, { title: string; sub: string }> = {
  1: { title: "What's your business name?", sub: "Start by telling us your business name." },
  2: { title: "Configure your Busmo", sub: "Select your business category and features you need." },
  3: { title: "Review your setup", sub: "Review your selections and enter Busmo." },
};

export default function BusmoOnboarding() {
  const [step, setStep] = useState<number>(1);
  const [done, setDone] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isTrial = searchParams.get("trial");
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);

    const googleCallback = searchParams.get("google");
    if (googleCallback === "callback") {
      (async () => {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setData((prev) => ({
            ...prev,
            email: session.user.email || prev.email,
            fullName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || prev.fullName,
            businessName: prev.businessName || `${session.user.user_metadata?.full_name || "My"} Business`,
            selectedCategory: prev.selectedCategory || "retail",
            selectedFeatures: Array.isArray(prev.selectedFeatures) ? prev.selectedFeatures : CATEGORY_FEATURES["retail"],
            googleUserId: session.user.id,
          }));
          setIsGoogleAuth(true);
          setStep(2);
        }
      })();
    }

    if (isTrial === "true") {
      const trialInfoStr = localStorage.getItem("busmo_trial_info");
      if (trialInfoStr) {
        try { setTrialInfo(JSON.parse(trialInfoStr)); } catch (_) {}
      }
    }
  }, []);

  const handleNext = async () => {
    if (!isStepValid(step, data, isGoogleAuth)) return;

    if (step === 2) {
      setIsAnalyzing(true);
      setError(null);
      try {
        let selectedFeatures = data.selectedFeatures;
        if (typeof selectedFeatures === "string") {
          selectedFeatures = JSON.parse(selectedFeatures as any);
        }
        const categoryLabel = CATEGORIES.find((c) => c.id === data.selectedCategory)?.label || "Retail Shop";
        const hasProFeatures = selectedFeatures?.some((f: string) => PRO_ONLY_FEATURES.includes(f));
        const hasStandardOrProFeatures = selectedFeatures?.some((f: string) => STANDARD_OR_PRO_FEATURES.includes(f));
        const hasManyFeatures = (selectedFeatures?.length ?? 0) >= 8;
        let recommendedPlan = "starter";
        let recommendedPlanReason = "The Starter plan covers all your selected features perfectly.";
        if (hasProFeatures) {
          recommendedPlan = "pro";
          recommendedPlanReason = "Your selected features require advanced capabilities available in the Pro plan.";
        } else if (hasStandardOrProFeatures || hasManyFeatures) {
          recommendedPlan = "standard";
          recommendedPlanReason = "Your selected features require advanced capabilities available in the Standard plan.";
        }
        const manualAnalysis = {
          businessType: categoryLabel,
          businessTypeConfidence: 1.0,
          operationalNeeds: selectedFeatures?.slice(0, 4) || ["Inventory Management", "Staff Management"],
          productTypes: ["Products"],
          recommendedCategories: [categoryLabel, "General"],
          recommendedFeatures: selectedFeatures || ["Sales Recording", "Inventory Tracking", "Staff Management"],
          recommendedPlan,
          recommendedPlanReason,
          teamSizeEstimate: "solo",
          complexityScore: (selectedFeatures?.length ?? 0) >= 8 ? 6 : 3,
        };
        setData((prev) => ({ ...prev, businessAnalysis: manualAnalysis }));
        setStep(3);
      } catch (e) {
        console.error(e);
        setData((prev) => ({
          ...prev,
          businessAnalysis: {
            businessType: "Retail Store",
            recommendedPlan: "starter",
            recommendedPlanReason: "Starter plan is recommended as a starting point.",
            recommendedFeatures: ["Sales Recording", "Inventory Tracking", "Staff Management"],
            recommendedCategories: ["General"],
          },
        }));
        setStep(3);
      } finally {
        setIsAnalyzing(false);
      }
      return;
    }

    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }

    setIsLoading(true);
    setError("We're setting things up for you...");
    let userId: string | null = null;
    let userCreated = false;
    let businessCreated = false;
    const maxRetries = 3;

    for (let retryCount = 0; retryCount < maxRetries && (!userCreated || !businessCreated); retryCount++) {
      try {
        const supabase = getSupabase();
        const { firestore } = initializeFirebase();

        if (!userCreated && !userId) {
          if (data.googleUserId) {
            userId = data.googleUserId;
            userCreated = true;
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && session.user.email === data.email) {
              userId = session.user.id;
              userCreated = true;
            } else {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: { data: { full_name: data.fullName } },
              });
              if (signUpError) {
                const msg = signUpError.message || "";
                if (msg.includes("already")) {
                  const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                  });
                  if (signInError) throw signInError;
                  const { data: { session: s2 } } = await supabase.auth.getSession();
                  userId = s2?.user?.id ?? null;
                  userCreated = true;
                } else {
                  throw signUpError;
                }
              } else {
                userId = signUpData.user?.id ?? null;
                userCreated = true;
              }
            }
          }
        }

        if (userId && userCreated) {
          try {
            const userDocRef = doc(firestore, "users", userId);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              const trialStart = trialInfo?.trialStart ? new Date(trialInfo.trialStart) : new Date();
              const trialEnd = trialInfo?.trialEnd
                ? new Date(trialInfo.trialEnd)
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
              const selectedPlan = trialInfo?.plan || "starter";
              await setDoc(userDocRef, {
                fullName: data.fullName,
                email: data.email,
                phone: `${data.countryCode}${data.phone}`,
                role: "Owner",
                businessId: userId,
                plan: selectedPlan,
                category: data.selectedCategory || "retail",
                categoryLabel: CATEGORIES.find((c) => c.id === data.selectedCategory)?.label || data.businessAnalysis?.businessType || "Retail Shop",
                country: data.country,
                createdAt: Timestamp.now(),
                avatarContent: "👤",
                avatarBg: "#6B3FE7",
                avatarColor: "#fff",
                displayName: data.fullName,
                trialStartDate: Timestamp.fromDate(trialStart),
                trialEndDate: Timestamp.fromDate(trialEnd),
                subscriptionStatus: "trial",
                moCreditsRemaining: selectedPlan === "pro" ? -1 : 2000,
                businessAnalysis: data.businessAnalysis,
                selectedCategory: data.selectedCategory || "retail",
                selectedFeatures: Array.isArray(data.selectedFeatures) ? data.selectedFeatures : [],
              });
            }
          } catch (e) {
            console.error("profile error", e);
          }
        }

        if (userId) {
          try {
            const businessRef = doc(firestore, "businesses", userId);
            const businessDoc = await getDoc(businessRef);
            if (!businessDoc.exists()) {
              await setDoc(businessRef, {
                ownerId: userId,
                businessName: data.businessName,
                category: data.selectedCategory || "retail",
                categoryLabel: CATEGORIES.find((c) => c.id === data.selectedCategory)?.label || data.businessAnalysis?.businessType || "Retail Shop",
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
                selectedCategory: data.selectedCategory || "retail",
                selectedFeatures: Array.isArray(data.selectedFeatures) ? data.selectedFeatures : [],
              });
            }
            businessCreated = true;
          } catch (e) {
            console.error("business error", e);
            businessCreated = true;
          }
        }

        if (userId && data.businessAnalysis?.recommendedCategories?.length) {
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
          } catch (_) {}
        }

        // Store businessId in Supabase user_metadata so AppContext can resolve it
        if (userId) {
          try {
            const supabase = getSupabase();
            await supabase.auth.updateUser({
              data: { businessId: userId },
            });
          } catch (e) {
            console.error("Failed to set businessId in Supabase metadata:", e);
          }
        }

        break;
      } catch (error: any) {
        console.error(`Onboarding attempt ${retryCount + 1} failed:`, error);
        if (retryCount >= maxRetries - 1) break;
        await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
      }
    }

    setError(null);

    if (referralCode && userId) {
      try {
        await fetch("/api/referrals/track-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referredId: userId,
            referrerId: referralCode,
            signupData: { email: data.email, name: data.fullName },
          }),
        });
      } catch (_) {}
    }

    sendOwnerWelcomeEmailSeries({
      email: data.email,
      name: data.fullName,
      businessName: data.businessName,
    }).catch((e) => console.error("welcome email series failed", e));

    // Email/password: Resend confirmation (not Supabase Auth mail)
    if (userId && data.email && !data.googleUserId && !isGoogleAuth) {
      try {
        const confRes = await fetch("/api/auth/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, userId, name: data.fullName }),
        });
        if (!confRes.ok) {
          const confData = await confRes.json().catch(() => ({}));
          console.error("Confirmation email failed:", confData);
        }
      } catch (e) {
        console.error("Failed to send confirmation email:", e);
      }
      try {
        await getSupabase().auth.signOut();
      } catch (_) {}
      setNeedsEmailConfirm(true);
    } else {
      setNeedsEmailConfirm(false);
    }

    setIsLoading(false);
    setDone(true);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleEdit = () => setStep(2);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/welcome/signup?google=callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch {
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
          email={data.email}
          needsEmailConfirm={needsEmailConfirm}
          onDashboard={() => {
            window.location.href = "/owner";
          }}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#6B3FE7", fontFamily: "'Sora', sans-serif" }}>
          Busmo
        </div>
        <span style={{ fontSize: 11, color: "#8888A0", fontWeight: 500 }}>{step} / 3</span>
      </div>

      <StepProgress current={step} />

      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: -3 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0A0A0F", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.025em", lineHeight: 1.22, marginBottom: 3 }}>
          {STEP_COPY[step].title}
        </h1>
        <p style={{ fontSize: 13, color: "#8888A0", lineHeight: 1.55 }}>{STEP_COPY[step].sub}</p>
      </div>

      <div style={{ height: 1, background: "#E8E8F0" }} />

      {error && (
        <p style={{ fontSize: 13, color: error.includes("setting things") ? "#6B3FE7" : "#E8503A", margin: 0 }}>
          {error}
        </p>
      )}

      {step === 1 && <StepOne data={data} onChange={handleChange} onGoogleSignIn={handleGoogleSignIn} />}
      {step === 2 && <StepTwo data={data} onChange={handleChange} />}
      {step === 3 && <StepThree data={data} onChange={handleChange} onEdit={handleEdit} />}

      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 3, justifyContent: step === 1 ? "flex-end" : "space-between" }}>
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: "#8888A0", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: 0 }}
          >
            Back
          </button>
        )}
        <PrimaryBtn onClick={handleNext} disabled={!valid || isLoading || isAnalyzing}>
          {step < 2 ? "Continue" : step === 2 ? "Continue" : isLoading ? "Setting up..." : "Enter Busmo"}
        </PrimaryBtn>
      </div>

      {step === 1 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#8888A0", marginTop: -3 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#6B3FE7", fontWeight: 600, textDecoration: "none" }}>
            Log in
          </a>
        </p>
      )}
    </OnboardingShell>
  );
}

function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 12px",
        background: "radial-gradient(ellipse 80% 55% at 50% -10%, rgba(107,63,231,0.07) 0%, transparent 65%), #F4F4F8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.6,
          backgroundImage: "radial-gradient(circle, rgba(107,63,231,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div style={{ position: "relative", width: "100%", maxWidth: 420, zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          style={{
            background: "white",
            borderRadius: 24,
            padding: "24px 22px",
            border: "1px solid #E8E8F0",
            boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(107,63,231,0.09)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
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
      return !!data.email.trim() && !!data.fullName.trim();
    }
    return (
      !!data.businessName.trim() &&
      !!data.fullName.trim() &&
      !!data.email.trim() &&
      !!data.phone.trim() &&
      !!data.password.trim() &&
      data.password.length >= 6
    );
  }
  if (step === 2) {
    return !!data.selectedCategory && Array.isArray(data.selectedFeatures) && data.selectedFeatures.length > 0;
  }
  if (step === 3) {
    return !!data.businessAnalysis;
  }
  return false;
}

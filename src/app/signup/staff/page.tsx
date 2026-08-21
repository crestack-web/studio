"use client";

import { useState } from "react";
import { getSupabase, isSupabaseConfigured, getSupabaseConfigErrorMessage } from "@/lib/supabase";
import { initializeFirebase } from "@/firebase";
import { doc, setDoc, getDocs, collection, query, where, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { sendWelcomeEmailSeries } from "@/services/email/welcome-series";

export default function StaffSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const valid = email.trim().length > 5 && email.includes('@') && password.length >= 6 && name.trim().length > 1 && businessId.trim().length > 0;

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      if (!isSupabaseConfigured()) {
        setError(getSupabaseConfigErrorMessage() || "Authentication is not configured. Please contact support.");
        return;
      }
      const supabase = getSupabase();
      const { firestore } = initializeFirebase();
      const bizId = businessId.trim();

      const staffSnap = await getDocs(
        query(collection(firestore, "businesses", bizId, "staff"), where("email", "==", email.trim()))
      );

      let inviteDocId: string | null = null;
      let inviteData: any = null;

      if (!staffSnap.empty) {
        const inviteDoc = staffSnap.docs[0];
        inviteDocId = inviteDoc.id;
        inviteData = inviteDoc.data();
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error('No user ID returned');

      await setDoc(doc(firestore, "users", userId), {
        fullName: name.trim(),
        displayName: name.trim(),
        email: email.trim(),
        role: 'Staff',
        businessId: bizId,
        createdAt: Timestamp.now(),
        permissions: inviteData?.permissions || {
          sale: true,
          inv: false,
          hist: false,
          atd: false,
          msg: false,
          earn: false,
        },
      });

      if (inviteDocId) {
        await updateDoc(doc(firestore, "businesses", bizId, "staff", inviteDocId), {
          uid: userId,
          status: 'active',
          name: name.trim(),
        });
      }

      sendWelcomeEmailSeries({
        email: email.trim(),
        name: name.trim(),
      }).catch((emailError) => {
        console.error('Failed to send welcome email series:', emailError);
      });

      try {
        await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            userId,
            name: name.trim(),
          }),
        });
      } catch (confErr) {
        console.error('Failed to send confirmation email:', confErr);
      }
      try {
        await supabase.auth.signOut();
      } catch (_) {}
      setNeedsEmailConfirm(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use' || (err.message || '').toLowerCase().includes('already registered') || (err.message || '').toLowerCase().includes('already been registered')) {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === 'auth/invalid-email' || (err.message || '').toLowerCase().includes('invalid email')) {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 65%), #F4F4F8',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: 420, width: '100%', background: 'white', borderRadius: 20,
          padding: 32, border: '1px solid #E8E8F0', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: '#0A0A0F' }}>
            Confirm your email
          </h1>
          <p style={{ fontSize: 15, color: '#555568', lineHeight: 1.55, marginBottom: 20 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your staff account, then log in.
          </p>
          <a href="/login/staff" style={{
            display: 'inline-block', padding: '13px 24px', borderRadius: 12,
            background: '#16A34A', color: 'white', fontWeight: 700, textDecoration: 'none',
          }}>
            Go to staff login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: 'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.07) 0%, transparent 65%), #F4F4F8',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{
          background: 'white',
          borderRadius: 28,
          padding: '28px 26px',
          border: '1px solid #E8E8F0',
          boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 48px rgba(22,163,74,0.09)',
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A0A0F', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>
            Staff Signup
          </h1>
          <p style={{ fontSize: 14, color: '#16A34A', marginBottom: 20 }}>
            Create your staff account with the Business ID from your employer.
          </p>

          {error && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Business ID</label>
              <input
                type="text"
                value={businessId}
                onChange={e => setBusinessId(e.target.value)}
                placeholder="Get this from your employer"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
              <p style={{ fontSize: 12, color: '#8888A0', marginTop: 4 }}>Ask your business owner for the Business ID</p>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleSignup}
              disabled={!valid || loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: valid && !loading ? '#16A34A' : '#E8E8F0',
                color: valid && !loading ? 'white' : '#8888A0',
                border: 'none',
                fontSize: 16,
                fontWeight: 600,
                cursor: valid && !loading ? 'pointer' : 'not-allowed',
                marginTop: 8
              }}
            >
              {loading ? 'Creating Account...' : 'Create Staff Account'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 14, color: '#555568' }}>
              Already have an account? <a href="/login/staff" style={{ color: '#16A34A', textDecoration: 'none' }}>Log in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

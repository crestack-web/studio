"use client";

import { useState } from "react";
import { initializeFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, updateDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function StaffSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = email.trim().length > 5 && email.includes('@') && password.length >= 6 && name.trim().length > 1 && businessId.trim().length > 0;

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const { auth, firestore } = initializeFirebase();
      const bizId = businessId.trim();

      // Look for a matching staff invite under businesses/{bizId}/staff where email matches
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
      // Allow signup even without an invite (owner may add later)

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const firebaseUser = userCredential.user;

      // Set displayName on auth profile
      await updateProfile(firebaseUser, { displayName: name.trim() });

      // Create user profile in users collection
      await setDoc(doc(firestore, "users", firebaseUser.uid), {
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

      // Link auth uid back to the staff invite doc
      if (inviteDocId) {
        await updateDoc(doc(firestore, "businesses", bizId, "staff", inviteDocId), {
          uid: firebaseUser.uid,
          status: 'active',
          name: name.trim(),
        });
      }

      router.push("/staff/home");
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F4F8', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#0A0A0F' }}>Staff Signup</h1>
        <p style={{ fontSize: 14, color: '#555568', marginBottom: 24 }}>Create your staff account</p>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#555568', marginBottom: 6, display: 'block' }}>Business ID</label>
            <input
              type="text"
              value={businessId}
              onChange={e => setBusinessId(e.target.value)}
              placeholder="Get this from your employer"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none' }}
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
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #E8E8F0', fontSize: 15, outline: 'none' }}
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
  );
}

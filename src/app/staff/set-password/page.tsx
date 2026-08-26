'use client';

import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function StaffSetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      if (!isSupabaseConfigured()) {
        setError('Authentication is not configured.');
        return;
      }
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        window.location.href = '/login/staff';
        return;
      }
      setEmail(data.session.user.email || '');
      setReady(true);
    })();
  }, []);

  const valid =
    password.length >= 8 &&
    password === confirm &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password);

  const handleSave = async () => {
    if (!valid) {
      setError('Use at least 8 characters with letters and a number. Passwords must match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = '/login/staff';
        return;
      }

      // Preserve invite metadata (businessId, staffId) — only clear must_change flag
      const { error: updateErr } = await supabase.auth.updateUser({
        password,
        data: {
          ...user.user_metadata,
          must_change_password: false,
          role: user.user_metadata?.role || 'Staff',
          businessId: user.user_metadata?.businessId || user.user_metadata?.business_id,
          staffId: user.user_metadata?.staffId || user.user_metadata?.staff_id,
        },
      });
      if (updateErr) throw updateErr;

      try {
        const { firestore } = initializeFirebase();
        if (firestore) {
          await updateDoc(doc(firestore, 'users', user.id), {
            mustChangePassword: false,
          });
          const businessId = user.user_metadata?.businessId;
          if (businessId) {
            await updateDoc(doc(firestore, 'businesses', businessId, 'staff', user.id), {
              mustChangePassword: false,
            });
          }
        }
      } catch (fsErr) {
        console.warn('Firestore mustChangePassword clear failed', fsErr);
      }

      window.location.href = '/staff/home';
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not update password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready && !error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>
        <p style={{ color: '#6B7280' }}>Checking session…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#F7F7FB',
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E8E8F0',
          padding: 28,
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
        }}
      >
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#0A0A0F' }}>
          Set your password
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
          {email ? (
            <>
              Signed in as <strong>{email}</strong>. Choose a new password for your staff account.
            </>
          ) : (
            'Choose a new password for your staff account.'
          )}
        </p>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          New password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            marginBottom: 14,
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          Confirm password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid #E5E7EB',
            marginBottom: 14,
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />

        {error && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#B91C1C',
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading || !valid}
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: valid && !loading ? '#16A34A' : '#A7F3D0',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            cursor: valid && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Saving…' : 'Save password & continue'}
        </button>
      </div>
    </div>
  );
}

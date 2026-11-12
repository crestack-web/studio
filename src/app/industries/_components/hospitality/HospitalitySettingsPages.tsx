'use client';

import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import styles from '../IndustryShell.module.css';

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  borderRadius: 10,
  border: '1.5px solid #e6e6ef',
  fontSize: 14,
  marginTop: 6,
};

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

export function HospitalityHotelSettings() {
  const [propertyName, setPropertyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/industries/hospitality/front-desk', { headers: await authHeaders() });
        const json = await res.json().catch(() => ({}));
        const s = json.settings || {};
        setPropertyName(s.property_name || '');
        setLogoUrl(s.logo_url || '');
        setCurrency(s.currency || 'NGN');
        setTimezone(s.timezone || 'Africa/Lagos');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setCheckInTime(s.check_in_time || '14:00');
        setCheckOutTime(s.check_out_time || '12:00');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/industries/hospitality/front-desk', {
        method: 'PATCH',
        headers: await authHeaders(),
        body: JSON.stringify({
          propertyName,
          logoUrl,
          currency,
          timezone,
          phone,
          email,
          address,
          checkInTime,
          checkOutTime,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setMsg(json.warning || 'Hotel settings saved. The front desk uses this name and logo.');
    } catch (err: any) {
      setMsg(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.greetingSub}>Loading hotel settings…</p>;

  return (
    <div>
      <div className={styles.greetingRow}>
        <div>
          <p className={styles.eyebrow}>Settings</p>
          <h1 className={styles.greetingTitle}>Hotel settings</h1>
          <p className={styles.greetingSub}>Property name, contact, check-in times, and the logo staff see on the front desk.</p>
        </div>
      </div>
      <section className={styles.panel}>
        <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Property name
            <input style={inputStyle} value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Palm Court Hotel" />
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Logo URL
            <input style={inputStyle} value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
          </label>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Currency
              <select style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="NGN">NGN</option>
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Timezone
              <select style={inputStyle} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="Africa/Accra">Africa/Accra</option>
                <option value="Africa/Niamey">Africa/Niamey</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Check-in
              <input style={inputStyle} type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 13 }}>
              Check-out
              <input style={inputStyle} type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} />
            </label>
          </div>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Front desk phone
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080…" />
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Property email
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="stay@hotel.com" />
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Address
            <textarea style={{ ...inputStyle, minHeight: 72 }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" />
          </label>
          <button type="submit" className={styles.btnPrimary} disabled={saving} style={{ border: 'none' }}>
            {saving ? 'Saving…' : 'Save hotel settings'}
          </button>
          {msg ? <p style={{ margin: 0, fontSize: 13 }}>{msg}</p> : null}
        </form>
      </section>
    </div>
  );
}

export function HospitalityAccountSettings({ productName }: { productName: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await getSupabase().auth.getUser();
      const user = data.user;
      const meta = (user?.user_metadata || {}) as Record<string, string>;
      setName(meta.full_name || meta.name || '');
      setEmail(user?.email || '');
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const supabase = getSupabase();
      const patch: { data: { full_name: string }; password?: string } = { data: { full_name: name.trim() } };
      if (password.trim()) {
        if (password.trim().length < 8) throw new Error('Password must be at least 8 characters');
        patch.password = password.trim();
      }
      const { error } = await supabase.auth.updateUser(patch);
      if (error) throw error;
      setPassword('');
      setMsg('Account updated');
    } catch (err: any) {
      setMsg(err?.message || 'Could not update account');
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await getSupabase().auth.signOut();
    window.location.href = '/industries/hospitality/login';
  }

  if (loading) return <p className={styles.greetingSub}>Loading account…</p>;

  return (
    <div>
      <div className={styles.greetingRow}>
        <div>
          <p className={styles.eyebrow}>Settings</p>
          <h1 className={styles.greetingTitle}>Account settings</h1>
          <p className={styles.greetingSub}>The login for this {productName} owner account.</p>
        </div>
      </div>
      <section className={styles.panel}>
        <form onSubmit={save} style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Your name
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            Email
            <input style={inputStyle} value={email} disabled />
          </label>
          <label style={{ fontWeight: 600, fontSize: 13 }}>
            New password
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep the current password" />
          </label>
          <button type="submit" className={styles.btnPrimary} disabled={saving} style={{ border: 'none' }}>
            {saving ? 'Saving…' : 'Save account'}
          </button>
          {msg ? <p style={{ margin: 0, fontSize: 13 }}>{msg}</p> : null}
        </form>
        <button type="button" onClick={signOut} className={styles.btnGhost} style={{ marginTop: 16 }}>
          Sign out
        </button>
      </section>
    </div>
  );
}

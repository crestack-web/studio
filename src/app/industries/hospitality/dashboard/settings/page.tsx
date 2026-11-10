'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { getIndustryConfig } from '@/lib/industries/config';

const config = getIndustryConfig('hospitality')!;

export default function HotelSettingsPage() {
  const router = useRouter();
  const [propertyName, setPropertyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        /* TEMP: continue without session */
        const res = await fetch('/api/industries/hospitality/front-desk', {
          headers: data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
        });
        const json = await res.json().catch(() => ({}));
        if (json.settings) {
          setPropertyName(json.settings.property_name || '');
          setLogoUrl(json.settings.logo_url || '');
          setCurrency(json.settings.currency || 'NGN');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/industries/hospitality/front-desk', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyName, logoUrl, currency }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setMsg('Saved. Front desk will show this logo and property name.');
    } catch (err: any) {
      setMsg(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 520, margin: '32px auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <Link href={config.dashboardPath} style={{ color: '#6b3fe7', fontWeight: 600, textDecoration: 'none' }}>
        ← Owner dashboard
      </Link>
      <h1 style={{ marginTop: 16 }}>Hotel settings</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        Branding for the staff front desk. Overall activity stays on the owner hospitality dashboard.
      </p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 13 }}>
          Property name
          <input
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            placeholder="e.g. Palm Court Hotel"
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1.5px solid #e8e8f0' }}
          />
        </label>
        <label style={{ fontWeight: 600, fontSize: 13 }}>
          Logo URL
          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…/logo.png"
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1.5px solid #e8e8f0' }}
          />
        </label>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }} />
        ) : null}
        <label style={{ fontWeight: 600, fontSize: 13 }}>
          Currency
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, borderRadius: 10, border: '1.5px solid #e8e8f0' }}
          >
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          style={{ marginTop: 8, background: '#6b3fe7', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save branding'}
        </button>
        {msg ? <p style={{ fontSize: 13, color: '#0d7a43' }}>{msg}</p> : null}
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/industries/hospitality/front-desk" style={{ color: '#6b3fe7', fontWeight: 700 }}>
          Open front desk →
        </Link>
      </p>
    </div>
  );
}

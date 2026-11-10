'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export function SolutionBrandingForm({
  edition,
  dashboardPath,
  loginPath,
  deskPath,
  noun,
}: {
  edition: string;
  dashboardPath: string;
  loginPath: string;
  deskPath: string;
  noun: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
                const { data } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = {};
        if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
        const res = await fetch(`/api/industries/branding?edition=${edition}`, { headers });
        const json = await res.json();
        if (json.branding) {
          setDisplayName(json.branding.display_name || '');
          setLogoUrl(json.branding.logo_url || '');
          setCurrency(json.branding.currency || 'NGN');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [edition, loginPath, router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await getSupabase().auth.getSession();
      const res = await fetch('/api/industries/branding', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ edition, displayName, logoUrl, currency }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setMsg('Saved. Staff desk will show this logo and name.');
    } catch (err: any) {
      setMsg(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 520, margin: '32px auto', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <Link href={dashboardPath} style={{ color: '#6b3fe7', fontWeight: 600, textDecoration: 'none' }}>
        ← Owner dashboard
      </Link>
      <h1 style={{ marginTop: 16 }}>Branding</h1>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        Logo and name for the staff {noun}. Owners track overall activity on the main dashboard.
      </p>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        <label style={{ fontWeight: 600, fontSize: 13 }}>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
          <img src={logoUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12 }} />
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
        <Link href={deskPath} style={{ color: '#6b3fe7', fontWeight: 700 }}>
          Open staff desk →
        </Link>
      </p>
    </div>
  );
}

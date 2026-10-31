'use client';

import React, { useState } from 'react';
import { BUSMO_ONE_CONFIG, formatNgn } from '@/lib/busmo-one/config';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BusmoOnePreorderModal({ open, onClose }: Props) {
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [cityOrState, setCityOrState] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [understands, setUnderstands] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/busmo-one/preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          businessName,
          phone,
          email,
          businessType,
          cityOrState,
          quantity,
          message,
          understandsPreorder: understands,
          source: 'welcome_page',
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const field: React.CSSProperties = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: '1px solid #d8e5dc',
    padding: '0 12px',
    fontSize: 15,
    boxSizing: 'border-box',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pre-order Busmo One"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(10, 31, 20, 0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: '20px 18px calc(20px + env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0D7A43', letterSpacing: 0.04 }}>
              BUSMO ONE PRE-ORDER
            </div>
            <h2 style={{ margin: '4px 0 0', fontSize: 20 }}>Register your interest</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: 20 }}>
            ✕
          </button>
        </div>

        {done ? (
          <div style={{ padding: '12px 0 8px' }}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>You&apos;re on the list for Busmo One.</p>
            <p style={{ color: '#3D6652', lineHeight: 1.5 }}>
              This is a pre-order registration, not a completed purchase. Our team will contact you to confirm
              details and next steps. The founding offer includes eligibility for {BUSMO_ONE_CONFIG.promotionLabel} after a qualifying purchase — the subscription is not activated by this form.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: 16,
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: '#14A05A',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
              Proposed founding price {formatNgn(BUSMO_ONE_CONFIG.earlyAccessPriceNgn)}
              {!BUSMO_ONE_CONFIG.priceConfirmed ? ' (pending confirmation)' : ''}. No payment is taken here.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Full name *</label>
            <input style={field} required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Business name *</label>
            <input style={field} required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Phone *</label>
            <input style={field} required value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="080…" />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Email *</label>
            <input style={field} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Business type</label>
            <input style={field} value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Retail, restaurant, wholesale…" />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>City / state</label>
            <input style={field} value={cityOrState} onChange={(e) => setCityOrState(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Terminals interested in</label>
            <input
              style={field}
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ ...field, height: 'auto', padding: 12, resize: 'vertical' }}
            />
            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12, fontSize: 13 }}>
              <input type="checkbox" checked={understands} onChange={(e) => setUnderstands(e.target.checked)} style={{ marginTop: 3 }} />
              <span>
                I understand this is a pre-order registration for upcoming hardware, not a completed purchase or payment.
              </span>
            </label>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 10 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 16,
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: 'none',
                background: loading ? '#86efac' : '#14A05A',
                color: '#fff',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Submitting…' : 'Join the Pre-Order'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

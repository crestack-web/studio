'use client';

import React, { useMemo, useState } from 'react';
import {
  BUSMO_ONE_CONFIG,
  formatNgn,
  getBusmoOneChargePrice,
} from '@/lib/busmo-one/config';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BusmoOnePreorderModal({ open, onClose }: Props) {
  const pricing = useMemo(() => getBusmoOneChargePrice(), []);
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [cityOrState, setCityOrState] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const total = pricing.charge * quantity;

  const field: React.CSSProperties = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: '1.5px solid #d1d5db',
    padding: '0 12px',
    fontSize: 15,
    boxSizing: 'border-box',
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/busmo-one/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          businessType: businessType.trim() || null,
          cityOrState: cityOrState.trim() || null,
          quantity,
          message: message.trim() || null,
          source: 'welcome_page',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not start payment');
      const url = data.data?.authorization_url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Payment failed');
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10, 31, 20, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '92vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 16,
          padding: '22px 22px 20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0D7A43', letterSpacing: '0.06em' }}>
              {pricing.saleActive ? 'BLACK FRIDAY · BUY NOW' : 'BUY BUSMO ONE'}
            </p>
            <h3 style={{ margin: '4px 0 0', fontSize: 20, color: '#0A1F14' }}>
              {BUSMO_ONE_CONFIG.productName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            style={{
              border: 'none',
              background: '#f3f4f6',
              width: 36,
              height: 36,
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 14, padding: '12px 14px', background: '#f3faf6', borderRadius: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
            <strong style={{ fontSize: 22 }}>{formatNgn(pricing.charge)}</strong>
            {pricing.saleActive ? (
              <s style={{ color: '#82A993' }}>{formatNgn(pricing.list)}</s>
            ) : null}
            <span style={{ fontSize: 13, color: '#3D6652' }}>per terminal</span>
          </div>
          {pricing.saleActive ? (
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#0D7A43', fontWeight: 600 }}>
              {pricing.percentOff}% Black Friday off list price
            </p>
          ) : null}
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#3D6652' }}>
            Includes eligibility for {BUSMO_ONE_CONFIG.promotionLabel} after payment.
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700 }}>
            Total now: {formatNgn(total)}
            {quantity > 1 ? ` (${quantity} × ${formatNgn(pricing.charge)})` : ''}
          </p>
        </div>

        {done ? (
          <p style={{ color: '#0D7A43', fontWeight: 600 }}>Redirecting to secure checkout…</p>
        ) : (
          <form onSubmit={onSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Full name *</label>
            <input style={field} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Business name</label>
            <input style={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Phone *</label>
            <input style={field} required value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Email *</label>
            <input
              style={field}
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Business type</label>
            <input
              style={field}
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="Retail, restaurant, wholesale…"
            />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>City / state</label>
            <input style={field} value={cityOrState} onChange={(e) => setCityOrState(e.target.value)} />
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>Quantity</label>
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
              rows={2}
              style={{ ...field, height: 'auto', padding: 12, resize: 'vertical' }}
            />
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 1.45 }}>
              You will pay securely with Paystack (card, bank, USSD). This is a real purchase for the terminal
              at the price shown. Hardware fulfilment is coordinated by our team after payment.
            </p>
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
              {loading ? 'Opening checkout…' : `Pay ${formatNgn(total)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

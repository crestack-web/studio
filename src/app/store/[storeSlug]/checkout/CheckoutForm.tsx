'use client';

import React, { useState, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

interface ShippingZone {
  id: string;
  zoneName: string;
  flatRate: number;
  estimatedDeliveryDays: number;
  regions: string[];
}

interface PickupLocation {
  name: string;
  address: string;
}

interface Props {
  storeSlug: string;
  businessId: string;
  currency: string;
  shippingZones: ShippingZone[];
  pickupLocations: PickupLocation[];
}

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

type DeliveryOption = 'delivery' | 'pickup';

export function CheckoutForm({
  storeSlug, businessId, currency, shippingZones, pickupLocations,
}: Props) {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();

  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>(
    pickupLocations.length > 0 ? 'pickup' : 'delivery'
  );
  const [address,        setAddress]        = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(shippingZones[0]?.id ?? '');
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  const selectedZone = shippingZones.find(z => z.id === selectedZoneId);
  const shippingCost = deliveryOption === 'delivery' ? (selectedZone?.flatRate ?? 0) : 0;
  const total = subtotal + shippingCost;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (deliveryOption === 'delivery' && !address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const lineItems = items.map(item => ({
        productId:   item.productId,
        productType: item.productType,
        displayName: item.displayName,
        quantity:    item.quantity,
        unitPrice:   item.price,
        lineTotal:   item.price * item.quantity,
      }));

      const res = await fetch('/api/store/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug, businessId,
          lineItems,
          customerName:    name.trim(),
          customerEmail:   email.trim(),
          customerPhone:   phone.trim(),
          deliveryOption,
          shippingAddress: deliveryOption === 'delivery' ? address.trim() : null,
          shippingZoneId:  deliveryOption === 'delivery' ? selectedZoneId : null,
          shippingCost,
          subtotal,
          total,
        }),
      });

      const data = await res.json() as { paystackUrl?: string; error?: string; sessionId?: string };

      if (!res.ok || !data.paystackUrl) {
        setError(data.error ?? 'Failed to initiate payment. Please try again.');
        return;
      }

      // Store sessionId for the pending page
      sessionStorage.setItem(`mo_checkout_${storeSlug}`, data.sessionId ?? '');

      // Fire analytics
      fetch('/api/store/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'checkout_initiated', storeSlug, businessId, pageType: 'checkout' }),
      }).catch(() => {});

      // Redirect to Paystack
      clearCart();
      window.location.href = data.paystackUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [name, email, phone, address, deliveryOption, selectedZoneId, shippingCost, subtotal, total, items, storeSlug, businessId, clearCart]);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--sf-text-3)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛒</div>
        <p style={{ fontWeight: 600 }}>Your cart is empty</p>
        <button
          onClick={() => router.push(`/store/${storeSlug}`)}
          style={{ marginTop: 16, padding: '10px 20px', background: 'var(--sf-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          Continue shopping
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Customer details */}
      <div style={cardStyle}>
        <p style={sectionTitle}>1. Contact details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Full name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" required />
          </div>
          <div>
            <label style={labelStyle}>Phone *</label>
            <input style={inputStyle} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" required />
          </div>
        </div>
      </div>

      {/* Delivery option */}
      <div style={cardStyle}>
        <p style={sectionTitle}>2. Delivery method</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['delivery', 'pickup'] as DeliveryOption[]).map(opt => {
            const available = opt === 'delivery' ? shippingZones.length > 0 : pickupLocations.length > 0;
            if (!available) return null;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setDeliveryOption(opt)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${deliveryOption === opt ? 'var(--sf-primary)' : 'var(--sf-border)'}`,
                  background: deliveryOption === opt ? 'rgba(14,165,233,0.06)' : 'var(--sf-bg)',
                  fontWeight: 600, fontSize: '0.875rem',
                  color: deliveryOption === opt ? 'var(--sf-primary)' : 'var(--sf-text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {opt === 'delivery' ? '🚚 Home delivery' : '🏪 Pickup'}
              </button>
            );
          })}
        </div>

        {deliveryOption === 'delivery' && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Delivery address *</label>
              <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address, city" required />
            </div>
            {shippingZones.length > 0 && (
              <div>
                <label style={labelStyle}>Shipping zone</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value)}
                >
                  {shippingZones.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.zoneName} — {z.flatRate === 0 ? 'Free' : fmt(z.flatRate, currency)} ({z.estimatedDeliveryDays} day{z.estimatedDeliveryDays !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {deliveryOption === 'pickup' && pickupLocations.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--sf-text-2)' }}>Pickup locations:</p>
            {pickupLocations.map((loc, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                fontSize: '0.875rem',
              }}>
                <p style={{ fontWeight: 600, color: 'var(--sf-text-1)' }}>{loc.name}</p>
                <p style={{ color: 'var(--sf-text-3)', fontSize: '0.78rem', marginTop: 2 }}>{loc.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order summary */}
      <div style={cardStyle}>
        <p style={sectionTitle}>3. Order summary</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <div key={item.productId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 7,
                background: 'var(--sf-bg)', border: '1px solid var(--sf-border)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {item.imageUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--sf-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.displayName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>× {item.quantity}</p>
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>{fmt(item.price * item.quantity, currency)}</p>
            </div>
          ))}

          <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 12, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>
              <span>Subtotal</span>
              <span>{fmt(subtotal, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : fmt(shippingCost, currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.05rem', color: 'var(--sf-text-1)', borderTop: '1px solid var(--sf-border)', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span>
              <span>{fmt(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#B91C1C', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '15px', borderRadius: 10,
          background: submitting ? 'var(--sf-text-3)' : 'var(--sf-primary)',
          color: '#fff', border: 'none', fontWeight: 700, fontSize: '1rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {submitting ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            Redirecting to payment…
          </>
        ) : (
          <>
            Pay {fmt(total, currency)} with Paystack
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </>
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>
        🔒 Secured by Paystack · Your payment info is never stored on this site
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--sf-surface)',
  border: '1px solid var(--sf-border)',
  borderRadius: 'var(--sf-radius)',
  padding: '20px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--sf-text-2)', marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid var(--sf-border)',
  borderRadius: 8, fontSize: '0.875rem',
  fontFamily: 'inherit', color: 'var(--sf-text-1)',
  background: 'var(--sf-bg)', outline: 'none',
  boxSizing: 'border-box',
};

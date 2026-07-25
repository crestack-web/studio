import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface LineItem {
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deliveryOption: string;
  shippingAddress: string | null;
  shippingCost: number;
  lineItems: LineItem[];
  subtotal: number;
  total: number;
  status: string;
  createdAt: any;
}

async function getStoreConfig(storeSlug: string) {
  try {
    const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getOrder(businessId: string, orderId: string): Promise<Order | null> {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeOrders').doc(orderId)
      .get();
    if (!snap.exists) return null;
    return { ...snap.data() as Order };
  } catch { return null; }
}

function fmt(n: number, currency: string) {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString()}`;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ storeSlug: string; orderId: string }>;
}) {
  const { storeSlug, orderId } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const order = await getOrder(config.businessId, orderId);
  if (!order) notFound();

  const currency = config.currency ?? 'NGN';

  return (
    <div className="sf-page" style={{ maxWidth: 640 }}>
      {/* Success banner */}
      <div style={{
        textAlign: 'center', marginBottom: 32,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)' }}>
            Order confirmed! 🎉
          </h1>
          <p style={{ color: 'var(--sf-text-3)', marginTop: 6 }}>
            Order #{order.orderNumber} · Confirmation sent to {order.customerEmail}
          </p>
        </div>
      </div>

      {/* Order summary card */}
      <div style={{
        background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
        borderRadius: 'var(--sf-radius-lg)', overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg)' }}>
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--sf-text-1)' }}>Order details</p>
        </div>

        {/* Line items */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {order.lineItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--sf-text-1)' }}>
                {item.displayName}
                <span style={{ color: 'var(--sf-text-3)', marginLeft: 8 }}>× {item.quantity}</span>
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', flexShrink: 0 }}>
                {fmt(item.lineTotal, currency)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--sf-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sf-text-2)' }}>
            <span>Subtotal</span>
            <span>{fmt(order.subtotal, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--sf-text-2)' }}>
            <span>{order.deliveryOption === 'pickup' ? 'Pickup' : 'Shipping'}</span>
            <span>{order.shippingCost === 0 ? 'Free' : fmt(order.shippingCost, currency)}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontWeight: 800, fontSize: '1.05rem', color: 'var(--sf-text-1)',
            borderTop: '1px solid var(--sf-border)', paddingTop: 8, marginTop: 4,
          }}>
            <span>Total paid</span>
            <span>{fmt(order.total, currency)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      <div style={{
        background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
        borderRadius: 'var(--sf-radius)', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24,
      }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--sf-text-1)' }}>
          {order.deliveryOption === 'pickup' ? '🏪 Pickup details' : '🚚 Delivery details'}
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>
          <strong>{order.customerName}</strong>
        </p>
        {order.deliveryOption === 'delivery' && order.shippingAddress && (
          <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>{order.shippingAddress}</p>
        )}
        {order.deliveryOption === 'pickup' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>We'll contact you to arrange pickup</p>
        )}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link
          href={`/store/${storeSlug}`}
          style={{
            padding: '11px 24px',
            background: 'var(--sf-primary)', color: '#fff',
            borderRadius: 8, fontWeight: 700, fontSize: '0.9rem',
            textDecoration: 'none',
          }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

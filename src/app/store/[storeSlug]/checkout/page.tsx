import React from 'react';
import { notFound } from 'next/navigation';
import { CheckoutForm } from './CheckoutForm';

async function getStoreConfig(storeSlug: string) {
  try {
    const base = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/store/config/${storeSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getShippingZones(businessId: string) {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeShippingZones').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const shippingZones = await getShippingZones(config.businessId);
  const pickupLocations = config.pickupLocations ?? [];

  return (
    <div className="sf-page" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 4 }}>
        Checkout
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-3)', marginBottom: 28 }}>
        Complete your order details below
      </p>
      <CheckoutForm
        storeSlug={storeSlug}
        businessId={config.businessId}
        currency={config.currency}
        shippingZones={shippingZones as any[]}
        pickupLocations={pickupLocations}
      />
    </div>
  );
}

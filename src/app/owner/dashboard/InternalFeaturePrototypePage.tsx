'use client';

import React from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import {
  DELIVERY_TRACKER_DEFINITION,
  DELIVERY_TRACKER_SAMPLE_ROWS,
} from '@/lib/custom-features/definitions/delivery-tracker';

/**
 * Internal-only page proving FeatureDefinition → validate → Busmo-native render.
 * Gated by NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true — not in default nav.
 */
export default function InternalFeaturePrototypePage() {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE === 'true';

  if (!enabled) {
    return (
      <div style={{ padding: 24, maxWidth: 480 }}>
        <h2 style={{ fontWeight: 800 }}>Feature builder prototype</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Disabled. Set{' '}
          <code>NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true</code> to view
          the internal Delivery Tracker prototype.
        </p>
      </div>
    );
  }

  return (
    <FeatureRenderer
      definition={DELIVERY_TRACKER_DEFINITION}
      recordsByEntity={{ delivery: DELIVERY_TRACKER_SAMPLE_ROWS }}
      internal
    />
  );
}

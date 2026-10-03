'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import type { BusmoFeatureDefinition } from '@/lib/custom-features/types';
import type { FeatureRecord } from '@/lib/custom-features/renderer/FeatureRenderer';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';

/**
 * Internal Phase B prototype:
 * ensure published feature → load records → CRUD via API.
 * Gated by NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true
 */
export default function InternalFeaturePrototypePage() {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE === 'true';
  const { businessId: ctxBusinessId, user } = useApp() as {
    businessId?: string;
    user?: { id?: string };
  };

  const [businessId, setBusinessId] = useState(ctxBusinessId || '');
  const [definition, setDefinition] = useState<BusmoFeatureDefinition | null>(
    null
  );
  const [featureId, setFeatureId] = useState<string | null>(null);
  const [records, setRecords] = useState<FeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function authHeaders(): Promise<HeadersInit> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Not signed in');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  const load = useCallback(async (bid: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const ensureRes = await fetch(
        `/api/custom-features?businessId=${encodeURIComponent(bid)}&slug=delivery-tracker&ensure=1`,
        { headers }
      );
      const ensureJson = await ensureRes.json().catch(() => ({}));
      if (!ensureRes.ok) {
        throw new Error(ensureJson.error || 'Failed to load feature');
      }
      const feature = ensureJson.feature;
      setFeatureId(feature.id);
      setDefinition(feature.definition as BusmoFeatureDefinition);

      const recRes = await fetch(
        `/api/custom-features/records?businessId=${encodeURIComponent(bid)}&featureId=${encodeURIComponent(feature.id)}&entityKey=delivery`,
        { headers }
      );
      const recJson = await recRes.json().catch(() => ({}));
      if (!recRes.ok) {
        throw new Error(recJson.error || 'Failed to load records');
      }
      const rows = (recJson.records || []).map(
        (r: { id: string; data: Record<string, unknown>; status?: string }) => ({
          id: r.id,
          data: r.data || {},
          status: r.status,
        })
      );
      setRecords(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const bid =
      ctxBusinessId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('businessId') ||
          localStorage.getItem('busmo_business_id') ||
          ''
        : '');
    setBusinessId(bid);
    if (!enabled || !bid) {
      setLoading(false);
      return;
    }
    void load(bid);
  }, [ctxBusinessId, enabled, load]);

  if (!enabled) {
    return (
      <div style={{ padding: 24, maxWidth: 520 }}>
        <h2 style={{ fontWeight: 800 }}>Feature builder prototype</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Disabled. Set{' '}
          <code>NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true</code> and open
          page <code>feature-prototype</code>.
        </p>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div style={{ padding: 24 }}>
        <p>No business context. Sign in as an owner with an active business.</p>
      </div>
    );
  }

  if (!definition || !featureId) {
    return (
      <div style={{ padding: 24 }}>
        {loading ? 'Loading feature…' : error || 'No published feature'}
      </div>
    );
  }

  return (
    <FeatureRenderer
      definition={definition}
      records={records}
      loading={loading}
      error={error}
      internal
      onCreate={async (entityKey, data) => {
        const headers = await authHeaders();
        const res = await fetch('/api/custom-features/records', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'create',
            businessId,
            featureId,
            entityKey,
            data,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(json.details)
            ? json.details.map((d: { message: string }) => d.message).join('; ')
            : '';
          throw new Error(detail || json.error || 'Create failed');
        }
        await load(businessId);
      }}
      onUpdate={async (entityKey, recordId, data) => {
        const headers = await authHeaders();
        const res = await fetch('/api/custom-features/records', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'update',
            businessId,
            featureId,
            recordId,
            data,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = Array.isArray(json.details)
            ? json.details.map((d: { message: string }) => d.message).join('; ')
            : '';
          throw new Error(detail || json.error || 'Update failed');
        }
        await load(businessId);
      }}
      onDelete={async (_entityKey, recordId) => {
        const headers = await authHeaders();
        const res = await fetch('/api/custom-features/records', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'delete',
            businessId,
            featureId,
            recordId,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Delete failed');
        await load(businessId);
      }}
    />
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import type { BusmoFeatureDefinition } from '@/lib/custom-features/types';
import type { FeatureRecord } from '@/lib/custom-features/renderer/FeatureRenderer';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';

const STORAGE_KEY = 'busmo_open_feature_id';

export function openCustomFeatureId(featureId: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, featureId);
  }
}

export function readOpenCustomFeatureId(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) || '';
}

export default function CustomFeaturePage() {
  const { user, navigateTo } = useApp() as {
    user: { id?: string; businessId?: string };
    navigateTo: (page: string) => void;
  };
  const businessId = user?.businessId || '';
  const [featureId, setFeatureId] = useState('');
  const [definition, setDefinition] = useState<BusmoFeatureDefinition | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [status, setStatus] = useState('');
  const [records, setRecords] = useState<FeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function authHeaders(): Promise<HeadersInit> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Please sign in again.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  const load = useCallback(async () => {
    const id = readOpenCustomFeatureId();
    setFeatureId(id);
    if (!businessId || !id) {
      setLoading(false);
      setError('No feature selected. Open one from Business Builder or My tools.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'get_custom_feature_draft',
          businessId,
          featureId: id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load feature');
      const feature = json.feature;
      if (!feature?.definition) throw new Error('Feature definition missing');
      setDefinition(feature.definition);
      setFeatureName(feature.name || feature.definition.name);
      setStatus(feature.status || feature.definition.status);
      const entityKey = feature.definition.entities?.[0]?.key;
      if (entityKey) {
        const recRes = await fetch(
          `/api/custom-features/records?businessId=${encodeURIComponent(businessId)}&featureId=${encodeURIComponent(id)}&entityKey=${encodeURIComponent(entityKey)}`,
          { headers }
        );
        const recJson = await recRes.json().catch(() => ({}));
        if (recRes.ok) {
          setRecords(
            (recJson.records || []).map(
              (r: { id: string; data: Record<string, unknown>; status?: string }) => ({
                id: r.id,
                data: r.data || {},
                status: r.status,
              })
            )
          );
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!businessId) {
    return (
      <div style={{ padding: 24 }}>
        <p>Sign in as a business owner to use this tool.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 16px 96px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B3FE7' }}>
            YOUR TOOL
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: '1.35rem', fontWeight: 800 }}>
            {featureName || 'Custom feature'}
          </h1>
          {status && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: 999,
                background: status === 'published' ? '#d1fae5' : '#fef3c7',
                color: status === 'published' ? '#065f46' : '#92400e',
              }}
            >
              {status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigateTo('business-builder')}
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Business Builder
          </button>
          <button
            type="button"
            onClick={() => void load()}
            style={{
              border: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: 999,
              padding: '8px 14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {definition && (
        <FeatureRenderer
          definition={definition}
          records={records}
          loading={loading}
          error={null}
          workspace
          businessId={businessId}
          internal={status !== 'published'}
          onCreate={
            status === 'published'
              ? async (entityKey, data) => {
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
                  if (!res.ok) throw new Error(json.error || 'Could not save');
                  await load();
                }
              : undefined
          }
          onUpdate={
            status === 'published'
              ? async (entityKey, recordId, data) => {
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
                  if (!res.ok) throw new Error(json.error || 'Update failed');
                  await load();
                }
              : undefined
          }
          onDelete={
            status === 'published'
              ? async (entityKey, recordId) => {
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
                  await load();
                }
              : undefined
          }
        />
      )}

      {!definition && !loading && !error && (
        <p style={{ color: '#6b7280' }}>Open a published feature from Business Builder.</p>
      )}
    </div>
  );
}

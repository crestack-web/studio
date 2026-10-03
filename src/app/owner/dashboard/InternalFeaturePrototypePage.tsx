'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import type { BusmoFeatureDefinition } from '@/lib/custom-features/types';
import type { FeatureRecord } from '@/lib/custom-features/renderer/FeatureRenderer';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';

/**
 * Internal Phase B/C prototype:
 * - published Delivery Tracker CRUD
 * - MO-style natural language → DRAFT → Preview (same FeatureRenderer) → Publish
 * Gated by NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE=true
 */
export default function InternalFeaturePrototypePage() {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_FEATURE_BUILDER_PROTOTYPE === 'true';
  const { businessId: ctxBusinessId } = useApp() as {
    businessId?: string;
  };

  const [businessId, setBusinessId] = useState(ctxBusinessId || '');
  const [definition, setDefinition] = useState<BusmoFeatureDefinition | null>(
    null
  );
  const [featureId, setFeatureId] = useState<string | null>(null);
  const [featureStatus, setFeatureStatus] = useState<string | null>(null);
  const [records, setRecords] = useState<FeatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nlMessage, setNlMessage] = useState(
    'Create a delivery tracker with customer, order, driver, status, delivery date and amount.'
  );
  const [builderNotice, setBuilderNotice] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Array<{ id: string; name: string; status: string; slug: string }>
  >([]);
  const [mode, setMode] = useState<'published' | 'draft-preview'>('published');

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

  const loadDrafts = useCallback(async (bid: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool: 'list_drafts', businessId: bid }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDrafts(
          (json.drafts || []).map(
            (d: { id: string; name: string; status: string; slug: string }) => ({
              id: d.id,
              name: d.name,
              status: d.status,
              slug: d.slug,
            })
          )
        );
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadPublished = useCallback(async (bid: string) => {
    setLoading(true);
    setError(null);
    setMode('published');
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
      setFeatureStatus(feature.status);
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
      await loadDrafts(bid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [loadDrafts]);

  const previewDraft = async (draftId: string) => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    setBuilderNotice(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'get_custom_feature_draft',
          businessId,
          featureId: draftId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.feature) {
        throw new Error(json.error || 'Draft not found');
      }
      setFeatureId(json.feature.id);
      setFeatureStatus(json.feature.status);
      setDefinition(json.feature.definition as BusmoFeatureDefinition);
      setRecords([]);
      setMode('draft-preview');
      setBuilderNotice(
        'PREVIEW (DRAFT) — same FeatureRenderer as published. Not live until you Publish.'
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async () => {
    if (!businessId || !featureId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'publish_draft',
          businessId,
          featureId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Publish failed');
      setBuilderNotice(
        json.notice || 'FEATURE PUBLISHED — now active for this business.'
      );
      setMode('published');
      await loadPublished(businessId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const runNlBuilder = async () => {
    if (!businessId || !nlMessage.trim()) return;
    setLoading(true);
    setError(null);
    setBuilderNotice(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'build_from_natural_language',
          businessId,
          message: nlMessage,
          useLlm: false,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Builder failed');

      if (json.result?.kind === 'clarification') {
        setBuilderNotice(`MO: ${json.result.question}`);
        return;
      }
      if (json.result?.kind === 'unsupported') {
        setBuilderNotice(`MO: ${json.result.message}`);
        return;
      }
      if (json.result?.kind === 'invalid') {
        setBuilderNotice(`Validation failed: ${json.result.message}`);
        return;
      }
      if (json.feature) {
        setBuilderNotice(
          json.result?.summary ||
            json.notice ||
            'DRAFT CREATED — not live until you publish.'
        );
        await loadDrafts(businessId);
        await previewDraft(json.feature.id);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Builder failed');
    } finally {
      setLoading(false);
    }
  };

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
    void loadPublished(bid);
  }, [ctxBusinessId, enabled, loadPublished]);

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

  return (
    <div>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '16px 16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#F3EFFE',
            border: '1px solid #D4C6FF',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#6B3FE7',
              marginBottom: 8,
            }}
          >
            MO Feature Builder (Phase C) — draft only
          </div>
          <textarea
            value={nlMessage}
            onChange={(e) => setNlMessage(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #E8E8F0',
              padding: 10,
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => void runNlBuilder()}
              style={{
                background: '#6B3FE7',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Generate draft
            </button>
            <button
              type="button"
              onClick={() => void loadPublished(businessId)}
              style={{
                background: '#fff',
                color: '#0A0A0F',
                border: '1px solid #E8E8F0',
                borderRadius: 8,
                padding: '8px 14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Back to published Delivery Tracker
            </button>
            {mode === 'draft-preview' && featureId && (
              <button
                type="button"
                onClick={() => void publishDraft()}
                style={{
                  background: '#059669',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Publish draft
              </button>
            )}
          </div>
          {builderNotice && (
            <p style={{ margin: '10px 0 0', fontSize: 13, color: '#4B27B0' }}>
              {builderNotice}
            </p>
          )}
          {drafts.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13 }}>
              <strong>Drafts:</strong>{' '}
              {drafts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => void previewDraft(d.id)}
                  style={{
                    marginRight: 8,
                    marginTop: 4,
                    border: '1px solid #D4C6FF',
                    background: '#fff',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {d.name} ({d.slug})
                </button>
              ))}
            </div>
          )}
          {featureStatus && (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b7280' }}>
              Viewing: <code>{featureStatus}</code>
              {mode === 'draft-preview' ? ' (preview)' : ''}
            </p>
          )}
        </div>
      </div>

      {!definition || !featureId ? (
        <div style={{ padding: 24 }}>
          {loading ? 'Loading feature…' : error || 'No feature loaded'}
        </div>
      ) : (
        <FeatureRenderer
          definition={definition}
          records={records}
          loading={loading}
          error={error}
          internal
          onCreate={
            mode === 'published'
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
                  if (!res.ok) {
                    const detail = Array.isArray(json.details)
                      ? json.details
                          .map((d: { message: string }) => d.message)
                          .join('; ')
                      : '';
                    throw new Error(detail || json.error || 'Create failed');
                  }
                  await loadPublished(businessId);
                }
              : undefined
          }
          onUpdate={
            mode === 'published'
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
                  if (!res.ok) {
                    const detail = Array.isArray(json.details)
                      ? json.details
                          .map((d: { message: string }) => d.message)
                          .join('; ')
                      : '';
                    throw new Error(detail || json.error || 'Update failed');
                  }
                  await loadPublished(businessId);
                }
              : undefined
          }
          onDelete={
            mode === 'published'
              ? async (_entityKey, recordId) => {
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
                  await loadPublished(businessId);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

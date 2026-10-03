'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import type { BusmoFeatureDefinition } from '@/lib/custom-features/types';
import type { FeatureRecord } from '@/lib/custom-features/renderer/FeatureRenderer';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';
import styles from './BusinessBuilderPage.module.css';

const EXAMPLES = [
  'Track the suppliers who bring PET bottles to my recycling business.',
  'I need to track roofing jobs, customer payments and balances.',
  'Create something to manage deliveries and drivers.',
  'Track production batches and the cost of each batch.',
  'I want to know how much each distributor owes me.',
];

const LOADING_STEPS = [
  'Understanding your business…',
  'Designing the tool…',
  'Checking the feature…',
  'Ready for your review',
];

type FeatureRow = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  slug: string;
  updated_at?: string;
  definition?: BusmoFeatureDefinition;
};

type ViewMode = 'home' | 'review' | 'live' | 'published-success';

export default function BusinessBuilderPage() {
  const { businessId: ctxBusinessId } = useApp() as { businessId?: string };
  const [businessId, setBusinessId] = useState(ctxBusinessId || '');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [moMessage, setMoMessage] = useState<string | null>(null);
  const [feature, setFeature] = useState<FeatureRow | null>(null);
  const [definition, setDefinition] = useState<BusmoFeatureDefinition | null>(null);
  const [records, setRecords] = useState<FeatureRecord[]>([]);
  const [changeLines, setChangeLines] = useState<string[]>([]);
  const [editText, setEditText] = useState('');
  const [history, setHistory] = useState<FeatureRow[]>([]);
  const [mode, setMode] = useState<ViewMode>('home');
  const [showPublishModal, setShowPublishModal] = useState(false);

  async function authHeaders(): Promise<HeadersInit> {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Please sign in again to continue.');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  const refreshHistory = useCallback(async (bid: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool: 'list_features', businessId: bid }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setHistory(json.features || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadRecords = async (bid: string, featureId: string, entityKey: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `/api/custom-features/records?businessId=${encodeURIComponent(bid)}&featureId=${encodeURIComponent(featureId)}&entityKey=${encodeURIComponent(entityKey)}`,
        { headers }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setRecords(
        (json.records || []).map(
          (r: { id: string; data: Record<string, unknown>; status?: string }) => ({
            id: r.id,
            data: r.data || {},
            status: r.status,
          })
        )
      );
    } catch {
      setRecords([]);
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
    if (bid) void refreshHistory(bid);
  }, [ctxBusinessId, refreshHistory]);

  useEffect(() => {
    if (!loading) return;
    setLoadStep(0);
    const t1 = setTimeout(() => setLoadStep(1), 400);
    const t2 = setTimeout(() => setLoadStep(2), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const buildFromPrompt = async (text?: string) => {
    const message = (text ?? prompt).trim();
    if (!businessId || !message) return;
    setLoading(true);
    setError(null);
    setMoMessage(null);
    setChangeLines([]);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'build_from_natural_language',
          businessId,
          message,
          useLlm: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Please sign in again.');
      if (res.status === 403) throw new Error('You do not have access to this business.');
      if (!res.ok) throw new Error(json.error || 'Could not build this feature.');

      if (json.result?.kind === 'clarification') {
        setMoMessage(json.result.question);
        setMode('home');
        return;
      }
      if (json.result?.kind === 'unsupported') {
        setMoMessage(json.result.message);
        setMode('home');
        return;
      }
      if (json.result?.kind === 'invalid') {
        setError('Busmo could not validate that tool. Try describing the fields you need more clearly.');
        return;
      }
      if (!json.feature) {
        setError('No feature was created. Try again with a clearer description.');
        return;
      }

      setFeature(json.feature);
      setDefinition(json.feature.definition);
      setRecords([]);
      setMoMessage(
        `Got it. I can build ${json.feature.name} for your business.`
      );
      setLoadStep(3);
      setMode('review');
      await refreshHistory(businessId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setMode('home');
    } finally {
      setLoading(false);
    }
  };

  const applyEdit = async () => {
    if (!businessId || !feature || !editText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'edit_draft_from_natural_language',
          businessId,
          featureId: feature.id,
          message: editText.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not update the draft.');
      if (json.result?.kind === 'unsupported') {
        setMoMessage(json.result.message);
        return;
      }
      if (json.feature) {
        setFeature(json.feature);
        setDefinition(json.feature.definition);
        setChangeLines(json.changeLines || []);
        setEditText('');
        setMoMessage(json.note || 'Draft updated.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    if (!businessId || !feature) return;
    setLoading(true);
    setError(null);
    setShowPublishModal(false);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'publish_draft',
          businessId,
          featureId: feature.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Publish failed');
      setFeature(json.feature);
      setDefinition(json.feature.definition);
      setMode('published-success');
      await refreshHistory(businessId);
      const entityKey = json.feature.definition?.entities?.[0]?.key;
      if (entityKey) await loadRecords(businessId, json.feature.id, entityKey);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setLoading(false);
    }
  };

  const openFeature = async (row: FeatureRow) => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      // Prefer draft fetch; fall back to list row definition
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'get_custom_feature_draft',
          businessId,
          featureId: row.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const f = json.feature || row;
      if (!f?.definition && row.definition) f.definition = row.definition;
      // If still missing definition, list_features already has it
      if (!f.definition) {
        const listRes = await fetch('/api/custom-features/builder', {
          method: 'POST',
          headers,
          body: JSON.stringify({ tool: 'list_features', businessId }),
        });
        const listJson = await listRes.json().catch(() => ({}));
        const found = (listJson.features || []).find((x: FeatureRow) => x.id === row.id);
        if (found) {
          setFeature(found);
          setDefinition(found.definition || null);
        }
      } else {
        setFeature(f);
        setDefinition(f.definition);
      }
      const entityKey = (f.definition || row.definition)?.entities?.[0]?.key;
      if (entityKey && (f.status === 'published' || row.status === 'published')) {
        await loadRecords(businessId, row.id, entityKey);
        setMode('live');
      } else {
        setRecords([]);
        setMode('review');
      }
      setMoMessage(null);
      setChangeLines([]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not open feature');
    } finally {
      setLoading(false);
    }
  };

  const continueEditingPublished = async (row: FeatureRow) => {
    if (!businessId || !row.definition) return;
    setLoading(true);
    try {
      const headers = await authHeaders();
      // Create/update draft from published definition (status forced to draft in tool)
      const def = {
        ...row.definition,
        status: 'draft' as const,
        id: undefined as unknown as string,
      };
      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'create_custom_feature_draft',
          businessId,
          definition: {
            ...row.definition,
            status: 'draft',
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not create draft');
      setFeature(json.feature);
      setDefinition(json.feature.definition);
      setRecords([]);
      setMode('review');
      setMoMessage('Draft created from your published feature. Published version stays live until you publish again.');
      await refreshHistory(businessId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not start draft');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void buildFromPrompt();
    }
  };

  if (!businessId) {
    return (
      <div className={styles.root}>
        <p className={styles.sub}>Sign in as a business owner to use Business Builder.</p>
      </div>
    );
  }

  const entity = definition?.entities?.[0];
  const status = feature?.status || definition?.status;

  return (
    <div className={styles.root}>
      {(mode === 'home' || mode === 'published-success') && (
        <>
          <div className={styles.hero}>
            <div className={styles.kicker}>Business Builder</div>
            <h1 className={styles.title}>Build Busmo around your business.</h1>
            <p className={styles.sub}>
              Tell Busmo what you need to track, manage or automate. We’ll turn it into a
              business tool you can review and add to your workspace.
            </p>
          </div>

          {mode === 'published-success' && feature && (
            <div className={styles.successBanner}>
              Your feature is live — {feature.name}
              <div className={styles.cardActions} style={{ marginTop: 10 }}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => void openFeature(feature)}
                >
                  Open feature
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setMode('home');
                    setFeature(null);
                    setDefinition(null);
                    setPrompt('');
                  }}
                >
                  Continue building
                </button>
              </div>
            </div>
          )}

          <div className={styles.inputCard}>
            <textarea
              className={styles.textarea}
              placeholder="What do you need Busmo to help you manage?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <div className={styles.inputBar}>
              <span className={styles.hint}>⌘ / Ctrl + Enter</span>
              <button
                type="button"
                className={styles.primaryBtn}
                disabled={loading || !prompt.trim()}
                onClick={() => void buildFromPrompt()}
              >
                Build it
              </button>
            </div>
          </div>

          <div className={styles.examples}>
            <div className={styles.examplesLabel}>Try an example</div>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className={styles.exampleChip}
                onClick={() => {
                  setPrompt(ex);
                  void buildFromPrompt(ex);
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className={styles.loadingBox}>
          <div className={styles.pulse} />
          {LOADING_STEPS[Math.min(loadStep, LOADING_STEPS.length - 1)]}
        </div>
      )}

      {error && <div className={styles.errorBox}>{error}</div>}

      {moMessage && mode === 'home' && !loading && (
        <div className={styles.moCard}>
          <div className={styles.moLabel}>MO</div>
          <p className={styles.moText}>{moMessage}</p>
        </div>
      )}

      {(mode === 'review' || mode === 'live') && definition && feature && !loading && (
        <>
          <div className={styles.moCard}>
            <div className={styles.headerRow}>
              <div>
                <div className={styles.moLabel}>MO</div>
                <p className={styles.moText}>
                  {moMessage || `Here’s ${definition.name}.`}
                </p>
                <h2 style={{ margin: '10px 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>
                  {definition.name}
                </h2>
                <span
                  className={`${styles.badge} ${
                    status === 'published'
                      ? styles.badgePublished
                      : status === 'archived'
                        ? styles.badgeArchived
                        : styles.badgeDraft
                  }`}
                >
                  {status || 'draft'}
                </span>
                {definition.description && (
                  <p className={styles.sub} style={{ marginTop: 10, textAlign: 'left' }}>
                    {definition.description}
                  </p>
                )}
              </div>
              <div className={styles.actions}>
                {status === 'draft' && (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ background: '#059669' }}
                    onClick={() => setShowPublishModal(true)}
                  >
                    Publish feature
                  </button>
                )}
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setMode('home');
                    setFeature(null);
                    setDefinition(null);
                  }}
                >
                  New request
                </button>
              </div>
            </div>

            {entity && (
              <>
                <div className={styles.moLabel} style={{ marginTop: 12 }}>
                  Track
                </div>
                <ul className={styles.fieldList}>
                  {entity.fields.map((f) => (
                    <li key={f.key}>
                      {f.label}
                      {f.required ? ' *' : ''}
                    </li>
                  ))}
                </ul>
                <div className={styles.moLabel} style={{ marginTop: 14 }}>
                  How it will work
                </div>
                <ol className={styles.steps}>
                  <li>Open this tool in Busmo</li>
                  <li>Add a new {entity.label.toLowerCase()}</li>
                  <li>Fill in the fields that matter to your business</li>
                  <li>Save — totals and lists update automatically</li>
                  <li>Edit or publish changes anytime with MO</li>
                </ol>
              </>
            )}

            {changeLines.length > 0 && (
              <div className={styles.changeBox}>
                <strong>Changes</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {changeLines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            )}

            {status === 'draft' && (
              <div className={styles.editRow}>
                <div className={styles.moLabel}>What would you like to change?</div>
                <input
                  className={styles.editInput}
                  placeholder='e.g. "Add supplier location"'
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void applyEdit();
                  }}
                />
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => void applyEdit()}
                  disabled={!editText.trim()}
                >
                  Update draft
                </button>
              </div>
            )}
          </div>

          <div className={styles.previewWrap}>
            <FeatureRenderer
              definition={definition}
              records={records}
              loading={false}
              error={null}
              internal={status === 'draft'}
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
                          featureId: feature.id,
                          entityKey,
                          data,
                        }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(json.error || 'Could not save');
                      }
                      await loadRecords(businessId, feature.id, entityKey);
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
                          featureId: feature.id,
                          recordId,
                          data,
                        }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(json.error || 'Update failed');
                      await loadRecords(businessId, feature.id, entityKey);
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
                          featureId: feature.id,
                          recordId,
                        }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) throw new Error(json.error || 'Delete failed');
                      await loadRecords(businessId, feature.id, entityKey);
                    }
                  : undefined
              }
            />
          </div>
        </>
      )}

      <div className={styles.history}>
        <div className={styles.historyTitle}>Your features</div>
        {history.length === 0 ? (
          <p className={styles.sub} style={{ textAlign: 'left' }}>
            Tools you build will show up here.
          </p>
        ) : (
          <div className={styles.cardGrid}>
            {history.map((h) => (
              <div key={h.id} className={styles.featureCard}>
                <div className={styles.headerRow}>
                  <h3>{h.name}</h3>
                  <span
                    className={`${styles.badge} ${
                      h.status === 'published'
                        ? styles.badgePublished
                        : h.status === 'archived'
                          ? styles.badgeArchived
                          : styles.badgeDraft
                    }`}
                  >
                    {h.status}
                  </span>
                </div>
                <p>{h.description || h.slug}</p>
                {h.updated_at && (
                  <p style={{ marginTop: 6, fontSize: 11 }}>
                    Updated {new Date(h.updated_at).toLocaleString()}
                  </p>
                )}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => void openFeature(h)}
                  >
                    Open
                  </button>
                  {h.status === 'published' && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => void continueEditingPublished(h)}
                    >
                      Continue editing
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && feature && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>Add this to your Busmo</h3>
            <p>
              <strong>{feature.name}</strong>
              <br />
              Once published, this tool will become available in your business workspace.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setShowPublishModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                style={{ background: '#059669' }}
                onClick={() => void publish()}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

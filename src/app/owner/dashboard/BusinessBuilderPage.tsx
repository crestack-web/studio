'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { FeatureRenderer } from '@/lib/custom-features/renderer/FeatureRenderer';
import type { BusmoFeatureDefinition } from '@/lib/custom-features/types';
import type { FeatureRecord } from '@/lib/custom-features/renderer/FeatureRenderer';
import { getSupabase } from '@/lib/supabase';
import { useApp } from './AppContext';
import { openCustomFeatureId } from './CustomFeaturePage';
import styles from './BusinessBuilderPage.module.css';

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
type ChatMsg = { role: 'user' | 'mo'; text: string };

export default function BusinessBuilderPage() {
  const { user, navigateTo } = useApp() as { user: any; navigateTo: (p: string) => void };
  const [businessId, setBusinessId] = useState(user?.businessId || '');
  const [businessCategory, setBusinessCategory] = useState('');
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
  const [builderMode, setBuilderMode] = useState<'planner' | 'builder'>('builder');
  const [thread, setThread] = useState<ChatMsg[]>([]);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

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
    let cancelled = false;
    async function resolveBusinessId() {
      let bid =
        (user?.businessId || '').trim() ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('businessId') ||
            localStorage.getItem('busmo_business_id') ||
            ''
          : '');

      if (!bid && user?.id) {
        try {
          const supabase = getSupabase();
          const { data } = await supabase
            .from('users')
            .select('business_id, businessId')
            .eq('id', user.id)
            .maybeSingle();
          bid = String(
            (data as any)?.business_id ||
              (data as any)?.businessId ||
              ''
          ).trim();
        } catch {
          /* ignore */
        }
      }

      let category =
        (typeof window !== 'undefined'
          ? localStorage.getItem('busmo_category') ||
            localStorage.getItem('selectedCategory') ||
            ''
          : '') || '';

      if (bid) {
        try {
          const supabase = getSupabase();
          const { data } = await supabase
            .from('businesses')
            .select('category, industry, metadata')
            .eq('id', bid)
            .maybeSingle();
          if (data) {
            const meta =
              data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
            category = String(
              data.category ||
                data.industry ||
                (meta as any).category ||
                category ||
                ''
            ).trim();
          }
        } catch {
          /* ignore */
        }
      }

      if (cancelled) return;
      setBusinessId(bid);
      setBusinessCategory(category);
      if (bid) void refreshHistory(bid);
    }
    void resolveBusinessId();
    return () => {
      cancelled = true;
    };
  }, [user?.businessId, user?.id, refreshHistory]);

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

  const sendMessage = async (text?: string) => {
    const message = (text ?? prompt).trim();
    if (!businessId || !message) return;
    setLoading(true);
    setError(null);
    setMoMessage(null);
    setChangeLines([]);
    setThread((prev) => [...prev, { role: 'user', text: message }]);
    setPrompt('');

    const historyText = [...thread, { role: 'user' as const, text: message }]
      .map((m) => `${m.role === 'user' ? 'Owner' : 'MO'}: ${m.text}`)
      .join('\n');
    const contextualMessage =
      thread.length > 0
        ? `${historyText}\n\nLatest owner request: ${message}`
        : message;

    try {
      const headers = await authHeaders();

      if (builderMode === 'planner') {
        const res = await fetch('/api/custom-features/builder', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tool: 'plan_from_natural_language',
            businessId,
            message: contextualMessage,
            useLlm: true,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Please sign in again.');
        if (res.status === 403) throw new Error('You do not have access to this business.');
        if (!res.ok) {
          const raw = String(json.error || '');
          if (/custom_features|schema cache|does not exist|MISSING_CUSTOM_FEATURES/i.test(raw)) {
            throw new Error(
              'Business Builder is almost ready — run migration 0020_custom_features_foundation.sql in Supabase, then try again.'
            );
          }
          throw new Error(raw || 'Could not plan this feature.');
        }

        const r = json.result;
        if (r?.kind === 'clarification') {
          setThread((prev) => [...prev, { role: 'mo', text: r.question }]);
          setMoMessage(r.question);
          return;
        }
        if (r?.kind === 'unsupported') {
          setThread((prev) => [...prev, { role: 'mo', text: r.message }]);
          setMoMessage(r.message);
          return;
        }
        if (r?.kind === 'invalid') {
          setError('Busmo could not validate that plan. Try describing the fields more clearly.');
          return;
        }
        if (r?.kind === 'plan') {
          setOptimizedPrompt(r.optimizedPrompt);
          const reply = `${r.summary}\n\nOptimized prompt ready. Switch to Builder and tap Build it — or edit the prompt first.`;
          setThread((prev) => [...prev, { role: 'mo', text: reply }]);
          setMoMessage(reply);
          setPrompt(r.optimizedPrompt);
          return;
        }
        if (r?.kind === 'definition') {
          const name = r.definition?.name || 'your tool';
          const opt = `Build "${name}" for my business. ${r.definition?.description || ''}`;
          setOptimizedPrompt(opt);
          setPrompt(opt);
          const reply = `Plan ready for ${name}. Switch to Builder to create the draft.`;
          setThread((prev) => [...prev, { role: 'mo', text: reply }]);
          setMoMessage(reply);
          return;
        }
        setMoMessage('Tell me a bit more about what you need to track.');
        return;
      }

      const res = await fetch('/api/custom-features/builder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'build_from_natural_language',
          businessId,
          message: contextualMessage,
          useLlm: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('Please sign in again.');
      if (res.status === 403) throw new Error('You do not have access to this business.');
      if (!res.ok) {
        const raw = String(json.error || '');
        if (/custom_features|schema cache|does not exist|MISSING_CUSTOM_FEATURES/i.test(raw)) {
          throw new Error(
            'Business Builder is almost ready — run migration 0020_custom_features_foundation.sql in Supabase, then try again.'
          );
        }
        throw new Error(raw || 'Could not build this feature.');
      }

      if (json.result?.kind === 'clarification') {
        setThread((prev) => [...prev, { role: 'mo', text: json.result.question }]);
        setMoMessage(json.result.question);
        setMode('home');
        return;
      }
      if (json.result?.kind === 'unsupported') {
        setThread((prev) => [...prev, { role: 'mo', text: json.result.message }]);
        setMoMessage(json.result.message);
        setMode('home');
        return;
      }
      if (json.result?.kind === 'invalid') {
        setError(
          'Busmo could not validate that tool. Try describing the fields you need more clearly.'
        );
        return;
      }
      if (!json.feature) {
        setError('No feature was created. Try again with a clearer description.');
        return;
      }

      setFeature(json.feature);
      setDefinition(json.feature.definition);
      setRecords([]);
      const expl =
        json.result?.explanation ||
        json.explanation ||
        json.result?.processPlan && json.result?.summary ||
        null;
      setExplanation(typeof expl === 'string' ? expl : null);
      const okMsg = `Got it. I built ${json.feature.name} as a draft. Review it below, then publish when ready.`;
      setMoMessage(okMsg);
      setThread((prev) => [...prev, { role: 'mo', text: okMsg }]);
      setLoadStep(3);
      setMode('review');
      setOptimizedPrompt(null);
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
        setMoMessage(
          [json.note, json.notice].filter(Boolean).join(' ') || 'Draft updated.'
        );
        setMode('review');
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
      let f = json.feature || row;
      if (!f?.definition && row.definition) f = { ...f, definition: row.definition };
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
          f = found;
        }
      } else {
        setFeature(f);
        setDefinition(f.definition);
      }
      const isPublished = f.status === 'published' || row.status === 'published';
      if (isPublished) {
        openCustomFeatureId(row.id);
        navigateTo('custom-feature');
        return;
      }
      setRecords([]);
      setMode('review');
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
      setMoMessage(
        'Draft created from your published feature. Published version stays live until you publish again.'
      );
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
      void sendMessage();
    }
  };

  if (!businessId) {
    return (
      <div className={styles.root}>
        <div className={styles.hero}>
          <div className={styles.kicker}>Business Builder</div>
          <h1 className={styles.title}>Build Busmo around your business.</h1>
          <p className={styles.sub}>
            {user?.id
              ? 'Loading your business… If this stays blank, open Settings and confirm your business is linked to this account.'
              : 'Sign in as a business owner to use Business Builder.'}
          </p>
        </div>
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
                  onClick={() => {
                    openCustomFeatureId(feature.id);
                    navigateTo('custom-feature');
                  }}
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
                    setThread([]);
                    setOptimizedPrompt(null);
                  }}
                >
                  Continue building
                </button>
              </div>
            </div>
          )}

          <div className={styles.modeRow}>
            <button
              type="button"
              className={`${styles.modePill} ${builderMode === 'planner' ? styles.modePillActive : ''}`}
              onClick={() => setBuilderMode('planner')}
            >
              Planner
            </button>
            <button
              type="button"
              className={`${styles.modePill} ${builderMode === 'builder' ? styles.modePillActive : ''}`}
              onClick={() => setBuilderMode('builder')}
            >
              Builder
            </button>
          </div>
          <p className={styles.modeHint}>
            {builderMode === 'planner'
              ? 'Planner asks questions and shapes a clear prompt. Nothing is published.'
              : 'Builder turns your prompt into a draft tool you can review and publish.'}
          </p>

          {thread.length > 0 && (
            <div className={styles.thread}>
              {thread.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={m.role === 'mo' ? styles.threadMo : styles.threadUser}
                >
                  <div className={styles.threadLabel}>
                    {m.role === 'mo' ? 'MO' : 'You'}
                  </div>
                  <p className={styles.threadText}>{m.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.inputCard}>
            <textarea
              className={styles.textarea}
              placeholder={
                builderMode === 'planner'
                  ? thread.some((m) => m.role === 'mo')
                    ? 'Reply to MO…'
                    : 'Describe what you need. Planner will ask clarifying questions.'
                  : thread.some((m) => m.role === 'mo')
                    ? 'Reply to MO, or refine your prompt…'
                    : 'What do you need Busmo to help you manage?'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <div className={styles.inputBar}>
              <span className={styles.hint}>⌘ / Ctrl + Enter</span>
              <div className={styles.inputActions}>
                {builderMode === 'builder' && prompt.trim() && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    disabled={loading}
                    onClick={() => {
                      setBuilderMode('planner');
                      void sendMessage(prompt);
                    }}
                  >
                    Optimize
                  </button>
                )}
                {builderMode === 'planner' && optimizedPrompt && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    disabled={loading}
                    onClick={() => {
                      setBuilderMode('builder');
                      setPrompt(optimizedPrompt);
                    }}
                  >
                    Use in Builder
                  </button>
                )}
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={loading || !prompt.trim()}
                  onClick={() => void sendMessage()}
                >
                  {builderMode === 'planner' ? 'Plan' : 'Build it'}
                </button>
              </div>
            </div>
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

      {moMessage && mode === 'home' && !loading && thread.length === 0 && (
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
                <p className={styles.moText}>{moMessage || `Here’s ${definition.name}.`}</p>
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
                    setThread([]);
                    setOptimizedPrompt(null);
                    setPrompt('');
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

          {explanation && (
            <div className={styles.changeBox} style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {explanation}
            </div>
          )}
          <div className={styles.previewWrap}>
            <FeatureRenderer
              definition={definition}
              records={records}
              businessId={businessId}
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

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { BusmoFeatureDefinition, EntityDefinition, ViewDefinition } from '../types';
import { validateFeatureDefinition } from '../validate';
import styles from './FeatureRenderer.module.css';

export interface FeatureRecord {
  id: string;
  data: Record<string, unknown>;
  status?: string | null;
}

export interface FeatureRendererProps {
  definition: BusmoFeatureDefinition;
  /** Records for the active entity (generic — not feature-name specific). */
  records?: FeatureRecord[];
  internal?: boolean;
  loading?: boolean;
  error?: string | null;
  onCreate?: (entityKey: string, data: Record<string, unknown>) => Promise<void> | void;
  onUpdate?: (
    entityKey: string,
    recordId: string,
    data: Record<string, unknown>
  ) => Promise<void> | void;
  onDelete?: (entityKey: string, recordId: string) => Promise<void> | void;
}

function formatCell(value: unknown, type?: string): string {
  if (value == null || value === '') return '—';
  if (type === 'currency' && typeof value === 'number') {
    return `₦${value.toLocaleString()}`;
  }
  return String(value);
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return styles.ok;
  if (s.includes('out')) return styles.warn;
  if (s.includes('fail')) return styles.bad;
  return styles.muted;
}

export function FeatureRenderer({
  definition,
  records = [],
  internal = true,
  loading,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: FeatureRendererProps) {
  const validation = useMemo(
    () => validateFeatureDefinition(definition),
    [definition]
  );
  const [activeViewKey, setActiveViewKey] = useState(
    definition.views[0]?.key || ''
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingId) return;
    const formView = definition.views.find((v) => v.type === 'form');
    if (formView) setActiveViewKey(formView.key);
  }, [editingId, definition.views]);

  if (!validation.ok) {
    return (
      <div className={`${styles.root} ${styles.error}`}>
        <h2>Invalid feature definition</h2>
        <ul>
          {validation.issues.map((i) => (
            <li key={i.path + i.message}>
              <code>{i.path || 'root'}</code>: {i.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const view =
    definition.views.find((v) => v.key === activeViewKey) || definition.views[0];
  const entity = definition.entities.find((e) => e.key === view?.entity);

  async function handleCreate(entityKey: string, data: Record<string, unknown>) {
    if (!onCreate) return;
    setBusy(true);
    setLocalError(null);
    try {
      await onCreate(entityKey, data);
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(
    entityKey: string,
    recordId: string,
    data: Record<string, unknown>
  ) {
    if (!onUpdate) return;
    setBusy(true);
    setLocalError(null);
    try {
      await onUpdate(entityKey, recordId, data);
      setEditingId(null);
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(entityKey: string, recordId: string) {
    if (!onDelete) return;
    if (typeof window !== 'undefined' && !window.confirm('Delete this record?')) {
      return;
    }
    setBusy(true);
    setLocalError(null);
    try {
      await onDelete(entityKey, recordId);
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.root}>
      {internal && (
        <div className={styles.banner}>
          Internal prototype — persisted feature definition + business-scoped
          records. Not a live product surface.
        </div>
      )}

      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>Custom feature</div>
          <h1 className={styles.title}>{definition.name}</h1>
          {definition.description && (
            <p className={styles.desc}>{definition.description}</p>
          )}
        </div>
        <div className={styles.meta}>
          <span className={styles.chip}>v{definition.version}</span>
          <span className={styles.chip}>{definition.status}</span>
        </div>
      </header>

      {(error || localError) && (
        <div className={styles.banner} role="alert">
          {error || localError}
        </div>
      )}

      {loading && <p className={styles.note}>Loading…</p>}

      <nav className={styles.tabs} aria-label="Views">
        {definition.views.map((v) => (
          <button
            key={v.key}
            type="button"
            className={v.key === view?.key ? 'active' : undefined}
            onClick={() => setActiveViewKey(v.key)}
          >
            {v.title}
          </button>
        ))}
      </nav>

      {view && entity && (
        <ViewBody
          view={view}
          entity={entity}
          records={records}
          busy={busy}
          editingId={editingId}
          setEditingId={setEditingId}
          onCreate={onCreate ? handleCreate : undefined}
          onUpdate={onUpdate ? handleUpdate : undefined}
          onDelete={onDelete ? handleDelete : undefined}
        />
      )}
    </div>
  );
}

function ViewBody({
  view,
  entity,
  records,
  busy,
  editingId,
  setEditingId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  view: ViewDefinition;
  entity: EntityDefinition;
  records: FeatureRecord[];
  busy: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onCreate?: (entityKey: string, data: Record<string, unknown>) => void;
  onUpdate?: (
    entityKey: string,
    recordId: string,
    data: Record<string, unknown>
  ) => void;
  onDelete?: (entityKey: string, recordId: string) => void;
}) {
  const rows = records.map((r) => ({ id: r.id, ...r.data }));

  if (view.type === 'metrics') {
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;
    for (const r of rows) {
      const st = String(r.status || 'Unknown');
      byStatus[st] = (byStatus[st] || 0) + 1;
      totalAmount += Number(r.amount) || 0;
    }
    return (
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricV}>{rows.length}</div>
          <div className={styles.metricL}>Total records</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricV}>₦{totalAmount.toLocaleString()}</div>
          <div className={styles.metricL}>Amount total</div>
        </div>
        {Object.entries(byStatus).map(([k, n]) => (
          <div className={styles.metric} key={k}>
            <div className={styles.metricV}>{n}</div>
            <div className={styles.metricL}>{k}</div>
          </div>
        ))}
      </div>
    );
  }

  if (view.type === 'form') {
    const fields = (view.formFields || entity.fields.map((f) => f.key))
      .map((k) => entity.fields.find((f) => f.key === k))
      .filter(Boolean);

    const editing = editingId
      ? records.find((r) => r.id === editingId)
      : null;

    return (
      <form
        className={styles.form}
        key={editingId || 'new'}
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          const fd = new FormData(e.currentTarget);
          const data: Record<string, unknown> = {};
          for (const f of fields) {
            if (!f) continue;
            const raw = fd.get(f.key);
            if (f.type === 'number' || f.type === 'currency') {
              data[f.key] = raw === '' || raw == null ? null : Number(raw);
            } else {
              data[f.key] = raw == null ? '' : String(raw);
            }
          }
          if (editing && onUpdate) {
            onUpdate(entity.key, editing.id, data);
          } else if (onCreate) {
            onCreate(entity.key, data);
            e.currentTarget.reset();
          }
        }}
      >
        {fields.map((f) => {
          if (!f) return null;
          const defaultVal =
            editing?.data?.[f.key] ?? f.defaultValue ?? '';
          if (f.type === 'status' || f.type === 'select') {
            return (
              <label key={f.key}>
                {f.label}
                <select
                  name={f.key}
                  defaultValue={String(defaultVal ?? '')}
                  required={!!f.required}
                >
                  {(f.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            );
          }
          if (f.type === 'textarea') {
            return (
              <label key={f.key}>
                {f.label}
                <textarea
                  name={f.key}
                  rows={3}
                  defaultValue={String(defaultVal ?? '')}
                  required={!!f.required}
                />
              </label>
            );
          }
          return (
            <label key={f.key}>
              {f.label}
              <input
                name={f.key}
                defaultValue={
                  defaultVal == null || defaultVal === ''
                    ? ''
                    : String(defaultVal)
                }
                required={!!f.required}
                type={
                  f.type === 'number' || f.type === 'currency'
                    ? 'number'
                    : f.type === 'date'
                      ? 'date'
                      : 'text'
                }
              />
            </label>
          );
        })}
        <button type="submit" disabled={busy || (!onCreate && !onUpdate)}>
          {editing ? 'Update record' : 'Save record'}
        </button>
        {editing && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditingId(null)}
            style={{ background: '#6b7280' }}
          >
            Cancel edit
          </button>
        )}
      </form>
    );
  }

  // table
  const columns =
    view.columns ||
    entity.fields.map((f) => ({ field: f.key, label: f.label }));

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.field}>{c.label || c.field}</th>
            ))}
            {(onUpdate || onDelete) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1}>No records yet</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={String(row.id)}>
                {columns.map((c) => {
                  const field = entity.fields.find((f) => f.key === c.field);
                  const raw = row[c.field];
                  if (field?.type === 'status') {
                    const s = String(raw || '');
                    return (
                      <td key={c.field}>
                        <span className={`${styles.st} ${statusTone(s)}`}>{s}</span>
                      </td>
                    );
                  }
                  return (
                    <td key={c.field}>{formatCell(raw, field?.type)}</td>
                  );
                })}
                {(onUpdate || onDelete) && (
                  <td>
                    {onUpdate && (
                      <button
                        type="button"
                        className={styles.chip}
                        disabled={busy}
                        onClick={() => setEditingId(String(row.id))}
                        style={{ cursor: 'pointer', marginRight: 6 }}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className={styles.chip}
                        disabled={busy}
                        onClick={() => onDelete(entity.key, String(row.id))}
                        style={{ cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {editingId && onUpdate && (
        <p className={styles.note}>
          Editing record — open the form view to save changes, or cancel below.
        </p>
      )}
    </div>
  );
}

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
  records?: FeatureRecord[];
  internal?: boolean;
  /** Live workspace page: hide builder prose, kicker, and redundant meta. */
  workspace?: boolean;
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
  workspace = false,
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
          {!workspace && <div className={styles.kicker}>Custom feature</div>}
          {!workspace && <h1 className={styles.title}>{definition.name}</h1>}
          {!workspace &&
            definition.description &&
            !/Assumptions:|Helps answer:/i.test(definition.description) && (
              <p className={styles.desc}>{definition.description}</p>
            )}
        </div>
        {!workspace && (
          <div className={styles.meta}>
            <span className={styles.chip}>v{definition.version}</span>
            <span className={styles.chip}>{definition.status}</span>
          </div>
        )}
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
            className={v.key === view?.key ? styles.active : undefined}
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
  const rows: Array<Record<string, unknown> & { id: string }> = records.map(
    (r) => ({
      id: r.id,
      ...r.data,
    })
  );

  if (view.type === 'metrics') {
    const byStatus: Record<string, number> = {};
    const moneyFields = entity.fields.filter(
      (f) => f.type === 'currency' || /amount|price|cost|balance|paid/i.test(f.key)
    );
    const numberFields = entity.fields.filter(
      (f) => f.type === 'number' && !moneyFields.some((m) => m.key === f.key)
    );
    const moneyTotals: Record<string, number> = {};
    const numberTotals: Record<string, number> = {};
    for (const f of moneyFields) moneyTotals[f.key] = 0;
    for (const f of numberFields) numberTotals[f.key] = 0;
    for (const r of rows) {
      const st = String(r.status || 'Unknown');
      byStatus[st] = (byStatus[st] || 0) + 1;
      for (const f of moneyFields) moneyTotals[f.key] += Number(r[f.key]) || 0;
      for (const f of numberFields) numberTotals[f.key] += Number(r[f.key]) || 0;
    }
    return (
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricV}>{rows.length}</div>
          <div className={styles.metricL}>Total {entity.labelPlural || entity.label}</div>
        </div>
        {moneyFields.slice(0, 3).map((f) => (
          <div className={styles.metric} key={f.key}>
            <div className={styles.metricV}>₦{(moneyTotals[f.key] || 0).toLocaleString()}</div>
            <div className={styles.metricL}>{f.label}</div>
          </div>
        ))}
        {numberFields.slice(0, 2).map((f) => (
          <div className={styles.metric} key={f.key}>
            <div className={styles.metricV}>{(numberTotals[f.key] || 0).toLocaleString()}</div>
            <div className={styles.metricL}>{f.label}</div>
          </div>
        ))}
        {Object.entries(byStatus).map(([k, n]) => (
          <div className={styles.metric} key={k}>
            <div className={styles.metricV}>{n}</div>
            <div className={styles.metricL}>{k}</div>
          </div>
        ))}
      </div>
    );
  }

  if (view.type === 'cards') {
    const columns =
      view.columns ||
      entity.fields.slice(0, 5).map((f) => ({ field: f.key, label: f.label }));
    const statusField = entity.fields.find(
      (f) => f.type === 'status' || f.key === 'status'
    );
    const groups: Record<string, typeof rows> = {};
    if (statusField) {
      for (const r of rows) {
        const st = String(r[statusField.key] || 'Unknown');
        (groups[st] ||= []).push(r);
      }
    } else {
      groups['All'] = rows;
    }
    return (
      <div className={styles.cardsBoard}>
        {Object.entries(groups).map(([group, groupRows]) => (
          <div key={group} className={styles.cardColumn}>
            <div className={styles.cardColumnTitle}>
              {group} <span className={styles.chip}>{groupRows.length}</span>
            </div>
            {groupRows.map((row) => (
              <div key={String(row.id)} className={styles.cardItem}>
                {columns.map((c) => {
                  const field = entity.fields.find((f) => f.key === c.field);
                  const raw = row[c.field];
                  if (field?.type === 'status') {
                    const s = String(raw || '');
                    return (
                      <div key={c.field} className={styles.cardLine}>
                        <span className={`${styles.st} ${statusTone(s)}`}>{s}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={c.field} className={styles.cardLine}>
                      <span className={styles.cardLineLabel}>{c.label || c.field}</span>
                      <span>{formatCell(raw, field?.type)}</span>
                    </div>
                  );
                })}
                {(onUpdate || onDelete) && (
                  <div className={styles.cardActions}>
                    {onUpdate && (
                      <button
                        type="button"
                        className={styles.chip}
                        disabled={busy}
                        onClick={() => setEditingId(String(row.id))}
                        style={{ cursor: 'pointer' }}
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
                  </div>
                )}
              </div>
            ))}
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

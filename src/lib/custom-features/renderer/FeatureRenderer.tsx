'use client';

import React, { useMemo, useState } from 'react';
import type { BusmoFeatureDefinition, EntityDefinition, ViewDefinition } from '../types';
import { validateFeatureDefinition } from '../validate';
import styles from './FeatureRenderer.module.css';

export interface FeatureRendererProps {
  definition: BusmoFeatureDefinition;
  recordsByEntity?: Record<string, Record<string, unknown>[]>;
  internal?: boolean;
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
  recordsByEntity = {},
  internal = true,
}: FeatureRendererProps) {
  const validation = useMemo(
    () => validateFeatureDefinition(definition),
    [definition]
  );
  const [activeViewKey, setActiveViewKey] = useState(
    definition.views[0]?.key || ''
  );

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

  return (
    <div className={styles.root}>
      {internal && (
        <div className={styles.banner}>
          Internal prototype — not a live product surface. Definition → validate →
          render only.
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
          rows={recordsByEntity[entity.key] || []}
        />
      )}
    </div>
  );
}

function ViewBody({
  view,
  entity,
  rows,
}: {
  view: ViewDefinition;
  entity: EntityDefinition;
  rows: Record<string, unknown>[];
}) {
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
          <div className={styles.metricL}>Total deliveries</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricV}>₦{totalAmount.toLocaleString()}</div>
          <div className={styles.metricL}>Amount on books</div>
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
    return (
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {fields.map((f) => {
          if (!f) return null;
          if (f.type === 'status' || f.type === 'select') {
            return (
              <label key={f.key}>
                {f.label}
                <select name={f.key} defaultValue={String(f.defaultValue ?? '')}>
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
                <textarea name={f.key} rows={3} />
              </label>
            );
          }
          return (
            <label key={f.key}>
              {f.label}
              <input
                name={f.key}
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
        <button type="submit">Save (prototype — not persisted)</button>
        <p className={styles.note}>
          Form is structural only in this internal prototype. Persistence uses
          custom_feature_records after the migration is applied.
        </p>
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
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>No records</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={String(row.id || JSON.stringify(row))}>
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

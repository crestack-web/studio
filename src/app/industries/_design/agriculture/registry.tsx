'use client';

import React, { useId, useMemo, useState } from 'react';
import {
  Badge,
  Chips,
  EmptyState,
  Field,
  PageHeader,
  Progress,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { fmtDate, money } from '../format';
import { useSolutionsLive } from '../live';
import type { AgriRecord } from './mock';

export type ResourceFieldType = 'text' | 'number' | 'date' | 'select';

export type ResourceField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: ResourceFieldType;
  options?: string[];
  hint?: string;
};

export type ResourceColumn = {
  key: string;
  label: string;
  kind?: 'text' | 'money' | 'date' | 'status' | 'badge' | 'progress';
  align?: 'right';
  suffix?: string;
};

export type ResourceConfig = {
  module: string;
  singular: string;
  plural: string;
  icon: string;
  description: string;
  fields: ResourceField[];
  columns: ResourceColumn[];
  statusOptions: string[];
  statusLabels?: Record<string, string>;
  /** Meta key shown as a subtitle beneath the primary title cell. */
  primarySub?: string;
  /** Field key used for the create form's title (defaults to `title`). */
  titleKey?: string;
  /** Field key used for the create form's monetary amount (defaults to `amount`). */
  amountKey?: string;
  /** Meta key promoted to the record's `occurred_at`. */
  dateKey?: string;
  /** Extra meta keys searched by the search box. */
  searchKeys?: string[];
  /** Returns the next status for the row action, or null when it has no next step. */
  nextStatus?: (row: AgriRecord) => string | null;
};

function nextInList(current: string, options: string[]): string {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? options[0] ?? '';
}

function cellValue(row: AgriRecord, col: ResourceColumn): unknown {
  if (col.kind === 'status') return row.status;
  if (col.key === 'title') return row.title;
  if (col.key === 'amount') return row.amount;
  if (col.key === 'occurred_at') return row.occurred_at;
  return row.meta?.[col.key];
}

/**
 * Generic, config-driven table screen shared by every agriculture module.
 * It keeps the create/update flows identical while each screen supplies its
 * own domain vocabulary, fields and columns.
 */
export function ResourceScreen({ config, rows }: { config: ResourceConfig; rows: AgriRecord[] }) {
  const { toast } = useToast();
  const { mutate, version } = useSolutionsLive();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const uid = useId().replace(/:/g, '');

  const formFields = useMemo<ResourceField[]>(() => {
    const base = config.fields.filter((field) => field.key !== 'status');
    return config.statusOptions.length
      ? [...base, { key: 'status', label: 'Status', type: 'select', options: config.statusOptions }]
      : base;
  }, [config]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keys = config.searchKeys ?? [];
    return rows
      .filter((row) => (status === 'all' ? true : row.status === status))
      .filter((row) => {
        if (!q) return true;
        const haystack = [row.title, row.status, ...keys.map((key) => String(row.meta?.[key] ?? ''))]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    // `version` changes after every live reload, refreshing rows mutated in place.
  }, [rows, query, status, config, version]);

  const chips = [
    { id: 'all', label: 'All', count: rows.length },
    ...config.statusOptions.map((option) => ({
      id: option,
      label: config.statusLabels?.[option] ?? option.replace(/_/g, ' '),
      count: rows.filter((row) => row.status === option).length,
    })),
  ];

  const openCreate = () => {
    const initial: Record<string, string> = {};
    for (const field of formFields) {
      initial[field.key] = field.type === 'select' ? (field.options?.[0] ?? '') : '';
    }
    setValues(initial);
    setNotes('');
    setOpen(true);
  };

  const setValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const create = async () => {
    const titleKey = config.titleKey ?? 'title';
    const amountKey = config.amountKey ?? 'amount';
    const title = String(values[titleKey] ?? '').trim();
    if (!title) {
      toast(`Enter a ${config.singular.toLowerCase()} name.`);
      return;
    }
    const meta: Record<string, any> = {};
    for (const field of formFields) {
      if (field.key === titleKey || field.key === amountKey || field.key === 'status') continue;
      const raw = String(values[field.key] ?? '').trim();
      if (!raw) continue;
      meta[field.key] = field.type === 'number' ? Number(raw) || 0 : raw;
    }
    const occurredAt = config.dateKey ? String(values[config.dateKey] ?? '') : '';
    setSaving(true);
    const res = await mutate({
      action: 'record_create',
      module: config.module,
      title,
      status: String(values.status ?? config.statusOptions[0] ?? ''),
      amount: Number(values[amountKey] ?? 0) || 0,
      notes: notes.trim() || undefined,
      meta,
      ...(occurredAt ? { occurred_at: occurredAt } : {}),
    });
    setSaving(false);
    if (!res.ok) {
      toast(res.error || `Could not add the ${config.singular.toLowerCase()}.`);
      return;
    }
    toast(`${config.singular} added.`);
    setOpen(false);
  };

  const advance = async (row: AgriRecord) => {
    const next = config.nextStatus?.(row) ?? nextInList(row.status, config.statusOptions);
    if (!next) {
      toast(`No next status available for this ${config.singular.toLowerCase()}.`);
      return;
    }
    const res = await mutate({ action: 'record_update', id: row.id, status: next });
    if (!res.ok) {
      // Seed ids are not live UUIDs, so the API can reject this — surface it, never crash.
      toast(res.error || `Could not update the ${config.singular.toLowerCase()}.`);
      return;
    }
    const label = config.statusLabels?.[next] ?? next.replace(/_/g, ' ');
    toast(`${config.singular} moved to ${label}.`);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name={config.icon} size={13} /> {config.plural}
          </>
        }
        title={config.plural}
        subtitle={config.description}
        meta={<span className="sol-small sol-muted">{rows.length} records in the current season</span>}
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={openCreate}>
            <Icon name="plus" size={15} /> Add {config.singular}
          </button>
        }
      />

      <section className="sol-card sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={`Search ${config.plural.toLowerCase()}…`}
              ariaLabel={`Search ${config.plural.toLowerCase()}`}
            />
            <div className="sol-toolbar-spacer" />
            <Chips items={chips} value={status} onChange={setStatus} />
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                {config.columns.map((col) => (
                  <Th key={col.key} align={col.align}>
                    {col.label}
                  </Th>
                ))}
                <Th align="right">Action</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id}>
                  {config.columns.map((col, index) => {
                    const raw = cellValue(row, col);
                    if (index === 0) {
                      return (
                        <Td key={col.key}>
                          <div className="sol-list-title">{row.title}</div>
                          {config.primarySub ? (
                            <div className="sol-list-sub">{String(row.meta?.[config.primarySub] ?? '')}</div>
                          ) : null}
                        </Td>
                      );
                    }
                    if (col.kind === 'status') {
                      return (
                        <Td key={col.key}>
                          <StatusBadge status={String(raw ?? '')} label={config.statusLabels?.[String(raw ?? '')]} />
                        </Td>
                      );
                    }
                    if (col.kind === 'money') {
                      return (
                        <Td key={col.key} align={col.align ?? 'right'} className="num">
                          {money(Number(raw) || 0)}
                        </Td>
                      );
                    }
                    if (col.kind === 'date') {
                      return (
                        <Td key={col.key}>
                          {raw ? fmtDate(String(raw)) : '—'}
                        </Td>
                      );
                    }
                    if (col.kind === 'badge') {
                      return (
                        <Td key={col.key}>
                          <Badge tone="blue">{String(raw ?? '—')}</Badge>
                        </Td>
                      );
                    }
                    if (col.kind === 'progress') {
                      const pct = Math.max(0, Math.min(100, Number(raw) || 0));
                      return (
                        <Td key={col.key}>
                          <div className="sol-meter-row">
                            <span className="sol-meter-main">
                              <Progress value={pct} label={`${col.label} for ${row.title}`} />
                            </span>
                            <small className="sol-num">{Math.round(pct)}{col.suffix ?? '%'}</small>
                          </div>
                        </Td>
                      );
                    }
                    return (
                      <Td key={col.key} align={col.align}>
                        {raw == null || raw === '' ? '—' : `${String(raw)}${col.suffix ?? ''}`}
                      </Td>
                    );
                  })}
                  <Td align="right">
                    <button
                      type="button"
                      className="sol-btn sol-btn-ghost sol-btn-sm"
                      aria-label={`Advance ${config.singular}: ${row.title}`}
                      title={`Advance ${config.singular}`}
                      onClick={() => void advance(row)}
                    >
                      Advance
                    </button>
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={config.columns.length + 1}>
                    <EmptyState
                      icon={config.icon}
                      title={`No ${config.plural.toLowerCase()} found`}
                      message="Try another search or status, or add a new record."
                    />
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`Add ${config.singular}`}
        subtitle={`Record a new entry in ${config.plural.toLowerCase()}.`}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => void create()} disabled={saving}>
              {saving ? 'Saving…' : `Add ${config.singular}`}
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          {formFields.map((field) => {
            const inputId = `${uid}-${field.key}`;
            return (
              <Field key={field.key} label={field.label} htmlFor={inputId} hint={field.hint}>
                {field.type === 'select' ? (
                  <select
                    id={inputId}
                    className="sol-input"
                    value={values[field.key] ?? ''}
                    onChange={(event) => setValue(field.key, event.target.value)}
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={inputId}
                    className="sol-input"
                    type={field.type ?? 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(event) => setValue(field.key, event.target.value)}
                  />
                )}
              </Field>
            );
          })}
          <Field label="Notes (optional)" htmlFor={`${uid}-notes`}>
            <textarea
              id={`${uid}-notes`}
              className="sol-textarea"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </div>
      </Sheet>
    </>
  );
}

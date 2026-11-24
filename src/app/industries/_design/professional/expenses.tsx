'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Chips,
  Field,
  Kpi,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  Switch,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Donut, Legend } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money, todayISO } from '../format';
import { expenses, expensesSummary, projects, team } from './mock';
import type { ProExpense, ProExpenseStatus } from '../types';
import { downloadCsv } from '../action-helpers';

type Filter = 'all' | ProExpenseStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'recorded', label: 'Recorded' },
];

const CATEGORIES = [
  'Software',
  'Production',
  'Travel',
  'Client entertainment',
  'Assets',
  'Premises',
  'Media',
  'Logistics',
  'Other',
];

const CATEGORY_COLORS = [
  'var(--sol-chart-1)',
  'var(--sol-chart-2)',
  'var(--sol-chart-3)',
  'var(--sol-chart-4)',
  'var(--sol-chart-5)',
  '#94a3b8',
];

export function ProfessionalExpenses() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProExpense | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    vendor: '',
    category: CATEGORIES[0],
    description: '',
    amount: '50000',
    date: todayISO(),
    member: team[0]?.full_name || '',
    project: '',
    billable: true,
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses
      .filter((e) => (filter === 'all' ? true : e.status === filter))
      .filter((e) =>
        q
          ? e.vendor.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            (e.project_name || '').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filter, query]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) map[e.category] = (map[e.category] || 0) + e.amount;
    return Object.entries(map)
      .map(([name, value], i) => ({
        name,
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const create = () => {
    if (!form.vendor.trim() || !form.description.trim()) {
      toast('Add a vendor and description to continue.');
      return;
    }
    toast(`${form.description.trim()} recorded for ${money(Number(form.amount) || 0)}.`);
    setCreateOpen(false);
    setForm({ ...form, vendor: '', description: '', amount: '50000' });
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="wallet" size={13} /> Finance
          </>
        }
        title="Expenses"
        subtitle="Studio costs, production spend and client-billable purchases in one ledger."
        meta={
          <>
            <Badge tone="accent" dot>
              {compactMoney(expensesSummary.total)} recorded
            </Badge>
            <span className="sol-small sol-muted">
              {compactMoney(expensesSummary.pending)} awaiting approval
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => { downloadCsv('expenses.csv', list); toast('Expense ledger exported as CSV.'); }}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={15} aria-hidden /> Add expense
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Total spend"
          value={compactMoney(expensesSummary.total)}
          icon="wallet"
          foot={`${expenses.length} expenses recorded`}
          accent
        />
        <Kpi
          label="Pending approval"
          value={compactMoney(expensesSummary.pending)}
          icon="clock"
          foot={`${expenses.filter((e) => e.status === 'pending').length} awaiting sign-off`}
        />
        <Kpi
          label="Client billable"
          value={compactMoney(expensesSummary.billable)}
          icon="receipt"
          foot={`${expenses.filter((e) => e.billable).length} recharged to clients`}
        />
        <Kpi
          label="Categories"
          value={byCategory.length}
          icon="layers"
          foot={`Largest: ${byCategory[0]?.name || '—'}`}
        />
      </div>

      <div className="sol-split sol-mt-3">
        <Card flush>
          <div className="sol-card-body" style={{ paddingTop: 16 }}>
            <div className="sol-toolbar">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search vendors, descriptions or categories…"
                ariaLabel="Search expenses"
              />
              <div className="sol-toolbar-spacer" />
              <Chips
                items={FILTERS.map((f) => ({
                  ...f,
                  count:
                    f.id === 'all'
                      ? expenses.length
                      : expenses.filter((e) => e.status === f.id).length,
                }))}
                value={filter}
                onChange={setFilter}
              />
            </div>
          </div>

          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Expense</Th>
                  <Th>Category</Th>
                  <Th>Project</Th>
                  <Th>Date</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} data-clickable="true" onClick={() => setSelected(e)}>
                    <Td>
                      <div className="sol-list-title">{e.vendor}</div>
                      <div className="sol-list-sub">{e.description}</div>
                    </Td>
                    <Td className="muted">{e.category}</Td>
                    <Td className="muted">{e.project_name || 'Studio overhead'}</Td>
                    <Td className="muted">{fmtDate(e.date)}</Td>
                    <Td align="right" className="num strong">
                      {money(e.amount)}
                    </Td>
                    <Td>
                      <StatusBadge status={e.status} />
                    </Td>
                  </tr>
                ))}
                {!list.length ? (
                  <tr>
                    <Td colSpan={6}>
                      <div className="sol-empty">
                        <span className="sol-empty-icon">
                          <Icon name="wallet" size={20} />
                        </span>
                        <h4>No expenses in this view</h4>
                        <p>Try a different status or search.</p>
                      </div>
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Spend by category" subtitle="Share of recorded expenses">
            <Donut
              data={byCategory}
              height={210}
              centerValue={`${Math.round(((byCategory[0]?.value ?? 0) / Math.max(1, expensesSummary.total)) * 100)}%`}
              centerLabel={byCategory[0]?.name}
            />
            <div className="sol-mt-3">
              <Legend
                items={byCategory.slice(0, 6).map((c) => ({
                  name: c.name,
                  color: c.color,
                  value: compactMoney(c.value),
                }))}
              />
            </div>
          </Card>

          <Card title="Approvals" subtitle="Pending expenses need a decision">
            <div className="sol-stack-2">
              {expenses
                .filter((e) => e.status === 'pending')
                .map((e) => (
                  <div key={e.id} className="sol-between">
                    <div>
                      <div className="sol-list-title">{e.vendor}</div>
                      <div className="sol-small sol-muted">
                        {e.category} · {money(e.amount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="sol-btn sol-btn-subtle sol-btn-sm"
                      onClick={() => toast(`${e.vendor} expense approved.`)}
                    >
                      Approve
                    </button>
                  </div>
                ))}
              {!expenses.filter((e) => e.status === 'pending').length ? (
                <div className="sol-small sol-muted">Everything is approved.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.vendor || 'Expense'}
        subtitle={selected ? `${selected.category} · ${fmtDate(selected.date, { year: true })}` : undefined}
        width={450}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            {selected?.status === 'pending' ? (
              <button
                type="button"
                className="sol-btn sol-btn-primary"
                onClick={() => {
                  toast(`${selected.vendor} expense approved.`);
                  setSelected(null);
                }}
              >
                <Icon name="checkCircle" size={15} /> Approve expense
              </button>
            ) : (
              <button
                type="button"
                className="sol-btn sol-btn-primary"
                onClick={() => {
                  toast(`${selected?.vendor} receipt opened.`);
                  setSelected(null);
                }}
              >
                <Icon name="receipt" size={15} /> View receipt
              </button>
            )}
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <StatusBadge status={selected.status} />
              <span className="sol-h1" style={{ fontSize: 22 }}>
                {money(selected.amount)}
              </span>
            </div>

            <p className="sol-small sol-muted" style={{ lineHeight: 1.6 }}>
              {selected.description}
            </p>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Category</span>
                <strong>{selected.category}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Recorded by</span>
                <strong>{selected.member}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Project</span>
                <strong>{selected.project_name || 'Studio overhead'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Client billable</span>
                <strong>{selected.billable ? 'Yes' : 'No'}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Date</span>
                <strong>{fmtDate(selected.date, { weekday: true, year: true })}</strong>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`${selected.vendor} expense marked for recharging.`)}
              >
                <Icon name="receipt" size={14} /> Recharge to client
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`${selected.vendor} expense rejected.`);
                  setSelected(null);
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add an expense"
        subtitle="Record a studio or project cost."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Save expense
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Vendor" className="full">
            <input
              className="sol-input"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="e.g. Verdant print lab"
            />
          </Field>
          <Field label="Description" className="full">
            <input
              className="sol-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What was purchased?"
            />
          </Field>
          <Field label="Category">
            <select
              className="sol-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="sol-input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Recorded by">
            <select
              className="sol-select"
              value={form.member}
              onChange={(e) => setForm({ ...form, member: e.target.value })}
            >
              {team.map((m) => (
                <option key={m.id}>{m.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Project" className="full" hint="Leave empty for studio overhead.">
            <select
              className="sol-select"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            >
              <option value="">Studio overhead</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="full sol-settings-row" style={{ paddingTop: 4, borderBottom: 0 }}>
            <div className="sol-settings-row-text">
              <strong>Recharge to client</strong>
              <small>Add this cost to the project&rsquo;s next invoice.</small>
            </div>
            <Switch
              checked={form.billable}
              onChange={(v) => setForm({ ...form, billable: v })}
              label="Recharge to client"
            />
          </div>
          <div className="full sol-row sol-gap-2 sol-small sol-muted">
            <Avatar name={form.member} size="sm" />
            Recorded by {form.member}
          </div>
        </div>
      </Sheet>
    </>
  );
}

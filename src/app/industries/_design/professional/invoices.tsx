'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus, Send } from 'lucide-react';
import {
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  Progress,
  Ring,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Tabs,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { addDays, compactMoney, fmtDate, money, todayISO } from '../format';
import { clients, firm, invoices, projects, revenueSummary } from './mock';
import type { ProInvoice, ProInvoiceStatus } from '../types';
import { downloadCsv } from '../action-helpers';

type TabId = 'all' | ProInvoiceStatus;

const today = todayISO();

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Paid' },
];

export function ProfessionalInvoices() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ProInvoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    client: clients[0]?.id || '',
    project: projects[0]?.id || '',
    description: 'Monthly retainer',
    amount: '500000',
    due: addDays(today, 14),
  });

  const open = invoices.filter((i) => i.status !== 'paid');
  const outstanding = open.reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);
  const overdue = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0);
  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collectionRate = Math.round((collected / Math.max(1, billed)) * 100);

  const aging = [
    {
      label: 'Current',
      value: open
        .filter((i) => i.due >= today)
        .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    },
    {
      label: '1 – 14 days late',
      value: open
        .filter((i) => i.due < today && i.due >= addDays(today, -14))
        .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    },
    {
      label: '15 – 30 days late',
      value: open
        .filter((i) => i.due < addDays(today, -14) && i.due >= addDays(today, -30))
        .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    },
    {
      label: '30+ days late',
      value: open
        .filter((i) => i.due < addDays(today, -30))
        .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    },
  ];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((i) => (tab === 'all' ? true : i.status === tab))
      .filter((i) =>
        q
          ? i.number.toLowerCase().includes(q) ||
            i.client_name.toLowerCase().includes(q) ||
            (i.project_name || '').toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.issued.localeCompare(a.issued));
  }, [tab, query]);

  const create = () => {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Enter an invoice amount to continue.');
      return;
    }
    const client = clients.find((c) => c.id === form.client);
    toast(`Invoice draft created for ${client?.company || 'the client'}.`);
    setCreateOpen(false);
    setForm({ ...form, description: 'Monthly retainer' });
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="receipt" size={13} /> Finance
          </>
        }
        title="Invoices"
        subtitle="Raise invoices, track what has been sent and chase everything that is overdue."
        meta={
          <>
            <Badge tone={overdue ? 'red' : 'green'} dot>
              {compactMoney(outstanding)} outstanding
            </Badge>
            <span className="sol-small sol-muted">
              {invoices.filter((i) => i.status === 'draft').length} drafts ·{' '}
              {invoices.filter((i) => i.status === 'overdue').length} overdue
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => { downloadCsv('invoices.csv', list); toast('Invoice register exported as CSV.'); }}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={15} aria-hidden /> New invoice
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Outstanding"
          value={compactMoney(outstanding)}
          icon="wallet"
          foot={`${open.length} open invoices`}
          accent
        />
        <Kpi
          label="Overdue"
          value={compactMoney(overdue)}
          icon="clock"
          delta={overdue ? 'Chase today' : 'Nothing late'}
          deltaDir={overdue ? 'down' : 'flat'}
          foot={`${invoices.filter((i) => i.status === 'overdue').length} invoices past due`}
        />
        <Kpi
          label="Collected"
          value={compactMoney(collected)}
          icon="cash"
          foot={`${collectionRate}% of ${compactMoney(billed)} billed`}
        />
        <Kpi
          label="Drafts"
          value={invoices.filter((i) => i.status === 'draft').length}
          icon="receipt"
          foot={`${compactMoney(
            invoices.filter((i) => i.status === 'draft').reduce((s, i) => s + i.amount, 0),
          )} ready to send`}
        />
      </div>

      <div className="sol-split sol-mt-3">
        <Card flush>
          <div className="sol-card-body" style={{ paddingTop: 16 }}>
            <div className="sol-toolbar">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search by number, client or project…"
                ariaLabel="Search invoices"
              />
              <div className="sol-toolbar-spacer" />
              <Tabs
                items={TABS.map((t) => ({
                  ...t,
                  count: t.id === 'all' ? invoices.length : invoices.filter((i) => i.status === t.id).length,
                }))}
                value={tab}
                onChange={setTab}
                ariaLabel="Invoice status"
              />
            </div>
          </div>

          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Client</Th>
                  <Th>Issued</Th>
                  <Th>Due</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Paid</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} data-clickable="true" onClick={() => setSelected(i)}>
                    <Td>
                      <div className="sol-list-title">{i.number}</div>
                      <div className="sol-list-sub">{i.project_name || 'Retainer'}</div>
                    </Td>
                    <Td>
                      <div className="sol-list-title" style={{ fontSize: 12 }}>
                        {i.client_name}
                      </div>
                    </Td>
                    <Td className="muted">{fmtDate(i.issued)}</Td>
                    <Td className={i.status === 'overdue' ? 'strong' : 'muted'}>{fmtDate(i.due)}</Td>
                    <Td align="right" className="num strong">
                      {money(i.amount)}
                    </Td>
                    <Td align="right" className="num muted">
                      {i.paid ? money(i.paid) : '—'}
                    </Td>
                    <Td>
                      <StatusBadge status={i.status} />
                    </Td>
                  </tr>
                ))}
                {!list.length ? (
                  <tr>
                    <Td colSpan={7}>
                      <div className="sol-empty">
                        <span className="sol-empty-icon">
                          <Icon name="receipt" size={20} />
                        </span>
                        <h4>No invoices in this view</h4>
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
          <Card title="Collections" subtitle="Share of billed revenue collected">
            <div className="sol-ring-card">
              <Ring value={collectionRate} label={`${collectionRate}%`} sub="Collected" />
              <div className="sol-ring-stats">
                <div className="sol-ring-stat">
                  <span>
                    <span className="sol-dot green" /> Collected
                  </span>
                  <strong>{compactMoney(collected)}</strong>
                </div>
                <div className="sol-ring-stat">
                  <span>
                    <span className="sol-dot amber" /> Outstanding
                  </span>
                  <strong>{compactMoney(outstanding)}</strong>
                </div>
                <div className="sol-ring-stat">
                  <span>
                    <span className="sol-dot red" /> Overdue
                  </span>
                  <strong>{compactMoney(overdue)}</strong>
                </div>
                <div className="sol-ring-stat">
                  <span>
                    <span className="sol-dot blue" /> Target
                  </span>
                  <strong>{compactMoney(revenueSummary.target)}</strong>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Aging" subtitle="Outstanding balance by age">
            <div className="sol-kv">
              {aging.map((row) => (
                <div key={row.label} className="sol-kv-row">
                  <span>{row.label}</span>
                  <strong>{row.value ? money(row.value) : '—'}</strong>
                </div>
              ))}
              <div className="sol-kv-row total">
                <span>Total outstanding</span>
                <strong>{money(outstanding)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Invoice ${selected.number}` : 'Invoice'}
        subtitle={selected ? `${selected.client_name} · issued ${fmtDate(selected.issued, { year: true })}` : undefined}
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            {selected?.status === 'paid' ? (
              <button
                type="button"
                className="sol-btn sol-btn-primary"
                onClick={() => {
                  toast(`${selected.number} receipt downloaded.`);
                  setSelected(null);
                }}
              >
                <Download size={15} aria-hidden /> Download receipt
              </button>
            ) : (
              <button
                type="button"
                className="sol-btn sol-btn-primary"
                onClick={() => {
                  toast(
                    selected?.status === 'draft'
                      ? `${selected.number} sent to ${selected.client_name}.`
                      : `Payment recorded against ${selected?.number}.`,
                  );
                  setSelected(null);
                }}
              >
                {selected?.status === 'draft' ? <Send size={15} aria-hidden /> : <Icon name="cash" size={15} />}
                {selected?.status === 'draft' ? 'Send invoice' : 'Record payment'}
              </button>
            )}
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <StatusBadge status={selected.status} />
              <span className="sol-small sol-muted">
                Due {fmtDate(selected.due, { year: true })}
              </span>
            </div>

            {selected.project_name ? (
              <div className="sol-small sol-muted">
                <Icon name="layers" size={13} /> {selected.project_name}
              </div>
            ) : null}

            <div className="sol-kv">
              {selected.items.map((item) => (
                <div key={item.name} className="sol-kv-row">
                  <span>
                    {item.name}
                    {item.qty > 1 ? ` × ${item.qty}` : ''}
                  </span>
                  <strong>{money(item.qty * item.rate)}</strong>
                </div>
              ))}
              <div className="sol-kv-row">
                <span>Subtotal</span>
                <strong>{money(selected.amount)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>VAT ({firm.taxRate}%)</span>
                <strong>{money(Math.round(selected.amount * (firm.taxRate / 100)))}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Paid</span>
                <strong>{selected.paid ? money(selected.paid) : '—'}</strong>
              </div>
              <div className="sol-kv-row total">
                <span>Balance due</span>
                <strong>{money(Math.max(0, selected.amount - selected.paid))}</strong>
              </div>
            </div>

            <div>
              <div className="sol-between sol-small sol-muted">
                <span>Payment progress</span>
                <strong className="sol-num">
                  {Math.round((selected.paid / Math.max(1, selected.amount)) * 100)}%
                </strong>
              </div>
              <div className="sol-mt-2">
                <Progress
                  value={(selected.paid / Math.max(1, selected.amount)) * 100}
                  tone={selected.paid >= selected.amount ? 'green' : 'amber'}
                  label={`${selected.number} payment progress`}
                />
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`${selected.number} PDF downloaded.`)}
              >
                <Download size={14} aria-hidden /> Download PDF
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Payment reminder sent to ${selected.client_name}.`)}
              >
                <Icon name="mail" size={14} /> Send reminder
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => {
                  toast(`${selected.number} voided.`);
                  setSelected(null);
                }}
              >
                Void invoice
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New invoice"
        subtitle="Bill a client for a project milestone or retainer."
        width={500}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={create}>
              <Icon name="plus" size={15} /> Create invoice
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Client" className="full">
            <select
              className="sol-select"
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Project" className="full" hint="Leave as retainer for recurring billing.">
            <select
              className="sol-select"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Line item" className="full">
            <input
              className="sol-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Brand system — milestone 2"
            />
          </Field>
          <Field label="Amount (excl. VAT)">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="sol-input"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <div className="full sol-small sol-muted">
            VAT of {firm.taxRate}% is added automatically. Payment terms are {firm.paymentTerms} days.
          </div>
        </div>
      </Sheet>
    </>
  );
}

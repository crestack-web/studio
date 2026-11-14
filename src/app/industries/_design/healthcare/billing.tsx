'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  Progress,
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
import { addDays, fmtDate, money, todayISO } from '../format';
import { billingSummary, invoices, patients } from './mock';
import type { Invoice, InvoiceStatus } from '../types';

type TabId = 'all' | InvoiceStatus;

export function HealthcareBilling() {
  const { toast } = useToast();
  const today = todayISO();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    patient: patients[0]?.full_name || '',
    service: 'Consultation',
    amount: '22000',
    payer: 'Self-pay',
    due: addDays(today, 7),
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((i) => (tab === 'all' ? true : i.status === tab))
      .filter((i) =>
        q
          ? i.patient_name.toLowerCase().includes(q) ||
            i.number.toLowerCase().includes(q) ||
            i.payer.toLowerCase().includes(q)
          : true,
      );
  }, [tab, query]);

  const collectionRate = Math.round((billingSummary.collectedMTD / billingSummary.billedMTD) * 100);
  const balanceOf = (i: Invoice) => Math.max(0, i.amount - i.paid);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Billing"
        subtitle="Invoices, HMO claims and outstanding balances across the clinic."
        meta={
          <>
            <Badge tone="accent" dot>
              {collectionRate}% collected
            </Badge>
            <span className="sol-small sol-muted">{invoices.length} invoices in view</span>
          </>
        }
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={15} aria-hidden /> New invoice
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Billed this month"
          value={money(billingSummary.billedMTD)}
          icon="receipt"
          foot={`Target ${money(billingSummary.target)}`}
          accent
        />
        <Kpi
          label="Collected"
          value={money(billingSummary.collectedMTD)}
          icon="wallet"
          delta={`${collectionRate}%`}
          deltaDir="up"
          foot="of invoices raised"
        />
        <Kpi
          label="Outstanding"
          value={money(billingSummary.outstanding)}
          icon="clock"
          foot={`${invoices.filter((i) => balanceOf(i) > 0).length} invoices open`}
        />
        <Kpi
          label="Overdue"
          value={money(billingSummary.overdue)}
          icon="alert"
          delta={`${invoices.filter((i) => i.status === 'overdue').length} accounts`}
          deltaDir="flat"
          foot="Past due date"
        />
      </div>

      <Card className="sol-mt-3">
        <div className="sol-between">
          <div>
            <div className="sol-card-title">Monthly collection target</div>
            <div className="sol-small sol-muted sol-mt-2">
              {money(billingSummary.collectedMTD)} collected of {money(billingSummary.target)}
            </div>
          </div>
          <strong className="sol-num">{Math.round((billingSummary.collectedMTD / billingSummary.target) * 100)}%</strong>
        </div>
        <div className="sol-mt-3">
          <Progress
            value={(billingSummary.collectedMTD / billingSummary.target) * 100}
            tone="green"
            label="Monthly collection target"
          />
        </div>
      </Card>

      <Card className="sol-mt-3" flush>
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search invoice, patient or payer…"
              ariaLabel="Search invoices"
            />
            <Tabs
              ariaLabel="Invoice filters"
              items={[
                { id: 'all', label: 'All', count: invoices.length },
                { id: 'pending', label: 'Pending', count: invoices.filter((i) => i.status === 'pending').length },
                {
                  id: 'partially_paid',
                  label: 'Part paid',
                  count: invoices.filter((i) => i.status === 'partially_paid').length,
                },
                { id: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
                { id: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Invoice</Th>
                <Th>Patient</Th>
                <Th>Payer</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} data-clickable="true" onClick={() => setSelected(i)}>
                  <Td>
                    <div className="sol-list-title">{i.number}</div>
                    <div className="sol-list-sub">
                      {fmtDate(i.date)} · due {fmtDate(i.due_date)}
                    </div>
                  </Td>
                  <Td>
                    <div className="sol-list-title" style={{ fontSize: 12 }}>
                      {i.patient_name}
                    </div>
                    <div className="sol-list-sub">{i.services.length} service{i.services.length > 1 ? 's' : ''}</div>
                  </Td>
                  <Td>
                    <Badge tone={i.payer === 'HMO' ? 'violet' : i.payer === 'Corporate' ? 'blue' : 'gray'}>
                      {i.payer}
                    </Badge>
                  </Td>
                  <Td align="right" className="strong">
                    {money(i.amount)}
                  </Td>
                  <Td align="right" className={balanceOf(i) > 0 ? 'strong' : 'muted'}>
                    {balanceOf(i) > 0 ? money(balanceOf(i)) : '—'}
                  </Td>
                  <Td>
                    <StatusBadge status={i.status} />
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={6}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="receipt" size={20} />
                      </span>
                      <h4>No invoices in this view</h4>
                      <p>Change the filter or create a new invoice.</p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.number || 'Invoice'}
        subtitle={selected ? `${selected.patient_name} · ${selected.payer} · ${fmtDate(selected.date)}` : undefined}
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(
                  selected && balanceOf(selected) > 0
                    ? `Payment recorded for ${selected.number}.`
                    : `${selected?.number} receipt opened.`,
                );
                setSelected(null);
              }}
            >
              {selected && balanceOf(selected) > 0 ? 'Record payment' : 'View receipt'}
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div>
                <div className="sol-person-name">{selected.number}</div>
                <div className="sol-person-sub">
                  Due {fmtDate(selected.due_date, { year: true })}
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div>
              <div className="sol-label">Services</div>
              <div className="sol-kv sol-mt-2">
                {selected.services.map((s) => (
                  <div key={s.name} className="sol-kv-row">
                    <span>{s.name}</span>
                    <strong>{money(s.amount)}</strong>
                  </div>
                ))}
                <div className="sol-kv-row total">
                  <span>Total</span>
                  <strong>{money(selected.amount)}</strong>
                </div>
                <div className="sol-kv-row">
                  <span>Paid</span>
                  <strong>{money(selected.paid)}</strong>
                </div>
                <div className="sol-kv-row">
                  <span>Balance</span>
                  <strong>{money(balanceOf(selected))}</strong>
                </div>
              </div>
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Patient</span>
                <strong>{selected.patient_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Payer</span>
                <strong>{selected.payer}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Issued</span>
                <strong>{fmtDate(selected.date, { year: true })}</strong>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Invoice ${selected.number} queued for HMO submission.`)}
              >
                <Icon name="mail" size={14} /> Send to payer
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Invoice ${selected.number} printed.`)}
              >
                <Icon name="receipt" size={14} /> Print
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`Payment plan started for ${selected.patient_name}.`)}
              >
                Payment plan
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create an invoice"
        subtitle="Raise a bill for a patient or their payer."
        width={460}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                if (!form.service.trim() || !Number(form.amount)) {
                  toast('Add a service and amount to create the invoice.');
                  return;
                }
                toast(`Invoice for ${form.patient} created.`);
                setCreateOpen(false);
              }}
            >
              <Icon name="receipt" size={15} /> Create invoice
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Patient" className="full">
            <select
              className="sol-select"
              value={form.patient}
              onChange={(e) => setForm({ ...form, patient: e.target.value })}
            >
              {patients.map((p) => (
                <option key={p.id}>{p.full_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Payer">
            <select
              className="sol-select"
              value={form.payer}
              onChange={(e) => setForm({ ...form, payer: e.target.value })}
            >
              {['Self-pay', 'HMO', 'Corporate', 'Insurance'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="sol-input"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </Field>
          <Field label="Service" className="full">
            <input
              className="sol-input"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="e.g. Consultation"
            />
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
        </div>
      </Sheet>
    </>
  );
}

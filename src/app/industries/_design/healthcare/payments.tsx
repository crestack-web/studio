'use client';

import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Badge,
  Card,
  Field,
  Kpi,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Tabs,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Donut, Legend } from '../charts';
import { Icon } from '../icons';
import { fmtDate, money, titleCase } from '../format';
import { invoices, paymentSummary, payments } from './mock';
import type { HealthPayment } from '../types';

type TabId = 'all' | 'settled' | 'pending' | 'refunded';

const METHODS: HealthPayment['method'][] = ['card', 'transfer', 'cash', 'pos', 'insurance'];

export function HealthcarePayments() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<HealthPayment | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [form, setForm] = useState({
    invoice: invoices.find((i) => i.status !== 'paid')?.number || invoices[0].number,
    amount: '45000',
    method: 'transfer',
  });

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments
      .filter((p) => (tab === 'all' ? true : p.status === tab))
      .filter((p) =>
        q
          ? p.patient_name.toLowerCase().includes(q) ||
            p.reference.toLowerCase().includes(q) ||
            p.invoice_number.toLowerCase().includes(q)
          : true,
      );
  }, [tab, query]);

  const methodMix = METHODS.map((m) => ({
    name: titleCase(m),
    value: payments.filter((p) => p.method === m).length,
  })).filter((m) => m.value > 0);

  const invoiceForPayment = invoices.find((i) => i.number === form.invoice);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Collections, settlement status and refunds across every payment channel."
        meta={
          <>
            <Badge tone="green" dot>
              {paymentSummary.settled} settled
            </Badge>
            <span className="sol-small sol-muted">
              {money(paymentSummary.collectedToday)} collected today
            </span>
          </>
        }
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setRecordOpen(true)}>
            <Plus size={15} aria-hidden /> Record payment
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Collected today"
          value={money(paymentSummary.collectedToday)}
          icon="wallet"
          delta="+12.8%"
          deltaDir="up"
          foot="vs yesterday"
          accent
        />
        <Kpi
          label="Settled payments"
          value={paymentSummary.settled}
          icon="checkCircle"
          foot="Cleared into the clinic account"
        />
        <Kpi
          label="Pending"
          value={money(paymentSummary.pending)}
          icon="clock"
          foot="Awaiting confirmation"
        />
        <Kpi
          label="Refunds"
          value={money(paymentSummary.refunds)}
          icon="refresh"
          foot="Processed this month"
        />
      </div>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card
          title="Payments"
          subtitle={`${list.length} transactions in view`}
          flush
          action={
            <Tabs
              ariaLabel="Payment filters"
              items={[
                { id: 'all', label: 'All', count: payments.length },
                { id: 'settled', label: 'Settled', count: payments.filter((p) => p.status === 'settled').length },
                { id: 'pending', label: 'Pending', count: payments.filter((p) => p.status === 'pending').length },
                { id: 'refunded', label: 'Refunded', count: payments.filter((p) => p.status === 'refunded').length },
              ]}
              value={tab}
              onChange={setTab}
            />
          }
        >
          <div className="sol-card-body" style={{ paddingBottom: 0 }}>
            <div className="sol-toolbar">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search patient, reference or invoice…"
                ariaLabel="Search payments"
              />
            </div>
          </div>
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Reference</Th>
                  <Th>Patient</Th>
                  <Th>Method</Th>
                  <Th>Date</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} data-clickable="true" onClick={() => setSelected(p)}>
                    <Td>
                      <div className="sol-list-title">{p.reference}</div>
                      <div className="sol-list-sub">{p.invoice_number}</div>
                    </Td>
                    <Td>{p.patient_name}</Td>
                    <Td>
                      <Badge tone="gray">{titleCase(p.method)}</Badge>
                    </Td>
                    <Td className="muted">{fmtDate(p.date)}</Td>
                    <Td align="right" className="strong">
                      {money(p.amount)}
                    </Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                  </tr>
                ))}
                {!list.length ? (
                  <tr>
                    <Td colSpan={6}>
                      <div className="sol-empty">
                        <span className="sol-empty-icon">
                          <Icon name="card" size={20} />
                        </span>
                        <h4>No payments in this view</h4>
                        <p>Change the filter to see other transactions.</p>
                      </div>
                    </Td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Payment mix" subtitle="Transactions by channel">
            <Donut data={methodMix} height={190} centerValue={`${payments.length}`} centerLabel="Payments" />
            <div className="sol-mt-3">
              <Legend items={methodMix.map((m) => ({ name: m.name, value: String(m.value) }))} />
            </div>
          </Card>

          <Card title="Reconciliation" subtitle="Today’s settlement">
            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Collected</span>
                <strong>{money(paymentSummary.collectedToday)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Pending</span>
                <strong>{money(paymentSummary.pending)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Refunds</span>
                <strong>{money(paymentSummary.refunds)}</strong>
              </div>
              <div className="sol-kv-row total">
                <span>Net position</span>
                <strong>{money(paymentSummary.collectedToday - paymentSummary.refunds)}</strong>
              </div>
            </div>
            <button
              type="button"
              className="sol-btn sol-btn-subtle sol-btn-sm sol-full sol-mt-3"
              onClick={() => toast('Daily settlement report exported.')}
            >
              <Icon name="chart" size={14} /> Export settlement
            </button>
          </Card>
        </div>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.reference || 'Payment'}
        subtitle={selected ? `${selected.patient_name} · ${selected.invoice_number}` : undefined}
        width={400}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                toast(`Receipt for ${selected?.reference} opened.`);
                setSelected(null);
              }}
            >
              View receipt
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div>
                <div className="sol-person-name">{money(selected.amount)}</div>
                <div className="sol-person-sub">{fmtDate(selected.date, { weekday: true, year: true })}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Reference</span>
                <strong>{selected.reference}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Patient</span>
                <strong>{selected.patient_name}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Invoice</span>
                <strong>{selected.invoice_number}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Method</span>
                <strong>{titleCase(selected.method)}</strong>
              </div>
            </div>

            <div className="sol-row sol-gap-2 sol-wrap">
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`Refund started for ${selected.reference}.`)}
              >
                <Icon name="refresh" size={14} /> Refund
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`Payment link resent to ${selected.patient_name}.`)}
              >
                Resend receipt
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title="Record a payment"
        subtitle="Apply a payment to an open invoice."
        width={440}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setRecordOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                if (!Number(form.amount)) {
                  toast('Enter the amount received to record the payment.');
                  return;
                }
                toast(`${money(Number(form.amount))} recorded against ${form.invoice}.`);
                setRecordOpen(false);
              }}
            >
              <Icon name="check" size={15} /> Record payment
            </button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Invoice" className="full">
            <select
              className="sol-select"
              value={form.invoice}
              onChange={(e) => setForm({ ...form, invoice: e.target.value })}
            >
              {invoices.map((i) => (
                <option key={i.id} value={i.number}>
                  {i.number} · {i.patient_name} · {money(Math.max(0, i.amount - i.paid))} due
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount received">
            <input
              type="number"
              min={0}
              className="sol-input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Method">
            <select
              className="sol-select"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {titleCase(m)}
                </option>
              ))}
            </select>
          </Field>
          {invoiceForPayment ? (
            <div className="sol-full sol-small sol-muted">
              {invoiceForPayment.patient_name} · balance{' '}
              {money(Math.max(0, invoiceForPayment.amount - invoiceForPayment.paid))} · payer{' '}
              {invoiceForPayment.payer}
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}

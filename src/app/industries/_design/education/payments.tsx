'use client';

import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Avatar, Badge, Card, Kpi, PageHeader, Progress, SearchInput, StatusBadge, TableWrap, Td, Th, useToast } from '../primitives';
import { Icon } from '../icons';
import { compactMoney, money } from '../format';
import { payments, paymentSummary } from './mock';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Bank transfer',
  card: 'Card',
  pos: 'POS',
};

export function EducationPayments() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter(
      (p) => !q || p.student_name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.invoice_number.toLowerCase().includes(q),
    );
  }, [query]);

  const settledTotal = payments.filter((p) => p.status === 'settled').reduce((s, p) => s + p.amount, 0);
  const pendingTotal = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="card" size={13} /> Finance
          </>
        }
        title="Payments"
        subtitle="Fee collections by channel, status and student."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Payment register exported as CSV.')}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Create fee payment opened.')}>
              <Icon name="plus" size={15} aria-hidden /> Record payment
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Collected" value={compactMoney(settledTotal)} icon="cash" foot={`${payments.filter((p) => p.status === 'settled').length} payments settled`} accent />
        <Kpi label="Pending" value={compactMoney(pendingTotal)} icon="clock" foot="Awaiting settlement confirmation" />
        <Kpi label="Collected today" value={compactMoney(paymentSummary.today)} icon="checkCircle" foot={`${paymentSummary.count} records this term`} />
        <Kpi label="Collection rate" value={`${Math.round((settledTotal / Math.max(1, settledTotal + pendingTotal)) * 100)}%`} icon="trend" foot="Settled over open" />
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput value={query} onChange={setQuery} placeholder="Search student, reference or invoice…" ariaLabel="Search payments" />
            <div className="sol-toolbar-spacer" />
            <Badge tone="green" dot>
              {paymentSummary.settled > 0 ? 'Settlement engine healthy' : 'No settlements yet'}
            </Badge>
          </div>
        </div>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Reference</Th>
                <Th>Invoice</Th>
                <Th align="right">Amount</Th>
                <Th>Method</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={p.student_name} size="sm" />
                      <span className="sol-list-title" style={{ fontSize: 12.5 }}>{p.student_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{p.reference}</Td>
                  <Td className="muted">{p.invoice_number}</Td>
                  <Td align="right" className="num strong">{money(p.amount)}</Td>
                  <Td className="muted">{METHOD_LABEL[p.method] || p.method}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="muted">{p.date}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <div className="sol-grid sol-grid-2 sol-mt-3">
        <Card title="Collections by channel" subtitle="Settled payments this term">
          <div className="sol-stack-2">
            {(['transfer', 'card', 'cash', 'pos'] as const).map((m) => {
              const total = payments.filter((p) => p.method === m && p.status === 'settled').reduce((s, p) => s + p.amount, 0);
              const pct = Math.round((total / Math.max(1, settledTotal)) * 100);
              return (
                <div key={m} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                  <div className="sol-list-main">
                    <div className="sol-list-title" style={{ fontSize: 13 }}>{METHOD_LABEL[m]}</div>
                  </div>
                  <div className="sol-list-side">
                    <small className="sol-muted">{pct}% of settled</small>
                    <strong className="sol-num">{compactMoney(total)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-stack-2">
            {(['transfer', 'card', 'cash', 'pos'] as const).map((m) => {
              const total = payments.filter((p) => p.method === m && p.status === 'settled').reduce((s, p) => s + p.amount, 0);
              const pct = Math.round((total / Math.max(1, settledTotal)) * 100);
              return (
                <div key={m} className="sol-meter-row" style={{ gridTemplateColumns: 'minmax(0,1fr) 120px' }}>
                  <span className="sol-meter-main">
                    <span className="sol-progress green" style={{ width: `${Math.max(4, pct)}%` }} />
                  </span>
                  <small className="sol-num">{compactMoney(total)}</small>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Payment summary" subtitle="Term to date">
          <div className="sol-kv">
            <div className="sol-kv-row">
              <span>Settled</span>
              <strong>{compactMoney(paymentSummary.settled)}</strong>
            </div>
            <div className="sol-kv-row">
              <span>Pending</span>
              <strong>{compactMoney(paymentSummary.pending)}</strong>
            </div>
            <div className="sol-kv-row">
              <span>Today</span>
              <strong>{compactMoney(paymentSummary.today)}</strong>
            </div>
            <div className="sol-kv-row total">
              <span>Records</span>
              <strong>{paymentSummary.count}</strong>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

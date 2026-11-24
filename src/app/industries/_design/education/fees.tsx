'use client';

import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Banner, Badge, Card, Kpi, PageHeader, Progress, SearchInput, StatusBadge, TableWrap, Td, Th, useToast } from '../primitives';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { feeInvoices, feeSummary, students } from './mock';
import { NewFeeInvoiceSheet } from './CreateSheets';
import { downloadCsv } from '../action-helpers';

export function EducationFees() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feeInvoices.filter(
      (f) =>
        !q ||
        f.number.toLowerCase().includes(q) ||
        f.student_name.toLowerCase().includes(q) ||
        f.class_name.toLowerCase().includes(q),
    );
  }, [query]);

  const outstandingStudents = students.filter((s) => s.balance > 0).length;

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="receipt" size={13} /> Finance
          </>
        }
        title="Fees"
        subtitle="Tuition, books and transport invoices, balances and collection rate."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => { downloadCsv('fees.csv', list); toast('Fee register exported as CSV.'); }}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setCreateOpen(true)}>
              <Icon name="plus" size={15} aria-hidden /> New invoice
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Outstanding"
          value={compactMoney(feeSummary.outstanding)}
          icon="receipt"
          foot={`${feeSummary.overdueInvoices} invoices overdue`}
          accent
        />
        <Kpi label="Overdue" value={compactMoney(feeSummary.overdue)} icon="alert" delta="Chase now" deltaDir="down" foot="Past due balances" />
        <Kpi label="Collected" value={compactMoney(feeSummary.collected)} icon="cash" foot={`${feeSummary.collectionRate}% of billed`} />
        <Kpi label="Invoices settled" value={feeSummary.paidInvoices} icon="checkCircle" foot={`${feeSummary.partiallyPaid} partially paid`} />
      </div>

      <Banner
        tone={feeSummary.overdue > 0 ? 'red' : 'green'}
        icon="alert"
        title={feeSummary.overdue > 0 ? `${feeSummary.overdueInvoices} fee accounts are overdue` : 'Fee pipeline is healthy'}
      >
        {feeSummary.overdue > 0
          ? 'Outstanding balances have passed the 14-day guardian follow-up window. Escalate to the bursar before the term closes.'
          : 'All outstanding balances are inside the follow-up window. Great work keeping collections ahead of term end.'}
      </Banner>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card flush title="Fee register" subtitle="Invoices for the current term">
          <div className="sol-card-body" style={{ paddingBottom: 0 }}>
            <div className="sol-toolbar">
              <SearchInput value={query} onChange={setQuery} placeholder="Search invoice, student or class…" ariaLabel="Search fees" />
              <div className="sol-toolbar-spacer" />
              <span className="sol-small sol-muted">{list.length} invoices</span>
            </div>
          </div>
          <TableWrap>
            <table className="sol-table">
              <thead>
                <tr>
                  <Th>Invoice</Th>
                  <Th>Student</Th>
                  <Th>Amount</Th>
                  <Th>Paid</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((f) => (
                  <tr key={f.id}>
                    <Td>
                      <div className="sol-list-title">{f.number}</div>
                      <div className="sol-list-sub">
                        {f.class_name} · due {f.due ? f.due.slice(0, 10) : ''}
                      </div>
                    </Td>
                    <Td>
                      <div className="sol-list-title" style={{ fontSize: 12 }}>
                        {f.student_name}
                      </div>
                      <div className="sol-list-sub">{f.term}</div>
                    </Td>
                    <Td align="right" className="num strong">
                      {money(f.amount)}
                    </Td>
                    <Td align="right" className="num">
                      {f.paid ? money(f.paid) : '—'}
                    </Td>
                    <Td>
                      {f.status === 'partially_paid' || f.status === 'overdue' ? (
                        <div className="sol-meter-row">
                          <span className="sol-meter-main">
                            <span
                              className={`sol-progress ${f.status === 'overdue' ? 'red' : 'amber'}`}
                              style={{ width: `${(f.paid / Math.max(1, f.amount)) * 100}%` }}
                            />
                          </span>
                          <small className="sol-num">{Math.round((f.paid / Math.max(1, f.amount)) * 100)}%</small>
                        </div>
                      ) : (
                        <StatusBadge status={f.status} />
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <div className="sol-aside-stack">
          <Card title="Billed this term" subtitle="Tuition, books and transport">
            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Billed</span>
                <strong>{compactMoney(feeSummary.billed)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Collected</span>
                <strong>{compactMoney(feeSummary.collected)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Outstanding</span>
                <strong>{compactMoney(feeSummary.outstanding)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Overdue</span>
                <strong>{compactMoney(feeSummary.overdue)}</strong>
              </div>
              <div className="sol-kv-row total">
                <span>Collection rate</span>
                <strong>{feeSummary.collectionRate}%</strong>
              </div>
            </div>
            <div className="sol-mt-3">
              <Progress value={feeSummary.collectionRate} label="Fee collection" />
            </div>
          </Card>

          <Card title="Outstanding balances" subtitle={`${outstandingStudents} learners with open balances`}>
            <div className="sol-list">
              {students
                .filter((s) => s.balance > 0)
                .sort((a, b) => b.balance - a.balance)
                .slice(0, 6)
                .map((s) => (
                  <div key={s.id} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                    <div className="sol-list-main">
                      <div className="sol-list-title">{s.full_name}</div>
                      <div className="sol-list-sub">{s.class_name}</div>
                    </div>
                    <div className="sol-list-side">
                      <strong className="sol-num">{compactMoney(s.balance)}</strong>
                      <small className="sol-muted">balance</small>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <NewFeeInvoiceSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

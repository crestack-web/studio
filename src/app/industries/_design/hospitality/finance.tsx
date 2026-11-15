'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus, Printer } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Kpi,
  PageHeader,
  Progress,
  SearchInput,
  Sheet,
  StatusBadge,
  Tabs,
  Td,
  Th,
  TableWrap,
  useToast,
} from '../primitives';
import { BarsChart, Donut, Legend, Sparkline, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import {
  channelMix,
  expenseSummary,
  expenses,
  paymentSummary,
  payments,
  reports,
  revenueByType,
  revenueSeries,
  revenueSummary,
} from './mock';

/* ── Revenue ──────────────────────────────────────────────────────── */

export function HospitalityRevenue({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [range, setRange] = useState<'7d' | '14d' | '30d'>('14d');

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Rooms: p.rooms,
    'Food & beverage': p.food,
    Services: p.other,
  }));

  const occupancyChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Occupancy: p.occupancy,
  }));

  const rangeData = range === '7d' ? revenueChart.slice(-7) : revenueChart;
  const total = rangeData.reduce((a, p) => a + p.Rooms + p['Food & beverage'] + p.Services, 0);
  const against = revenueSummary.monthToDate / revenueSummary.target;

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="trend" size={13} /> Finance</>}
        title="Revenue"
        subtitle="How the property is performing — rooms, food and services, with occupancy and rate in context."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Revenue report exported.')}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Rate plan editor opened.')}>
              <Icon name="wallet" size={15} /> Rate plans
            </button>
          </>
        }
        meta={
          <>
            <span className="sol-stat-line">Target {compactMoney(revenueSummary.target)}</span>
            <span className="sol-stat-line"><span className="sol-dot green" /> {Math.round(against * 100)}% of month target</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Revenue today" value={compactMoney(revenueSummary.today)} icon="wallet" delta="+8.6%" deltaDir="up" foot="vs yesterday" accent spark={<Sparkline data={revenueSeries.map((p) => p.rooms + p.food + p.other)} />} />
        <Kpi label="Month to date" value={compactMoney(revenueSummary.monthToDate)} icon="trend" delta="+11.0%" deltaDir="up" foot="vs last month" />
        <Kpi label="ADR" value={compactMoney(revenueSummary.adr)} icon="cash" delta="+2.1%" deltaDir="up" foot="7-day average" />
        <Kpi label="RevPAR" value={compactMoney(revenueSummary.revpar)} icon="chart" delta="+3.4%" deltaDir="up" foot="per available room" />
      </div>

      <Card
        title="Revenue trend"
        subtitle="Rooms, food & beverage and services stacked by day"
        action={
          <Tabs<'7d' | '14d' | '30d'>
            value={range}
            onChange={setRange}
            items={[{ id: '7d', label: '7 days' }, { id: '14d', label: '14 days' }, { id: '30d', label: '30 days' }]}
          />
        }
      >
        <TrendChart
          data={rangeData}
          series={[
            { key: 'Rooms', name: 'Rooms' },
            { key: 'Food & beverage', name: 'Food & beverage', color: 'var(--sol-chart-2)' },
            { key: 'Services', name: 'Services', color: 'var(--sol-chart-3)' },
          ]}
          height={300}
          money
          yFormat={(v) => compactMoney(v)}
        />
        <div className="sol-between sol-mt-3">
          <Legend
            items={[
              { name: 'Rooms' },
              { name: 'Food & beverage', color: 'var(--sol-chart-2)' },
              { name: 'Services', color: 'var(--sol-chart-3)' },
            ]}
          />
          <span className="sol-small sol-muted">
            Total <strong className="sol-num">{compactMoney(total)}</strong>
          </span>
        </div>
      </Card>

      <div className="sol-grid sol-grid-2">
        <Card title="Revenue by room type" subtitle="Contribution across 14 days">
          <BarsChart
            data={revenueByType}
            series={[{ key: 'revenue', name: 'Revenue' }]}
            height={260}
            money
            yFormat={(v) => compactMoney(v)}
          />
        </Card>
        <Card title="Channel mix" subtitle="Where bookings come from">
          <div className="sol-row" style={{ gap: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px', minWidth: 180 }}>
              <Donut data={channelMix} height={220} centerValue="38%" centerLabel="Direct" />
            </div>
            <div className="sol-stack-2" style={{ flex: '1 1 140px' }}>
              {channelMix.map((c) => (
                <div key={c.name} className="sol-between">
                  <span className="sol-stat-line"><span className="sol-dot" style={{ background: c.color }} /> {c.name}</span>
                  <strong className="sol-num">{c.value}%</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Occupancy & rate" subtitle="Daily occupancy across the period">
        <TrendChart
          data={occupancyChart}
          series={[{ key: 'Occupancy', name: 'Occupancy', color: 'var(--sol-chart-2)', area: false }]}
          height={220}
          yFormat={(v) => `${v}%`}
        />
      </Card>
    </>
  );
}

/* ── Expenses ─────────────────────────────────────────────────────── */

export function HospitalityExpenses({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (tab !== 'all' && e.status !== tab) return false;
      if (!q) return true;
      return `${e.vendor} ${e.category} ${e.description}`.toLowerCase().includes(q);
    });
  }, [tab, query]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, color: `var(--sol-chart-${(i % 5) + 1})` }))
      .sort((a, b) => b.value - a.value);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="receipt" size={13} /> Finance</>}
        title="Expenses"
        subtitle="Bills, payroll and suppliers — tracked against budget so nothing slips through."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => setAddOpen(true)}>
            <Plus size={15} aria-hidden /> Log expense
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line">Budget {compactMoney(expenseSummary.budget)}</span>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {compactMoney(expenseSummary.pending)} pending</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Month to date" value={compactMoney(expenseSummary.monthToDate)} icon="receipt" foot="all expenses" accent />
        <Kpi label="Pending" value={compactMoney(expenseSummary.pending)} icon="clock" foot="awaiting payment" />
        <Kpi label="Budget used" value={`${Math.round((expenseSummary.monthToDate / expenseSummary.budget) * 100)}%`} icon="chart" foot="of monthly budget" />
        <Kpi label="Largest category" value={expenseSummary.largest} icon="wallet" foot="this month" />
      </div>

      <div className="sol-grid sol-grid-2">
        <Card title="Spend by category" subtitle="Where the money went this month">
          <BarsChart
            data={byCategory.map((c) => ({ label: c.name, Spend: c.value }))}
            series={[{ key: 'Spend', name: 'Spend' }]}
            height={250}
            money
            yFormat={(v) => compactMoney(v)}
          />
        </Card>
        <Card title="Budget" subtitle="Month-to-date against plan">
          <div className="sol-stack-3">
            {byCategory.slice(0, 5).map((c) => (
              <div key={c.name}>
                <div className="sol-between" style={{ marginBottom: 5 }}>
                  <span className="sol-stat-line"><span className="sol-dot" style={{ background: c.color }} /> {c.name}</span>
                  <span className="sol-small sol-muted sol-num">{compactMoney(c.value)}</span>
                </div>
                <Progress value={(c.value / expenseSummary.monthToDate) * 100} label={`${c.name} share of spend`} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="Expense ledger"
        subtitle="Every bill and payment on record"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search vendor or category…" />}
      >
        <div className="sol-mt-3">
          <Tabs<'all' | 'paid' | 'pending' | 'overdue'>
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'All', count: expenses.length },
              { id: 'paid', label: 'Paid', count: expenses.filter((e) => e.status === 'paid').length },
              { id: 'pending', label: 'Pending', count: expenses.filter((e) => e.status === 'pending').length },
              { id: 'overdue', label: 'Overdue', count: expenses.filter((e) => e.status === 'overdue').length },
            ]}
          />
        </div>
        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead>
                    <tr>
                      <Th>Vendor</Th>
                      <Th>Category</Th>
                      <Th>Date</Th>
                      <Th>Method</Th>
                      <Th>Status</Th>
                      <Th align="right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id}>
                        <Td>
                          <div className="sol-person-name">{e.vendor}</div>
                          <div className="sol-person-sub">{e.description}</div>
                        </Td>
                        <Td className="muted">{e.category}</Td>
                        <Td className="muted">{fmtDate(e.date)}</Td>
                        <Td className="muted">{e.method}</Td>
                        <Td><StatusBadge status={e.status} /></Td>
                        <Td align="right" className="num strong">{money(e.amount)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          ) : (
            <EmptyState icon="receipt" title="No expenses match" message="Try a different status or search term." />
          )}
        </div>
      </Card>

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        width={460}
        title="Log an expense"
        subtitle="Record a bill or supplier payment"
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => { toast('Expense logged.'); setAddOpen(false); }}>Save expense</button>
          </>
        }
      >
        <div className="sol-form-grid">
          <Field label="Vendor" className="full"><input className="sol-input" placeholder="e.g. CleanPro Supplies" /></Field>
          <Field label="Category">
            <select className="sol-select">
              {['Utilities', 'Food & beverage', 'Housekeeping', 'Maintenance', 'Payroll', 'Marketing'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount"><input className="sol-input" inputMode="numeric" placeholder="0" /></Field>
          <Field label="Date"><input className="sol-input" type="date" /></Field>
          <Field label="Method">
            <select className="sol-select"><option>Bank transfer</option><option>Card</option><option>POS</option><option>Cash</option></select>
          </Field>
          <Field label="Description" className="full"><textarea className="sol-textarea" placeholder="Optional" /></Field>
        </div>
      </Sheet>
    </>
  );
}

/* ── Payments ─────────────────────────────────────────────────────── */

const METHOD_LABEL: Record<string, string> = { card: 'Card', transfer: 'Transfer', cash: 'Cash', pos: 'POS' };

export function HospitalityPayments({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'all' | 'settled' | 'pending' | 'refunded'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false;
      if (!q) return true;
      return `${p.reference} ${p.guest_name} ${p.room_number}`.toLowerCase().includes(q);
    });
  }, [tab, query]);

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="card" size={13} /> Finance</>}
        title="Payments"
        subtitle="All transactions across the property — every card, transfer and cash settlement."
        actions={
          <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Payment log exported.')}>
            <Download size={15} aria-hidden /> Export
          </button>
        }
        meta={
          <>
            <span className="sol-stat-line"><span className="sol-dot green" /> {paymentSummary.settled} settled</span>
            <span className="sol-stat-line"><span className="sol-dot amber" /> {compactMoney(paymentSummary.outstanding)} outstanding</span>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Collected today" value={compactMoney(paymentSummary.collectedToday)} icon="wallet" delta="+12%" deltaDir="up" foot="vs yesterday" accent />
        <Kpi label="Outstanding" value={compactMoney(paymentSummary.outstanding)} icon="receipt" foot="across all folios" />
        <Kpi label="Refunds" value={compactMoney(paymentSummary.refunds)} icon="refresh" foot="this week" />
        <Kpi label="Transactions" value={payments.length} icon="card" foot="last 7 days" />
      </div>

      <Card
        title="Transaction log"
        subtitle="Search by reference, guest or room"
        action={<SearchInput value={query} onChange={setQuery} placeholder="Search reference or guest…" />}
      >
        <div className="sol-mt-3">
          <Tabs<'all' | 'settled' | 'pending' | 'refunded'>
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'All', count: payments.length },
              { id: 'settled', label: 'Settled', count: payments.filter((p) => p.status === 'settled').length },
              { id: 'pending', label: 'Pending', count: payments.filter((p) => p.status === 'pending').length },
              { id: 'refunded', label: 'Refunded', count: payments.filter((p) => p.status === 'refunded').length },
            ]}
          />
        </div>
        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead>
                    <tr>
                      <Th>Reference</Th>
                      <Th>Guest</Th>
                      <Th>Method</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                      <Th align="right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <Td><span className="strong">{p.reference}</span></Td>
                        <Td>
                          <div className="sol-person-name">{p.guest_name}</div>
                          <div className="sol-person-sub">Room {p.room_number}</div>
                        </Td>
                        <Td><Badge tone="gray">{METHOD_LABEL[p.method]}</Badge></Td>
                        <Td className="muted">{fmtDate(p.date)}</Td>
                        <Td><StatusBadge status={p.status} /></Td>
                        <Td align="right" className="num strong">{money(p.amount)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </div>
          ) : (
            <EmptyState icon="card" title="No payments match" message="Try a different status or search term." />
          )}
        </div>
      </Card>
    </>
  );
}

/* ── Reports ──────────────────────────────────────────────────────── */

export function HospitalityReports({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<(typeof reports)[number] | null>(null);

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Rooms: p.rooms,
    'Food & beverage': p.food,
    Services: p.other,
  }));

  return (
    <>
      <PageHeader
        eyebrow={<><Icon name="chart" size={13} /> Finance</>}
        title="Reports"
        subtitle="Daily flash, night audit and performance reports — ready to run, print or schedule."
        actions={
          <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Custom report builder opened.')}>
            <Plus size={15} aria-hidden /> Build report
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Reports available" value={reports.length} icon="chart" foot="pre-built" accent />
        <Kpi label="Scheduled" value={reports.filter((r) => r.cadence === 'Daily').length} icon="clock" foot="daily runs" />
        <Kpi label="Last night audit" value="00:14" icon="checkCircle" foot="completed cleanly" />
        <Kpi label="Next daily flash" value="06:00" icon="calendar" foot="tomorrow" />
      </div>

      <div className="sol-grid sol-grid-2">
        {reports.map((r) => (
          <Card key={r.id}>
            <div className="sol-row sol-between" style={{ alignItems: 'flex-start' }}>
              <div className="sol-row sol-gap-2" style={{ alignItems: 'flex-start' }}>
                <span className="sol-kpi-icon"><Icon name={r.icon} size={17} /></span>
                <div>
                  <div className="sol-person-name">{r.name}</div>
                  <div className="sol-person-sub" style={{ maxWidth: '36ch' }}>{r.description}</div>
                </div>
              </div>
              <Badge tone={r.cadence === 'Daily' ? 'green' : 'blue'}>{r.cadence}</Badge>
            </div>
            <div className="sol-divider" style={{ margin: '12px 0' }} />
            <div className="sol-between">
              <span className="sol-small sol-muted">Last run {r.lastRun}</span>
              <div className="sol-row sol-gap-2">
                <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => setSelected(r)}>Preview</button>
                <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast(`${r.name} queued — you'll get it shortly.`)}>
                  Run
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={560}
        title={selected?.name || ''}
        subtitle={selected ? `Last run ${selected.lastRun}` : ''}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setSelected(null)}>Close</button>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Report sent to printer.')}>
              <Printer size={15} /> Print
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Report downloaded as PDF.')}>
              <Download size={15} /> Download
            </button>
          </>
        }
      >
        {selected ? (
          <>
            <div className="sol-kv">
              <div className="sol-kv-row"><span>Property</span><strong>The Ashcombe Hotel</strong></div>
              <div className="sol-kv-row"><span>Period</span><strong>{fmtDate(revenueSeries[revenueSeries.length - 1].date, { year: true })}</strong></div>
              <div className="sol-kv-row"><span>Cadence</span><strong>{selected.cadence}</strong></div>
            </div>
            <TrendChart
              data={revenueChart.slice(-7)}
              series={[
                { key: 'Rooms', name: 'Rooms' },
                { key: 'Food & beverage', name: 'Food & beverage', color: 'var(--sol-chart-2)' },
              ]}
              height={220}
              money
              yFormat={(v) => compactMoney(v)}
            />
            <div className="sol-kv">
              <div className="sol-kv-row"><span>Occupancy</span><strong>65%</strong></div>
              <div className="sol-kv-row"><span>ADR</span><strong>{money(revenueSummary.adr)}</strong></div>
              <div className="sol-kv-row"><span>RevPAR</span><strong>{money(revenueSummary.revpar)}</strong></div>
              <div className="sol-kv-row total"><span>Revenue today</span><strong>{money(revenueSummary.today)}</strong></div>
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}

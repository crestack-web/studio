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
import { useSolutionsLive } from '../live';

export function HospitalityRevenue({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [range, setRange] = useState<'7d' | '14d' | '30d'>('14d');
  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Rooms: p.rooms,
    'Food & beverage': p.food,
    Services: p.other,
  }));
  const occupancyChart = revenueSeries.map((p) => ({ label: fmtDate(p.date), Occupancy: p.occupancy }));
  const rangeData = range === '7d' ? revenueChart.slice(-7) : revenueChart;
  const total = rangeData.reduce((a, p) => a + p.Rooms + p['Food & beverage'] + p.Services, 0);
  const against = revenueSummary.target ? revenueSummary.monthToDate / revenueSummary.target : 0;
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
        <Kpi label="Revenue today" value={compactMoney(revenueSummary.today)} icon="wallet" foot="from live bookings" accent spark={<Sparkline data={revenueSeries.map((p) => p.rooms + p.food + p.other)} />} />
        <Kpi label="Month to date" value={compactMoney(revenueSummary.monthToDate)} icon="trend" foot="from live bookings" />
        <Kpi label="ADR" value={compactMoney(revenueSummary.adr)} icon="cash" foot="average daily rate" />
        <Kpi label="RevPAR" value={compactMoney(revenueSummary.revpar)} icon="chart" foot="per available room" />
      </div>
      <Card title="Revenue trend" subtitle="Rooms, food & beverage and services stacked by day" action={
        <Tabs<'7d' | '14d' | '30d'> value={range} onChange={setRange} items={[{ id: '7d', label: '7 days' }, { id: '14d', label: '14 days' }, { id: '30d', label: '30 days' }]} />
      }>
        {rangeData.length ? (
          <TrendChart data={rangeData} series={[{ key: 'Rooms', name: 'Rooms' }, { key: 'Food & beverage', name: 'Food & beverage', color: 'var(--sol-chart-2)' }, { key: 'Services', name: 'Services', color: 'var(--sol-chart-3)' }]} height={300} money yFormat={(v) => compactMoney(v)} />
        ) : (
          <EmptyState icon="chart" title="No revenue yet" message="Revenue appears here once bookings and folios are recorded." />
        )}
        <div className="sol-between sol-mt-3">
          <Legend items={[{ name: 'Rooms' }, { name: 'Food & beverage', color: 'var(--sol-chart-2)' }, { name: 'Services', color: 'var(--sol-chart-3)' }]} />
          <span className="sol-small sol-muted">Total <strong className="sol-num">{compactMoney(total)}</strong></span>
        </div>
      </Card>
      <div className="sol-grid sol-grid-2">
        <Card title="Revenue by room type" subtitle="Contribution from live bookings">
          {revenueByType.length ? (
            <BarsChart data={revenueByType} series={[{ key: 'revenue', name: 'Revenue' }]} height={260} money yFormat={(v) => compactMoney(v)} />
          ) : (
            <EmptyState icon="bed" title="No room revenue yet" message="Add rooms and bookings to see the breakdown." />
          )}
        </Card>
        <Card title="Channel mix" subtitle="Where bookings come from">
          {channelMix.length ? (
            <div className="sol-row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                <Donut data={channelMix} height={220} centerValue={`${channelMix[0]?.value || 0}%`} centerLabel={channelMix[0]?.name || '—'} />
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
          ) : (
            <EmptyState icon="globe" title="No channel data yet" message="Booking sources appear once reservations are created." />
          )}
        </Card>
      </div>
      <Card title="Occupancy & rate" subtitle="Daily occupancy across the period">
        {occupancyChart.length ? (
          <TrendChart data={occupancyChart} series={[{ key: 'Occupancy', name: 'Occupancy', color: 'var(--sol-chart-2)', area: false }]} height={220} yFormat={(v) => `${v}%`} />
        ) : (
          <EmptyState icon="trend" title="No occupancy series yet" message="Charts fill in as the property records stays." />
        )}
      </Card>
    </>
  );
}

export function HospitalityExpenses({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const { mutate } = useSolutionsLive();
  const [tab, setTab] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [query, setQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
        <Kpi label="Budget used" value={`${expenseSummary.budget ? Math.round((expenseSummary.monthToDate / expenseSummary.budget) * 100) : 0}%`} icon="chart" foot="of monthly budget" />
        <Kpi label="Largest category" value={expenseSummary.largest} icon="wallet" foot="this month" />
      </div>
      <div className="sol-grid sol-grid-2">
        <Card title="Spend by category" subtitle="Where the money went this month">
          {byCategory.length ? (
            <BarsChart data={byCategory.map((c) => ({ label: c.name, Spend: c.value }))} series={[{ key: 'Spend', name: 'Spend' }]} height={250} money yFormat={(v) => compactMoney(v)} />
          ) : (
            <EmptyState icon="receipt" title="No expenses yet" message="Log your first bill to see spend by category." />
          )}
        </Card>
        <Card title="Budget" subtitle="Month-to-date against plan">
          <div className="sol-stack-3">
            {byCategory.slice(0, 5).map((c) => (
              <div key={c.name}>
                <div className="sol-between" style={{ marginBottom: 5 }}>
                  <span className="sol-stat-line"><span className="sol-dot" style={{ background: c.color }} /> {c.name}</span>
                  <span className="sol-small sol-muted sol-num">{compactMoney(c.value)}</span>
                </div>
                <Progress value={expenseSummary.monthToDate ? (c.value / expenseSummary.monthToDate) * 100 : 0} label={`${c.name} share of spend`} />
              </div>
            ))}
            {!byCategory.length ? <EmptyState icon="chart" title="Nothing to show" message="Expense categories appear after you log bills." /> : null}
          </div>
        </Card>
      </div>
      <Card title="Expense ledger" subtitle="Every bill and payment on record" action={<SearchInput value={query} onChange={setQuery} placeholder="Search vendor or category…" />}>
        <div className="sol-mt-3">
          <Tabs<'all' | 'paid' | 'pending' | 'overdue'> value={tab} onChange={setTab} items={[
            { id: 'all', label: 'All', count: expenses.length },
            { id: 'paid', label: 'Paid', count: expenses.filter((e) => e.status === 'paid').length },
            { id: 'pending', label: 'Pending', count: expenses.filter((e) => e.status === 'pending').length },
            { id: 'overdue', label: 'Overdue', count: expenses.filter((e) => e.status === 'overdue').length },
          ]} />
        </div>
        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead><tr><Th>Vendor</Th><Th>Category</Th><Th>Date</Th><Th>Method</Th><Th>Status</Th><Th align="right">Amount</Th></tr></thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id}>
                        <Td><div className="sol-person-name">{e.vendor}</div><div className="sol-person-sub">{e.description}</div></Td>
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
            <EmptyState icon="receipt" title="No expenses match" message="Try a different status or search term, or log a new expense." />
          )}
        </div>
      </Card>
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} width={460} title="Log an expense" subtitle="Record a bill or supplier payment" footer={
        <>
          <button type="button" className="sol-btn sol-btn-ghost" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
          <button type="button" className="sol-btn sol-btn-primary" disabled={saving} onClick={async () => {
            const root = document.querySelector('[data-expense-form]');
            const vendor = (root?.querySelector('[name=vendor]') as HTMLInputElement)?.value?.trim() || '';
            const amount = (root?.querySelector('[name=amount]') as HTMLInputElement)?.value || '';
            const category = (root?.querySelector('[name=category]') as HTMLSelectElement)?.value || 'Utilities';
            const date = (root?.querySelector('[name=date]') as HTMLInputElement)?.value || new Date().toISOString().slice(0, 10);
            const method = (root?.querySelector('[name=method]') as HTMLSelectElement)?.value || 'Bank transfer';
            const description = (root?.querySelector('[name=description]') as HTMLTextAreaElement)?.value?.trim() || '';
            if (!vendor || !amount) { toast('Vendor and amount are required.'); return; }
            setSaving(true);
            const res = await mutate({
              action: 'record_create',
              module: 'expenses',
              title: vendor,
              amount: Number(amount) || 0,
              status: 'pending',
              notes: description || null,
              occurredAt: new Date(`${date}T12:00:00`).toISOString(),
              meta: { vendor, category, description, method, date },
            });
            setSaving(false);
            if (!res.ok) { toast(res.error || 'Could not save expense.'); return; }
            toast('Expense logged.');
            setAddOpen(false);
          }}>{saving ? 'Saving…' : 'Save expense'}</button>
        </>
      }>
        <div className="sol-form-grid" data-expense-form>
          <Field label="Vendor" className="full"><input className="sol-input" name="vendor" placeholder="e.g. CleanPro Supplies" /></Field>
          <Field label="Category"><select className="sol-select" name="category">{['Utilities', 'Food & beverage', 'Housekeeping', 'Maintenance', 'Payroll', 'Marketing'].map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Amount"><input className="sol-input" name="amount" inputMode="numeric" placeholder="0" /></Field>
          <Field label="Date"><input className="sol-input" name="date" type="date" /></Field>
          <Field label="Method"><select className="sol-select" name="method"><option>Bank transfer</option><option>Card</option><option>POS</option><option>Cash</option></select></Field>
          <Field label="Description" className="full"><textarea className="sol-textarea" name="description" placeholder="Optional" /></Field>
        </div>
      </Sheet>
    </>
  );
}

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
      <PageHeader eyebrow={<><Icon name="card" size={13} /> Finance</>} title="Payments" subtitle="All transactions across the property — every card, transfer and cash settlement." actions={
        <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Payment log exported.')}><Download size={15} aria-hidden /> Export</button>
      } meta={
        <><span className="sol-stat-line"><span className="sol-dot green" /> {paymentSummary.settled} settled</span><span className="sol-stat-line"><span className="sol-dot amber" /> {compactMoney(paymentSummary.outstanding)} outstanding</span></>
      } />
      <div className="sol-kpis">
        <Kpi label="Collected today" value={compactMoney(paymentSummary.collectedToday)} icon="wallet" foot="settled today" accent />
        <Kpi label="Outstanding" value={compactMoney(paymentSummary.outstanding)} icon="receipt" foot="across all folios" />
        <Kpi label="Refunds" value={compactMoney(paymentSummary.refunds)} icon="refresh" foot="all time" />
        <Kpi label="Transactions" value={payments.length} icon="card" foot="on record" />
      </div>
      <Card title="Transaction log" subtitle="Search by reference, guest or room" action={<SearchInput value={query} onChange={setQuery} placeholder="Search reference or guest…" />}>
        <div className="sol-mt-3">
          <Tabs<'all' | 'settled' | 'pending' | 'refunded'> value={tab} onChange={setTab} items={[
            { id: 'all', label: 'All', count: payments.length },
            { id: 'settled', label: 'Settled', count: payments.filter((p) => p.status === 'settled').length },
            { id: 'pending', label: 'Pending', count: payments.filter((p) => p.status === 'pending').length },
            { id: 'refunded', label: 'Refunded', count: payments.filter((p) => p.status === 'refunded').length },
          ]} />
        </div>
        <div className="sol-mt-3">
          {filtered.length ? (
            <div className="sol-card" style={{ boxShadow: 'none' }}>
              <TableWrap>
                <table className="sol-table">
                  <thead><tr><Th>Reference</Th><Th>Guest</Th><Th>Method</Th><Th>Date</Th><Th>Status</Th><Th align="right">Amount</Th></tr></thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id}>
                        <Td><span className="strong">{p.reference}</span></Td>
                        <Td><div className="sol-person-name">{p.guest_name}</div><div className="sol-person-sub">Room {p.room_number}</div></Td>
                        <Td><Badge tone="gray">{METHOD_LABEL[p.method] || p.method}</Badge></Td>
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
            <EmptyState icon="card" title="No payments match" message="Payments appear when guests settle folios or you record a transaction." />
          )}
        </div>
      </Card>
    </>
  );
}

export function HospitalityReports({ hrefFor }: { hrefFor: (s: string) => string }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<(typeof reports)[number] | null>(null);
  const revenueChart = revenueSeries.map((p) => ({ label: fmtDate(p.date), Rooms: p.rooms, 'Food & beverage': p.food, Services: p.other }));
  return (
    <>
      <PageHeader eyebrow={<><Icon name="chart" size={13} /> Finance</>} title="Reports" subtitle="Daily flash, night audit and performance reports — run from live property data." actions={
        <button type="button" className="sol-btn sol-btn-subtle" onClick={() => toast('Report pack exported.')}><Download size={15} aria-hidden /> Export pack</button>
      } />
      <div className="sol-grid sol-grid-2">
        {reports.map((r) => (
          <Card key={r.id} title={r.name} subtitle={r.description} action={
            <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => { setSelected(r); toast(`${r.name} generated from live data.`); }}>
              <Printer size={14} aria-hidden /> Run
            </button>
          }>
            <div className="sol-between">
              <span className="sol-small sol-muted">{r.cadence}</span>
              <Badge tone="gray">Last: {r.lastRun}</Badge>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Performance snapshot" subtitle="Built from bookings, occupancy and payments">
        {revenueChart.length ? (
          <TrendChart data={revenueChart} series={[{ key: 'Rooms', name: 'Rooms' }, { key: 'Food & beverage', name: 'Food & beverage', color: 'var(--sol-chart-2)' }, { key: 'Services', name: 'Services', color: 'var(--sol-chart-3)' }]} height={260} money yFormat={(v) => compactMoney(v)} />
        ) : (
          <EmptyState icon="chart" title="No report data yet" message="Reports fill in once the property has bookings." />
        )}
        {selected ? <p className="sol-small sol-muted sol-mt-3">Last run: {selected.name}</p> : null}
      </Card>
    </>
  );
}

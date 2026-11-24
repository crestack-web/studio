'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Badge, Card, Kpi, PageHeader, Progress, StatusBadge, TableWrap, Td, Th, useToast } from '../primitives';
import { BarsChart, Donut, Legend, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { downloadCsv } from '../action-helpers';
import {
  deliveryStats,
  disciplineMix,
  expensesSummary,
  projectTypeMix,
  projects,
  reports,
  revenueSeries,
  revenueSummary,
  timeStats,
} from './mock';

export function ProfessionalReports() {
  const { toast } = useToast();

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Billed: p.billed,
    Collected: p.collected,
  }));

  const utilisationChart = revenueSeries.slice(-7).map((p) => ({
    label: fmtDate(p.date),
    Utilisation: p.utilisation,
  }));

  const collectionRate = Math.round(
    (revenueSummary.collectedMTD / Math.max(1, revenueSummary.billedMTD)) * 100,
  );

  const margins = projects
    .filter((p) => p.budget > 0 && p.status !== 'draft')
    .map((p) => ({
      project: p,
      margin: Math.round(((p.budget - p.spent) / p.budget) * 100),
    }))
    .sort((a, b) => b.margin - a.margin);

  const avgMargin = Math.round(margins.reduce((s, m) => s + m.margin, 0) / Math.max(1, margins.length));

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="chart" size={13} /> Insights
          </>
        }
        title="Reports"
        subtitle="Delivery, revenue, utilisation and profitability across the studio."
        meta={
          <>
            <Badge tone="accent" dot>
              Month to date
            </Badge>
            <span className="sol-small sol-muted">Updated moments ago</span>
          </>
        }
        actions={
          <button
            type="button"
            className="sol-btn sol-btn-subtle"
            onClick={() => { downloadCsv('professional-report.csv', revenueChart); toast('Report exported as CSV.'); }}
          >
            <Download size={15} aria-hidden /> Export pack
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Revenue MTD"
          value={compactMoney(revenueSummary.monthToDate)}
          icon="trend"
          delta="+11.4%"
          deltaDir="up"
          foot="vs last month"
          accent
        />
        <Kpi
          label="Collection rate"
          value={`${collectionRate}%`}
          icon="wallet"
          foot={`${compactMoney(revenueSummary.outstanding)} outstanding`}
        />
        <Kpi
          label="Utilisation"
          value={`${timeStats.avgUtilisation}%`}
          icon="clock"
          foot={`${timeStats.billableHours.toFixed(1)}h billable logged`}
        />
        <Kpi
          label="Average margin"
          value={`${avgMargin}%`}
          icon="chart"
          foot={`${deliveryStats.activeProjects} active projects`}
        />
      </div>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card title="Revenue & collections" subtitle="Billed against collected · last 14 days">
          <TrendChart
            data={revenueChart}
            series={[
              { key: 'Billed', name: 'Billed' },
              { key: 'Collected', name: 'Collected', color: 'var(--sol-chart-2)' },
            ]}
            height={280}
            money
            yFormat={(v) => compactMoney(v)}
          />
          <div className="sol-between sol-mt-3">
            <div className="sol-legend">
              <span className="sol-legend-item">
                <span className="sol-swatch" /> Billed
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-2)' }} /> Collected
              </span>
            </div>
            <span className="sol-small sol-muted">
              MTD <strong className="sol-num">{compactMoney(revenueSummary.monthToDate)}</strong> ·
              Target <strong className="sol-num">{compactMoney(revenueSummary.target)}</strong>
            </span>
          </div>
        </Card>

        <Card title="Utilisation" subtitle="Billable load across the last seven days">
          <BarsChart
            data={utilisationChart}
            series={[{ key: 'Utilisation', name: 'Utilisation' }]}
            height={220}
            yFormat={(v) => `${v}%`}
          />
          <div className="sol-legend sol-mt-3">
            <span className="sol-legend-item">
              <span className="sol-swatch" /> Daily utilisation
            </span>
            <span className="sol-legend-item sol-muted">Target 75 – 85%</span>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-kv sol-mt-2">
            <div className="sol-kv-row">
              <span>Billable hours</span>
              <strong>{timeStats.billableHours.toFixed(1)}h</strong>
            </div>
            <div className="sol-kv-row">
              <span>Internal hours</span>
              <strong>{timeStats.nonBillableHours.toFixed(1)}h</strong>
            </div>
            <div className="sol-kv-row">
              <span>Unbilled value</span>
              <strong>{money(timeStats.unbilledValue)}</strong>
            </div>
          </div>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2 sol-mt-3">
        <Card title="Discipline mix" subtitle="Share of billable hours by discipline">
          <Donut
            data={disciplineMix}
            height={210}
            centerValue={`${disciplineMix[0].value}%`}
            centerLabel="Design"
          />
          <div className="sol-mt-3">
            <Legend
              items={disciplineMix.map((d) => ({ name: d.name, color: d.color, value: `${d.value}%` }))}
            />
          </div>
        </Card>
        <Card title="Project mix" subtitle="Contracted value by engagement type">
          <Donut
            data={projectTypeMix}
            height={210}
            centerValue={`${projectTypeMix[0].value}%`}
            centerLabel="Brand"
          />
          <div className="sol-mt-3">
            <Legend
              items={projectTypeMix.map((d) => ({ name: d.name, color: d.color, value: `${d.value}%` }))}
            />
          </div>
        </Card>
      </div>

      <Card title="Project profitability" subtitle="Budget against spend, with margin at completion" flush className="sol-mt-3">
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th align="right">Budget</Th>
                <Th align="right">Spent</Th>
                <Th align="right">Margin</Th>
                <Th>Health</Th>
              </tr>
            </thead>
            <tbody>
              {margins.map(({ project: p, margin }) => {
                const overrun = p.spent > p.budget * 0.85;
                return (
                  <tr key={p.id}>
                    <Td>
                      <div className="sol-list-title">{p.name}</div>
                      <div className="sol-list-sub">
                        {p.code} · {p.progress}% complete
                      </div>
                    </Td>
                    <Td className="muted">{p.client_name}</Td>
                    <Td align="right" className="num">
                      {compactMoney(p.budget)}
                    </Td>
                    <Td align="right" className="num">
                      {compactMoney(p.spent)}
                    </Td>
                    <Td align="right" className={margin < 20 ? 'strong' : 'num'}>
                      {margin}%
                    </Td>
                    <Td>
                      <div style={{ minWidth: 130 }}>
                        <StatusBadge status={margin < 20 ? 'at_risk' : 'active'} label={margin < 20 ? 'At risk' : 'On track'} />
                        <div className="sol-mt-2">
                          <Progress
                            value={(p.spent / Math.max(1, p.budget)) * 100}
                            tone={overrun ? 'red' : 'green'}
                            label={`${p.name} budget used`}
                          />
                        </div>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <div className="sol-card-body sol-between sol-small sol-muted">
          <span>
            Total contracted <strong className="sol-num">{compactMoney(projects.reduce((s, p) => s + p.budget, 0))}</strong>
          </span>
          <span>
            Spent to date <strong className="sol-num">{compactMoney(projects.reduce((s, p) => s + p.spent, 0))}</strong>
          </span>
          <span>
            Studio costs <strong className="sol-num">{compactMoney(expensesSummary.total)}</strong>
          </span>
        </div>
      </Card>

      <div className="sol-section-title sol-mt-4">
        <h2>Saved reports</h2>
        <span className="sol-small sol-muted">Run or schedule a report</span>
      </div>

      <div className="sol-desk-grid">
        {reports.map((r) => (
          <article key={r.id} className="sol-desk-card">
            <div className="sol-desk-top">
              <div className="sol-row sol-gap-2">
                <span className="sol-kpi-icon">
                  <Icon name={r.icon || 'clipboard'} size={16} />
                </span>
                <div>
                  <div className="sol-list-title">{r.name}</div>
                  <div className="sol-list-sub">{r.cadence}</div>
                </div>
              </div>
              <Badge tone="gray">{r.lastRun}</Badge>
            </div>
            <p className="sol-board-desc" style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5 }}>
              {r.description}
            </p>
            <div className="sol-desk-foot">
              <button
                type="button"
                className="sol-btn sol-btn-ghost sol-btn-sm"
                onClick={() => toast(`${r.name} opened.`)}
              >
                Open report
              </button>
              <button
                type="button"
                className="sol-btn sol-btn-subtle sol-btn-sm"
                onClick={() => toast(`${r.name} exported as CSV.`)}
              >
                <Download size={13} aria-hidden /> Export
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="sol-mt-4">
        <Card title="Capacity outlook" subtitle="Weighted utilisation for the next four weeks">
          <div className="sol-grid sol-grid-4">
            {[0, 1, 2, 3].map((i) => {
              const value = Math.min(98, timeStats.avgUtilisation + (i === 1 ? 6 : i === 2 ? -4 : i === 3 ? 2 : 0));
              return (
                <div key={i}>
                  <div className="sol-between sol-small">
                    <span className="sol-muted">Week {i + 1}</span>
                    <strong className="sol-num">{value}%</strong>
                  </div>
                  <div className="sol-mt-2">
                    <Progress
                      value={value}
                      tone={value > 90 ? 'red' : value > 82 ? 'amber' : 'green'}
                      label={`Week ${i + 1} utilisation forecast`}
                    />
                  </div>
                  <div className="sol-small sol-muted sol-mt-2">
                    {value > 90 ? 'Over capacity' : value > 82 ? 'Tight' : 'Healthy headroom'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

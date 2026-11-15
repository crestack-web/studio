'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Badge, Card, Kpi, PageHeader, useToast } from '../primitives';
import { BarsChart, Donut, Legend, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import {
  appointmentStats,
  billingSummary,
  departmentMix,
  payerMix,
  reports,
  revenueSeries,
  revenueSummary,
  visitStats,
} from './mock';

export function HealthcareReports() {
  const { toast } = useToast();

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Consultations: p.consultations,
    Procedures: p.procedures,
    Laboratory: p.laboratory,
    Pharmacy: p.pharmacy,
  }));

  const departmentChart = departmentMix.map((d) => ({ label: d.name, Visits: d.value }));

  const collectionRate = Math.round(
    (billingSummary.collectedMTD / Math.max(1, billingSummary.billedMTD)) * 100,
  );

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Financial, clinical and operational reporting for the clinic."
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
            onClick={() => toast('Report pack exported as PDF.')}
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
          delta="+9.1%"
          deltaDir="up"
          foot="vs last month"
          accent
        />
        <Kpi
          label="Collection rate"
          value={`${collectionRate}%`}
          icon="wallet"
          foot={`${compactMoney(billingSummary.outstanding)} outstanding`}
        />
        <Kpi label="Average wait" value={`${visitStats.avgWait}m`} icon="clock" foot="Target under 20 minutes" />
        <Kpi
          label="Cancellations"
          value={appointmentStats.cancelled}
          icon="calendar"
          foot="Today’s cancelled appointments"
        />
      </div>

      <div className="sol-grid sol-grid-main sol-mt-3">
        <Card
          title="Revenue by service line"
          subtitle="Consultations, procedures, laboratory and pharmacy · last 14 days"
        >
          <TrendChart
            data={revenueChart}
            series={[
              { key: 'Consultations', name: 'Consultations' },
              { key: 'Procedures', name: 'Procedures', color: 'var(--sol-chart-2)' },
              { key: 'Laboratory', name: 'Laboratory', color: 'var(--sol-chart-3)' },
              { key: 'Pharmacy', name: 'Pharmacy', color: 'var(--sol-chart-4)' },
            ]}
            height={280}
            money
            yFormat={(v) => compactMoney(v)}
          />
        </Card>

        <Card title="Payer mix" subtitle="Share of billed revenue">
          <Donut data={payerMix} height={210} centerValue={`${payerMix[0].value}%`} centerLabel="HMO share" />
          <div className="sol-mt-3">
            <Legend
              items={payerMix.map((p) => ({ name: p.name, color: p.color, value: `${p.value}%` }))}
            />
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-kv sol-mt-2">
            <div className="sol-kv-row">
              <span>Billed MTD</span>
              <strong>{money(billingSummary.billedMTD)}</strong>
            </div>
            <div className="sol-kv-row">
              <span>Collected MTD</span>
              <strong>{money(billingSummary.collectedMTD)}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Visits by department" subtitle="Share of visits month to date" className="sol-mt-3">
        <BarsChart
          data={departmentChart}
          series={[{ key: 'Visits', name: 'Visits' }]}
          height={240}
          yFormat={(v) => `${v}%`}
        />
        <div className="sol-legend sol-mt-3">
          {departmentMix.map((d, i) => (
            <span key={d.name} className="sol-legend-item">
              <span
                className="sol-swatch"
                style={{ background: i === 0 ? 'var(--sol-chart-1)' : 'var(--sol-chart-1)', opacity: 1 - i * 0.12 }}
              />
              {d.name}
              <strong className="sol-num">{d.value}%</strong>
            </span>
          ))}
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
                  <Icon name={r.icon} size={16} />
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
    </>
  );
}

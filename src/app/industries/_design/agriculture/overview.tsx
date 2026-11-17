'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge, Banner, Card, Kpi, Progress, StatusBadge } from '../primitives';
import { BarsChart, MiniBars } from '../charts';
import { Icon } from '../icons';
import { addDays, compactMoney, fmtDate, todayISO } from '../format';
import {
  activities,
  crops,
  farm,
  finance,
  harvest,
  inputs,
  inventory,
  plots,
  sales,
} from './mock';

const QUICK_LINKS = [
  { id: 'plots', label: 'Plots', icon: 'layers' },
  { id: 'activities', label: 'Activities', icon: 'calendar' },
  { id: 'harvest', label: 'Harvest', icon: 'clipboard' },
  { id: 'sales', label: 'Sales', icon: 'trend' },
  { id: 'exports', label: 'Exports', icon: 'globe' },
];

const GRADE_PROGRESS: Record<string, number> = { A: 100, B: 76, C: 52 };

export function AgricultureOverview({ hrefFor }: { hrefFor?: (sectionId: string) => string }) {
  const href = hrefFor ?? ((section: string) => `#${section}`);
  const today = todayISO();
  const month = today.slice(0, 7);

  const plantedArea = plots
    .filter((plot) => plot.status === 'planted' || plot.status === 'harvested')
    .reduce((sum, plot) => sum + (Number(plot.meta.area_ha) || 0), 0);
  const activeCrops = crops.filter((crop) => ['growing', 'flowering', 'ready'].includes(crop.status));
  const readyBatches = harvest.filter((item) => item.status === 'ready' || item.status === 'grading');
  const readyTonnes = readyBatches.reduce((sum, item) => sum + (Number(item.meta.quantity_t) || 0), 0);
  const revenue = sales
    .filter((sale) => String(sale.occurred_at || '').slice(0, 7) === month)
    .reduce((sum, sale) => sum + sale.amount, 0);
  const receiptsThisMonth = finance.filter(
    (row) => row.meta.type === 'receipt' && String(row.occurred_at || '').slice(0, 7) === month,
  ).length;

  // Eight weekly buckets, oldest first, built from real harvest and sale dates.
  const trend = Array.from({ length: 8 }, (_, index) => {
    const end = addDays(today, -7 * (7 - index));
    const start = addDays(end, -6);
    const inBucket = (date?: string) => Boolean(date && date >= start && date <= end);
    const tonnes = harvest
      .filter((item) => inBucket(String(item.meta.date || item.occurred_at || '')))
      .reduce((sum, item) => sum + (Number(item.meta.quantity_t) || 0), 0);
    const naira = sales
      .filter((sale) => inBucket(String(sale.occurred_at || '')))
      .reduce((sum, sale) => sum + sale.amount, 0);
    return {
      label: fmtDate(start),
      'Yield (t)': Math.round(tonnes * 10) / 10,
      'Revenue (₦M)': Math.round((naira / 1_000_000) * 10) / 10,
    };
  });

  const schedule = [...activities]
    .sort((a, b) =>
      String(a.meta.due || a.occurred_at || '').localeCompare(String(b.meta.due || b.occurred_at || '')),
    )
    .slice(0, 5);

  const harvestBoard = harvest
    .filter((item) => ['ready', 'grading', 'graded'].includes(item.status))
    .slice(0, 5);

  const lowStock = [...inputs, ...inventory]
    .filter(
      (row) =>
        row.status === 'out_of_stock' ||
        row.status === 'low_stock' ||
        Number(row.meta.quantity) <= Number(row.meta.reorder_level),
    )
    .slice(0, 5);

  return (
    <>
      <section className="sol-hero">
        <div className="sol-hero-body">
          <div className="sol-hero-date">
            <Clock size={13} aria-hidden /> {fmtDate(today, { weekday: true, year: true })} · {farm.season}
          </div>
          <h1>Good morning, {farm.ownerName.replace(/^Mrs\.\s*/, '')}.</h1>
          <p className="sol-hero-sub">
            {activeCrops.length} crop cycles are in the field, {readyBatches.length} harvest batches are ready for
            lifting and {lowStock.length} stock items need attention. Here is how {farm.name} is tracking this season.
          </p>
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Link href={href('harvest')} className="sol-btn sol-btn-primary">
              <Icon name="clipboard" size={15} /> Open harvest board
            </Link>
            <Link href={href('activities')} className="sol-btn sol-btn-subtle">
              <Icon name="calendar" size={15} /> Field schedule
            </Link>
          </div>
          <div className="sol-row sol-small sol-muted">
            <span className="sol-dot green" /> {schedule.length} tasks coming up · first due{' '}
            {fmtDate(String(schedule[0]?.meta.due || schedule[0]?.occurred_at || today))}
          </div>
        </div>
      </section>

      <div className="sol-kpis">
        <Kpi
          label="Planted area"
          value={`${Math.round(plantedArea)} ha`}
          icon="layers"
          delta={`${plots.length} plots registered`}
          deltaDir="up"
          foot={`${farm.totalHectares} ha across the network`}
          accent
          spark={<MiniBars data={plots.map((plot) => Number(plot.meta.area_ha) || 0)} />}
        />
        <Kpi
          label="Active crop cycles"
          value={activeCrops.length}
          icon="checklist"
          delta={`${crops.filter((crop) => crop.status === 'ready').length} nearing harvest`}
          deltaDir="up"
          foot={`${crops.length} cycles on record`}
          spark={<MiniBars data={crops.map((crop) => Number(crop.meta.progress) || 0)} color="var(--sol-chart-2)" />}
        />
        <Kpi
          label="Harvest ready"
          value={`${readyTonnes.toFixed(1)} t`}
          icon="clipboard"
          delta={`${readyBatches.length} batches to lift`}
          deltaDir="up"
          foot={`${harvest.reduce((sum, item) => sum + (Number(item.meta.quantity_t) || 0), 0).toFixed(0)} t harvested this season`}
        />
        <Kpi
          label="Revenue this month"
          value={compactMoney(revenue)}
          icon="trend"
          delta={`${receiptsThisMonth} receipts posted`}
          deltaDir="up"
          foot={`${sales.filter((sale) => sale.status === 'pending').length} orders awaiting payment`}
        />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Yield & revenue trend"
          subtitle="Weekly harvest tonnage and sales value · last 8 weeks"
          action={
            <Link href={href('sales')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Sales register <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <BarsChart
            data={trend}
            series={[
              { key: 'Yield (t)', name: 'Yield (t)' },
              { key: 'Revenue (₦M)', name: 'Revenue (₦M)', color: 'var(--sol-chart-2)' },
            ]}
            height={264}
            yFormat={(value) => String(Math.round(value))}
          />
          <div className="sol-between sol-mt-3">
            <div className="sol-legend">
              <span className="sol-legend-item">
                <span className="sol-swatch" /> Yield in tonnes
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-2)' }} /> Revenue in ₦ millions
              </span>
            </div>
            <span className="sol-small sol-muted">
              Season to date <strong className="sol-num">{compactMoney(sales.reduce((sum, s) => sum + s.amount, 0))}</strong>
            </span>
          </div>
        </Card>

        <Card title="Harvest readiness" subtitle={`${harvestBoard.length} batches moving through grading`}>
          <div className="sol-stack-2">
            {harvestBoard.map((item) => {
              const pct = GRADE_PROGRESS[String(item.meta.grade)] ?? 52;
              return (
                <div key={item.id}>
                  <div className="sol-between">
                    <div>
                      <div className="sol-list-title" style={{ fontSize: 13 }}>
                        {item.title}
                      </div>
                      <div className="sol-small sol-muted">
                        {item.meta.plot} · {fmtDate(String(item.meta.date || item.occurred_at || ''))}
                      </div>
                    </div>
                    <div className="sol-row sol-gap-2">
                      <Badge tone={item.meta.grade === 'A' ? 'green' : item.meta.grade === 'B' ? 'blue' : 'amber'}>
                        Grade {item.meta.grade}
                      </Badge>
                      <strong className="sol-num">{Number(item.meta.quantity_t) || 0} t</strong>
                    </div>
                  </div>
                  <div className="sol-mt-2">
                    <Progress
                      value={pct}
                      tone={pct >= 100 ? 'green' : pct >= 76 ? undefined : 'amber'}
                      label={`Readiness of ${item.title}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sol-divider sol-mt-3" />
          <Link href={href('harvest')} className="sol-btn sol-btn-subtle sol-btn-sm">
            View harvest board <ArrowRight size={13} aria-hidden />
          </Link>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card
          title="Field activity schedule"
          subtitle="Next tasks across every plot"
          flush
          action={
            <Link href={href('activities')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All activities <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {schedule.map((item) => (
              <Link key={item.id} href={href('activities')} className="sol-list-row">
                <span className="sol-empty-icon">
                  <Icon name="checklist" size={15} />
                </span>
                <div className="sol-list-main">
                  <div className="sol-list-title">{item.title}</div>
                  <div className="sol-list-sub">
                    {String(item.meta.type || '').replace(/_/g, ' ')} · {item.meta.plot} · {item.meta.assignee}
                  </div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={item.status} />
                  <small>{fmtDate(String(item.meta.due || item.occurred_at || ''))}</small>
                </div>
              </Link>
            ))}
            {!schedule.length ? (
              <div className="sol-list-row sol-small sol-muted">No field activities scheduled.</div>
            ) : null}
          </div>
        </Card>

        <Card
          title="Stock alerts"
          subtitle={`${lowStock.length} items at or below reorder level`}
          flush
          action={
            <Link href={href('inputs')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Inputs <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {lowStock.map((item) => (
              <Link key={item.id} href={href('inventory')} className="sol-list-row">
                <span className="sol-empty-icon">
                  <Icon name="alert" size={15} />
                </span>
                <div className="sol-list-main">
                  <div className="sol-list-title">{item.title}</div>
                  <div className="sol-list-sub">{item.meta.supplier || item.meta.location || item.meta.unit}</div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={item.status} />
                  <small className="sol-num">
                    {Number(item.meta.quantity) || 0} / {Number(item.meta.reorder_level) || 0} {item.meta.unit}
                  </small>
                </div>
              </Link>
            ))}
            {!lowStock.length ? (
              <div className="sol-list-row sol-small sol-muted">Everything is above reorder level.</div>
            ) : null}
          </div>
        </Card>
      </div>

      <Banner tone="accent" icon="mo" title="MO insight">
        {readyBatches.length} batches are ready for lifting — about {readyTonnes.toFixed(1)} tonnes. With{' '}
        {lowStock.length} stock items below reorder level and {activeCrops.length} cycles still in the field, MO would
        send the grading crew to {readyBatches[0]?.meta.plot || 'the earliest plot'} first and raise a purchase order
        for the shortfall items today.
      </Banner>

      <Card
        title="Quick links"
        subtitle="Jump straight into the busiest parts of the farm"
        className="sol-mt-3"
        action={
          <Link href={href('plots')} className="sol-btn sol-btn-ghost sol-btn-sm">
            All operations <ArrowRight size={13} aria-hidden />
          </Link>
        }
      >
        <div className="sol-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {QUICK_LINKS.map((link) => (
            <Link key={link.id} href={href(link.id)} className="sol-btn sol-btn-subtle">
              <Icon name={link.icon} size={15} /> {link.label}
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}

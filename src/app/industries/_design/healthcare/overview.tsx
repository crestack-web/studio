'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Kpi,
  Progress,
  Ring,
  StatusBadge,
} from '../primitives';
import { Sparkline, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money, secondsLabel, todayISO } from '../format';
import {
  activity,
  appointmentStats,
  bedOccupancy,
  beds,
  clinic,
  patients,
  revenueSeries,
  revenueSummary,
  supplies,
  supplyStats,
  todaysAppointments,
  visitStats,
  visits,
} from './mock';

const revenueChart = revenueSeries.map((p) => ({
  label: fmtDate(p.date),
  Consultations: p.consultations,
  Procedures: p.procedures,
  Laboratory: p.laboratory,
  Pharmacy: p.pharmacy,
}));

const revenueSpark = revenueSeries.map(
  (p) => p.consultations + p.procedures + p.laboratory + p.pharmacy,
);
const patientSpark = revenueSeries.map((p) => p.patients);

const highlightBeds = [
  ...beds.filter((b) => b.status === 'occupied').slice(0, 6),
  ...beds.filter((b) => b.status === 'available').slice(0, 4),
  ...beds.filter((b) => b.status === 'cleaning').slice(0, 2),
];

const kindIcon: Record<string, string> = {
  check_in: 'login',
  appointment: 'calendar',
  payment: 'card',
  lab: 'flask',
  admission: 'bed',
  alert: 'bell',
};

const occupancyRate = Math.round((bedOccupancy.occupied / bedOccupancy.total) * 100);
const openQueue = visits.filter((v) => v.status !== 'completed');
const lowSupply = supplies.filter((s) => s.status !== 'in_stock');

export function HealthcareOverview({ hrefFor }: { hrefFor: (s: string) => string }) {
  const today = todayISO();
  const nextUp = todaysAppointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <section className="sol-hero">
        <div className="sol-hero-body">
          <div className="sol-hero-date">
            <Clock size={13} aria-hidden /> {fmtDate(today, { weekday: true, year: true })} · Clinic live
          </div>
          <h1>Welcome back, Dr. Nnaji.</h1>
          <p className="sol-hero-sub">
            {appointmentStats.today} appointments booked, {visitStats.queue + visitStats.inConsultation}{' '}
            patients in the care queue and {bedOccupancy.available} beds available. Here is how{' '}
            {clinic.name} is running today.
          </p>
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Link href={hrefFor('appointments')} className="sol-btn sol-btn-primary">
              <Icon name="plus" size={15} /> Book appointment
            </Link>
            <Link href={hrefFor('visits')} className="sol-btn sol-btn-subtle">
              <Icon name="login" size={15} /> Check in a patient
            </Link>
          </div>
          <div className="sol-row sol-small sol-muted">
            <span className="sol-dot green" /> All systems normal · morning huddle completed 07:40
          </div>
        </div>
      </section>

      <div className="sol-kpis">
        <Kpi
          label="Patients today"
          value={appointmentStats.today}
          icon="calendar"
          delta="+3 vs yesterday"
          deltaDir="up"
          foot={`${appointmentStats.upcoming} upcoming`}
          accent
          spark={<Sparkline data={patientSpark} />}
        />
        <Kpi
          label="In the care queue"
          value={visitStats.queue + visitStats.inConsultation}
          icon="stethoscope"
          foot={`${visitStats.inConsultation} in consultation · avg wait ${visitStats.avgWait}m`}
        />
        <Kpi
          label="Bed occupancy"
          value={`${occupancyRate}%`}
          icon="bed"
          foot={`${bedOccupancy.occupied} of ${bedOccupancy.total} beds · ${bedOccupancy.available} free`}
        />
        <Kpi
          label="Revenue today"
          value={compactMoney(revenueSummary.today)}
          icon="wallet"
          delta="+7.4%"
          deltaDir="up"
          foot="vs last Friday"
          spark={<Sparkline data={revenueSpark} color="var(--sol-chart-2)" />}
        />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Clinic revenue"
          subtitle="Consultations, procedures, laboratory and pharmacy · last 14 days"
          action={
            <Link href={hrefFor('reports')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Revenue report <ArrowUpRight size={13} aria-hidden />
            </Link>
          }
        >
          <TrendChart
            data={revenueChart}
            series={[
              { key: 'Consultations', name: 'Consultations' },
              { key: 'Procedures', name: 'Procedures', color: 'var(--sol-chart-2)' },
              { key: 'Laboratory', name: 'Laboratory', color: 'var(--sol-chart-3)' },
              { key: 'Pharmacy', name: 'Pharmacy', color: 'var(--sol-chart-4)' },
            ]}
            height={264}
            money
            yFormat={(v) => compactMoney(v)}
          />
          <div className="sol-between sol-mt-3">
            <div className="sol-legend">
              <span className="sol-legend-item">
                <span className="sol-swatch" /> Consultations
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-2)' }} /> Procedures
              </span>
              <span className="sol-legend-item">
                <span className="sol-swatch" style={{ background: 'var(--sol-chart-3)' }} /> Laboratory
              </span>
            </div>
            <span className="sol-small sol-muted">
              MTD <strong className="sol-num">{compactMoney(revenueSummary.monthToDate)}</strong> · Target{' '}
              <strong className="sol-num">{compactMoney(revenueSummary.target)}</strong>
            </span>
          </div>
        </Card>

        <Card title="Ward occupancy" subtitle="Live bed picture across the clinic">
          <div className="sol-ring-card">
            <Ring value={occupancyRate} label={`${occupancyRate}%`} sub="Occupied" />
            <div className="sol-ring-stats">
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot blue" /> Occupied
                </span>
                <strong>{bedOccupancy.occupied}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot green" /> Available
                </span>
                <strong>{bedOccupancy.available}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot amber" /> Cleaning
                </span>
                <strong>{bedOccupancy.cleaning}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot violet" /> Reserved
                </span>
                <strong>{bedOccupancy.reserved}</strong>
              </div>
            </div>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-row sol-between sol-mt-3">
            <div>
              <div className="sol-kpi-label">Discharge rounds</div>
              <div className="sol-small sol-muted sol-mt-2">3 patients cleared for discharge</div>
            </div>
            <Link href={hrefFor('rooms')} className="sol-btn sol-btn-subtle sol-btn-sm">
              Ward board
            </Link>
          </div>
          <div className="sol-mt-2">
            <Progress value={occupancyRate} label="Ward occupancy" />
          </div>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card
          title="Next up"
          subtitle={`${nextUp.length} patients still to be seen today`}
          flush
          action={
            <Link href={hrefFor('appointments')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Full schedule <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {nextUp.slice(0, 6).map((a) => (
              <Link key={a.id} href={hrefFor('appointments')} className="sol-list-row">
                <span className="sol-room-num" style={{ fontSize: 12, minWidth: 44 }}>
                  {a.time}
                </span>
                <Avatar name={a.patient_name} />
                <div className="sol-list-main">
                  <div className="sol-list-title">{a.patient_name}</div>
                  <div className="sol-list-sub">
                    {a.reason} · {a.clinician}
                  </div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={a.status} />
                  <small>{a.mode === 'teleconsult' ? 'Teleconsult' : a.room || 'Front desk'}</small>
                </div>
              </Link>
            ))}
            {!nextUp.length ? (
              <div className="sol-list-row sol-muted sol-small">
                <Icon name="checkCircle" size={15} /> Every patient booked for today has been seen.
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          title="Care queue"
          subtitle={`${openQueue.length} active · ${visitStats.completed} completed`}
          flush
          action={
            <Link href={hrefFor('visits')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Open queue <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {openQueue.slice(0, 5).map((v) => (
              <Link key={v.id} href={hrefFor('visits')} className="sol-list-row">
                <Avatar name={v.patient_name} />
                <div className="sol-list-main">
                  <div className="sol-list-title">{v.patient_name}</div>
                  <div className="sol-list-sub">
                    {v.reason} · {v.room}
                  </div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={v.status} />
                  <small>{secondsLabel(v.checked_in_at)}</small>
                </div>
              </Link>
            ))}
            <div className="sol-list-row sol-muted sol-small">
              <Icon name="clock" size={15} />
              <div className="sol-list-main">
                Average wait today is {visitStats.avgWait} minutes · target under 20.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="sol-split">
        <Card
          title="Patient snapshot"
          subtitle="A quick read of the clinic’s registered patient base"
          action={
            <Link href={hrefFor('patients')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All {patients.length} patients <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-mini-rooms">
            {highlightBeds.map((b) => (
              <Link key={b.id} href={hrefFor('rooms')} className="sol-mini-room" data-status={b.status}>
                <strong>{b.label}</strong>
                <small>{b.status}</small>
              </Link>
            ))}
          </div>
          <div className="sol-legend sol-mt-3">
            <span className="sol-legend-item">
              <span className="sol-dot blue" /> Occupied
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot green" /> Available
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot amber" /> Cleaning
            </span>
            <span className="sol-legend-item">
              <span className="sol-dot violet" /> Reserved
            </span>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-grid sol-grid-3 sol-mt-3">
            <div>
              <div className="sol-kpi-label">Registered patients</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {patients.length}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Chronic care</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {patients.filter((p) => p.status === 'chronic').length}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Outstanding</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {compactMoney(revenueSummary.outstanding)}
              </div>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card
            title="Supply alerts"
            subtitle={`${supplyStats.low} low · ${supplyStats.out} out of stock`}
            action={
              <Link href={hrefFor('inventory')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Supplies
              </Link>
            }
          >
            <div className="sol-stack-2">
              {lowSupply.slice(0, 4).map((s) => (
                <div key={s.id} className="sol-between">
                  <div>
                    <div className="sol-list-title">{s.name}</div>
                    <div className="sol-small sol-muted">
                      {s.stock} in stock · reorder at {s.reorder_level}
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
            <div className="sol-divider sol-mt-3" />
            <div className="sol-row sol-between sol-mt-2">
              <span className="sol-small sol-muted">Inventory value</span>
              <Badge tone="accent" dot>
                {money(supplyStats.value)}
              </Badge>
            </div>
          </Card>

          <Card title="Recent activity" subtitle="Across the clinic" flush>
            <div className="sol-card-body" style={{ padding: '14px 18px' }}>
              <div className="sol-timeline">
                {activity.slice(0, 5).map((a) => (
                  <div key={a.id} className="sol-timeline-item">
                    <span className="sol-timeline-dot">
                      <Icon name={kindIcon[a.kind] || 'dot'} size={14} />
                    </span>
                    <div className="sol-timeline-body">
                      <strong>{a.title}</strong>
                      <small>{a.detail}</small>
                    </div>
                    <span className="sol-timeline-time">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

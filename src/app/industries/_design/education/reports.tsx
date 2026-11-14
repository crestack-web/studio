'use client';

import React from 'react';
import { Download, Play } from 'lucide-react';
import { Badge, Card, Kpi, PageHeader } from '../primitives';
import { Icon } from '../icons';
import { classStats, enrollmentStats, studentStats } from './mock';

const CADENCE_STYLE: Record<string, 'green' | 'amber' | 'blue'> = {
  Daily: 'green',
  Weekly: 'blue',
  Monthly: 'amber',
};

export function EducationReports() {
  const run = (id: string) => {
    // Demo action — real wiring will hit the reports API.
    void id;
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="chart" size={13} /> Reports
          </>
        }
        title="Reports"
        subtitle="Scheduled and on-demand insights across enrollment, attendance, fees and performance."
        actions={
          <button type="button" className="sol-btn sol-btn-subtle" onClick={() => run('all')}>
            <Download size={15} aria-hidden /> Export all
          </button>
        }
      />

      <div className="sol-kpis">
        <Kpi label="Reports" value={5} icon="chart" foot="Across 4 domains" accent />
        <Kpi label="Scheduled" value={4} icon="refresh" foot="Automated digests" />
        <Kpi label="Last run" value="Yesterday" icon="clock" foot="Attendance register" />
        <Kpi label="Delivered" value={5} icon="checkCircle" foot="All schedules healthy" />
      </div>

      <div className="sol-grid sol-grid-3 sol-mt-3">
        {[
          { id: 'enrollment', name: 'Enrollment summary', description: 'Applications, offers and conversion by class for the current term.', cadence: 'Weekly', lastRun: '2 days ago', icon: 'graduation', meta: `${enrollmentStats.open} open applications` },
          { id: 'fees', name: 'Fees collection', description: 'Billed, collected and outstanding balances by class and guardian.', cadence: 'Daily', lastRun: 'Today', icon: 'receipt', meta: `${enrollmentStats.seatsAvailable} seats open` },
          { id: 'attendance', name: 'Attendance register', description: 'Daily attendance rates with absence and lateness patterns.', cadence: 'Weekly', lastRun: 'Yesterday', icon: 'checklist', meta: `${studentStats.averageAttendance}% average` },
          { id: 'performance', name: 'Academic performance', description: 'Average scores and subject strengths across every class.', cadence: 'Monthly', lastRun: 'Last week', icon: 'chart', meta: `${studentStats.averageScore}% learner average` },
          { id: 'workload', name: 'Teacher workload', description: 'Class load, student counts and attendance by teacher.', cadence: 'Monthly', lastRun: 'Last week', icon: 'badge', meta: `${classStats.total} classes` },
        ].map((r) => (
          <Card key={r.id} title={r.name} subtitle={r.description}>
            <div className="sol-row sol-between">
              <Badge tone={CADENCE_STYLE[r.cadence] || 'blue'}>{r.cadence}</Badge>
              <span className="sol-small sol-muted">Last run {r.lastRun}</span>
            </div>
            <div className="sol-small sol-muted sol-mt-3">{r.meta}</div>
            <div className="sol-row sol-gap-2 sol-wrap sol-mt-3">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => run(r.id)}>
                <Play size={13} aria-hidden /> Run now
              </button>
              <button type="button" className="sol-btn sol-btn-ghost sol-btn-sm" onClick={() => run(r.id)}>
                <Download size={13} aria-hidden /> Schedule
              </button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock } from 'lucide-react';
import { Avatar, Badge, Card, Kpi, Progress, Ring, StatusBadge } from '../primitives';
import { MiniBars, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, todayISO } from '../format';
import {
  activity,
  attendanceDays,
  attendanceStats,
  classes,
  enrollmentStats,
  enrollments,
  feeSummary,
  revenueSeries,
  school,
  studentStats,
  students,
  teachers,
  timetable,
} from './mock';

const revenueChart = revenueSeries.map((p) => ({
  label: fmtDate(p.date),
  Billed: p.billed,
  Collected: p.collected,
}));

const attendanceSpark = attendanceDays.map((d) => d.rate);

const enrolmentStages = [
  { id: 'applied', label: 'Applied', tone: 'blue' as const },
  { id: 'assessment', label: 'Assessment', tone: 'violet' as const },
  { id: 'offered', label: 'Offered', tone: 'amber' as const },
  { id: 'enrolled', label: 'Enrolled', tone: 'green' as const },
];

const kindIcon: Record<string, string> = {
  enrollment: 'graduation',
  fees: 'receipt',
  attendance: 'checklist',
  class: 'book',
  teacher: 'badge',
  alert: 'alert',
};

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const jsDay = new Date(`${todayISO()}T12:00:00`).getDay();
const isSchoolDay = jsDay >= 1 && jsDay <= 5;
const lessonDay = isSchoolDay ? WEEKDAY_SHORT[jsDay] : 'Mon';
const lessonWhen = isSchoolDay ? 'today' : 'on Monday';
const lessonsLabel = isSchoolDay ? "Today's lessons" : "Monday's lessons";

const todayLessons = timetable.filter((slot) => slot.day === lessonDay).slice(0, 5);

const collecting = students
  .filter((s) => s.balance > 0)
  .sort((a, b) => b.balance - a.balance)
  .slice(0, 5);

export function EducationOverview({ hrefFor }: { hrefFor: (s: string) => string }) {
  const targetPct = Math.min(
    100,
    Math.round((feeSummary.collected / Math.max(1, feeSummary.collected + feeSummary.outstanding)) * 100),
  );

  return (
    <>
      <section className="sol-hero">
        <div className="sol-hero-body">
          <div className="sol-hero-date">
            <Clock size={13} aria-hidden /> {fmtDate(todayISO(), { weekday: true, year: true })} · {school.term}
          </div>
          <h1>Good morning, Mrs. Lawal.</h1>
          <p className="sol-hero-sub">
            {attendanceStats.present} students are in today, {feeSummary.overdueInvoices} fee accounts are
            overdue and {enrollmentStats.open} applications are moving through admissions. Here is how{' '}
            {school.name} is tracking this term.
          </p>
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Link href={hrefFor('students')} className="sol-btn sol-btn-primary">
              <Icon name="plus" size={15} /> Enroll a student
            </Link>
            <Link href={hrefFor('attendance')} className="sol-btn sol-btn-subtle">
              <Icon name="checklist" size={15} /> Take attendance
            </Link>
          </div>
          <div className="sol-row sol-small sol-muted">
            <span className="sol-dot green" /> {todayLessons.length} lessons scheduled {lessonWhen} · first at{' '}
            {todayLessons[0]?.start || '08:00'}
          </div>
        </div>
      </section>

      <div className="sol-kpis">
        <Kpi
          label="Students enrolled"
          value={studentStats.total}
          icon="graduation"
          delta={`${studentStats.newThisTerm} new this term`}
          deltaDir="up"
          foot={`${classes.length} classes · ${enrollmentStats.seatsAvailable} seats open`}
          accent
          spark={<MiniBars data={revenueSeries.map((p) => p.enrollment)} />}
        />
        <Kpi
          label="Attendance today"
          value={`${attendanceStats.today.rate}%`}
          icon="checklist"
          delta={`${attendanceStats.absent} absent`}
          deltaDir={attendanceStats.absent > 12 ? 'down' : 'flat'}
          foot={`${attendanceStats.present} present · ${attendanceStats.late} late`}
          spark={<MiniBars data={attendanceSpark} color="var(--sol-chart-2)" />}
        />
        <Kpi
          label="Fees collected"
          value={compactMoney(feeSummary.collected)}
          icon="receipt"
          delta={`${feeSummary.collectionRate}% of billed`}
          deltaDir="up"
          foot={`${compactMoney(feeSummary.outstanding)} outstanding`}
        />
        <Kpi
          label="Open applications"
          value={enrollmentStats.open}
          icon="sparkles"
          foot={`${enrollmentStats.offered} offers · ${enrollmentStats.conversion}% conversion`}
        />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Fees billed & collected"
          subtitle="Last 14 days across every class"
          action={
            <Link href={hrefFor('reports')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Fees report <ArrowUpRight size={13} aria-hidden />
            </Link>
          }
        >
          <TrendChart
            data={revenueChart}
            series={[
              { key: 'Billed', name: 'Billed' },
              { key: 'Collected', name: 'Collected', color: 'var(--sol-chart-2)' },
            ]}
            height={264}
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
              Term collected{' '}
              <strong className="sol-num">{compactMoney(feeSummary.collected)}</strong> · Outstanding{' '}
              <strong className="sol-num">{compactMoney(feeSummary.outstanding)}</strong>
            </span>
          </div>
        </Card>

        <Card title="Attendance this week" subtitle="Daily rate across the whole school">
          <div className="sol-ring-card">
            <Ring value={attendanceStats.average} label={`${attendanceStats.average}%`} sub="Average" />
            <div className="sol-ring-stats">
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot green" /> Present
                </span>
                <strong>{attendanceStats.present}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot red" /> Absent
                </span>
                <strong>{attendanceStats.absent}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot amber" /> Late
                </span>
                <strong>{attendanceStats.late}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot violet" /> Excused
                </span>
                <strong>{attendanceStats.excused}</strong>
              </div>
            </div>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-row sol-between sol-mt-3">
            <div>
              <div className="sol-kpi-label">Fee collection target</div>
              <div className="sol-small sol-muted sol-mt-2">
                {compactMoney(feeSummary.collected)} of{' '}
                {compactMoney(feeSummary.collected + feeSummary.outstanding)}
              </div>
            </div>
            <Badge tone="accent" dot>
              {targetPct}%
            </Badge>
          </div>
          <div className="sol-mt-2">
            <Progress value={targetPct} label="Fee collection target" />
          </div>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card
          title="Admissions pipeline"
          subtitle={`${enrollmentStats.open} applications in progress`}
          flush
          action={
            <Link href={hrefFor('enrollment')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All applications <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-card-body">
            <div className="sol-grid sol-grid-4">
              {enrolmentStages.map((stage) => {
                const count = enrollments.filter((e) => e.stage === stage.id).length;
                return (
                  <div key={stage.id}>
                    <div className="sol-between sol-small">
                      <span className="sol-muted">{stage.label}</span>
                      <Badge tone={stage.tone}>{count}</Badge>
                    </div>
                    <div className="sol-mt-2">
                      <Progress
                        value={(count / Math.max(1, enrollments.length)) * 100}
                        label={`${stage.label} applications`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="sol-list">
            {enrollments
              .filter((e) => e.stage === 'offered' || e.stage === 'assessment')
              .slice(0, 4)
              .map((e) => (
                <Link key={e.id} href={hrefFor('enrollment')} className="sol-list-row">
                  <Avatar name={e.applicant} size="sm" />
                  <div className="sol-list-main">
                    <div className="sol-list-title">{e.applicant}</div>
                    <div className="sol-list-sub">
                      {e.class_name} · guardian {e.guardian}
                    </div>
                  </div>
                  <div className="sol-list-side">
                    <StatusBadge status={e.stage} />
                    <small>{fmtDate(e.submitted_at)}</small>
                  </div>
                </Link>
              ))}
          </div>
        </Card>

        <Card
          title="Outstanding fees"
          subtitle={`${collecting.length} largest balances to follow up`}
          flush
          action={
            <Link href={hrefFor('fees')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Fee register <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {collecting.map((s) => (
              <Link key={s.id} href={hrefFor('fees')} className="sol-list-row">
                <Avatar name={s.full_name} size="sm" />
                <div className="sol-list-main">
                  <div className="sol-list-title">{s.full_name}</div>
                  <div className="sol-list-sub">
                    {s.class_name} · {s.guardian}
                  </div>
                </div>
                <div className="sol-list-side">
                  <strong className="sol-num">{compactMoney(s.balance)}</strong>
                  <small className="sol-muted">balance</small>
                </div>
              </Link>
            ))}
            {!collecting.length ? (
              <div className="sol-list-row sol-small sol-muted">
                <Icon name="checkCircle" size={15} /> No outstanding balances this term.
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="sol-split">
        <Card
          title="Classes"
          subtitle={`${classes.length} classes · ${studentStats.averageAttendance}% average attendance`}
          action={
            <Link href={hrefFor('classes')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All classes <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-mini-rooms">
            {classes.slice(0, 10).map((c) => (
              <Link key={c.id} href={hrefFor('classes')} className="sol-mini-room" data-status="available">
                <strong>{c.name}</strong>
                <small>
                  {c.students}/{c.capacity} · {c.attendance_rate}%
                </small>
              </Link>
            ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-grid sol-grid-3 sol-mt-3">
            <div>
              <div className="sol-kpi-label">Students</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {studentStats.total}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Teachers</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {teachers.filter((t) => t.status === 'active').length}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Average score</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {studentStats.averageScore}%
              </div>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card
            title={lessonsLabel}
            subtitle={`${todayLessons.length} on the timetable`}
            action={
              <Link href={hrefFor('timetable')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Timetable
              </Link>
            }
          >
            <div className="sol-stack-2">
              {todayLessons.map((slot) => (
                <div key={slot.id} className="sol-between">
                  <div>
                    <div className="sol-list-title">
                      {slot.subject} · {slot.class_name}
                    </div>
                    <div className="sol-small sol-muted">
                      {slot.teacher} · {slot.room}
                    </div>
                  </div>
                  <span className="sol-small sol-muted sol-num">{slot.start}</span>
                </div>
              ))}
              {!todayLessons.length ? (
                <div className="sol-small sol-muted">No lessons scheduled today.</div>
              ) : null}
            </div>
          </Card>

          <Card title="Recent activity" subtitle="Across the school" flush>
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

      <div className="sol-grid sol-grid-3 sol-mt-3">
        {teachers
          .filter((t) => t.status === 'active')
          .slice(0, 3)
          .map((t) => (
            <Card key={t.id} tight>
              <div className="sol-row sol-between">
                <div className="sol-row sol-gap-2">
                  <Avatar name={t.full_name} />
                  <div>
                    <div className="sol-list-title">{t.full_name}</div>
                    <div className="sol-list-sub">{t.subject}</div>
                  </div>
                </div>
                <Badge tone={t.attendance_rate >= 95 ? 'green' : 'amber'}>{t.attendance_rate}%</Badge>
              </div>
              <div className="sol-mt-3">
                <Progress
                  value={t.attendance_rate}
                  tone={t.attendance_rate >= 95 ? 'green' : 'amber'}
                  label={`${t.full_name} attendance`}
                />
              </div>
              <div className="sol-small sol-muted sol-mt-2">
                {t.classes} classes · {t.students} students
              </div>
            </Card>
          ))}
      </div>
    </>
  );
}

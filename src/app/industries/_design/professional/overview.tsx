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
import { compactMoney, fmtDate, money, todayISO } from '../format';
import {
  activity,
  clients,
  deliveryStats,
  events,
  projects,
  revenueSeries,
  revenueSummary,
  tasks,
  team,
  timeStats,
} from './mock';

const kindIcon: Record<string, string> = {
  project: 'layers',
  task: 'checklist',
  invoice: 'receipt',
  payment: 'card',
  time: 'clock',
  client: 'users',
};

export function ProfessionalOverview({ hrefFor }: { hrefFor: (s: string) => string }) {
  const targetPct = Math.round((revenueSummary.monthToDate / Math.max(1, revenueSummary.target)) * 100);

  const revenueChart = revenueSeries.map((p) => ({
    label: fmtDate(p.date),
    Billed: p.billed,
    Collected: p.collected,
  }));

  const billedSpark = revenueSeries.map((p) => p.billed);
  const hourSpark = revenueSeries.map((p) => p.hours);

  const openProjects = projects
    .filter((p) => p.status === 'active' || p.status === 'review')
    .sort((a, b) => a.due.localeCompare(b.due));

  const dueSoon = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 6);

  const todayEvents = events.filter((e) => e.date === todayISO());

  const activePeople = team.filter((m) => m.status === 'active');

  return (
    <>
      <section className="sol-hero">
        <div className="sol-hero-body">
          <div className="sol-hero-date">
            <Clock size={13} aria-hidden /> {fmtDate(todayISO(), { weekday: true, year: true })} · Studio live
          </div>
          <h1>Good morning, Tobi.</h1>
          <p className="sol-hero-sub">
            {deliveryStats.activeProjects} active projects, {deliveryStats.openTasks} open tasks and{' '}
            {money(revenueSummary.outstanding)} awaiting collection. Here is how Northwind Studio is
            tracking this week.
          </p>
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Link href={hrefFor('projects')} className="sol-btn sol-btn-primary">
              <Icon name="plus" size={15} /> New project
            </Link>
            <Link href={hrefFor('time')} className="sol-btn sol-btn-subtle">
              <Icon name="clock" size={15} /> Log time
            </Link>
          </div>
          <div className="sol-row sol-small sol-muted">
            <span className="sol-dot green" /> {todayEvents.length} meetings today · next at{' '}
            {todayEvents[0]?.start || '09:00'}
          </div>
        </div>
      </section>

      <div className="sol-kpis">
        <Kpi
          label="Active projects"
          value={deliveryStats.activeProjects}
          icon="layers"
          delta={`${deliveryStats.atRisk} at risk`}
          deltaDir={deliveryStats.atRisk ? 'down' : 'flat'}
          foot={`${deliveryStats.onHold} on hold`}
          accent
          spark={<Sparkline data={billedSpark} />}
        />
        <Kpi
          label="Open tasks"
          value={deliveryStats.openTasks}
          icon="checklist"
          foot={`${deliveryStats.dueThisWeek} due this week`}
        />
        <Kpi
          label="Unbilled time"
          value={compactMoney(timeStats.unbilledValue)}
          icon="clock"
          foot={`${timeStats.billableHours.toFixed(1)}h billable logged`}
          spark={<Sparkline data={hourSpark} color="var(--sol-chart-2)" />}
        />
        <Kpi
          label="Outstanding"
          value={compactMoney(revenueSummary.outstanding)}
          icon="wallet"
          delta={`${money(revenueSummary.overdue)} overdue`}
          deltaDir="down"
          foot="Across open invoices"
        />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card
          title="Revenue & collections"
          subtitle="Billed against collected · last 14 days"
          action={
            <Link href={hrefFor('reports')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Revenue report <ArrowUpRight size={13} aria-hidden />
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
              MTD <strong className="sol-num">{compactMoney(revenueSummary.monthToDate)}</strong> ·
              Target <strong className="sol-num">{compactMoney(revenueSummary.target)}</strong>
            </span>
          </div>
        </Card>

        <Card title="Studio utilisation" subtitle="Billable load across the team this week">
          <div className="sol-ring-card">
            <Ring value={timeStats.avgUtilisation} label={`${timeStats.avgUtilisation}%`} sub="Utilised" />
            <div className="sol-ring-stats">
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot green" /> Billable
                </span>
                <strong>{timeStats.billableHours.toFixed(1)}h</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot blue" /> Internal
                </span>
                <strong>{timeStats.nonBillableHours.toFixed(1)}h</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot amber" /> On leave
                </span>
                <strong>{team.filter((m) => m.status === 'on_leave').length}</strong>
              </div>
              <div className="sol-ring-stat">
                <span>
                  <span className="sol-dot violet" /> Team
                </span>
                <strong>{team.length}</strong>
              </div>
            </div>
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-row sol-between sol-mt-3">
            <div>
              <div className="sol-kpi-label">Monthly revenue target</div>
              <div className="sol-small sol-muted sol-mt-2">
                {compactMoney(revenueSummary.monthToDate)} of {compactMoney(revenueSummary.target)}
              </div>
            </div>
            <Badge tone="accent" dot>
              {targetPct}%
            </Badge>
          </div>
          <div className="sol-mt-2">
            <Progress value={targetPct} label="Monthly revenue target" />
          </div>
        </Card>
      </div>

      <div className="sol-grid sol-grid-2">
        <Card
          title="Project health"
          subtitle={`${openProjects.length} live engagements, nearest deadline first`}
          flush
          action={
            <Link href={hrefFor('projects')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All projects <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {openProjects.slice(0, 5).map((p) => (
              <Link key={p.id} href={hrefFor('projects')} className="sol-list-row">
                <span className="sol-room-num" style={{ fontSize: 12, minWidth: 52 }}>
                  {p.code}
                </span>
                <div className="sol-list-main">
                  <div className="sol-list-title">{p.name}</div>
                  <div className="sol-list-sub">
                    {p.client_name} · lead {p.lead}
                  </div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={p.status} />
                  <small>
                    {p.progress}% · due {fmtDate(p.due)}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card
          title="Due soon"
          subtitle={`${deliveryStats.dueThisWeek} tasks land in the next seven days`}
          flush
          action={
            <Link href={hrefFor('tasks')} className="sol-btn sol-btn-ghost sol-btn-sm">
              Task board <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-list">
            {dueSoon.map((t) => (
              <Link key={t.id} href={hrefFor('tasks')} className="sol-list-row">
                <Avatar name={t.assignee} size="sm" />
                <div className="sol-list-main">
                  <div className="sol-list-title">{t.title}</div>
                  <div className="sol-list-sub">
                    {t.project_name} · {t.assignee}
                  </div>
                </div>
                <div className="sol-list-side">
                  <StatusBadge status={t.priority} />
                  <small>{fmtDate(t.due)}</small>
                </div>
              </Link>
            ))}
            {!dueSoon.length ? (
              <div className="sol-list-row sol-muted sol-small">
                <Icon name="checkCircle" size={15} /> Nothing is due in the next seven days.
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="sol-split">
        <Card
          title="Clients"
          subtitle={`${deliveryStats.activeClients} active clients · ${money(
            clients.filter((c) => c.status === 'active').reduce((s, c) => s + c.retainer, 0),
          )} in monthly retainers`}
          action={
            <Link href={hrefFor('clients')} className="sol-btn sol-btn-ghost sol-btn-sm">
              All clients <ArrowRight size={13} aria-hidden />
            </Link>
          }
        >
          <div className="sol-mini-rooms">
            {clients
              .filter((c) => c.status === 'active')
              .slice(0, 8)
              .map((c) => (
                <Link
                  key={c.id}
                  href={hrefFor('clients')}
                  className="sol-mini-room"
                  data-status={c.status}
                >
                  <strong>{c.company}</strong>
                  <small>{compactMoney(c.retainer)}/mo</small>
                </Link>
              ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-grid sol-grid-3 sol-mt-3">
            <div>
              <div className="sol-kpi-label">Active clients</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {deliveryStats.activeClients}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Retainers</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {compactMoney(
                  clients.filter((c) => c.status === 'active').reduce((s, c) => s + c.retainer, 0),
                )}
              </div>
            </div>
            <div>
              <div className="sol-kpi-label">Billed to date</div>
              <div className="sol-kpi-value" style={{ fontSize: 21 }}>
                {compactMoney(clients.reduce((s, c) => s + c.billed, 0))}
              </div>
            </div>
          </div>
        </Card>

        <div className="sol-aside-stack">
          <Card
            title="Today"
            subtitle={`${todayEvents.length} events · studio hours 09:00 – 18:00`}
            action={
              <Link href={hrefFor('calendar')} className="sol-btn sol-btn-ghost sol-btn-sm">
                Calendar
              </Link>
            }
          >
            <div className="sol-stack-2">
              {todayEvents.map((e) => (
                <div key={e.id} className="sol-between">
                  <div>
                    <div className="sol-list-title">{e.title}</div>
                    <div className="sol-small sol-muted">
                      {e.start} – {e.end} · {e.location}
                    </div>
                  </div>
                  <Badge tone={e.type === 'deadline' ? 'amber' : e.type === 'review' ? 'violet' : 'blue'}>
                    {e.type}
                  </Badge>
                </div>
              ))}
              {!todayEvents.length ? (
                <div className="sol-small sol-muted">No meetings today — a clear focus day.</div>
              ) : null}
            </div>
          </Card>

          <Card title="Recent activity" subtitle="Across the studio" flush>
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
        {activePeople.slice(0, 3).map((m) => (
          <Card key={m.id} tight>
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={m.full_name} />
                <div>
                  <div className="sol-list-title">{m.full_name}</div>
                  <div className="sol-list-sub">{m.role}</div>
                </div>
              </div>
              <Badge tone={m.utilisation >= 85 ? 'amber' : 'green'}>{m.utilisation}%</Badge>
            </div>
            <div className="sol-mt-3">
              <Progress
                value={m.utilisation}
                tone={m.utilisation >= 90 ? 'amber' : m.utilisation >= 70 ? 'green' : 'amber'}
                label={`${m.full_name} utilisation`}
              />
            </div>
            <div className="sol-small sol-muted sol-mt-2">
              {m.billable_hours}h billable of {m.capacity}h · {m.projects} projects
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

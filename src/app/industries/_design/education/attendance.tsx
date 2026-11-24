'use client';

import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Kpi,
  PageHeader,
  Progress,
  SearchInput,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { attendanceDays, attendanceRecords } from './mock';
import { TakeAttendanceSheet } from './CreateSheets';
import { downloadCsv } from '../action-helpers';

export function EducationAttendance() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [takeOpen, setTakeOpen] = useState(false);

  const records = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendanceRecords.filter(
      (r) =>
        !q ||
        r.student_name.toLowerCase().includes(q) ||
        r.class_name.toLowerCase().includes(q) ||
        r.status.includes(q),
    );
  }, [query]);

  const today = attendanceDays[attendanceDays.length - 1];
  const average = Math.round(attendanceDays.reduce((s, d) => s + d.rate, 0) / Math.max(1, attendanceDays.length));

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="checklist" size={13} /> Attendance
          </>
        }
        title="Attendance"
        subtitle="Daily registers, absence patterns and lateness across every class."
        actions={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => { downloadCsv('attendance.csv', records); toast('Attendance register exported as CSV.'); }}>
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => setTakeOpen(true)}>
              <Icon name="plus" size={15} aria-hidden /> Take attendance
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Today’s attendance"
          value={`${today.rate}%`}
          icon="checklist"
          delta={today.absent > 12 ? 'Watch absences' : 'Healthy'}
          deltaDir={today.absent > 12 ? 'down' : 'up'}
          foot={`${today.present} present · ${today.late} late`}
          accent
        />
        <Kpi label="Average" value={`${average}%`} icon="trend" foot="Rolling 10 days" />
        <Kpi label="Absent" value={today.absent} icon="alert" foot="With guardians alerted" />
        <Kpi label="Late arrivals" value={today.late} icon="clock" foot="Traffic delays noted" />
      </div>

      <div className="sol-grid sol-grid-main">
        <Card title="Daily registers" subtitle="Last 10 school days">
          <div className="sol-stack-2">
            {attendanceDays.map((d) => (
              <div key={d.date} className="sol-list-row" style={{ border: 'none', padding: 0 }}>
                <div className="sol-list-main">
                  <div className="sol-list-title">{d.date ? d.date.slice(0, 10) : ''}</div>
                  <div className="sol-list-sub">
                    {d.present} present · {d.absent} absent · {d.late} late
                  </div>
                </div>
                <div className="sol-list-side">
                  <div className="sol-meter-row" style={{ minWidth: 140 }}>
                    <span className="sol-meter-main">
                      <span
                        className={`sol-progress ${d.rate >= 90 ? 'green' : d.rate >= 75 ? 'amber' : 'red'}`}
                        style={{ width: `${d.rate}%` }}
                      />
                    </span>
                    <small className="sol-num">{d.rate}%</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="This week" subtitle="Average attendance by day">
          <div className="sol-stack-2">
            {attendanceDays.slice(-5).map((d) => (
              <div key={d.date} className="sol-row sol-between">
                <span className="sol-small">{d.date ? d.date.slice(0, 10) : ''}</span>
                <div className="sol-meter-row" style={{ width: '60%', minWidth: 140 }}>
                  <span className="sol-meter-main">
                    <span
                      className={`sol-progress ${d.rate >= 90 ? 'green' : d.rate >= 75 ? 'amber' : 'red'}`}
                      style={{ width: `${d.rate}%` }}
                    />
                  </span>
                  <small className="sol-num">{d.rate}%</small>
                </div>
              </div>
            ))}
          </div>
          <div className="sol-divider sol-mt-3" />
          <div className="sol-mt-2">
            <Progress value={average} label="Roll average attendance" />
          </div>
        </Card>
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput value={query} onChange={setQuery} placeholder="Search learner or class…" ariaLabel="Search attendance" />
            <div className="sol-toolbar-spacer" />
            <Badge tone={today.rate >= 90 ? 'green' : 'amber'} dot>
              Target {90}%
            </Badge>
          </div>
        </div>
        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Learner</Th>
                <Th>Class</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={r.student_name} size="sm" />
                      <span className="sol-list-title">{r.student_name}</span>
                    </div>
                  </Td>
                  <Td className="muted">{r.class_name}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td className="muted">{r.date}</Td>
                  <Td className="muted">{r.note || '—'}</Td>
                </tr>
              ))}
              {!records.length ? (
                <tr>
                  <Td colSpan={5}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="checklist" size={20} />
                      </span>
                      <h4>No attendance records</h4>
                      <p>Take attendance for today’s register.</p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <TakeAttendanceSheet open={takeOpen} onClose={() => setTakeOpen(false)} />
    </>
  );
}

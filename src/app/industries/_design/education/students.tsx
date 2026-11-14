'use client';

import React, { useMemo, useState } from 'react';
import { Download, Mail, Phone } from 'lucide-react';
import {
  Avatar,
  Badge,
  Card,
  Kpi,
  PageHeader,
  SearchInput,
  Sheet,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  useToast,
} from '../primitives';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { students } from './mock';

export function EducationStudents() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<(typeof students)[number] | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => (status === 'all' ? true : s.status === status))
      .filter((s) =>
        q
          ? s.full_name.toLowerCase().includes(q) ||
            s.class_name.toLowerCase().includes(q) ||
            s.admission_no.toLowerCase().includes(q) ||
            s.guardian.toLowerCase().includes(q)
          : true,
      );
  }, [query, status]);

  const active = students.filter((s) => s.status === 'active').length;
  const onHold = students.filter((s) => s.status === 'on_hold').length;
  const outstanding = students.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  const totals = students.reduce(
    (acc, s) => ({
      billed: acc.billed + s.fees_billed,
      paid: acc.paid + s.fees_paid,
    }),
    { billed: 0, paid: 0 },
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <>
            <Icon name="graduation" size={13} /> Students
          </>
        }
        title="Students"
        subtitle="Admissions, enrolment status, guardians and fee balances per learner."
        meta={
          <>
            <Badge tone={active ? 'green' : 'red'} dot>
              {active} active
            </Badge>
            {onHold ? (
              <Badge tone="amber" dot>
                {onHold} on hold
              </Badge>
            ) : null}
            <span className="sol-small sol-muted">
              {compactMoney(outstanding)} outstanding across the roll
            </span>
          </>
        }
        actions={
          <>
            <button
              type="button"
              className="sol-btn sol-btn-subtle"
              onClick={() => toast('Student register exported as CSV.')}
            >
              <Download size={15} aria-hidden /> Export
            </button>
            <button type="button" className="sol-btn sol-btn-primary" onClick={() => toast('Admission form opened.')}>
              <Icon name="plus" size={15} aria-hidden /> Enroll student
            </button>
          </>
        }
      />

      <div className="sol-kpis">
        <Kpi
          label="Total students"
          value={students.length}
          icon="graduation"
          foot="Across all classes"
          accent
          delta={`${new Set(students.map((s) => s.class_name)).size} classes`}
          deltaDir="flat"
        />
        <Kpi label="Fee balance" value={compactMoney(totals.billed - totals.paid)} icon="receipt" foot="Outstanding" />
        <Kpi label="Avg attendance" value={`${Math.round(students.reduce((s, x) => s + x.attendance_rate, 0) / Math.max(1, students.length))}%`} icon="checklist" foot="Roll average" />
        <Kpi label="Avg score" value={`${Math.round(students.reduce((s, x) => s + x.average_score, 0) / Math.max(1, students.length))}%`} icon="chart" foot="Learner average" />
      </div>

      <Card flush className="sol-mt-3">
        <div className="sol-card-body" style={{ paddingBottom: 0 }}>
          <div className="sol-toolbar">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search name, class, admission no or guardian…"
              ariaLabel="Search students"
            />
            <div className="sol-toolbar-spacer" />
            <div className="sol-chips" style={{ flexWrap: 'wrap' }}>
              {['all', 'active', 'on_hold', 'graduated'].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="sol-chip"
                  aria-pressed={status === s}
                  onClick={() => setStatus(s)}
                >
                  {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TableWrap>
          <table className="sol-table">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Class</Th>
                <Th>Guardian</Th>
                <Th>Attendance</Th>
                <Th align="right">Avg score</Th>
                <Th align="right">Fee balance</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} data-clickable="true" onClick={() => setSelected(s)}>
                  <Td>
                    <div className="sol-row sol-gap-2">
                      <Avatar name={s.full_name} size="sm" />
                      <div>
                        <div className="sol-list-title">{s.full_name}</div>
                        <div className="sol-list-sub">{s.admission_no}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="muted">{s.class_name}</Td>
                  <Td>
                    <div className="sol-list-title" style={{ fontSize: 12 }}>{s.guardian}</div>
                    <div className="sol-list-sub">{s.guardian_phone}</div>
                  </Td>
                  <Td>
                    <div className="sol-meter-row" style={{ minWidth: 110 }}>
                      <span className="sol-meter-main">
                        <span
                          className={`sol-progress ${s.attendance_rate >= 90 ? 'green' : s.attendance_rate >= 75 ? 'amber' : 'red'}`}
                          style={{ width: `${s.attendance_rate}%` }}
                        />
                      </span>
                      <small className="sol-num">{s.attendance_rate}%</small>
                    </div>
                  </Td>
                  <Td align="right" className="num">{s.average_score}%</Td>
                  <Td align="right" className="num strong">{s.balance ? compactMoney(s.balance) : '—'}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                </tr>
              ))}
              {!list.length ? (
                <tr>
                  <Td colSpan={7}>
                    <div className="sol-empty">
                      <span className="sol-empty-icon">
                        <Icon name="users" size={20} />
                      </span>
                      <h4>No students found</h4>
                      <p>Try a different search or status.</p>
                    </div>
                  </Td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.full_name : 'Student'}
        subtitle={selected ? `${selected.admission_no} · ${selected.class_name}` : undefined}
        width={480}
        footer={
          <>
            <button type="button" className="sol-btn sol-btn-subtle" onClick={() => setSelected(null)}>
              Close
            </button>
            <button
              type="button"
              className="sol-btn sol-btn-primary"
              onClick={() => {
                setSelected(null);
                toast('Guardian contacted via SMS.');
              }}
            >
              <Icon name="phone" size={15} aria-hidden /> Contact guardian
            </button>
          </>
        }
      >
        {selected ? (
          <div className="sol-stack-3">
            <div className="sol-row sol-between">
              <div className="sol-row sol-gap-2">
                <Avatar name={selected.full_name} size="lg" />
                <div>
                  <div className="sol-person-name">{selected.full_name}</div>
                  <div className="sol-person-sub">
                    {selected.gender} · age {selected.age}
                  </div>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="sol-kv">
              <div className="sol-kv-row">
                <span>Guardian</span>
                <strong>
                  {selected.guardian} · {selected.guardian_phone}
                </strong>
              </div>
              {selected.email ? (
                <div className="sol-kv-row">
                  <span>Guardian email</span>
                  <strong>{selected.email}</strong>
                </div>
              ) : null}
              <div className="sol-kv-row">
                <span>Enrolled</span>
                <strong>{fmtDate(selected.enrolled_at)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Attendance</span>
                <strong>{selected.attendance_rate}%</strong>
              </div>
              <div className="sol-kv-row">
                <span>Average score</span>
                <strong>{selected.average_score}%</strong>
              </div>
              <div className="sol-kv-row">
                <span>Fees billed</span>
                <strong>{money(selected.fees_billed)}</strong>
              </div>
              <div className="sol-kv-row">
                <span>Fees paid</span>
                <strong>{money(selected.fees_paid)}</strong>
              </div>
              <div className="sol-kv-row total">
                <span>Balance due</span>
                <strong>{selected.balance ? money(selected.balance) : 'Paid in full'}</strong>
              </div>
            </div>

            {selected.notes ? (
              <div>
                <div className="sol-label">Notes</div>
                <p className="sol-small sol-muted sol-mt-2" style={{ lineHeight: 1.6 }}>{selected.notes}</p>
              </div>
            ) : null}

            <div className="sol-row sol-gap-2 sol-wrap">
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Fee schedule editor opened.')}>
                <Icon name="receipt" size={14} aria-hidden /> Fee schedule
              </button>
              <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => toast('Message to guardian opened.')}>
                <Mail size={14} aria-hidden /> Message guardian
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardIcon } from './Card';
import { getAuthCurrentUser } from '@/lib/supabase-auth';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';

interface StaffMember {
  id: string;
  staffId: string;
  name: string;
  role: string;
  avatarBg: string;
  avatarColor: string;
  initials: string;
}

interface AttendanceTabProps {
  staffMembers: StaffMember[];
  showToast: (message: string) => void;
}

interface AttendanceRecord {
  id: string;
  staffId?: string;
  userId?: string;
  staffName?: string;
  date?: string;
  clockIn?: any;
  clockOut?: any;
  note?: any;
  status?: string;
  [key: string]: any;
}

function parseNote(note: any): { staffName?: string; staffId?: string; status?: string } {
  if (!note) return {};
  if (typeof note === 'object') {
    return {
      staffName: note.staffName,
      staffId: note.staffId,
      status: note.status,
    };
  }
  if (typeof note === 'string') {
    const t = note.trim();
    if (t.startsWith('{')) {
      try {
        const p = JSON.parse(t);
        return {
          staffName: p.staffName,
          staffId: p.staffId,
          status: p.status,
        };
      } catch {
        return {};
      }
    }
  }
  return {};
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ staffMembers }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const staffById = useMemo(() => {
    const map = new Map<string, StaffMember>();
    for (const s of staffMembers) {
      if (s.id) map.set(String(s.id), s);
      if (s.staffId) map.set(String(s.staffId), s);
      if (s.name) map.set(s.name.toLowerCase(), s);
    }
    return map;
  }, [staffMembers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentUserId = getAuthCurrentUser()?.uid || '';
        if (!currentUserId) return;

        const supabase = getSupabase();
        const { data: ownerDoc } = await supabase
          .from('users')
          .select('business_id, businessId')
          .eq('id', currentUserId)
          .maybeSingle();

        const businessId =
          ownerDoc?.business_id || ownerDoc?.businessId || '';
        if (!businessId) {
          if (!cancelled) setAttendanceRecords([]);
          return;
        }

        const records = await fetchDocs(`businesses/${businessId}/attendance`);
        if (cancelled) return;
        // Newest first
        const sorted = [...(records as AttendanceRecord[])].sort((a, b) => {
          const ta = toDate(a.clockIn || a.createdAt || a.created_at)?.getTime() || 0;
          const tb = toDate(b.clockIn || b.createdAt || b.created_at)?.getTime() || 0;
          return tb - ta;
        });
        setAttendanceRecords(sorted);
      } catch (error) {
        console.error('Error loading attendance:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveName = (record: AttendanceRecord) => {
    const note = parseNote(record.note);
    const sid = String(
      record.staffId ||
        record.staff_id ||
        record.userId ||
        record.user_id ||
        note.staffId ||
        ''
    );
    let fromStaff: StaffMember | undefined;
    if (sid) fromStaff = staffById.get(sid);
    if (!fromStaff && record.staffName) {
      fromStaff = staffById.get(String(record.staffName).toLowerCase());
    }
    if (!fromStaff && note.staffName) {
      fromStaff = staffById.get(String(note.staffName).toLowerCase());
    }

    const name = String(
      record.staffName || note.staffName || fromStaff?.name || ''
    ).trim();
    return {
      name: name || 'Staff member',
      role: fromStaff?.role || '',
      initials: fromStaff?.initials || (name ? name.slice(0, 2).toUpperCase() : 'ST'),
      avatarBg: fromStaff?.avatarBg || 'var(--purple-lt, #ede9fe)',
      avatarColor: fromStaff?.avatarColor || 'var(--purple, #7c3aed)',
      isUnknown: !name,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </CardIcon>
          Staff Attendance
        </CardHeader>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
          Loading attendance data...
        </div>
      </Card>
    );
  }

  if (attendanceRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </CardIcon>
          Staff Attendance
        </CardHeader>
        <div style={{ padding: '20px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              background: 'var(--bg)',
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No attendance records yet</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
              When staff clock in from the staff portal, their shifts appear here. Clocked-in staff
              also show as Online on the team list.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const groupedByDate = attendanceRecords.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
    const clockIn = toDate(record.clockIn || record.check_in || record.createdAt);
    const date =
      record.date ||
      (clockIn ? clockIn.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate).sort((a, b) => (a < b ? 1 : -1));

  return (
    <Card>
      <CardHeader>
        <CardIcon bg="var(--blue-bg)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </CardIcon>
        Staff Attendance
      </CardHeader>
      <div
        style={{
          padding: '0 12px 16px',
          maxHeight: 'min(70vh, 560px)',
          overflowY: 'auto',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {dates.map((date) => (
          <div key={date} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-2)',
                margin: '8px 4px',
              }}
            >
              {new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    {['Staff', 'Clock In', 'Clock Out', 'Duration', 'Status'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px',
                          textAlign: h === 'Staff' ? 'left' : 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedByDate[date].map((record) => {
                    const person = resolveName(record);
                    const clockInTime = toDate(record.clockIn || record.check_in);
                    const clockOutTime = toDate(record.clockOut || record.check_out);
                    let hours = 0;
                    let minutes = 0;
                    if (clockInTime && clockOutTime) {
                      const diff = clockOutTime.getTime() - clockInTime.getTime();
                      hours = Math.floor(diff / 3600000);
                      minutes = Math.floor((diff % 3600000) / 60000);
                    }
                    const isClockedIn = !!(clockInTime && !clockOutTime);

                    return (
                      <tr key={record.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: person.avatarBg,
                                color: person.avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {person.initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 500,
                                  fontSize: '0.85rem',
                                  color: person.isUnknown ? 'var(--text-3)' : 'var(--text-1)',
                                }}
                              >
                                {person.name}
                              </div>
                              {person.role ? (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                                  {person.role}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                          {clockInTime
                            ? clockInTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                          {clockOutTime
                            ? clockOutTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                          {clockOutTime
                            ? `${hours}h ${minutes}m`
                            : isClockedIn
                              ? 'Active'
                              : '—'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 10,
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              background: isClockedIn
                                ? 'var(--green-bg)'
                                : clockOutTime
                                  ? 'var(--blue-bg)'
                                  : 'var(--amber-bg)',
                              color: isClockedIn
                                ? 'var(--green)'
                                : clockOutTime
                                  ? 'var(--blue)'
                                  : 'var(--amber)',
                            }}
                          >
                            {isClockedIn ? 'Online' : clockOutTime ? 'Complete' : 'Incomplete'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AttendanceTab;

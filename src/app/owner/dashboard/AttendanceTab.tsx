'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, getFirestore, collection, getDocs, query } from 'firebase/firestore';

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
  staffId: string;
  staffName?: string;
  date?: string;
  clockIn?: any;
  clockOut?: any;
  [key: string]: any;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({ staffMembers, showToast }) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const { auth, firestore } = initializeFirebase();
      const currentUserId = auth.currentUser?.uid || '';
      if (!currentUserId) return;
      
      const ownerDoc = await getDoc(doc(firestore, 'users', currentUserId));
      const businessId = ownerDoc.data()?.businessId || 'default';
      
      const attendanceQuery = query(
        collection(firestore, 'businesses', businessId, 'attendance')
      );
      const snapshot = await getDocs(attendanceQuery);
      const records: AttendanceRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </CardIcon>
          Staff Attendance
        </CardHeader>
        <div style={{ padding: '20px' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: 'var(--bg)',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
              No attendance records yet
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-3)', maxWidth: '400px', margin: '0 auto' }}>
              Staff attendance will appear here once they start clocking in from the staff portal.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Group by date
  const groupedByDate = attendanceRecords.reduce((acc, record) => {
    const date = record.date || new Date().toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <Card>
      <CardHeader>
        <CardIcon bg="var(--blue-bg)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </CardIcon>
        Staff Attendance
      </CardHeader>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="primary" size="sm" onClick={() => showToast('Attendance report generation coming soon')}>
            Generate Report
          </Button>
          <Button variant="subtle" size="sm" onClick={() => showToast('Export feature coming soon')}>
            Export CSV
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(groupedByDate)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 7)
            .map(([date, records]) => (
              <div key={date} style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  padding: '10px 14px', 
                  background: 'var(--bg)', 
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Staff</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Clock In</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Clock Out</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Hours</th>
                      <th style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const staffMember = staffMembers.find(s => s.id === record.staffId);
                      const clockInTime = record.clockIn?.toDate ? record.clockIn.toDate() : new Date(record.clockIn);
                      const clockOutTime = record.clockOut?.toDate ? record.clockOut.toDate() : record.clockOut ? new Date(record.clockOut) : null;
                      
                      let hours = 0;
                      let minutes = 0;
                      if (clockOutTime) {
                        const diff = clockOutTime.getTime() - clockInTime.getTime();
                        hours = Math.floor(diff / (1000 * 60 * 60));
                        minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      }
                      
                      const isClockedIn = !clockOutTime && new Date() > clockInTime;
                      
                      return (
                        <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ 
                                width: '28px', 
                                height: '28px', 
                                borderRadius: '50%', 
                                background: staffMember?.avatarBg || '#D1FAE5', 
                                color: staffMember?.avatarColor || '#14A05A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}>
                                {staffMember?.initials || '??'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                  {record.staffName || staffMember?.name || 'Unknown'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                                  {staffMember?.role || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                            {clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                            {clockOutTime ? clockOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem' }}>
                            {clockOutTime ? `${hours}h ${minutes}m` : isClockedIn ? 'Active' : '-'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '3px 8px', 
                              borderRadius: '10px', 
                              fontSize: '0.7rem', 
                              fontWeight: 500,
                              background: isClockedIn ? 'var(--green-bg)' : clockOutTime ? 'var(--blue-bg)' : 'var(--amber-bg)',
                              color: isClockedIn ? 'var(--green)' : clockOutTime ? 'var(--blue)' : 'var(--amber)'
                            }}>
                              {isClockedIn ? 'Active' : clockOutTime ? 'Complete' : 'Incomplete'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          }
        </div>
      </div>
    </Card>
  );
};

export default AttendanceTab;
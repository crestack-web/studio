import type { SolutionsSuiteId } from './types';

export type QuickAction = { id: string; label: string; icon: string; section: string };

export const QUICK_ACTIONS: Record<SolutionsSuiteId, QuickAction[]> = {
  hospitality: [
    { id: 'reservations', label: 'New reservation', icon: 'calendar', section: 'reservations' },
    { id: 'checkin', label: 'Check in a guest', icon: 'login', section: 'checkin' },
    { id: 'rooms', label: 'Add a room', icon: 'bed', section: 'rooms' },
    { id: 'expenses', label: 'Log an expense', icon: 'receipt', section: 'expenses' },
    { id: 'tasks', label: 'Assign a task', icon: 'checklist', section: 'tasks' },
  ],
  healthcare: [
    { id: 'appointments', label: 'Book appointment', icon: 'calendar', section: 'appointments' },
    { id: 'patients', label: 'Register a patient', icon: 'users', section: 'patients' },
    { id: 'visits', label: 'Check in a patient', icon: 'login', section: 'visits' },
    { id: 'billing', label: 'Create an invoice', icon: 'receipt', section: 'billing' },
    { id: 'inventory', label: 'Restock supplies', icon: 'box', section: 'inventory' },
  ],
  professional: [
    { id: 'projects', label: 'New project', icon: 'layers', section: 'projects' },
    { id: 'clients', label: 'Add a client', icon: 'users', section: 'clients' },
    { id: 'tasks', label: 'Assign a task', icon: 'checklist', section: 'tasks' },
    { id: 'invoices', label: 'Raise an invoice', icon: 'receipt', section: 'invoices' },
    { id: 'time', label: 'Log time', icon: 'clock', section: 'time' },
  ],
  education: [
    { id: 'students', label: 'Enroll a student', icon: 'users', section: 'students' },
    { id: 'classes', label: 'Create a class', icon: 'layers', section: 'classes' },
    { id: 'attendance', label: 'Take attendance', icon: 'checklist', section: 'attendance' },
    { id: 'timetable', label: 'Add to timetable', icon: 'calendar', section: 'timetable' },
    { id: 'fees', label: 'Record a fee payment', icon: 'receipt', section: 'fees' },
  ],
};

export const MO_SUMMARY: Record<SolutionsSuiteId, string> = {
  hospitality:
    'MO: “Occupancy is 65%. 6 arrivals today — rooms 305 and 412 need attention.”',
  healthcare:
    'MO: “12 patients are in the queue. Cardiology is running 22 minutes late — consider moving Dr. Lawal’s 15:30 virtual.”',
  professional:
    'MO: “Three projects are at risk this week. Northwind has 18 unbilled hours ready to invoice.”',
  education:
    'MO: “Attendance is 92% this week. 14 students have fees outstanding before the term closes.”',
};

export const PREVIEW_READY: SolutionsSuiteId[] = ['hospitality', 'healthcare', 'professional', 'education'];

export const SECTION_ORDER = ['main', 'operations', 'finance', 'settings'] as const;

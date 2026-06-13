import type { StaffUser, Permissions, SaleRecord } from './types';

export const DEFAULT_STAFF: StaffUser = {
  id: '1',
  initials: 'JD',
  name: 'John Doe',
  firstName: 'John',
  role: 'Cashier',
};

export const DEFAULT_PERMISSIONS: Permissions = {
  sale: true,
  inv: true,
  hist: true,
  atd: true,
  msg: true,
  earn: false,
};

export const DAILY_TARGET = 150000;

// Products and sales history are now fetched from Firestore via dataService.ts
// These mock arrays are removed as they're no longer used

// Mock products for fallback when dataService is unavailable
export const PRODUCTS = [
  { id: '1', name: 'Bread', price: 500, stock: 50 },
  { id: '2', name: 'Rice', price: 1500, stock: 30 },
  { id: '3', name: 'Beans', price: 1200, stock: 25 },
  { id: '4', name: 'Oil', price: 800, stock: 40 },
  { id: '5', name: 'Sugar', price: 700, stock: 35 },
  { id: '6', name: 'Milk', price: 900, stock: 20 },
  { id: '7', name: 'Eggs', price: 2000, stock: 15 },
  { id: '8', name: 'Tomatoes', price: 600, stock: 45 },
];

export const ATTENDANCE_DAYS = [
  { day: '1', status: 'present' },
  { day: '2', status: 'present' },
  { day: '3', status: 'present' },
  { day: '4', status: 'late' },
  { day: '5', status: 'present' },
  { day: '6', status: 'off' },
  { day: '7', status: 'off' },
  { day: '8', status: 'present' },
  { day: '9', status: 'present' },
  { day: '10', status: 'present' },
  { day: '11', status: 'present' },
  { day: '12', status: 'present' },
  { day: '13', status: 'late' },
  { day: '14', status: 'present' },
  { day: '15', status: 'off' },
  { day: '16', status: 'off' },
  { day: '17', status: 'present' },
  { day: '18', status: 'present' },
  { day: '19', status: 'present' },
  { day: '20', status: 'present' },
  { day: '21', status: 'present' },
  { day: '22', status: 'off' },
  { day: '23', status: 'off' },
  { day: '24', status: 'absent' },
  { day: '25', status: 'present' },
  { day: '26', status: 'present' },
  { day: '27', status: 'present' },
  { day: '28', status: 'present' },
];

export const SHIFT_LOG = [
  { date: 'Feb 27', clockIn: '08:14 AM', clockOut: '04:32 PM', hours: '8h 18m', status: 'complete' },
  { date: 'Feb 26', clockIn: '08:20 AM', clockOut: '04:45 PM', hours: '8h 25m', status: 'complete' },
  { date: 'Feb 25', clockIn: '08:05 AM', clockOut: '04:15 PM', hours: '8h 10m', status: 'complete' },
  { date: 'Feb 24', clockIn: '08:35 AM', clockOut: '04:50 PM', hours: '8h 15m', status: 'late' },
  { date: 'Feb 23', clockIn: '—', clockOut: '—', hours: '0h 0m', status: 'absent' },
];

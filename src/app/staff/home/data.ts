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

export const PRODUCTS = [
  { id: '1', name: 'Rice 50kg', price: 25000, stock: 100, emoji: '🍚', low: false },
  { id: '2', name: 'Beans 50kg', price: 30000, stock: 50, emoji: '🫘', low: false },
  { id: '3', name: 'Oil 5L', price: 8000, stock: 200, emoji: '🛢️', low: false },
  { id: '4', name: 'Sabuni', price: 850, stock: 7, emoji: '🧼', low: true },
  { id: '5', name: 'Bottled Water', price: 200, stock: 4, emoji: '💧', low: true },
  { id: '6', name: 'Sugar 50kg', price: 35000, stock: 30, emoji: '🍬', low: false },
  { id: '7', name: 'Salt 50kg', price: 5000, stock: 150, emoji: '🧂', low: false },
  { id: '8', name: 'Milk 1L', price: 1200, stock: 45, emoji: '🥛', low: false },
];

export const INITIAL_HISTORY: SaleRecord[] = [
  { id: '1', time: '08:32 AM', items: 'Rice 50kg ×2, Oil 5L ×1', amount: 58000, payment: 'Transfer' },
  { id: '2', time: '09:15 AM', items: 'Beans 50kg ×1, Sugar 5kg ×3', amount: 32500, payment: 'Cash' },
  { id: '3', time: '10:47 AM', items: 'Sabuni ×4, Salt 50kg ×1', amount: 8400, payment: 'Transfer' },
  { id: '4', time: '11:23 AM', items: 'Bottled Water ×12', amount: 2400, payment: 'Cash' },
  { id: '5', time: '12:05 PM', items: 'Oil 5L ×2, Milk 1L ×6', amount: 23200, payment: 'Transfer' },
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

import { HOSPITALITY, PROFESSIONAL } from './config';
import type { IndustryConfig } from './types';

export type SuiteProduct = {
  id: string;
  name: string;
  blurb: string;
  href: string;
  badge?: string;
};

export type SuiteFamily = {
  id: 'business' | 'hospitality' | 'professional';
  label: string;
  productName: string;
  href: string;
  signupHref: string;
  loginHref: string;
  tagline: string;
  description: string;
  products: SuiteProduct[];
};

const businessProducts: SuiteProduct[] = [
  { id: 'sales', name: 'Sales', blurb: 'Record sales, track stock, and close the day faster.', href: '/welcome' },
  { id: 'cashflow', name: 'Cashflow', blurb: 'See money in and out without spreadsheet chaos.', href: '/welcome' },
  { id: 'inventory', name: 'Inventory', blurb: 'Stock levels, low-stock alerts, and restock clarity.', href: '/welcome' },
  { id: 'mo', name: 'Ask MO', blurb: 'Your AI business assistant for daily decisions.', href: '/welcome' },
  { id: 'staff', name: 'Staff', blurb: 'Attendance, roles, and accountability in one place.', href: '/welcome' },
  { id: 'builder', name: 'Business Builder', blurb: 'Describe a process — Busmo builds the tool.', href: '/welcome' },
];

function industryProducts(config: IndustryConfig): SuiteProduct[] {
  // Map nav main items into product-style cards
  return config.nav
    .filter((n) => n.section === 'main' && n.id !== 'overview')
    .slice(0, 6)
    .map((n) => ({
      id: n.id,
      name: n.label,
      blurb:
        config.id === 'hospitality'
          ? `Manage ${n.label.toLowerCase()} as part of your hotel workspace.`
          : `Run ${n.label.toLowerCase()} inside your professional workspace.`,
      href: config.signupPath,
    }));
}

export const SUITE_FAMILIES: SuiteFamily[] = [
  {
    id: 'business',
    label: 'Business',
    productName: 'Busmo Business',
    href: '/',
    signupHref: '/welcome/signup',
    loginHref: '/login',
    tagline: 'Run your business. Stay in control.',
    description: 'Sales, inventory, cashflow, staff and MO — built for everyday SMEs.',
    products: businessProducts,
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    productName: HOSPITALITY.productName,
    href: HOSPITALITY.welcomePath,
    signupHref: HOSPITALITY.signupPath,
    loginHref: HOSPITALITY.loginPath,
    tagline: HOSPITALITY.tagline,
    description: HOSPITALITY.description,
    products: [
      { id: 'reservations', name: 'Reservations', blurb: 'Bookings, availability, and stay status in one view.', href: HOSPITALITY.signupPath },
      { id: 'rooms', name: 'Rooms', blurb: 'Room inventory, types, and readiness at a glance.', href: HOSPITALITY.signupPath },
      { id: 'guests', name: 'Guests', blurb: 'Guest profiles and history without paper trails.', href: HOSPITALITY.signupPath },
      { id: 'checkin', name: 'Check-in / Out', blurb: 'Front-desk flow for arrivals and departures.', href: HOSPITALITY.signupPath },
      { id: 'housekeeping', name: 'Housekeeping', blurb: 'Room status and task lists for your team.', href: HOSPITALITY.signupPath },
      { id: 'revenue', name: 'Revenue', blurb: 'Daily hotel revenue without leaving Busmo.', href: HOSPITALITY.signupPath },
    ],
  },
  {
    id: 'professional',
    label: 'Professional',
    productName: PROFESSIONAL.productName,
    href: PROFESSIONAL.welcomePath,
    signupHref: PROFESSIONAL.signupPath,
    loginHref: PROFESSIONAL.loginPath,
    tagline: PROFESSIONAL.tagline,
    description: PROFESSIONAL.description,
    products: [
      { id: 'projects', name: 'Projects', blurb: 'Active engagements, deadlines, and delivery status.', href: PROFESSIONAL.signupPath },
      { id: 'clients', name: 'Clients', blurb: 'Client records tied to projects and invoices.', href: PROFESSIONAL.signupPath },
      { id: 'tasks', name: 'Tasks', blurb: 'Assign work and track what is due today.', href: PROFESSIONAL.signupPath },
      { id: 'time', name: 'Time Tracking', blurb: 'Billable hours without a separate timesheet app.', href: PROFESSIONAL.signupPath },
      { id: 'invoices', name: 'Invoices', blurb: 'Create invoices and track what is outstanding.', href: PROFESSIONAL.signupPath },
      { id: 'team', name: 'Team', blurb: 'Workload and capacity across your firm.', href: PROFESSIONAL.signupPath },
    ],
  },
];

export function getSuiteFamily(id: string): SuiteFamily {
  return SUITE_FAMILIES.find((f) => f.id === id) || SUITE_FAMILIES[0];
}

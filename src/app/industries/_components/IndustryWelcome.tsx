'use client';

import Link from 'next/link';
import type { IndustryConfig } from '@/lib/industries/types';
import { getSuiteFamily } from '@/lib/industries/suite-catalog';
import { SuiteChrome, SuiteProductGrid } from './SuiteChrome';
import { SuiteInstallAppButton } from './SuiteInstallAppButton';
import { IndustryPricing } from './IndustryPricing';
import styles from './IndustryWelcome.module.css';

/* ------------------------------- icons ------------------------------ */

const ICONS = {
  desk: (
    <>
      <path d="M3 9h18M4 9v10M20 9v10M3 9l2-5h14l2 5" />
      <path d="M8 19v-5h8v5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h2M14 14h2M8 17.5h2" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18v-7M3 18h18v-4a3 3 0 0 0-3-3h-7v7" />
      <path d="M3 14h18" />
      <circle cx="7.5" cy="11" r="1.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3 2.7-5.2 6-5.2s6 2.2 6 5.2" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17.6 19c0-2 .7-3.5 2-4.4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-5M13 16V7M18 16v-8" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.6 12 20 12 20Z" />
  ),
  queue: (
    <>
      <path d="M4 6h9M4 12h9M4 18h9" />
      <path d="M17 8l2 2 3-3M19 14v6" />
    </>
  ),
  notes: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 12h6M9 16h4" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M10 12v2a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="9" r="2" />
      <path d="M6 3H4M14 3h2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.8 4.7L18 9.5l-4.2 1.8L12 16l-1.8-4.7L6 9.5l4.2-1.8L12 3z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  checkSquare: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 12l2.5 2.5L16 9" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  invoice: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4M9 11h6M9 15h6M9 19h3" />
    </>
  ),
  team: (
    <>
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3 19c.4-2.5 2.4-4 5-4s4.6 1.5 5 4" />
      <path d="M14 15.2c2.2.2 3.6 1.6 4 3.8" />
    </>
  ),
  graduation: (
    <>
      <path d="M2.5 9L12 4l9.5 5L12 14 2.5 9z" />
      <path d="M6 11v4.4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V11" />
      <path d="M21.5 9v4.5" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M3 14h18M9 4v16" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="3" />
      <path d="M3 10h18" />
      <circle cx="17" cy="15" r="1.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
} as const;

type IconName = keyof typeof ICONS;

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 8.5l3 3L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------ content ----------------------------- */

type SuiteId = 'hospitality' | 'healthcare' | 'professional' | 'education' | 'agriculture';

type Feature = { icon: IconName; title: string; desc: string };
type Step = { title: string; desc: string };
type Faq = { q: string; a: string };
type MockRow = { title: string; meta: string; status: string; tone?: 'accent' | 'warn' | 'neutral' };
type MockAsideItem = { text: string; state: 'done' | 'active' | 'todo' };

type SuiteContent = {
  kicker: string;
  headline: { lead: string; em: string; tail?: string };
  description: string;
  note: string;
  ctaLabel: string;
  featureLead: string;
  features: Feature[];
  steps: Step[];
  faq: Faq[];
  ctaTitle: string;
  ctaText: string;
  mock: {
    window: string;
    workspace: string;
    subtitle: string;
    kpis: { label: string; value: string; delta?: string }[];
    listTitle: string;
    listMeta: string;
    rows: MockRow[];
    asideTitle: string;
    asideMeta: string;
    aside: MockAsideItem[];
    mo: string;
  };
};

const SUITE_CONTENT: Record<SuiteId, SuiteContent> = {
  hospitality: {
    kicker: 'Hotel operations',
    headline: { lead: 'Run your hotel without', em: 'chasing the front desk.' },
    description:
      'Reservations, rooms, guests, housekeeping and revenue stay in sync — so the front desk, housekeeping and back office work from the same live picture instead of WhatsApp and notebooks.',
    note: '14-day free trial · Cancel anytime',
    ctaLabel: 'Start free trial',
    featureLead:
      'Replace the booking book, room-status calls and end-of-day spreadsheet with one live workspace your whole team can trust.',
    features: [
      {
        icon: 'desk',
        title: 'Front desk',
        desc: "Arrivals, departures and walk-ins in one calm screen, with today's expected revenue and room status always visible.",
      },
      {
        icon: 'calendar',
        title: 'Reservations & calendar',
        desc: 'Book rooms, edit stays and see availability across dates — without double-booking a guest or losing a deposit.',
      },
      {
        icon: 'bed',
        title: 'Rooms & housekeeping',
        desc: 'Room types, rates and live readiness — clean, dirty, inspected or out of service — synced with the front desk.',
      },
      {
        icon: 'users',
        title: 'Guests & folio',
        desc: 'Guest profiles, stay history and a running folio for extras, deposits and balances at check-out.',
      },
      {
        icon: 'chart',
        title: 'Finance & reports',
        desc: 'Payments, expenses and occupancy revenue roll into daily reports the owner and manager can actually read.',
      },
      {
        icon: 'globe',
        title: 'Website booking site',
        desc: 'A branded Mo-sell booking page so guests can reserve direct — without paying commission to a middleman.',
      },
    ],
    steps: [
      {
        title: 'Set up rooms, rates and staff',
        desc: 'Add room types, nightly rates and your team. Bring current reservations across if you are switching systems.',
      },
      {
        title: 'Run the day from the front desk',
        desc: 'Take bookings, check guests in and out, and let housekeeping update room status as they finish each room.',
      },
      {
        title: 'Close with numbers you trust',
        desc: 'Payments, expenses and occupancy roll into daily reports, so the owner sees the same picture as the desk.',
      },
    ],
    faq: [
      {
        q: 'Can we import our existing bookings?',
        a: 'Yes. The front desk can add current and upcoming reservations, and our team can help with a structured import of rooms, rates and guest records during onboarding.',
      },
      {
        q: 'Does housekeeping update the front desk automatically?',
        a: 'Yes. Room status — clean, dirty, inspected, out of service — is shared live, so the front desk only assigns rooms that are actually ready.',
      },
      {
        q: 'Can guests book directly from our website?',
        a: 'Yes. The included Mo-sell booking page lets guests check availability and reserve direct, so you are not completely dependent on commission-heavy channels.',
      },
      {
        q: 'Does it handle payments and deposits?',
        a: 'You can record payments, part payments and deposits against a guest folio, and see exactly what is still outstanding before check-out.',
      },
      {
        q: 'Can we run more than one property?',
        a: 'Multi-property support is available on higher plans. Smaller properties can start lean and add properties as operations grow.',
      },
    ],
    ctaTitle: 'Give your front desk a system worth trusting.',
    ctaText:
      'Start with reservations, rooms and guests. Add housekeeping, revenue reporting and your direct booking site as you grow.',
    mock: {
      window: 'busmo.app/hospitality/front-desk',
      workspace: 'Palm Court Hotel',
      subtitle: 'Front desk · Today',
      kpis: [
        { label: 'Occupancy', value: '82%', delta: '+6%' },
        { label: 'Arrivals', value: '14' },
        { label: 'Revenue', value: '₦1.24m' },
      ],
      listTitle: 'Today at the desk',
      listMeta: 'Live',
      rows: [
        { title: 'Room 204 · A. Okafor', meta: '2 nights · checked in 14:10', status: 'In house' },
        { title: 'Room 112 · Walk-in', meta: 'Departure today · 11:00', status: 'Due out', tone: 'warn' },
        { title: 'Suite 3 · M. Bello', meta: 'Arriving 15:30 · airport pick-up', status: 'Arriving', tone: 'neutral' },
      ],
      asideTitle: 'Housekeeping',
      asideMeta: '12 rooms',
      aside: [
        { text: 'Ready · 201, 202, 205', state: 'done' },
        { text: 'Cleaning · 112', state: 'active' },
        { text: 'Inspect · Suite 3', state: 'todo' },
      ],
      mo: 'Weekend occupancy is up 14%. Hold Suite 3 at the higher rate.',
    },
  },

  healthcare: {
    kicker: 'Clinic operations',
    headline: { lead: 'Run the clinic day without', em: 'losing the thread.' },
    description:
      'Patients, appointments, clinical notes and billing live in one connected workspace — so reception, clinicians and finance stop working from different versions of the day.',
    note: '14-day free trial · Cancel anytime',
    ctaLabel: 'Start free trial',
    featureLead:
      'Replace the appointment book, paper files and separate billing sheet with one live record for every patient and every naira.',
    features: [
      {
        icon: 'heart',
        title: 'Patients',
        desc: 'One record per patient — demographics, history and every appointment, visit and payment connected to their care.',
      },
      {
        icon: 'queue',
        title: 'Appointments & reception queue',
        desc: 'Book, reschedule and check people in, with a live queue reception can manage alongside booked appointments.',
      },
      {
        icon: 'notes',
        title: 'Visits & clinical notes',
        desc: 'Start a visit at check-in, record notes and vitals through the consultation, and close it cleanly at discharge.',
      },
      {
        icon: 'stethoscope',
        title: 'Staff & clinicians',
        desc: 'Doctors, nurses and reception on one roster with clear roles, rooms and access to the records they need.',
      },
      {
        icon: 'receipt',
        title: 'Billing & payments',
        desc: 'Turn visits into invoices, record payments and see what is still owed without reconciling a second system.',
      },
      {
        icon: 'sparkles',
        title: 'Condition tracking + AI patient chat',
        desc: "Track ongoing conditions and follow-ups, and let MO answer routine patient questions from your clinic's own information.",
      },
    ],
    steps: [
      {
        title: 'Add your clinic and services',
        desc: 'Set up services, consulting rooms, clinicians and reception users in an afternoon — no IT project required.',
      },
      {
        title: 'Run appointments and visits',
        desc: 'Book patients, manage the reception queue and record notes from check-in through to discharge.',
      },
      {
        title: 'Bill and review the day',
        desc: 'Turn visits into invoices, record payments and see clinic revenue without exporting to another tool.',
      },
    ],
    faq: [
      {
        q: 'Is this a full electronic medical record?',
        a: 'Busmo covers patient records, appointments, visits, clinical notes, staff and billing. It is a clinic operations system; specialised lab and imaging modules can be packaged separately with the right safeguards.',
      },
      {
        q: 'Can reception and clinicians see different things?',
        a: 'Yes. Role-based access means reception handles scheduling and payments, while clinicians get the patient and visit records they need to treat.',
      },
      {
        q: 'How do appointments and walk-ins work together?',
        a: 'The reception queue handles both booked appointments and walk-ins, so the day stays in one ordered list instead of two separate books.',
      },
      {
        q: 'Can we track ongoing conditions?',
        a: "Yes. Conditions and follow-ups stay attached to the patient record, and MO can answer routine patient questions using your clinic's own information.",
      },
      {
        q: 'What about patient privacy?',
        a: 'Records are access-controlled by role. Clinical data should always be handled under your clinic\'s own privacy policy and local health regulations.',
      },
    ],
    ctaTitle: 'A calmer clinic starts with one clear view.',
    ctaText:
      'Bring patients, appointments and billing together — and give reception, clinicians and the owner the same picture of the day.',
    mock: {
      window: 'busmo.app/healthcare/reception',
      workspace: 'Grace Clinic',
      subtitle: 'Reception · Today',
      kpis: [
        { label: 'Patients', value: '38' },
        { label: 'In queue', value: '5' },
        { label: 'Revenue', value: '₦480k' },
      ],
      listTitle: 'Reception queue',
      listMeta: 'Live',
      rows: [
        { title: 'Amina Yusuf · 09:20', meta: 'Follow-up · Dr. Bello', status: 'In consult' },
        { title: 'Chidi Eze · 09:40', meta: 'New patient · vitals done', status: 'Waiting', tone: 'warn' },
        { title: 'Grace Nwosu · 10:00', meta: 'Malaria review', status: 'Checked in', tone: 'neutral' },
      ],
      asideTitle: 'Consulting rooms',
      asideMeta: '3 active',
      aside: [
        { text: 'Room 1 · Dr. Bello', state: 'done' },
        { text: 'Room 2 · Dr. Ade', state: 'active' },
        { text: 'Room 3 · free', state: 'todo' },
      ],
      mo: 'Two patients have waited over 20 minutes. Open Room 3 to reset the queue.',
    },
  },

  professional: {
    kicker: 'Firm operations',
    headline: { lead: 'Every client, project and hour', em: 'in one workspace.' },
    description:
      'Clients, projects, time and invoices live in one connected workspace. See what the team is delivering, what it is worth, and where the week is really heading.',
    note: '14-day free trial · Cancel anytime',
    ctaLabel: 'Start free trial',
    featureLead:
      'Replace the status meeting, timesheet app and invoice spreadsheet with one live view of the firm — for owners and the team.',
    features: [
      {
        icon: 'briefcase',
        title: 'Clients & projects',
        desc: 'Every engagement with its owner, deadline, budget and status in one place — not spread across inboxes.',
      },
      {
        icon: 'checkSquare',
        title: 'Tasks',
        desc: "Assign work, set due dates and see what is slipping before a client has to ask you about it.",
      },
      {
        icon: 'calendar',
        title: 'Calendar',
        desc: 'Team schedules, meetings and delivery deadlines in a shared view everyone can plan around.',
      },
      {
        icon: 'clock',
        title: 'Time tracking',
        desc: 'Log billable hours against projects as the week happens, then turn tracked time into an invoice.',
      },
      {
        icon: 'invoice',
        title: 'Invoices & expenses',
        desc: 'Bill clients, chase outstanding balances and keep project costs next to the revenue they generated.',
      },
      {
        icon: 'team',
        title: 'Team utilisation + AI chief of staff',
        desc: 'See who is overloaded and who has capacity, then ask MO what needs your attention this week.',
      },
    ],
    steps: [
      {
        title: 'Add clients and live projects',
        desc: 'Bring your client list and active engagements in, with owners, budgets and deadlines attached.',
      },
      {
        title: 'Plan work and track time',
        desc: 'Assign tasks, keep the team calendar current and log billable hours against each project.',
      },
      {
        title: 'Invoice and see utilisation',
        desc: 'Raise invoices from tracked time, chase balances and see who has room for the next engagement.',
      },
    ],
    faq: [
      {
        q: 'Can we bill by the hour and by project?',
        a: 'Yes. Log time against projects and turn it into an invoice, or set fixed project fees. Both can be tracked alongside project expenses.',
      },
      {
        q: 'Does it replace our project management tool?',
        a: 'For most small firms, yes — projects, tasks, calendar, time and invoices sit together. Larger teams can keep a specialist tool and still use Busmo for clients, time and money.',
      },
      {
        q: 'Can the team see their own workload?',
        a: 'Yes. Everyone sees their tasks and schedule, while owners and managers get utilisation across the whole firm.',
      },
      {
        q: 'What does MO actually do?',
        a: 'MO reads your own project, time and invoice data and answers questions like who is over capacity, what is unbilled, or which projects are at risk.',
      },
      {
        q: 'Can we control who sees financials?',
        a: 'Yes. Roles and permissions decide who can view invoices, expenses and firm-level reports.',
      },
    ],
    ctaTitle: 'See what the firm is delivering — and what it is worth.',
    ctaText:
      'Start with clients and projects, then track time, invoices and utilisation in the same workspace. No more month-end guesswork.',
    mock: {
      window: 'busmo.app/professional/projects',
      workspace: 'Northline Studio',
      subtitle: 'Delivery · This week',
      kpis: [
        { label: 'Projects', value: '12' },
        { label: 'Utilisation', value: '78%' },
        { label: 'Outstanding', value: '₦3.6m' },
      ],
      listTitle: 'Active engagements',
      listMeta: 'This week',
      rows: [
        { title: 'Brand refresh · Acme', meta: 'Due Fri · 62% complete', status: 'On track' },
        { title: 'Website build · Kora', meta: 'Blocked on copy', status: 'At risk', tone: 'warn' },
        { title: 'Q3 retainer · Halcyon', meta: 'Invoice sent 3 days ago', status: 'Awaiting', tone: 'neutral' },
      ],
      asideTitle: 'Today',
      asideMeta: '3 items',
      aside: [
        { text: 'Stand-up · 09:30', state: 'done' },
        { text: 'Design review · 11:00', state: 'active' },
        { text: 'Invoice run · 16:00', state: 'todo' },
      ],
      mo: 'Utilisation is 78%, but two designers are at 94%. Rebalance before Friday.',
    },
  },

  education: {
    kicker: 'School operations',
    headline: { lead: 'Run the school term without', em: 'the paper chase.' },
    description:
      'Students, classes, attendance and fees live in one connected platform — giving the front office, teachers and bursar the same live view of the term.',
    note: 'Free for up to 100 students · Termly billing',
    ctaLabel: 'Start free',
    featureLead:
      'Replace registers, fee spreadsheets and timetable notices with one live view of the school — from admissions to end-of-term reports.',
    features: [
      {
        icon: 'graduation',
        title: 'Students & admissions',
        desc: 'Student records plus an admissions pipeline that follows each enquiry from first contact to enrolled.',
      },
      {
        icon: 'book',
        title: 'Classes & enrollment',
        desc: 'Class lists, capacity and teacher assignment without juggling multiple spreadsheets each term.',
      },
      {
        icon: 'clipboard',
        title: 'Attendance',
        desc: "Mark a register in seconds, see today's attendance and follow up on absentees before the day is out.",
      },
      {
        icon: 'table',
        title: 'Timetable + topic assignment',
        desc: 'Build the timetable, assign topics to teachers and swap lessons when plans change — without reprinting anything.',
      },
      {
        icon: 'wallet',
        title: 'Fees & payments',
        desc: 'Fee plans, part payments and outstanding balances visible per student, per class and per term.',
      },
      {
        icon: 'chart',
        title: 'Reports + AI insights',
        desc: 'Enrollment, attendance and fee-collection reports — with MO highlighting what changed and what needs attention.',
      },
    ],
    steps: [
      {
        title: 'Import students and classes',
        desc: 'Add students, classes and teachers, or bring your existing lists in from a spreadsheet during setup.',
      },
      {
        title: 'Run attendance and timetable',
        desc: 'Mark registers daily, publish the timetable and swap topics between teachers when the week changes.',
      },
      {
        title: 'Collect fees and review',
        desc: 'Track fee plans, part payments and outstanding balances, then review term reports with the leadership team.',
      },
    ],
    faq: [
      {
        q: 'Can we import our student list?',
        a: 'Yes. Students, classes and teachers can be added in bulk during setup, so you do not start the term from a blank system.',
      },
      {
        q: 'Does it support termly fee plans?',
        a: 'Yes. Set fee plans per class or student, record part payments and see outstanding balances for the term.',
      },
      {
        q: 'How does the timetable handle changes?',
        a: 'Build the timetable, assign topics to teachers and swap them when a lesson changes — affected classes see the updated plan.',
      },
      {
        q: 'Can parents or students log in?',
        a: 'Staff accounts cover the front office and teachers. Parent and student access depends on your plan and rollout; the core platform is built around staff operations.',
      },
      {
        q: 'What reports can the school see?',
        a: 'Enrollment, attendance, class capacity and fee-collection reports, with MO highlighting unusual changes so leadership can act early.',
      },
    ],
    ctaTitle: 'Give the term one source of truth.',
    ctaText:
      'Start with students and classes, then run attendance, timetable and fees from the same platform. Your bursar will thank you.',
    mock: {
      window: 'busmo.app/education/timetable',
      workspace: 'Cedar Grove Academy',
      subtitle: 'Front office · Term 1',
      kpis: [
        { label: 'Students', value: '642' },
        { label: 'Attendance', value: '94%' },
        { label: 'Fees due', value: '₦2.1m' },
      ],
      listTitle: 'Today at school',
      listMeta: 'Term 1',
      rows: [
        { title: 'JSS 2A · 08:00 register', meta: '38 present · 2 absent', status: 'Marked' },
        { title: 'JSS 3B · Mathematics', meta: 'Topic swapped · Mr Adeyemi', status: 'Updated' },
        { title: 'SS 1A · Fees', meta: '12 part payments today', status: 'Following up', tone: 'neutral' },
      ],
      asideTitle: 'Next on timetable',
      asideMeta: '3 lessons',
      aside: [
        { text: 'JSS 2A · English · 10:20', state: 'done' },
        { text: 'JSS 3B · Maths · 11:00', state: 'active' },
        { text: 'SS 1A · Physics · 12:00', state: 'todo' },
      ],
      mo: 'Attendance in JSS 3B dropped 8% this week. Flag it for the form teacher.',
    },
  },

  agriculture: {
    kicker: 'Farm & agribusiness',
    headline: {
      lead: 'From the field to',
      em: 'the final sale.',
      tail: '— without the guesswork.',
    },
    description:
      'Farms, plots, crops and field work connect to harvests, processing, packaging, stock, sales and exports in one workspace — so the farm manager, store and back office work from the same live picture instead of notebooks and scattered spreadsheets.',
    note: '14-day free trial · Cancel anytime',
    ctaLabel: 'Start free trial',
    featureLead:
      'Replace the farm diary, input register and yield spreadsheet with one live view of the season — from land preparation and planting through to packaged stock, invoices and export documents.',
    features: [
      {
        icon: 'table',
        title: 'Farms & plots',
        desc: 'Every farm, plot and crop in one place — with area, location and what is planted where, ready for the whole team to see.',
      },
      {
        icon: 'calendar',
        title: 'Field activities',
        desc: 'Plan planting, weeding and spraying, assign field crews and log what actually happened against each plot and work day.',
      },
      {
        icon: 'receipt',
        title: 'Inputs & inventory',
        desc: 'Track seeds, fertiliser and agrochemicals from purchase to use, with stock levels and reorder alerts before a field runs dry.',
      },
      {
        icon: 'chart',
        title: 'Harvest & yield',
        desc: 'Record harvests plot by plot, compare yields against planting plans and see what each field is really producing per hectare.',
      },
      {
        icon: 'briefcase',
        title: 'Processing & packaging',
        desc: 'Move produce from harvest into processing and packaging, track grades and batch numbers, and know how many bags or crates are ready.',
      },
      {
        icon: 'globe',
        title: 'Sales, exports & finance + MO',
        desc: 'Sell local or export with invoices, buyer records and document checks, while finance rolls it up and MO flags what needs attention.',
      },
    ],
    steps: [
      {
        title: 'Import farms, plots and crops',
        desc: 'Add your farms, plots and crop plans — or bring existing land and input records in from a spreadsheet during setup.',
      },
      {
        title: 'Plan the season and run field work',
        desc: 'Set up a season cycle, schedule planting and field activities, and let crews log work against each plot as it happens.',
      },
      {
        title: 'Harvest, process, sell and export',
        desc: 'Capture yields, move stock through processing and packaging, then invoice local buyers or prepare export documents.',
      },
    ],
    faq: [
      {
        q: 'Can we import our farms and plots?',
        a: 'Yes. Farms, plots, crop assignments and input records can be added in bulk during setup, so you do not start a season from a blank system.',
      },
      {
        q: 'Can we run more than one season cycle?',
        a: 'Yes. Each season has its own planting plan, field activities and harvest records, so you can compare yields and inputs across seasons without losing history.',
      },
      {
        q: 'Does it handle processing and packaging?',
        a: 'Yes. Move harvested produce into processing, record grades and batch numbers, and track how many bags, crates or cartons are packed and ready to sell.',
      },
      {
        q: 'Can we manage exports and compliance documents?',
        a: 'You can attach buyers, invoices and required export documents to each sale and see what is still outstanding before a shipment is dispatched. Specific certification requirements depend on your market and should be confirmed with your buyer.',
      },
      {
        q: 'What can MO report on?',
        a: 'MO reads your own farm data and highlights what needs attention — plots ready for harvest, stock below reorder level, fields underperforming and export files waiting on documents.',
      },
    ],
    ctaTitle: 'Bring the whole season into one view.',
    ctaText:
      'Start with farms and plots, then add field work, harvests, processing and sales. See the field and the final sale in the same workspace.',
    mock: {
      window: 'busmo.app/agriculture/overview',
      workspace: 'Greenfield Farms Ltd',
      subtitle: 'Ibadan, Oyo · Farm operations',
      kpis: [
        { label: 'Planted area', value: '126 ha' },
        { label: 'Harvest ready', value: '18.4 t', delta: '+2.1 t' },
        { label: 'Revenue', value: '₦8.4m' },
      ],
      listTitle: 'Today on the farm',
      listMeta: 'Field operations',
      rows: [
        { title: 'Plot A4 · Maize harvest', meta: 'Ring Road block · 4.2 ha', status: 'Ready' },
        { title: 'Fertiliser restock · Input store', meta: '12 bags left · below reorder level', status: 'Due', tone: 'warn' },
        { title: 'Grade A cassava · Export batch', meta: '20 × 50 kg bags · packaging', status: 'In progress', tone: 'neutral' },
      ],
      asideTitle: 'Next field jobs',
      asideMeta: '3 tasks',
      aside: [
        { text: 'Weed Plot B2 · 07:00', state: 'done' },
        { text: 'Harvest Plot A4 · 09:30', state: 'active' },
        { text: 'Dispatch export documents · 15:00', state: 'todo' },
      ],
      mo: 'Two plots are ready for harvest. Maize stock is below reorder level and one export file needs documents.',
    },
  },
};

/* ----------------------------- mockup ------------------------------ */

function Mockup({ content, suiteLabel }: { content: SuiteContent; suiteLabel: string }) {
  const m = content.mock;
  const label = `${suiteLabel} dashboard preview — ${m.workspace}: ${m.kpis
    .map((k) => `${k.label} ${k.value}`)
    .join(', ')}. MO insight: ${m.mo}`;

  return (
    <div className={styles.mockWrap} role="img" aria-label={label}>
      <div className={styles.mock}>
        <div className={styles.mockTop}>
          <span className={styles.mockDots}>
            <span className={styles.mockDotAccent + ' ' + styles.mockDot} />
            <span className={styles.mockDot} />
            <span className={styles.mockDot} />
          </span>
          <span className={styles.mockAddr}>{m.window}</span>
        </div>

        <div className={styles.mockBody}>
          <div className={styles.mockSide}>
            <span className={styles.mockSideLogo} />
            <div className={styles.mockSideNav}>
              <span className={styles.mockSideItemActive} />
              <span className={styles.mockSideItem} />
              <span className={styles.mockSideItem} />
              <span className={styles.mockSideItem} />
            </div>
          </div>

          <div className={styles.mockMain}>
            <div className={styles.mockHead}>
              <div>
                <p className={styles.mockTitle}>{m.workspace}</p>
                <p className={styles.mockSub}>{m.subtitle}</p>
              </div>
              <span className={styles.mockAvatar} />
            </div>

            <div className={styles.kpis}>
              {m.kpis.map((kpi) => (
                <div key={kpi.label} className={styles.kpi}>
                  <div className={styles.kpiLabel}>{kpi.label}</div>
                  <div className={styles.kpiValue}>
                    {kpi.value}
                    {kpi.delta ? <span className={styles.kpiDelta}>{kpi.delta}</span> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.mockList}>
              <div className={styles.mockListHead}>
                <span>{m.listTitle}</span>
                <span>{m.listMeta}</span>
              </div>
              {m.rows.map((row) => (
                <div key={row.title} className={styles.mockRow}>
                  <div className={styles.mockRowMain}>
                    <div className={styles.mockRowTitle}>{row.title}</div>
                    <div className={styles.mockRowMeta}>{row.meta}</div>
                  </div>
                  <span
                    className={[
                      styles.mockChip,
                      row.tone === 'warn' ? styles.mockChipWarn : '',
                      row.tone === 'neutral' ? styles.mockChipNeutral : '',
                    ].join(' ')}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.mockAside}>
              <div className={styles.mockAsideTitle}>
                <span>{m.asideTitle}</span>
                <span>{m.asideMeta}</span>
              </div>
              {m.aside.map((item) => (
                <div key={item.text} className={styles.mockAsideItem}>
                  <span
                    className={[
                      styles.mockAsideMark,
                      item.state === 'done' ? styles.mockAsideMarkDone : '',
                      item.state === 'active' ? styles.mockAsideMarkActive : '',
                    ].join(' ')}
                  />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mockFloat}>
        <div className={styles.mockFloatTop}>
          <Icon name="sparkles" size={12} /> MO insight
        </div>
        <p className={styles.mockFloatText}>{m.mo}</p>
      </div>
    </div>
  );
}

/* ------------------------------ page -------------------------------- */

export function IndustryWelcome({ config }: { config: IndustryConfig }) {
  const family = getSuiteFamily(config.id);
  const content = SUITE_CONTENT[config.id];
  const year = new Date().getFullYear();

  return (
    <SuiteChrome family={family} sectionLinks>
      <div className={styles.page}>
        {/* 1. Hero */}
        <section className={styles.heroSection} aria-labelledby="suite-hero-heading">
          <div className={styles.hero}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <p className={styles.kicker}>
                  <span className={styles.kickerDot} aria-hidden />
                  <span className={styles.kickerProduct}>{family.productName}</span>
                  <span className={styles.kickerSep} aria-hidden>
                    ·
                  </span>
                  <span>{content.kicker}</span>
                </p>

                <h1 id="suite-hero-heading" className={styles.heroTitle}>
                  {content.headline.lead} <em>{content.headline.em}</em>
                  {content.headline.tail ? <> {content.headline.tail}</> : null}
                </h1>

                <p className={styles.heroDesc}>{content.description}</p>

                <div className={styles.heroCtas}>
                  <Link href={family.signupHref} className={styles.btnHeroPrimary}>
                    {content.ctaLabel}
                    <ArrowRight />
                  </Link>
                  <a href="#how-it-works" className={styles.btnHeroGhost}>
                    See how it works
                  </a>
                </div>

                <p className={styles.heroNote}>{content.note}</p>

                <ul className={styles.trust} aria-label="Platform highlights">
                  <li>
                    <span className={styles.trustIcon}>
                      <CheckMark />
                    </span>
                    Built for African SMEs
                  </li>
                  <li>
                    <span className={styles.trustIcon}>
                      <CheckMark />
                    </span>
                    Live staff desk
                  </li>
                  <li>
                    <span className={styles.trustIcon}>
                      <CheckMark />
                    </span>
                    AI chief of staff MO
                  </li>
                </ul>
              </div>

              <Mockup content={content} suiteLabel={family.label} />
            </div>
          </div>
        </section>

        {/* 2. What you get */}
        <section className={styles.section} id="what-you-get" aria-labelledby="what-you-get-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>What you get</p>
            <h2 id="what-you-get-heading" className={styles.sectionTitle}>
              {family.label} operations, under one roof
            </h2>
            <p className={styles.sectionLead}>{content.featureLead}</p>
          </div>

          <ul className={styles.featureGrid}>
            {content.features.map((feature) => (
              <li key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <Icon name={feature.icon} size={21} />
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. How it works */}
        <section className={styles.section} id="how-it-works" aria-labelledby="how-it-works-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>How it works</p>
            <h2 id="how-it-works-heading" className={styles.sectionTitle}>
              Live in days, not quarters
            </h2>
            <p className={styles.sectionLead}>
              Start with the part of the day that hurts most. Busmo grows with you from there — same account, same
              data.
            </p>
          </div>

          <div className={styles.stepsPanel}>
            <ol className={styles.steps}>
              {content.steps.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNum} aria-hidden>
                    {index + 1}
                  </span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4. Product apps */}
        <section className={styles.section} id="apps" aria-labelledby="apps-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Product apps</p>
            <h2 id="apps-heading" className={styles.sectionTitle}>
              Apps in {family.label}
            </h2>
            <p className={styles.sectionLead}>
              Each app works on its own and shares the same records. Add the ones you need now — the rest are ready
              when you are.
            </p>
          </div>
          <div className={styles.appsGrid}>
            <SuiteProductGrid family={family} />
          </div>
        </section>

        {/* 5. Pricing */}
        <IndustryPricing config={config} />

        {/* 6. FAQ */}
        <section className={styles.section} id="faq" aria-labelledby="faq-heading">
          <div className={styles.sectionHeadCenter}>
            <p className={styles.eyebrow}>FAQ</p>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Questions, answered
            </h2>
            <p className={styles.sectionLead}>
              The things {family.label.toLowerCase()} teams usually ask before switching.
            </p>
          </div>

          <div className={styles.faqList}>
            {content.faq.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>
                  <span>{item.q}</span>
                  <span className={styles.faqIcon} aria-hidden>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className={styles.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 7. Install as app */}
        <section className={styles.installSection} aria-labelledby="install-heading">
          <div className={styles.installCard}>
            <h2 id="install-heading" className={styles.installTitle}>
              Work from the app, not a browser tab
            </h2>
            <p className={styles.installSub}>
              Install {family.productName} once and it opens straight to your sign-in — without the full Busmo site.
            </p>
            <SuiteInstallAppButton productName={family.productName} />
          </div>
        </section>

        {/* 8. Final CTA */}
        <section className={styles.ctaSection} aria-labelledby="cta-heading">
          <div className={styles.ctaBand}>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              {content.ctaTitle}
            </h2>
            <p className={styles.ctaText}>{content.ctaText}</p>
            <div className={styles.ctaActions}>
              <Link href={family.signupHref} className={styles.btnHeroPrimary}>
                {content.ctaLabel}
                <ArrowRight />
              </Link>
              <a href="#pricing" className={styles.btnHeroGhost}>
                See pricing
              </a>
            </div>
            <p className={styles.ctaNote}>{content.note} · Cancel anytime</p>
          </div>
        </section>

        {/* 9. Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerTop}>
            <div>
              <div className={styles.footerBrand}>
                <img src="/email-logo.png" alt="" width={26} height={26} />
                Busmo
              </div>
              <p className={styles.footerTag}>
                One platform for the work that runs your business — sales, operations, people and money.
              </p>
            </div>

            <div className={styles.footerCols}>
              <div>
                <h2 className={styles.footerColTitle}>Product</h2>
                <ul className={styles.footerLinks}>
                  <li>
                    <a href="#what-you-get">What you get</a>
                  </li>
                  <li>
                    <a href="#apps">Apps</a>
                  </li>
                  <li>
                    <a href="#pricing">Pricing</a>
                  </li>
                  <li>
                    <a href="#faq">FAQ</a>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className={styles.footerColTitle}>Solutions</h2>
                <ul className={styles.footerLinks}>
                  <li>
                    <Link href="/industries">All solutions</Link>
                  </li>
                  <li>
                    <Link href="/welcome">Busmo Business</Link>
                  </li>
                  <li>
                    <Link href="/sell-welcome">Mo-sell</Link>
                  </li>
                  <li>
                    <Link href="/pricing">Pricing</Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className={styles.footerColTitle}>Account</h2>
                <ul className={styles.footerLinks}>
                  <li>
                    <Link href={family.loginHref}>Sign in</Link>
                  </li>
                  <li>
                    <Link href={family.signupHref}>Create account</Link>
                  </li>
                  <li>
                    <Link href="/welcome/help">Help center</Link>
                  </li>
                  <li>
                    <a href="mailto:busmohq@gmail.com">Contact us</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© {year} Busmo. Built for African businesses.</span>
            <span>Same Busmo platform. Built for {family.label.toLowerCase()} operations.</span>
          </div>
        </footer>
      </div>
    </SuiteChrome>
  );
}

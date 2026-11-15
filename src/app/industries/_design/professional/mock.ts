import { addDays, todayISO } from '../format';
import type {
  Client,
  ProActivity,
  ProEvent,
  ProExpense,
  ProInvoice,
  ProMember,
  ProRevenuePoint,
  Project,
  ProTask,
  TaskPriority,
  TimeEntry,
} from '../types';

const TODAY = todayISO();
const CUR = 'NGN';

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const firm = {
  name: 'Northwind Studio',
  legalName: 'Northwind Creative Ltd',
  location: 'Victoria Island, Lagos',
  address: '8A Akin Adesola Street, Victoria Island, Lagos',
  phone: '+234 803 555 0142',
  email: 'hello@northwind.studio',
  website: 'northwind.studio',
  currency: CUR,
  taxRate: 7.5,
  founded: '2019',
  ownerName: 'Tobi Adeyemi',
  ownerEmail: 'tobi@northwind.studio',
  standardRate: 65000,
  monthlyTarget: 18_000_000,
  paymentTerms: 14,
};

/* ── Clients ──────────────────────────────────────────────────────── */

export const clients: Client[] = [
  {
    id: 'client-aura',
    name: 'Adekunle Ajayi',
    company: 'Aura Financial',
    email: 'adekunle@aurafinancial.ng',
    phone: '+234 802 114 8801',
    industry: 'Financial services',
    status: 'active',
    retainer: 1_200_000,
    since: addDays(TODAY, -640),
    projects: 2,
    billed: 8_400_000,
    notes: 'Brand system is the flagship engagement. Quarterly board review in December.',
  },
  {
    id: 'client-verdant',
    name: 'Ngozi Eze',
    company: 'Verdant Foods',
    email: 'ngozi@verdantfoods.com',
    phone: '+234 805 330 7120',
    industry: 'Consumer goods',
    status: 'active',
    retainer: 650_000,
    since: addDays(TODAY, -310),
    projects: 1,
    billed: 3_900_000,
    notes: 'Packaging suite entering final review. Wants shelf photography next quarter.',
  },
  {
    id: 'client-helio',
    name: 'Ibrahim Musa',
    company: 'Helio Energy',
    email: 'ibrahim@helioenergy.africa',
    phone: '+234 807 210 4455',
    industry: 'Energy',
    status: 'active',
    retainer: 900_000,
    since: addDays(TODAY, -480),
    projects: 2,
    billed: 6_250_000,
    notes: 'Investor site is the priority; brand film is paused until funding closes.',
  },
  {
    id: 'client-northline',
    name: 'Funke Adebayo',
    company: 'Northline Logistics',
    email: 'funke@northline.ng',
    phone: '+234 809 441 2200',
    industry: 'Logistics',
    status: 'paused',
    retainer: 400_000,
    since: addDays(TODAY, -520),
    projects: 1,
    billed: 2_500_000,
    notes: 'Ops dashboard paused while they migrate their warehouse system.',
  },
  {
    id: 'client-kite',
    name: 'Chuka Obi',
    company: 'Kite & Co',
    email: 'chuka@kiteandco.com',
    phone: '+234 806 900 3311',
    industry: 'Hospitality',
    status: 'active',
    retainer: 300_000,
    since: addDays(TODAY, -200),
    projects: 1,
    billed: 1_800_000,
    notes: 'Identity delivered. Retainer covers ongoing social templates.',
  },
  {
    id: 'client-lumen',
    name: 'Dr. Bola Ade',
    company: 'Lumen Health',
    email: 'bola@lumenhealth.ng',
    phone: '+234 803 772 6600',
    industry: 'Healthcare',
    status: 'active',
    retainer: 750_000,
    since: addDays(TODAY, -390),
    projects: 2,
    billed: 5_200_000,
    notes: 'Patient portal is in build. Campaign toolkit starts after the portal launch.',
  },
  {
    id: 'client-salt',
    name: 'Amara Nwankwo',
    company: 'Salt & Pepper Hospitality',
    email: 'amara@saltandpepper.ng',
    phone: '+234 808 654 1122',
    industry: 'Hospitality',
    status: 'active',
    retainer: 500_000,
    since: addDays(TODAY, -450),
    projects: 1,
    billed: 2_100_000,
    notes: 'Website live. Discussing a second location launch in the new year.',
  },
  {
    id: 'client-orbit',
    name: 'Tunde Balogun',
    company: 'Orbit Mobility',
    email: 'tunde@orbitmobility.com',
    phone: '+234 802 500 8899',
    industry: 'Mobility',
    status: 'closed',
    retainer: 0,
    since: addDays(TODAY, -700),
    projects: 1,
    billed: 1_500_000,
    notes: 'Loyalty concept shelved after their acquisition. Revisit next year.',
  },
  {
    id: 'client-fairview',
    name: 'Mrs. Chioma Umeh',
    company: 'Fairview Schools',
    email: 'chioma@fairviewschools.edu.ng',
    phone: '+234 805 118 7700',
    industry: 'Education',
    status: 'active',
    retainer: 350_000,
    since: addDays(TODAY, -260),
    projects: 1,
    billed: 1_400_000,
    notes: 'Admissions funnel launching before the January intake.',
  },
  {
    id: 'client-pebble',
    name: 'Jide Okafor',
    company: 'Pebble Studio',
    email: 'jide@pebblestudio.co',
    phone: '+234 807 664 5533',
    industry: 'Media',
    status: 'active',
    retainer: 250_000,
    since: addDays(TODAY, -150),
    projects: 1,
    billed: 750_000,
    notes: 'Small retainer for art direction support. Low-touch but consistent.',
  },
];

/* ── Team ─────────────────────────────────────────────────────────── */

export const team: ProMember[] = [
  {
    id: 'member-tobi',
    full_name: 'Tobi Adeyemi',
    email: 'tobi@northwind.studio',
    phone: '+234 803 555 0142',
    role: 'Founder & strategy lead',
    discipline: 'Strategy',
    status: 'active',
    utilisation: 78,
    billable_hours: 112,
    capacity: 144,
    rate: 75000,
    projects: 6,
    started: '2019-02-04',
  },
  {
    id: 'member-zainab',
    full_name: 'Zainab Bello',
    email: 'zainab@northwind.studio',
    phone: '+234 805 220 1144',
    role: 'Design director',
    discipline: 'Design',
    status: 'active',
    utilisation: 92,
    billable_hours: 132,
    capacity: 144,
    rate: 65000,
    projects: 5,
    started: '2020-06-15',
  },
  {
    id: 'member-emeka',
    full_name: 'Emeka Nwosu',
    email: 'emeka@northwind.studio',
    phone: '+234 807 991 2233',
    role: 'Senior product designer',
    discipline: 'Design',
    status: 'active',
    utilisation: 88,
    billable_hours: 127,
    capacity: 144,
    rate: 55000,
    projects: 4,
    started: '2021-03-08',
  },
  {
    id: 'member-ifeoma',
    full_name: 'Ifeoma Obi',
    email: 'ifeoma@northwind.studio',
    phone: '+234 802 774 6655',
    role: 'Brand designer',
    discipline: 'Design',
    status: 'active',
    utilisation: 74,
    billable_hours: 106,
    capacity: 144,
    rate: 45000,
    projects: 3,
    started: '2022-01-24',
  },
  {
    id: 'member-kunle',
    full_name: 'Kunle Salami',
    email: 'kunle@northwind.studio',
    phone: '+234 806 330 7788',
    role: 'Front-end engineer',
    discipline: 'Engineering',
    status: 'active',
    utilisation: 81,
    billable_hours: 117,
    capacity: 144,
    rate: 50000,
    projects: 3,
    started: '2021-09-13',
  },
  {
    id: 'member-halima',
    full_name: 'Halima Yusuf',
    email: 'halima@northwind.studio',
    phone: '+234 809 220 9911',
    role: 'Content strategist',
    discipline: 'Content',
    status: 'on_leave',
    utilisation: 0,
    billable_hours: 0,
    capacity: 0,
    rate: 40000,
    projects: 2,
    started: '2022-07-11',
  },
  {
    id: 'member-damilola',
    full_name: 'Damilola Eze',
    email: 'damilola@northwind.studio',
    phone: '+234 803 660 4411',
    role: 'Project manager',
    discipline: 'Operations',
    status: 'active',
    utilisation: 69,
    billable_hours: 99,
    capacity: 144,
    rate: 38000,
    projects: 7,
    started: '2021-11-02',
  },
  {
    id: 'member-seun',
    full_name: 'Seun Akinola',
    email: 'seun@northwind.studio',
    phone: '+234 805 887 3322',
    role: 'Motion designer',
    discipline: 'Design',
    status: 'active',
    utilisation: 56,
    billable_hours: 81,
    capacity: 144,
    rate: 42000,
    projects: 2,
    started: '2023-04-17',
  },
];

/* ── Projects ─────────────────────────────────────────────────────── */

export const projects: Project[] = [
  {
    id: 'project-aura-brand',
    name: 'Aura brand system refresh',
    code: 'AUR-01',
    client_id: 'client-aura',
    client_name: 'Aura Financial',
    status: 'active',
    progress: 68,
    budget: 6_500_000,
    spent: 4_100_000,
    start: addDays(TODAY, -42),
    due: addDays(TODAY, 18),
    lead: 'Zainab Bello',
    team: ['Zainab Bello', 'Ifeoma Obi', 'Tobi Adeyemi'],
    priority: 'high',
    tasks_done: 24,
    tasks_total: 38,
    description:
      'A full refresh of the Aura identity — logo system, typography, colour, motion rules and a living brand portal.',
    tags: ['Brand', 'Design system'],
  },
  {
    id: 'project-aura-app',
    name: 'Aura mobile app 2.0',
    code: 'AUR-02',
    client_id: 'client-aura',
    client_name: 'Aura Financial',
    status: 'active',
    progress: 42,
    budget: 12_000_000,
    spent: 4_800_000,
    start: addDays(TODAY, -28),
    due: addDays(TODAY, 46),
    lead: 'Emeka Nwosu',
    team: ['Emeka Nwosu', 'Kunle Salami', 'Damilola Eze'],
    priority: 'high',
    tasks_done: 15,
    tasks_total: 44,
    description:
      'End-to-end redesign of the Aura banking app — onboarding, transfers, savings and a new insights tab.',
    tags: ['Product', 'Mobile'],
  },
  {
    id: 'project-verdant-packaging',
    name: 'Verdant packaging suite',
    code: 'VER-01',
    client_id: 'client-verdant',
    client_name: 'Verdant Foods',
    status: 'review',
    progress: 88,
    budget: 3_200_000,
    spent: 2_700_000,
    start: addDays(TODAY, -70),
    due: addDays(TODAY, 4),
    lead: 'Ifeoma Obi',
    team: ['Ifeoma Obi', 'Zainab Bello'],
    priority: 'urgent',
    tasks_done: 21,
    tasks_total: 24,
    description:
      'Shelf-ready packaging for the new cold-press range, including dielines, print specs and a usage guide.',
    tags: ['Packaging', 'Print'],
  },
  {
    id: 'project-helio-site',
    name: 'Helio investor site',
    code: 'HEL-01',
    client_id: 'client-helio',
    client_name: 'Helio Energy',
    status: 'active',
    progress: 55,
    budget: 4_800_000,
    spent: 2_500_000,
    start: addDays(TODAY, -35),
    due: addDays(TODAY, 21),
    lead: 'Kunle Salami',
    team: ['Kunle Salami', 'Emeka Nwosu', 'Halima Yusuf'],
    priority: 'high',
    tasks_done: 12,
    tasks_total: 26,
    description:
      'A crisp investor-facing site with a live impact dashboard, data room and a story-driven narrative.',
    tags: ['Web', 'Storytelling'],
  },
  {
    id: 'project-helio-film',
    name: 'Helio brand film',
    code: 'HEL-02',
    client_id: 'client-helio',
    client_name: 'Helio Energy',
    status: 'on_hold',
    progress: 30,
    budget: 3_500_000,
    spent: 1_100_000,
    start: addDays(TODAY, -50),
    due: addDays(TODAY, 60),
    lead: 'Seun Akinola',
    team: ['Seun Akinola', 'Halima Yusuf'],
    priority: 'medium',
    tasks_done: 5,
    tasks_total: 18,
    description:
      'A 90-second brand film for the funding round. Paused until the investor site launches.',
    tags: ['Motion', 'Film'],
  },
  {
    id: 'project-northline-dash',
    name: 'Northline ops dashboard',
    code: 'NOR-01',
    client_id: 'client-northline',
    client_name: 'Northline Logistics',
    status: 'on_hold',
    progress: 35,
    budget: 7_200_000,
    spent: 2_500_000,
    start: addDays(TODAY, -90),
    due: addDays(TODAY, 45),
    lead: 'Damilola Eze',
    team: ['Damilola Eze', 'Kunle Salami', 'Emeka Nwosu'],
    priority: 'medium',
    tasks_done: 9,
    tasks_total: 28,
    description:
      'Internal operations dashboard for fleet tracking, dispatch and exception handling across eight hubs.',
    tags: ['Product', 'Operations'],
  },
  {
    id: 'project-kite-identity',
    name: 'Kite & Co identity',
    code: 'KIT-01',
    client_id: 'client-kite',
    client_name: 'Kite & Co',
    status: 'done',
    progress: 100,
    budget: 1_800_000,
    spent: 1_650_000,
    start: addDays(TODAY, -120),
    due: addDays(TODAY, -12),
    lead: 'Ifeoma Obi',
    team: ['Ifeoma Obi', 'Seun Akinola'],
    priority: 'medium',
    tasks_done: 16,
    tasks_total: 16,
    description:
      'A warm, editorial identity for a boutique hospitality group, with menus, signage and social templates.',
    tags: ['Brand', 'Hospitality'],
  },
  {
    id: 'project-lumen-portal',
    name: 'Lumen patient portal',
    code: 'LUM-01',
    client_id: 'client-lumen',
    client_name: 'Lumen Health',
    status: 'active',
    progress: 61,
    budget: 9_500_000,
    spent: 5_200_000,
    start: addDays(TODAY, -55),
    due: addDays(TODAY, 34),
    lead: 'Damilola Eze',
    team: ['Damilola Eze', 'Emeka Nwosu', 'Kunle Salami'],
    priority: 'high',
    tasks_done: 19,
    tasks_total: 32,
    description:
      'Patient booking, records and reminders in one calm portal — designed alongside their clinical team.',
    tags: ['Product', 'Health'],
  },
  {
    id: 'project-lumen-campaign',
    name: 'Lumen campaign toolkit',
    code: 'LUM-02',
    client_id: 'client-lumen',
    client_name: 'Lumen Health',
    status: 'active',
    progress: 25,
    budget: 2_400_000,
    spent: 700_000,
    start: addDays(TODAY, -14),
    due: addDays(TODAY, 28),
    lead: 'Halima Yusuf',
    team: ['Halima Yusuf', 'Ifeoma Obi'],
    priority: 'medium',
    tasks_done: 4,
    tasks_total: 17,
    description:
      'A modular campaign kit for the new year wellness push — social, out-of-home and email templates.',
    tags: ['Campaign', 'Content'],
  },
  {
    id: 'project-salt-site',
    name: 'Salt & Pepper website',
    code: 'SAL-01',
    client_id: 'client-salt',
    client_name: 'Salt & Pepper Hospitality',
    status: 'done',
    progress: 100,
    budget: 2_100_000,
    spent: 1_950_000,
    start: addDays(TODAY, -100),
    due: addDays(TODAY, -5),
    lead: 'Kunle Salami',
    team: ['Kunle Salami', 'Ifeoma Obi'],
    priority: 'medium',
    tasks_done: 14,
    tasks_total: 14,
    description: 'A reservation-first restaurant site with menus, private dining and a story-led gallery.',
    tags: ['Web', 'Hospitality'],
  },
  {
    id: 'project-fairview-funnel',
    name: 'Fairview admissions funnel',
    code: 'FAI-01',
    client_id: 'client-fairview',
    client_name: 'Fairview Schools',
    status: 'active',
    progress: 48,
    budget: 3_600_000,
    spent: 1_400_000,
    start: addDays(TODAY, -22),
    due: addDays(TODAY, 24),
    lead: 'Tobi Adeyemi',
    team: ['Tobi Adeyemi', 'Kunle Salami', 'Halima Yusuf'],
    priority: 'medium',
    tasks_done: 8,
    tasks_total: 19,
    description:
      'An admissions landing experience and enquiry flow built to lift January intake conversions.',
    tags: ['Web', 'Growth'],
  },
  {
    id: 'project-orbit-loyalty',
    name: 'Orbit loyalty concept',
    code: 'ORB-01',
    client_id: 'client-orbit',
    client_name: 'Orbit Mobility',
    status: 'draft',
    progress: 0,
    budget: 1_500_000,
    spent: 0,
    start: addDays(TODAY, 10),
    due: addDays(TODAY, 40),
    lead: 'Zainab Bello',
    team: ['Zainab Bello'],
    priority: 'low',
    tasks_done: 0,
    tasks_total: 6,
    description:
      'A speculative loyalty concept for Orbit riders. Waiting on approval before the kick-off.',
    tags: ['Concept', 'Loyalty'],
  },
];

/* ── Tasks ────────────────────────────────────────────────────────── */

const taskSeeds: {
  title: string;
  project: string;
  assignee: string;
  status: ProTask['status'];
  priority: TaskPriority;
  dueOffset: number;
  estimate: number;
  labels: string[];
}[] = [
  {
    title: 'Finalise logo lock-ups and clear space',
    project: 'project-aura-brand',
    assignee: 'Zainab Bello',
    status: 'in_progress',
    priority: 'high',
    dueOffset: 1,
    estimate: 6,
    labels: ['Brand', 'Design'],
  },
  {
    title: 'Write the motion usage rules',
    project: 'project-aura-brand',
    assignee: 'Seun Akinola',
    status: 'todo',
    priority: 'medium',
    dueOffset: 4,
    estimate: 4,
    labels: ['Motion'],
  },
  {
    title: 'Typography scale audit',
    project: 'project-aura-brand',
    assignee: 'Ifeoma Obi',
    status: 'done',
    priority: 'medium',
    dueOffset: -3,
    estimate: 5,
    labels: ['Brand'],
  },
  {
    title: 'Onboarding flow — high-fidelity screens',
    project: 'project-aura-app',
    assignee: 'Emeka Nwosu',
    status: 'in_progress',
    priority: 'urgent',
    dueOffset: 0,
    estimate: 12,
    labels: ['Product', 'Mobile'],
  },
  {
    title: 'Insights tab data model review',
    project: 'project-aura-app',
    assignee: 'Kunle Salami',
    status: 'review',
    priority: 'high',
    dueOffset: 2,
    estimate: 5,
    labels: ['Engineering'],
  },
  {
    title: 'Prepare packaging print files',
    project: 'project-verdant-packaging',
    assignee: 'Ifeoma Obi',
    status: 'review',
    priority: 'urgent',
    dueOffset: 0,
    estimate: 8,
    labels: ['Print', 'Production'],
  },
  {
    title: 'Cold-press dieline corrections',
    project: 'project-verdant-packaging',
    assignee: 'Zainab Bello',
    status: 'in_progress',
    priority: 'high',
    dueOffset: 1,
    estimate: 3,
    labels: ['Packaging'],
  },
  {
    title: 'Build impact dashboard charts',
    project: 'project-helio-site',
    assignee: 'Kunle Salami',
    status: 'in_progress',
    priority: 'high',
    dueOffset: 3,
    estimate: 10,
    labels: ['Web', 'Engineering'],
  },
  {
    title: 'Draft the investor story copy',
    project: 'project-helio-site',
    assignee: 'Halima Yusuf',
    status: 'review',
    priority: 'medium',
    dueOffset: 2,
    estimate: 6,
    labels: ['Copy'],
  },
  {
    title: 'Data room permissions spec',
    project: 'project-helio-site',
    assignee: 'Damilola Eze',
    status: 'todo',
    priority: 'medium',
    dueOffset: 6,
    estimate: 2,
    labels: ['Planning'],
  },
  {
    title: 'Patient records IA workshop',
    project: 'project-lumen-portal',
    assignee: 'Emeka Nwosu',
    status: 'in_progress',
    priority: 'high',
    dueOffset: 4,
    estimate: 8,
    labels: ['Product', 'Research'],
  },
  {
    title: 'Reminder notification copy',
    project: 'project-lumen-portal',
    assignee: 'Halima Yusuf',
    status: 'todo',
    priority: 'low',
    dueOffset: 9,
    estimate: 3,
    labels: ['Copy'],
  },
  {
    title: 'Appointment booking QA pass',
    project: 'project-lumen-portal',
    assignee: 'Kunle Salami',
    status: 'todo',
    priority: 'high',
    dueOffset: 7,
    estimate: 6,
    labels: ['QA'],
  },
  {
    title: 'Wellness campaign moodboard',
    project: 'project-lumen-campaign',
    assignee: 'Ifeoma Obi',
    status: 'in_progress',
    priority: 'medium',
    dueOffset: 5,
    estimate: 4,
    labels: ['Campaign'],
  },
  {
    title: 'January intake landing copy',
    project: 'project-fairview-funnel',
    assignee: 'Halima Yusuf',
    status: 'done',
    priority: 'medium',
    dueOffset: -2,
    estimate: 5,
    labels: ['Growth', 'Copy'],
  },
  {
    title: 'Enquiry form validation states',
    project: 'project-fairview-funnel',
    assignee: 'Kunle Salami',
    status: 'in_progress',
    priority: 'medium',
    dueOffset: 3,
    estimate: 3,
    labels: ['Engineering'],
  },
  {
    title: 'Review Q3 retainer scope',
    project: 'project-aura-brand',
    assignee: 'Tobi Adeyemi',
    status: 'todo',
    priority: 'low',
    dueOffset: 8,
    estimate: 2,
    labels: ['Strategy'],
  },
  {
    title: 'Archive Kite & Co source files',
    project: 'project-kite-identity',
    assignee: 'Damilola Eze',
    status: 'done',
    priority: 'low',
    dueOffset: -1,
    estimate: 1,
    labels: ['Operations'],
  },
];

export const tasks: ProTask[] = taskSeeds.map((seed, index) => {
  const project = projects.find((p) => p.id === seed.project)!;
  return {
    id: `task-${index + 1}`,
    title: seed.title,
    project_id: project.id,
    project_name: project.name,
    client_name: project.client_name,
    assignee: seed.assignee,
    status: seed.status,
    priority: seed.priority,
    due: addDays(TODAY, seed.dueOffset),
    estimate: seed.estimate,
    labels: seed.labels,
  };
});

/* ── Calendar ─────────────────────────────────────────────────────── */

export const events: ProEvent[] = [
  {
    id: 'event-1',
    title: 'Design crit — Aura brand',
    type: 'review',
    date: TODAY,
    start: '09:00',
    end: '10:00',
    location: 'Studio · Table 2',
    attendees: ['Zainab Bello', 'Ifeoma Obi', 'Seun Akinola'],
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
  },
  {
    id: 'event-2',
    title: 'Aura stakeholder sync',
    type: 'meeting',
    date: TODAY,
    start: '11:00',
    end: '11:45',
    location: 'Google Meet',
    attendees: ['Tobi Adeyemi', 'Zainab Bello'],
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
  },
  {
    id: 'event-3',
    title: 'Lumen sprint planning',
    type: 'meeting',
    date: TODAY,
    start: '14:00',
    end: '15:00',
    location: 'Studio · Room B',
    attendees: ['Damilola Eze', 'Emeka Nwosu', 'Kunle Salami'],
    project_id: 'project-lumen-portal',
    project_name: 'Lumen patient portal',
  },
  {
    id: 'event-4',
    title: 'Verdant packaging sign-off',
    type: 'deadline',
    date: addDays(TODAY, 1),
    start: '10:00',
    end: '11:00',
    location: 'Client office · Ikoyi',
    attendees: ['Ifeoma Obi', 'Zainab Bello'],
    project_id: 'project-verdant-packaging',
    project_name: 'Verdant packaging suite',
  },
  {
    id: 'event-5',
    title: 'Focus block — Helio site',
    type: 'focus',
    date: addDays(TODAY, 1),
    start: '13:00',
    end: '16:00',
    location: 'Studio',
    attendees: ['Kunle Salami'],
    project_id: 'project-helio-site',
    project_name: 'Helio investor site',
  },
  {
    id: 'event-6',
    title: 'Helio site demo',
    type: 'call',
    date: addDays(TODAY, 2),
    start: '15:00',
    end: '15:45',
    location: 'Zoom',
    attendees: ['Kunle Salami', 'Tobi Adeyemi'],
    project_id: 'project-helio-site',
    project_name: 'Helio investor site',
  },
  {
    id: 'event-7',
    title: 'Fairview admissions workshop',
    type: 'meeting',
    date: addDays(TODAY, 3),
    start: '10:00',
    end: '12:00',
    location: 'Fairview Schools',
    attendees: ['Tobi Adeyemi', 'Halima Yusuf'],
    project_id: 'project-fairview-funnel',
    project_name: 'Fairview admissions funnel',
  },
  {
    id: 'event-8',
    title: 'Monthly invoice run',
    type: 'deadline',
    date: addDays(TODAY, 3),
    start: '16:00',
    end: '17:00',
    location: 'Remote',
    attendees: ['Tobi Adeyemi', 'Damilola Eze'],
  },
  {
    id: 'event-9',
    title: 'Studio all-hands',
    type: 'meeting',
    date: addDays(TODAY, 4),
    start: '11:00',
    end: '12:00',
    location: 'Studio · Main space',
    attendees: team.map((m) => m.full_name),
  },
  {
    id: 'event-10',
    title: 'Aura app usability round',
    type: 'review',
    date: addDays(TODAY, 4),
    start: '14:00',
    end: '15:30',
    location: 'Studio · Room A',
    attendees: ['Emeka Nwosu', 'Damilola Eze'],
    project_id: 'project-aura-app',
    project_name: 'Aura mobile app 2.0',
  },
  {
    id: 'event-11',
    title: 'Verdant launch assets due',
    type: 'deadline',
    date: addDays(TODAY, 5),
    start: '09:00',
    end: '09:30',
    location: 'Remote',
    attendees: ['Ifeoma Obi'],
    project_id: 'project-verdant-packaging',
    project_name: 'Verdant packaging suite',
  },
  {
    id: 'event-12',
    title: 'Brand portal handover',
    type: 'meeting',
    date: addDays(TODAY, 6),
    start: '10:00',
    end: '11:30',
    location: 'Google Meet',
    attendees: ['Zainab Bello', 'Tobi Adeyemi'],
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
  },
];

/* ── Time tracking ────────────────────────────────────────────────── */

export const timeEntries: TimeEntry[] = [
  {
    id: 'time-1',
    date: TODAY,
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
    client_name: 'Aura Financial',
    task: 'Finalise logo lock-ups',
    member: 'Zainab Bello',
    hours: 3.5,
    billable: true,
    rate: 65000,
    notes: 'Cleaned up the monogram and horizontal lock-up.',
  },
  {
    id: 'time-2',
    date: TODAY,
    project_id: 'project-verdant-packaging',
    project_name: 'Verdant packaging suite',
    client_name: 'Verdant Foods',
    task: 'Print-ready dielines',
    member: 'Ifeoma Obi',
    hours: 4,
    billable: true,
    rate: 45000,
  },
  {
    id: 'time-3',
    date: TODAY,
    project_id: 'project-lumen-portal',
    project_name: 'Lumen patient portal',
    client_name: 'Lumen Health',
    task: 'Sprint planning',
    member: 'Damilola Eze',
    hours: 1.5,
    billable: false,
    rate: 38000,
  },
  {
    id: 'time-4',
    date: TODAY,
    project_id: 'project-aura-app',
    project_name: 'Aura mobile app 2.0',
    client_name: 'Aura Financial',
    task: 'Onboarding screens',
    member: 'Emeka Nwosu',
    hours: 5,
    billable: true,
    rate: 55000,
  },
  {
    id: 'time-5',
    date: addDays(TODAY, -1),
    project_id: 'project-helio-site',
    project_name: 'Helio investor site',
    client_name: 'Helio Energy',
    task: 'Impact dashboard charts',
    member: 'Kunle Salami',
    hours: 6.5,
    billable: true,
    rate: 50000,
  },
  {
    id: 'time-6',
    date: addDays(TODAY, -1),
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
    client_name: 'Aura Financial',
    task: 'Brand guidelines copy',
    member: 'Tobi Adeyemi',
    hours: 2,
    billable: true,
    rate: 75000,
  },
  {
    id: 'time-7',
    date: addDays(TODAY, -1),
    project_id: 'project-lumen-campaign',
    project_name: 'Lumen campaign toolkit',
    client_name: 'Lumen Health',
    task: 'Campaign moodboard',
    member: 'Ifeoma Obi',
    hours: 3,
    billable: true,
    rate: 45000,
  },
  {
    id: 'time-8',
    date: addDays(TODAY, -2),
    project_id: 'project-aura-app',
    project_name: 'Aura mobile app 2.0',
    client_name: 'Aura Financial',
    task: 'Insights tab flows',
    member: 'Emeka Nwosu',
    hours: 4.5,
    billable: true,
    rate: 55000,
  },
  {
    id: 'time-9',
    date: addDays(TODAY, -2),
    project_id: 'project-helio-site',
    project_name: 'Helio investor site',
    client_name: 'Helio Energy',
    task: 'Data room permissions',
    member: 'Damilola Eze',
    hours: 2.5,
    billable: true,
    rate: 38000,
  },
  {
    id: 'time-10',
    date: addDays(TODAY, -3),
    project_id: 'project-fairview-funnel',
    project_name: 'Fairview admissions funnel',
    client_name: 'Fairview Schools',
    task: 'Enquiry form build',
    member: 'Kunle Salami',
    hours: 5.5,
    billable: true,
    rate: 50000,
  },
  {
    id: 'time-11',
    date: addDays(TODAY, -3),
    project_id: 'project-verdant-packaging',
    project_name: 'Verdant packaging suite',
    client_name: 'Verdant Foods',
    task: 'Packaging revisions',
    member: 'Ifeoma Obi',
    hours: 4,
    billable: true,
    rate: 45000,
  },
  {
    id: 'time-12',
    date: addDays(TODAY, -4),
    project_id: 'project-lumen-portal',
    project_name: 'Lumen patient portal',
    client_name: 'Lumen Health',
    task: 'Records IA workshop',
    member: 'Emeka Nwosu',
    hours: 6,
    billable: true,
    rate: 55000,
  },
  {
    id: 'time-13',
    date: addDays(TODAY, -4),
    project_id: 'project-helio-film',
    project_name: 'Helio brand film',
    client_name: 'Helio Energy',
    task: 'Storyboard drafts',
    member: 'Seun Akinola',
    hours: 3,
    billable: true,
    rate: 42000,
  },
  {
    id: 'time-14',
    date: addDays(TODAY, -4),
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
    client_name: 'Aura Financial',
    task: 'Stakeholder prep',
    member: 'Tobi Adeyemi',
    hours: 1.5,
    billable: false,
    rate: 75000,
  },
];

/* ── Invoices ─────────────────────────────────────────────────────── */

export const invoices: ProInvoice[] = [
  {
    id: 'invoice-2052',
    number: 'NW-2052',
    client_id: 'client-verdant',
    client_name: 'Verdant Foods',
    project_id: 'project-verdant-packaging',
    project_name: 'Verdant packaging suite',
    items: [
      { name: 'Packaging design — phase 2', qty: 1, rate: 1_400_000 },
      { name: 'Print production support', qty: 1, rate: 450_000 },
    ],
    amount: 1_850_000,
    paid: 0,
    status: 'overdue',
    issued: addDays(TODAY, -32),
    due: addDays(TODAY, -18),
  },
  {
    id: 'invoice-2051',
    number: 'NW-2051',
    client_id: 'client-aura',
    client_name: 'Aura Financial',
    project_id: 'project-aura-brand',
    project_name: 'Aura brand system refresh',
    items: [
      { name: 'Brand system — milestone 2', qty: 1, rate: 2_800_000 },
      { name: 'Brand portal build', qty: 1, rate: 900_000 },
    ],
    amount: 3_700_000,
    paid: 1_500_000,
    status: 'sent',
    issued: addDays(TODAY, -16),
    due: addDays(TODAY, -2),
  },
  {
    id: 'invoice-2050',
    number: 'NW-2050',
    client_id: 'client-helio',
    client_name: 'Helio Energy',
    project_id: 'project-helio-site',
    project_name: 'Helio investor site',
    items: [
      { name: 'Website design — 50%', qty: 1, rate: 2_400_000 },
      { name: 'Impact dashboard', qty: 1, rate: 850_000 },
    ],
    amount: 3_250_000,
    paid: 0,
    status: 'sent',
    issued: addDays(TODAY, -10),
    due: addDays(TODAY, 4),
  },
  {
    id: 'invoice-2049',
    number: 'NW-2049',
    client_id: 'client-lumen',
    client_name: 'Lumen Health',
    project_id: 'project-lumen-portal',
    project_name: 'Lumen patient portal',
    items: [
      { name: 'Patient portal — sprint 3', qty: 1, rate: 1_800_000 },
      { name: 'Clinical workshop', qty: 2, rate: 250_000 },
    ],
    amount: 2_300_000,
    paid: 2_300_000,
    status: 'paid',
    issued: addDays(TODAY, -24),
    due: addDays(TODAY, -10),
  },
  {
    id: 'invoice-2048',
    number: 'NW-2048',
    client_id: 'client-kite',
    client_name: 'Kite & Co',
    project_id: 'project-kite-identity',
    project_name: 'Kite & Co identity',
    items: [
      { name: 'Identity final delivery', qty: 1, rate: 1_200_000 },
      { name: 'Menu templates', qty: 1, rate: 300_000 },
    ],
    amount: 1_500_000,
    paid: 1_500_000,
    status: 'paid',
    issued: addDays(TODAY, -60),
    due: addDays(TODAY, -46),
  },
  {
    id: 'invoice-2047',
    number: 'NW-2047',
    client_id: 'client-salt',
    client_name: 'Salt & Pepper Hospitality',
    project_id: 'project-salt-site',
    project_name: 'Salt & Pepper website',
    items: [
      { name: 'Website final payment', qty: 1, rate: 1_050_000 },
      { name: 'Photography direction', qty: 1, rate: 250_000 },
    ],
    amount: 1_300_000,
    paid: 1_300_000,
    status: 'paid',
    issued: addDays(TODAY, -30),
    due: addDays(TODAY, -16),
  },
  {
    id: 'invoice-2046',
    number: 'NW-2046',
    client_id: 'client-fairview',
    client_name: 'Fairview Schools',
    project_id: 'project-fairview-funnel',
    project_name: 'Fairview admissions funnel',
    items: [
      { name: 'Admissions funnel — deposit', qty: 1, rate: 1_200_000 },
    ],
    amount: 1_200_000,
    paid: 600_000,
    status: 'sent',
    issued: addDays(TODAY, -20),
    due: addDays(TODAY, -6),
  },
  {
    id: 'invoice-2045',
    number: 'NW-2045',
    client_id: 'client-aura',
    client_name: 'Aura Financial',
    project_id: 'project-aura-app',
    project_name: 'Aura mobile app 2.0',
    items: [
      { name: 'App redesign — discovery', qty: 1, rate: 1_600_000 },
      { name: 'Usability testing', qty: 1, rate: 400_000 },
    ],
    amount: 2_000_000,
    paid: 2_000_000,
    status: 'paid',
    issued: addDays(TODAY, -45),
    due: addDays(TODAY, -31),
  },
  {
    id: 'invoice-2044',
    number: 'NW-2044',
    client_id: 'client-helio',
    client_name: 'Helio Energy',
    project_id: 'project-helio-film',
    project_name: 'Helio brand film',
    items: [{ name: 'Brand film — pre-production', qty: 1, rate: 1_100_000 }],
    amount: 1_100_000,
    paid: 0,
    status: 'draft',
    issued: TODAY,
    due: addDays(TODAY, 14),
  },
  {
    id: 'invoice-2043',
    number: 'NW-2043',
    client_id: 'client-northline',
    client_name: 'Northline Logistics',
    project_id: 'project-northline-dash',
    project_name: 'Northline ops dashboard',
    items: [{ name: 'Dashboard discovery', qty: 1, rate: 2_500_000 }],
    amount: 2_500_000,
    paid: 2_500_000,
    status: 'paid',
    issued: addDays(TODAY, -75),
    due: addDays(TODAY, -61),
  },
  {
    id: 'invoice-2042',
    number: 'NW-2042',
    client_id: 'client-pebble',
    client_name: 'Pebble Studio',
    items: [{ name: 'Art direction retainer', qty: 1, rate: 250_000 }],
    amount: 250_000,
    paid: 250_000,
    status: 'paid',
    issued: addDays(TODAY, -14),
    due: addDays(TODAY, 0),
  },
  {
    id: 'invoice-2041',
    number: 'NW-2041',
    client_id: 'client-orbit',
    client_name: 'Orbit Mobility',
    project_id: 'project-orbit-loyalty',
    project_name: 'Orbit loyalty concept',
    items: [{ name: 'Loyalty concept — deposit', qty: 1, rate: 1_500_000 }],
    amount: 1_500_000,
    paid: 1_500_000,
    status: 'paid',
    issued: addDays(TODAY, -95),
    due: addDays(TODAY, -81),
  },
];

/* ── Expenses ─────────────────────────────────────────────────────── */

export const expenses: ProExpense[] = [
  {
    id: 'expense-1',
    vendor: 'Adobe',
    category: 'Software',
    description: 'Creative Cloud for the design team',
    amount: 486_000,
    status: 'approved',
    date: addDays(TODAY, -2),
    member: 'Tobi Adeyemi',
    billable: false,
  },
  {
    id: 'expense-2',
    vendor: 'Figma',
    category: 'Software',
    description: 'Organisation plan — monthly',
    amount: 312_000,
    status: 'approved',
    date: addDays(TODAY, -3),
    member: 'Zainab Bello',
    billable: false,
  },
  {
    id: 'expense-3',
    vendor: 'Verdant print lab',
    category: 'Production',
    description: 'Packaging proofs and colour tests',
    amount: 185_000,
    status: 'pending',
    date: addDays(TODAY, -4),
    project_name: 'Verdant packaging suite',
    member: 'Ifeoma Obi',
    billable: true,
  },
  {
    id: 'expense-4',
    vendor: 'Uber',
    category: 'Travel',
    description: 'Client visit — Fairview Schools',
    amount: 28_500,
    status: 'recorded',
    date: addDays(TODAY, -1),
    project_name: 'Fairview admissions funnel',
    member: 'Tobi Adeyemi',
    billable: true,
  },
  {
    id: 'expense-5',
    vendor: 'The Wheatbaker',
    category: 'Client entertainment',
    description: 'Aura stakeholder lunch',
    amount: 96_000,
    status: 'pending',
    date: addDays(TODAY, -6),
    project_name: 'Aura brand system refresh',
    member: 'Tobi Adeyemi',
    billable: true,
  },
  {
    id: 'expense-6',
    vendor: 'Envato',
    category: 'Assets',
    description: 'Motion presets and stock textures',
    amount: 42_000,
    status: 'recorded',
    date: addDays(TODAY, -8),
    member: 'Seun Akinola',
    billable: false,
  },
  {
    id: 'expense-7',
    vendor: 'Studio rent',
    category: 'Premises',
    description: 'Victoria Island studio — monthly',
    amount: 1_200_000,
    status: 'approved',
    date: addDays(TODAY, -10),
    member: 'Tobi Adeyemi',
    billable: false,
  },
  {
    id: 'expense-8',
    vendor: 'Google Workspace',
    category: 'Software',
    description: 'Team email and storage',
    amount: 98_000,
    status: 'approved',
    date: addDays(TODAY, -10),
    member: 'Damilola Eze',
    billable: false,
  },
  {
    id: 'expense-9',
    vendor: 'Lumen media buy',
    category: 'Media',
    description: 'Wellness campaign placements',
    amount: 420_000,
    status: 'pending',
    date: addDays(TODAY, -5),
    project_name: 'Lumen campaign toolkit',
    member: 'Halima Yusuf',
    billable: true,
  },
  {
    id: 'expense-10',
    vendor: 'DHL',
    category: 'Logistics',
    description: 'Print deliveries to Verdant warehouse',
    amount: 34_000,
    status: 'recorded',
    date: addDays(TODAY, -7),
    project_name: 'Verdant packaging suite',
    member: 'Ifeoma Obi',
    billable: true,
  },
];

/* ── Analytics ────────────────────────────────────────────────────── */

export const revenueSeries: ProRevenuePoint[] = [
  { date: addDays(TODAY, -13), billed: 680_000, collected: 420_000, hours: 34, utilisation: 62 },
  { date: addDays(TODAY, -12), billed: 910_000, collected: 760_000, hours: 38, utilisation: 68 },
  { date: addDays(TODAY, -11), billed: 1_240_000, collected: 890_000, hours: 41, utilisation: 71 },
  { date: addDays(TODAY, -10), billed: 1_050_000, collected: 1_100_000, hours: 39, utilisation: 69 },
  { date: addDays(TODAY, -9), billed: 1_480_000, collected: 980_000, hours: 44, utilisation: 76 },
  { date: addDays(TODAY, -8), billed: 1_260_000, collected: 1_320_000, hours: 42, utilisation: 74 },
  { date: addDays(TODAY, -7), billed: 760_000, collected: 640_000, hours: 28, utilisation: 52 },
  { date: addDays(TODAY, -6), billed: 1_320_000, collected: 1_100_000, hours: 45, utilisation: 79 },
  { date: addDays(TODAY, -5), billed: 1_540_000, collected: 1_260_000, hours: 47, utilisation: 82 },
  { date: addDays(TODAY, -4), billed: 1_180_000, collected: 1_410_000, hours: 43, utilisation: 77 },
  { date: addDays(TODAY, -3), billed: 1_690_000, collected: 1_240_000, hours: 48, utilisation: 84 },
  { date: addDays(TODAY, -2), billed: 1_420_000, collected: 1_520_000, hours: 46, utilisation: 81 },
  { date: addDays(TODAY, -1), billed: 1_760_000, collected: 1_380_000, hours: 49, utilisation: 86 },
  { date: TODAY, billed: 1_300_000, collected: 1_640_000, hours: 40, utilisation: 73 },
];

export const revenueSummary = {
  today: revenueSeries[revenueSeries.length - 1].collected,
  week: revenueSeries.slice(-7).reduce((s, p) => s + p.collected, 0),
  monthToDate: 16_240_000,
  target: 18_000_000,
  outstanding: invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
  overdue: invoices
    .filter((i) => i.status === 'overdue')
    .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
  collectedMTD: invoices.reduce((s, i) => s + i.paid, 0),
  billedMTD: invoices.reduce((s, i) => s + i.amount, 0),
};

export const deliveryStats = {
  activeProjects: projects.filter((p) => p.status === 'active').length,
  atRisk: projects.filter(
    (p) =>
      p.status !== 'done' &&
      p.status !== 'draft' &&
      (p.priority === 'urgent' || p.progress < 35),
  ).length,
  openTasks: tasks.filter((t) => t.status !== 'done').length,
  dueThisWeek: tasks.filter(
    (t) => t.status !== 'done' && t.due >= TODAY && t.due <= addDays(TODAY, 7),
  ).length,
  completedThisWeek: tasks.filter((t) => t.status === 'done').length,
  onHold: projects.filter((p) => p.status === 'on_hold').length,
  totalClients: clients.length,
  activeClients: clients.filter((c) => c.status === 'active').length,
};

export const timeStats = {
  loggedToday: timeEntries
    .filter((t) => t.date === TODAY)
    .reduce((s, t) => s + t.hours, 0),
  loggedWeek: timeEntries.reduce((s, t) => s + t.hours, 0),
  billableHours: timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0),
  nonBillableHours: timeEntries.filter((t) => !t.billable).reduce((s, t) => s + t.hours, 0),
  unbilledValue: timeEntries
    .filter((t) => t.billable)
    .reduce((s, t) => s + t.hours * t.rate, 0),
  avgUtilisation: Math.round(
    team.filter((m) => m.status === 'active').reduce((s, m) => s + m.utilisation, 0) /
      Math.max(1, team.filter((m) => m.status === 'active').length),
  ),
};

export const expensesSummary = {
  total: expenses.reduce((s, e) => s + e.amount, 0),
  pending: expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
  billable: expenses.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0),
  count: expenses.length,
};

export const disciplineMix = [
  { name: 'Design', value: 38, color: 'var(--sol-chart-1)' },
  { name: 'Engineering', value: 24, color: 'var(--sol-chart-2)' },
  { name: 'Strategy', value: 21, color: 'var(--sol-chart-3)' },
  { name: 'Content', value: 10, color: 'var(--sol-chart-4)' },
  { name: 'Operations', value: 7, color: 'var(--sol-chart-5)' },
];

export const projectTypeMix = [
  { name: 'Brand', value: 34, color: 'var(--sol-chart-1)' },
  { name: 'Digital product', value: 31, color: 'var(--sol-chart-2)' },
  { name: 'Websites', value: 21, color: 'var(--sol-chart-3)' },
  { name: 'Campaigns', value: 14, color: 'var(--sol-chart-4)' },
];

export const activity: ProActivity[] = [
  {
    id: 'act-1',
    title: 'Verdant packaging moved to review',
    detail: 'Ifeoma Obi uploaded the final print files',
    time: '12m ago',
    kind: 'project',
  },
  {
    id: 'act-2',
    title: 'Payment received from Lumen Health',
    detail: '₦2,300,000 · invoice NW-2049',
    time: '48m ago',
    kind: 'payment',
  },
  {
    id: 'act-3',
    title: 'Aura app onboarding screens updated',
    detail: 'Emeka Nwosu · 5 hours logged',
    time: '1h ago',
    kind: 'time',
  },
  {
    id: 'act-4',
    title: 'Helio site demo booked',
    detail: 'Thursday 15:00 · Kunle Salami and Tobi Adeyemi',
    time: '2h ago',
    kind: 'task',
  },
  {
    id: 'act-5',
    title: 'Fairview deposit part-paid',
    detail: '₦600,000 received of ₦1,200,000',
    time: '3h ago',
    kind: 'invoice',
  },
  {
    id: 'act-6',
    title: 'New client added — Pebble Studio',
    detail: 'Art direction retainer at ₦250,000 / month',
    time: 'Yesterday',
    kind: 'client',
  },
  {
    id: 'act-7',
    title: 'Kite & Co identity archived',
    detail: 'Source files handed over to the client',
    time: 'Yesterday',
    kind: 'project',
  },
  {
    id: 'act-8',
    title: 'Zainab Bello is at 92% utilisation',
    detail: 'Highest billable load this week',
    time: '2d ago',
    kind: 'time',
  },
];

export const reports = [
  {
    id: 'report-utilisation',
    name: 'Team utilisation',
    description: 'Billable hours against capacity for every member of the studio.',
    cadence: 'Weekly · Mondays',
    lastRun: '2 days ago',
    icon: 'users',
  },
  {
    id: 'report-profitability',
    name: 'Project profitability',
    description: 'Budget, spend and margin by engagement with overrun flags.',
    cadence: 'Monthly · 1st',
    lastRun: '12 days ago',
    icon: 'trend',
  },
  {
    id: 'report-revenue',
    name: 'Revenue & collections',
    description: 'Billed versus collected, with aging buckets for every client.',
    cadence: 'Weekly · Fridays',
    lastRun: 'Yesterday',
    icon: 'wallet',
  },
  {
    id: 'report-clients',
    name: 'Client scorecard',
    description: 'Retainer value, delivery health and payment behaviour by client.',
    cadence: 'Monthly · 5th',
    lastRun: '9 days ago',
    icon: 'badge',
  },
  {
    id: 'report-capacity',
    name: 'Capacity forecast',
    description: 'Upcoming workload against available hours for the next eight weeks.',
    cadence: 'Fortnightly',
    lastRun: '5 days ago',
    icon: 'calendar',
  },
];

export const notifications = [
  {
    id: 'notif-1',
    title: 'Verdant packaging is due in 4 days',
    detail: 'Print files are in review — two tasks remain open.',
    time: '20m ago',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Invoice NW-2052 is 18 days overdue',
    detail: '₦1,850,000 outstanding from Verdant Foods.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Emeka Nwosu hit 88% utilisation',
    detail: 'Consider balancing the Aura app work this week.',
    time: '3h ago',
    unread: true,
  },
  {
    id: 'notif-4',
    title: 'New enquiry from Kite & Co',
    detail: 'They asked about social templates for the new menu launch.',
    time: '5h ago',
    unread: false,
  },
  {
    id: 'notif-5',
    title: 'Helio site demo confirmed',
    detail: 'Thursday at 15:00 on Zoom.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'notif-6',
    title: 'Monthly invoice run due Thursday',
    detail: 'Three draft invoices are ready to send.',
    time: 'Yesterday',
    unread: false,
  },
];

/* ── Live hydration ───────────────────────────────────────────────── */

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function toDay(iso: unknown): string {
  return String(iso || '').slice(0, 10);
}

function proTaskStatus(value: unknown): ProTask['status'] {
  const v = String(value || '').toLowerCase();
  if (v === 'in_progress' || v === 'in-progress') return 'in_progress';
  if (v === 'review' || v === 'in_review') return 'review';
  if (v === 'done' || v === 'completed' || v === 'closed') return 'done';
  return 'todo';
}

function recalcProfessionalSummaries() {
  const activeProjects = projects.filter((p) => p.status === 'active');
  replaceArray(revenueSeries, revenueSeries);
  const byDay = new Map<string, { billed: number; collected: number; hours: number }>();
  for (const invoice of invoices) {
    const key = invoice.issued || TODAY;
    const row = byDay.get(key) || { billed: 0, collected: 0, hours: 0 };
    row.billed += invoice.amount;
    row.collected += invoice.paid;
    byDay.set(key, row);
  }
  for (const entry of timeEntries) {
    const row = byDay.get(entry.date) || { billed: 0, collected: 0, hours: 0 };
    row.hours += entry.hours;
    byDay.set(entry.date, row);
  }
  const days = Array.from(byDay.keys()).sort().slice(-14);
  if (days.length > 1) {
    replaceArray(
      revenueSeries,
      days.map((date) => {
        const row = byDay.get(date) as { billed: number; collected: number; hours: number };
        const util = Math.min(100, Math.round((row.hours / Math.max(1, team.length * 8)) * 100));
        return { date, billed: row.billed, collected: row.collected, hours: row.hours, utilisation: util };
      }),
    );
  }

  const collected = invoices.reduce((s, i) => s + i.paid, 0);
  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  Object.assign(revenueSummary, {
    today: revenueSeries.length
      ? revenueSeries[revenueSeries.length - 1].collected
      : 0,
    week: revenueSeries.slice(-7).reduce((s, p) => s + p.collected, 0),
    monthToDate: collected,
    target: Math.max(18_000_000, Math.round(billed * 1.1)),
    outstanding: invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    overdue: invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + Math.max(0, i.amount - i.paid), 0),
    collectedMTD: collected,
    billedMTD: billed,
  });

  Object.assign(deliveryStats, {
    activeProjects: activeProjects.length,
    atRisk: projects.filter(
      (p) =>
        p.status !== 'done' &&
        p.status !== 'draft' &&
        (p.priority === 'urgent' || p.progress < 35),
    ).length,
    openTasks: tasks.filter((t) => t.status !== 'done').length,
    dueThisWeek: tasks.filter(
      (t) => t.status !== 'done' && t.due >= TODAY && t.due <= addDays(TODAY, 7),
    ).length,
    completedThisWeek: tasks.filter((t) => t.status === 'done').length,
    onHold: projects.filter((p) => p.status === 'on_hold').length,
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === 'active').length,
  });

  Object.assign(timeStats, {
    loggedToday: timeEntries.filter((t) => t.date === TODAY).reduce((s, t) => s + t.hours, 0),
    loggedWeek: timeEntries.reduce((s, t) => s + t.hours, 0),
    billableHours: timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0),
    nonBillableHours: timeEntries.filter((t) => !t.billable).reduce((s, t) => s + t.hours, 0),
    unbilledValue: timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.hours * t.rate, 0),
    avgUtilisation: Math.round(
      team.filter((m) => m.status === 'active').reduce((s, m) => s + m.utilisation, 0) /
        Math.max(1, team.filter((m) => m.status === 'active').length),
    ),
  });

  Object.assign(expensesSummary, {
    total: expenses.reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
    billable: expenses.filter((e) => e.billable).reduce((s, e) => s + e.amount, 0),
    count: expenses.length,
  });

  const disciplineCount = new Map<string, number>();
  for (const member of team) disciplineCount.set(member.discipline, (disciplineCount.get(member.discipline) || 0) + 1);
  const teamTotal = Math.max(1, team.length);
  replaceArray(
    disciplineMix,
    Array.from(disciplineCount.entries()).map(([name, count], i) => ({
      name,
      value: Math.round((count / teamTotal) * 100),
      color: `var(--sol-chart-${(i % 5) + 1})`,
    })),
  );

  const typeCount = new Map<string, number>();
  for (const project of projects) {
    const tag = project.tags[0] || 'Project';
    typeCount.set(tag, (typeCount.get(tag) || 0) + 1);
  }
  const projectTotal = Math.max(1, projects.length);
  replaceArray(
    projectTypeMix,
    Array.from(typeCount.entries()).map(([name, count], i) => ({
      name,
      value: Math.round((count / projectTotal) * 100),
      color: `var(--sol-chart-${(i % 4) + 1})`,
    })),
  );
}

export function hydrateProfessional(payload: any): boolean {
  if (!payload) return false;

  const liveProjects: Project[] = asArray(payload.projects).map((r: any) => {
    const meta = r.meta || {};
    const clientName = String(meta.client_name || meta.clientName || '');
    const client = clients.find((c) => c.name === clientName || c.company === clientName);
    return {
      id: String(r.id),
      name: String(meta.name || r.title || 'Project'),
      code: String(meta.code || `PRJ-${String(r.id).slice(0, 4)}`),
      client_id: String(meta.client_id || client?.id || ''),
      client_name: clientName || client?.company || '',
      status: (['active', 'on_hold', 'review', 'done', 'draft'].includes(String(r.status))
        ? r.status
        : 'active') as Project['status'],
      progress: Number(meta.progress ?? (String(r.status) === 'done' ? 100 : 0)),
      budget: Number(r.amount || meta.budget || 0),
      spent: Number(meta.spent ?? 0),
      start: toDay(meta.start || r.occurred_at || r.created_at),
      due: toDay(meta.due || r.due_date),
      lead: String(meta.lead || ''),
      team: asArray(meta.team).map(String),
      priority: (['low', 'medium', 'high', 'urgent'].includes(String(meta.priority))
        ? meta.priority
        : 'medium') as TaskPriority,
      tasks_done: Number(meta.tasks_done ?? 0),
      tasks_total: Number(meta.tasks_total ?? 0),
      description: String(meta.description || r.notes || ''),
      tags: asArray(meta.tags).map(String),
    };
  });

  const liveExpenses: ProExpense[] = asArray(payload.expenses).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      vendor: String(meta.vendor || r.title || 'Vendor'),
      category: String(meta.category || 'Operations'),
      description: String(meta.description || r.notes || ''),
      amount: Number(r.amount || 0),
      status: (['recorded', 'pending', 'approved'].includes(String(r.status))
        ? r.status
        : 'recorded') as ProExpense['status'],
      date: toDay(meta.date || r.occurred_at || r.created_at),
      project_name: meta.project_name ? String(meta.project_name) : undefined,
      member: String(meta.member || ''),
      billable: Boolean(meta.billable),
    };
  });

  const liveInvoices: ProInvoice[] = asArray(payload.invoices).map((r: any) => {
    const meta = r.meta || {};
    const amount = Number(r.amount || 0);
    const paid = Number(meta.paid ?? meta.paid_amount ?? (String(r.status) === 'paid' ? amount : 0));
    return {
      id: String(r.id),
      number: String(meta.number || r.invoice_number || r.title || 'INV'),
      client_id: String(meta.client_id || ''),
      client_name: String(meta.client_name || r.title || 'Client'),
      project_id: meta.project_id ? String(meta.project_id) : undefined,
      project_name: meta.project_name ? String(meta.project_name) : undefined,
      items: asArray(meta.items),
      amount,
      paid,
      status: (['draft', 'sent', 'paid', 'overdue'].includes(String(r.status))
        ? r.status
        : paid >= amount && amount > 0
          ? 'paid'
          : 'sent') as ProInvoice['status'],
      issued: toDay(meta.issued || r.occurred_at || r.created_at),
      due: toDay(meta.due || r.due_date),
    };
  });

  const liveClients: Client[] = asArray(payload.clients).map((r: any) => {
    const name = String(r.name || 'Client');
    const clientProjects = liveProjects.filter(
      (p) => p.client_name === name || p.client_name === String(r.company || ''),
    );
    const clientInvoices = liveInvoices.filter(
      (i) => i.client_name === name || i.client_name === String(r.company || ''),
    );
    return {
      id: String(r.id),
      name,
      company: String(r.company || name),
      email: String(r.email || ''),
      phone: String(r.phone || ''),
      industry: String(r.industry || ''),
      status: (['active', 'paused', 'closed'].includes(String(r.status))
        ? r.status
        : 'active') as Client['status'],
      retainer: Number(r.retainer || 0),
      since: toDay(r.created_at || r.since),
      projects: clientProjects.length,
      billed: clientInvoices.reduce((s, i) => s + i.amount, 0),
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveTasks: ProTask[] = asArray(payload.tasks).map((r: any) => {
    const project =
      liveProjects.find((p) => p.id === String(r.project_id || '')) ||
      liveProjects.find((p) => p.client_name === String(r.client_name || ''));
    return {
      id: String(r.id),
      title: String(r.title || 'Task'),
      project_id: String(r.project_id || project?.id || ''),
      project_name: String(project?.name || r.project_name || ''),
      client_name: String(r.client_name || project?.client_name || ''),
      assignee: String(r.assignee || ''),
      status: proTaskStatus(r.status),
      priority: (['low', 'medium', 'high', 'urgent'].includes(String(r.priority))
        ? r.priority
        : 'medium') as TaskPriority,
      due: toDay(r.due_date || r.due),
      estimate: Number(r.estimate || 0),
      labels: asArray(r.labels).map(String),
      description: r.description ? String(r.description) : undefined,
    };
  });

  const liveEvents: ProEvent[] = asArray(payload.events).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      title: String(meta.title || r.title || 'Event'),
      type: (['meeting', 'deadline', 'review', 'focus', 'call'].includes(String(meta.type))
        ? meta.type
        : 'meeting') as ProEvent['type'],
      date: toDay(meta.date || r.occurred_at || r.created_at),
      start: String(meta.start || '09:00'),
      end: String(meta.end || '10:00'),
      location: String(meta.location || ''),
      attendees: asArray(meta.attendees).map(String),
      project_id: meta.project_id ? String(meta.project_id) : undefined,
      project_name: meta.project_name ? String(meta.project_name) : undefined,
    };
  });

  const liveTime: TimeEntry[] = asArray(payload.timeEntries).map((r: any) => {
    const meta = r.meta || {};
    const rate = Number(meta.rate || 0);
    const hours = Number(meta.hours ?? (rate ? Number(r.amount || 0) / rate : Number(r.amount || 0)));
    return {
      id: String(r.id),
      date: toDay(meta.date || r.occurred_at || r.created_at),
      project_id: String(meta.project_id || ''),
      project_name: String(meta.project_name || ''),
      client_name: String(meta.client_name || ''),
      task: String(meta.task || r.title || ''),
      member: String(meta.member || ''),
      hours: Number.isFinite(hours) ? hours : 0,
      billable: meta.billable === undefined ? true : Boolean(meta.billable),
      rate,
      notes: r.notes ? String(r.notes) : undefined,
    };
  });

  const liveTeam: ProMember[] = asArray(payload.team).map((r: any) => {
    const meta = r.meta || {};
    return {
      id: String(r.id),
      full_name: String(meta.full_name || r.title || 'Member'),
      email: String(meta.email || ''),
      phone: String(meta.phone || ''),
      role: String(meta.role || ''),
      discipline: (['Design', 'Strategy', 'Engineering', 'Content', 'Operations'].includes(String(meta.discipline))
        ? meta.discipline
        : 'Operations') as ProMember['discipline'],
      status: String(r.status) === 'on_leave' ? 'on_leave' : 'active',
      utilisation: Number(meta.utilisation ?? 0),
      billable_hours: Number(meta.billable_hours ?? 0),
      capacity: Number(meta.capacity ?? 40),
      rate: Number(meta.rate ?? 0),
      projects: liveProjects.filter((p) => p.team.includes(String(meta.full_name || r.title))).length,
      started: toDay(meta.started || r.created_at),
    };
  });

  const settingsRow =
    payload.settings && typeof payload.settings === 'object' ? payload.settings : null;
  const settingsMeta =
    settingsRow && settingsRow.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : null;

  const anyLive =
    liveClients.length +
      liveTasks.length +
      liveProjects.length +
      liveInvoices.length +
      liveTime.length +
      liveEvents.length +
      liveExpenses.length +
      liveTeam.length +
      (settingsMeta ? 1 : 0) >
    0;
  if (!anyLive) return false;

  if (settingsMeta) {
    Object.assign(orgSettings, settingsMeta);
    const s = settingsMeta;
    if (s.name) firm.name = String(s.name);
    if (s.legal) firm.legalName = String(s.legal);
    if (s.phone) firm.phone = String(s.phone);
    if (s.email) firm.email = String(s.email);
    if (s.website) firm.website = String(s.website);
    if (s.address) firm.address = String(s.address);
    if (s.rate != null && s.rate !== '') firm.standardRate = Number(s.rate);
    if (s.tax != null && s.tax !== '') firm.taxRate = Number(s.tax);
    if (s.currency) firm.currency = String(s.currency);
  }

  replaceArray(projects, liveProjects);
  replaceArray(expenses, liveExpenses);
  replaceArray(invoices, liveInvoices);
  replaceArray(clients, liveClients);
  replaceArray(tasks, liveTasks);
  replaceArray(events, liveEvents);
  replaceArray(timeEntries, liveTime);
  replaceArray(team, liveTeam);

  recalcProfessionalSummaries();
  return true;
}

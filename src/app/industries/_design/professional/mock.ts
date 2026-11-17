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
  name: 'Your firm',
  legalName: '',
  location: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  currency: CUR,
  taxRate: 7.5,
  founded: '',
  ownerName: '',
  ownerEmail: '',
  standardRate: 0,
  monthlyTarget: 0,
  paymentTerms: 14,
};

/* ── Clients ──────────────────────────────────────────────────────── */

export const clients: Client[] = [];

/* ── Team ─────────────────────────────────────────────────────────── */

export const team: ProMember[] = [];

/* ── Projects ─────────────────────────────────────────────────────── */

export const projects: Project[] = [];

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

export const tasks: ProTask[] = [];

/* ── Calendar ─────────────────────────────────────────────────────── */

export const events: ProEvent[] = [];

/* ── Time tracking ────────────────────────────────────────────────── */

export const timeEntries: TimeEntry[] = [];

/* ── Invoices ─────────────────────────────────────────────────────── */

export const invoices: ProInvoice[] = [];

/* ── Expenses ─────────────────────────────────────────────────────── */

export const expenses: ProExpense[] = [];

/* ── Analytics ────────────────────────────────────────────────────── */

export const revenueSeries: ProRevenuePoint[] = [];

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

export const disciplineMix: { name: string; value: number; color?: string }[] = [];

export const projectTypeMix: { name: string; value: number; color?: string }[] = [];

export const activity: ProActivity[] = [];

export const reports: { id: string; name: string; description?: string; icon?: string; lastRun?: string; cadence?: string }[] = [];

export const notifications: { id: string; title: string; detail: string; time: string; unread: boolean }[] = [];

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

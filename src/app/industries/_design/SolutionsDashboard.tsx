'use client';

import './solutions-mobile.css';

import React from 'react';
import { SolutionsShell } from './shell';
import { ToastProvider, Banner } from './primitives';
import { getSolutionsSuite } from './suites';
import { SolutionsLiveProvider, useSolutionsLive } from './live';
import { notifications as hospitalityNotifications } from './hospitality/mock';
import { notifications as healthcareNotifications } from './healthcare/mock';
import { HospitalityOverview } from './hospitality/overview';
import { HospitalityReservations } from './hospitality/reservations';
import { HospitalityRooms } from './hospitality/rooms';
import { HospitalityGuests } from './hospitality/guests';
import { HospitalityCheckin } from './hospitality/frontdesk';
import {
  HospitalityHousekeeping,
  HospitalityRoomService,
  HospitalityStaff,
  HospitalityTasks,
} from './hospitality/operations';
import {
  HospitalityRevenue,
  HospitalityExpenses,
  HospitalityPayments,
  HospitalityReports,
} from './hospitality/finance';
import {
  HospitalityWebsite,
  HospitalityHotelSettings,
  HospitalityAccount,
  SuitePreviewPlaceholder,
} from './hospitality/workspace';
import { HealthcareOverview } from './healthcare/overview';
import { HealthcarePatients } from './healthcare/patients';
import { HealthcareAppointments } from './healthcare/appointments';
import { HealthcareVisits } from './healthcare/visits';
import { HealthcareStaff } from './healthcare/staff';
import { HealthcareRooms } from './healthcare/rooms';
import { HealthcareInventory } from './healthcare/inventory';
import { HealthcareBilling } from './healthcare/billing';
import { HealthcarePayments } from './healthcare/payments';
import { HealthcareReports } from './healthcare/reports';
import {
  HealthcareClinicSettings,
  HealthcareAccount,
} from './healthcare/workspace';
import { ProfessionalOverview } from './professional/overview';
import { ProfessionalProjects } from './professional/projects';
import { ProfessionalClients } from './professional/clients';
import { ProfessionalTasks } from './professional/tasks';
import { ProfessionalCalendar } from './professional/calendar';
import { ProfessionalTeam } from './professional/team';
import { ProfessionalTime } from './professional/time';
import { ProfessionalInvoices } from './professional/invoices';
import { ProfessionalExpenses } from './professional/expenses';
import { ProfessionalReports } from './professional/reports';
import {
  ProfessionalBusinessSettings,
  ProfessionalAccount,
} from './professional/workspace';
import { notifications as professionalNotifications } from './professional/mock';
import { EducationOverview } from './education/overview';
import { EducationStudents } from './education/students';
import { EducationClasses } from './education/classes';
import { EducationEnrollment } from './education/enrollment';
import { EducationAttendance } from './education/attendance';
import { EducationTeachers } from './education/teachers';
import { EducationTimetable } from './education/timetable';
import { EducationFees } from './education/fees';
import { EducationPayments } from './education/payments';
import { EducationReports } from './education/reports';
import { EducationSchoolSettings, EducationAccount } from './education/workspace';
import { notifications as educationNotifications } from './education/mock';
import { AgricultureOverview } from './agriculture/overview';
import {
  AgricultureFarms,
  AgriculturePlots,
  AgricultureCrops,
  AgricultureActivities,
  AgricultureHarvest,
  AgricultureInputs,
  AgricultureInventory,
  AgricultureProcessing,
  AgriculturePackaging,
  AgricultureWarehouse,
  AgricultureEquipment,
  AgricultureTeam,
} from './agriculture/operations';
import {
  AgricultureSales,
  AgricultureExports,
  AgricultureFinance,
  AgricultureReports,
} from './agriculture/finance';
import {
  AgricultureFarmSettings,
  AgricultureAccount,
} from './agriculture/workspace';
import { notifications as agricultureNotifications } from './agriculture/mock';
import type { ShellNotification } from './shell';

type ScreenProps = { hrefFor: (sectionId: string) => string };

const HOSPITALITY_SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  overview: HospitalityOverview,
  reservations: HospitalityReservations,
  rooms: HospitalityRooms,
  guests: HospitalityGuests,
  checkin: HospitalityCheckin,
  housekeeping: HospitalityHousekeeping,
  'room-service': HospitalityRoomService,
  staff: HospitalityStaff,
  tasks: HospitalityTasks,
  revenue: HospitalityRevenue,
  expenses: HospitalityExpenses,
  payments: HospitalityPayments,
  reports: HospitalityReports,
  website: HospitalityWebsite,
  'hotel-settings': HospitalityHotelSettings,
  account: HospitalityAccount,
};

const HEALTHCARE_SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  overview: HealthcareOverview,
  patients: HealthcarePatients,
  appointments: HealthcareAppointments,
  visits: HealthcareVisits,
  staff: HealthcareStaff,
  rooms: HealthcareRooms,
  inventory: HealthcareInventory,
  billing: HealthcareBilling,
  payments: HealthcarePayments,
  reports: HealthcareReports,
  settings: HealthcareClinicSettings,
  account: HealthcareAccount,
};

const PROFESSIONAL_SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  overview: ProfessionalOverview,
  projects: ProfessionalProjects,
  clients: ProfessionalClients,
  tasks: ProfessionalTasks,
  calendar: ProfessionalCalendar,
  team: ProfessionalTeam,
  time: ProfessionalTime,
  invoices: ProfessionalInvoices,
  expenses: ProfessionalExpenses,
  reports: ProfessionalReports,
  settings: ProfessionalBusinessSettings,
  account: ProfessionalAccount,
};

const NOTIFICATIONS: Record<string, ShellNotification[]> = {
  hospitality: hospitalityNotifications,
  healthcare: healthcareNotifications,
  professional: professionalNotifications,
  education: educationNotifications,
  agriculture: agricultureNotifications,
};

const EDUCATION_SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  overview: EducationOverview,
  students: EducationStudents,
  classes: EducationClasses,
  enrollment: EducationEnrollment,
  attendance: EducationAttendance,
  teachers: EducationTeachers,
  timetable: EducationTimetable,
  fees: EducationFees,
  payments: EducationPayments,
  reports: EducationReports,
  settings: EducationSchoolSettings,
  account: EducationAccount,
};

/** Map design section ids to URL path segments under /dashboard/[section]. */
function sectionToPathSegment(sectionId: string): string {
  if (sectionId === 'hotel-settings') return 'settings';
  if (sectionId === 'time-tracking') return 'time';
  return sectionId;
}

function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={`sol-skeleton-bone ${className}`.trim()} style={style} aria-hidden />;
}

/** Overview-shaped skeleton so loading matches the live dashboard layout. */
function DashboardSkeleton({ suiteName }: { suiteName: string }) {
  return (
    <div className="sol-skeleton" role="status" aria-live="polite" aria-busy="true">
      <span className="sol-sr-only">Loading {suiteName} workspace…</span>

      <section className="sol-hero sol-skeleton-hero">
        <div className="sol-hero-body">
          <Bone className="sol-skeleton-line sol-skeleton-date" />
          <Bone className="sol-skeleton-line sol-skeleton-title" />
          <Bone className="sol-skeleton-line sol-skeleton-sub" />
          <Bone className="sol-skeleton-line sol-skeleton-sub short" />
        </div>
        <div className="sol-hero-side">
          <div className="sol-hero-actions">
            <Bone className="sol-skeleton-btn" />
            <Bone className="sol-skeleton-btn muted" />
          </div>
          <Bone className="sol-skeleton-line sol-skeleton-meta" />
        </div>
      </section>

      <div className="sol-kpis">
        {[0, 1, 2, 3].map((i) => (
          <article key={i} className="sol-kpi sol-skeleton-kpi">
            <div className="sol-kpi-head">
              <Bone className="sol-skeleton-line sol-skeleton-kpi-label" />
              <Bone className="sol-skeleton-icon" />
            </div>
            <Bone className="sol-skeleton-line sol-skeleton-kpi-value" />
            <Bone className="sol-skeleton-line sol-skeleton-kpi-foot" />
          </article>
        ))}
      </div>

      <div className="sol-grid sol-grid-main">
        <section className="sol-card sol-skeleton-card">
          <div className="sol-card-head">
            <div>
              <Bone className="sol-skeleton-line sol-skeleton-card-title" />
              <Bone className="sol-skeleton-line sol-skeleton-card-sub" />
            </div>
          </div>
          <div className="sol-card-body">
            <Bone className="sol-skeleton-chart" />
            <div className="sol-skeleton-legend">
              <Bone className="sol-skeleton-chip" />
              <Bone className="sol-skeleton-chip" />
              <Bone className="sol-skeleton-chip" />
            </div>
          </div>
        </section>

        <section className="sol-card sol-skeleton-card">
          <div className="sol-card-head">
            <div>
              <Bone className="sol-skeleton-line sol-skeleton-card-title" />
              <Bone className="sol-skeleton-line sol-skeleton-card-sub" />
            </div>
          </div>
          <div className="sol-card-body sol-skeleton-ring-block">
            <Bone className="sol-skeleton-ring" />
            <div className="sol-skeleton-ring-stats">
              {[0, 1, 2, 3].map((i) => (
                <Bone key={i} className="sol-skeleton-line sol-skeleton-stat" />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="sol-grid sol-grid-2">
        {[0, 1].map((col) => (
          <section key={col} className="sol-card sol-skeleton-card">
            <div className="sol-card-head">
              <div>
                <Bone className="sol-skeleton-line sol-skeleton-card-title" />
                <Bone className="sol-skeleton-line sol-skeleton-card-sub" />
              </div>
            </div>
            <div className="sol-card-body sol-skeleton-list">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="sol-skeleton-list-row">
                  <Bone className="sol-skeleton-avatar" />
                  <div className="sol-skeleton-list-main">
                    <Bone className="sol-skeleton-line sol-skeleton-list-title" />
                    <Bone className="sol-skeleton-line sol-skeleton-list-sub" />
                  </div>
                  <Bone className="sol-skeleton-chip" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
const AGRICULTURE_SCREENS: Record<string, React.ComponentType<ScreenProps>> = {
  overview: AgricultureOverview,
  farms: AgricultureFarms,
  plots: AgriculturePlots,
  crops: AgricultureCrops,
  activities: AgricultureActivities,
  harvest: AgricultureHarvest,
  inputs: AgricultureInputs,
  inventory: AgricultureInventory,
  processing: AgricultureProcessing,
  packaging: AgriculturePackaging,
  warehouse: AgricultureWarehouse,
  equipment: AgricultureEquipment,
  team: AgricultureTeam,
  sales: AgricultureSales,
  exports: AgricultureExports,
  finance: AgricultureFinance,
  reports: AgricultureReports,
  settings: AgricultureFarmSettings,
  account: AgricultureAccount,
};

const SUITE_SCREENS: Record<string, Record<string, React.ComponentType<ScreenProps>>> = {
  hospitality: HOSPITALITY_SCREENS,
  healthcare: HEALTHCARE_SCREENS,
  professional: PROFESSIONAL_SCREENS,
  education: EDUCATION_SCREENS,
  agriculture: AGRICULTURE_SCREENS,
};

export function SolutionsDashboard({
  suiteId,
  section,
  basePath = '/industries/preview',
  user,
  signOut,
}: {
  suiteId: string;
  section: string;
  basePath?: string;
  user?: { name: string; email?: string } | null;
  signOut?: () => void;
}) {
  const liveEnabled = !basePath.includes('/preview');
  return (
    <SolutionsLiveProvider suiteId={suiteId} enabled={liveEnabled}>
      <SolutionsDashboardBody
        suiteId={suiteId}
        section={section}
        basePath={basePath}
        user={user}
        signOut={signOut}
        liveEnabled={liveEnabled}
      />
    </SolutionsLiveProvider>
  );
}

function SolutionsDashboardBody({
  suiteId,
  section,
  basePath = '/industries/preview',
  user,
  signOut,
  liveEnabled,
}: {
  suiteId: string;
  section: string;
  basePath?: string;
  user?: { name: string; email?: string } | null;
  signOut?: () => void;
  liveEnabled: boolean;
}) {
  const { version, status, error, refresh } = useSolutionsLive();
  const suite = getSolutionsSuite(suiteId);

  const hrefFor = (sectionId: string) => {
    // Live product dashboards: basePath is already /solutions/{suite}/dashboard
    if (basePath.includes('/dashboard')) {
      const root = basePath.replace(/\/$/, '');
      if (sectionId === 'overview') return root;
      return `${root}/${sectionToPathSegment(sectionId)}`;
    }

    // Preview routes are /industries/preview/<suite>/<section>.
    if (basePath.includes('/preview')) {
      if (sectionId === 'overview') return `${basePath}/${suite.id}`;
      return `${basePath}/${suite.id}/${sectionId}`;
    }

    // Live routes are /solutions/<suite>/dashboard/<section>. The basePath
    // already contains the current suite, so rebuild from the canonical root.
    const segments = basePath.replace(/\/$/, '').split('/').filter(Boolean);
    const root = segments.length >= 2
      ? `/${segments.slice(0, -1).join('/')}`.replace(/^\/industries/, '/solutions')
      : '/solutions';
    const suiteBase = `${root}/${suite.id}`;
    if (sectionId === 'overview') return `${suiteBase}/dashboard`;
    return `${suiteBase}/dashboard/${sectionId}`;
  };

  const screens = SUITE_SCREENS[suite.id];

  const Screen = screens ? screens[section] || screens.overview : null;

  const showSkeleton = liveEnabled && status === 'loading';
  const showError = liveEnabled && status === 'error';

  return (
    <ToastProvider>
      <SolutionsShell
        suite={suite}
        section={section}
        hrefFor={hrefFor}
        notifications={NOTIFICATIONS[suite.id] || []}
        user={user}
        signOut={signOut}
      >
        {showSkeleton ? (
          <DashboardSkeleton suiteName={suite.shortName} />
        ) : (
          <React.Fragment key={version}>
            {showError ? (
              <Banner
                tone="amber"
                icon="bell"
                title="Couldn’t load live data"
                action={
                  <button type="button" className="sol-btn sol-btn-subtle sol-btn-sm" onClick={() => void refresh()}>
                    Retry
                  </button>
                }
              >
                {error || 'Check your connection and try again. Showing the workspace shell for now.'}
              </Banner>
            ) : null}
            {Screen ? (
              <Screen hrefFor={hrefFor} />
            ) : (
              <SuitePreviewPlaceholder suiteName={suite.shortName} suiteId={suite.id} />
            )}
          </React.Fragment>
        )}
      </SolutionsShell>
    </ToastProvider>
  );
}

export type SolutionsDashboardProps = {
  suiteId: string;
  section: string;
  basePath: string;
};

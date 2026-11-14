'use client';

import React from 'react';
import { SolutionsShell } from './shell';
import { ToastProvider } from './primitives';
import { getSolutionsSuite } from './suites';
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
  const suite = getSolutionsSuite(suiteId);

  const hrefFor = (sectionId: string, targetSuiteId?: string) => {
    const s = targetSuiteId || suite.id;
    if (sectionId === 'overview') return `${basePath}/${s}`;
    return `${basePath}/${s}/${sectionId}`;
  };

  const screens =
    suite.id === 'hospitality'
      ? HOSPITALITY_SCREENS
      : suite.id === 'healthcare'
        ? HEALTHCARE_SCREENS
        : suite.id === 'professional'
          ? PROFESSIONAL_SCREENS
          : EDUCATION_SCREENS;

  const Screen = screens ? screens[section] || screens.overview : null;

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
        {Screen ? (
          <Screen hrefFor={hrefFor} />
        ) : (
          <SuitePreviewPlaceholder suiteName={suite.shortName} suiteId={suite.id} />
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

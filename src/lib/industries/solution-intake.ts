/**
 * Extractive onboarding profiles for Busmo industry solutions
 * (Healthcare, Hospitality, Professional, Education).
 */

export type IndustryFieldType = 'single' | 'multi' | 'text' | 'number';

export type IndustryField = {
  id: string;
  label: string;
  type: IndustryFieldType;
  options?: { id: string; label: string }[];
  required?: boolean;
  help?: string;
  placeholder?: string;
};

export type IndustryIntakeProfile = {
  orgLabel: string;
  orgPlaceholder: string;
  headline: string;
  sub: string;
  outcomes: string[];
  fields: IndustryField[];
};

const YES_NO = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];

export const INDUSTRY_INTAKE: Record<string, IndustryIntakeProfile> = {
  healthcare: {
    orgLabel: 'Clinic name',
    orgPlaceholder: 'e.g. Greenfield Clinic',
    headline: 'How does your clinic operate?',
    sub: 'We use this to set up patients, appointments, billing, and supplies the way your facility works.',
    outcomes: ['Patient records', 'Appointment flow', 'Billing defaults', 'Supplies'],
    fields: [
      {
        id: 'facility_type',
        label: 'Facility type',
        type: 'single',
        required: true,
        options: [
          { id: 'clinic', label: 'Clinic' },
          { id: 'hospital', label: 'Hospital' },
          { id: 'lab', label: 'Lab / diagnostics' },
          { id: 'dental', label: 'Dental' },
          { id: 'pharmacy_clinic', label: 'Pharmacy + clinic' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'specialties',
        label: 'Main specialties',
        type: 'multi',
        required: true,
        options: [
          { id: 'gp', label: 'General practice' },
          { id: 'paediatrics', label: 'Paediatrics' },
          { id: 'obgyn', label: 'OB/GYN' },
          { id: 'dental', label: 'Dental' },
          { id: 'lab', label: 'Lab' },
          { id: 'physio', label: 'Physiotherapy' },
          { id: 'mental', label: 'Mental health' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'daily_patients',
        label: 'Patients per day (approx.)',
        type: 'single',
        required: true,
        options: [
          { id: 'under_20', label: 'Under 20' },
          { id: '20_50', label: '20–50' },
          { id: '50_100', label: '50–100' },
          { id: '100_plus', label: '100+' },
        ],
      },
      {
        id: 'appointments',
        label: 'Use scheduled appointments?',
        type: 'single',
        required: true,
        options: YES_NO,
      },
      {
        id: 'walk_ins',
        label: 'Accept walk-ins?',
        type: 'single',
        required: true,
        options: YES_NO,
      },
      {
        id: 'clinical_staff',
        label: 'Clinical staff count',
        type: 'single',
        required: true,
        options: [
          { id: '1_3', label: '1–3' },
          { id: '4_10', label: '4–10' },
          { id: '11_plus', label: '11+' },
        ],
      },
      {
        id: 'rooms_beds',
        label: 'Rooms or beds to manage?',
        type: 'single',
        required: true,
        options: YES_NO,
      },
      {
        id: 'billing_model',
        label: 'How do patients pay?',
        type: 'multi',
        required: true,
        options: [
          { id: 'cash', label: 'Cash' },
          { id: 'transfer', label: 'Transfer' },
          { id: 'pos', label: 'POS / card' },
          { id: 'insurance', label: 'Insurance / HMO' },
          { id: 'corporate', label: 'Corporate accounts' },
        ],
      },
      {
        id: 'medical_supplies',
        label: 'Track medical supplies / drugs?',
        type: 'single',
        required: true,
        options: YES_NO,
      },
      {
        id: 'locations',
        label: 'Number of locations',
        type: 'single',
        options: [
          { id: '1', label: '1' },
          { id: '2_5', label: '2–5' },
          { id: '6_plus', label: '6+' },
        ],
      },
    ],
  },
  hospitality: {
    orgLabel: 'Hotel / property name',
    orgPlaceholder: 'e.g. Palm Court Hotel',
    headline: 'How does your property run?',
    sub: 'Rooms, F&B, and front desk setup depend on what you actually operate.',
    outcomes: ['Rooms', 'Reservations', 'Front desk', 'F&B if needed'],
    fields: [
      {
        id: 'property_type',
        label: 'Property type',
        type: 'single',
        required: true,
        options: [
          { id: 'hotel', label: 'Hotel' },
          { id: 'guesthouse', label: 'Guesthouse' },
          { id: 'apartment', label: 'Serviced apartments' },
          { id: 'resort', label: 'Resort' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'room_count',
        label: 'Number of rooms',
        type: 'single',
        required: true,
        options: [
          { id: 'under_10', label: 'Under 10' },
          { id: '10_30', label: '10–30' },
          { id: '30_100', label: '30–100' },
          { id: '100_plus', label: '100+' },
        ],
      },
      {
        id: 'has_restaurant',
        label: 'On-site restaurant / bar?',
        type: 'single',
        required: true,
        options: YES_NO,
      },
      {
        id: 'booking_channels',
        label: 'Booking channels',
        type: 'multi',
        required: true,
        options: [
          { id: 'walk_in', label: 'Walk-in' },
          { id: 'phone', label: 'Phone' },
          { id: 'whatsapp', label: 'WhatsApp' },
          { id: 'ota', label: 'OTA (Booking.com, etc.)' },
          { id: 'website', label: 'Own website' },
        ],
      },
      {
        id: 'payment_methods',
        label: 'Guest payment methods',
        type: 'multi',
        required: true,
        options: [
          { id: 'cash', label: 'Cash' },
          { id: 'transfer', label: 'Transfer' },
          { id: 'pos', label: 'POS / card' },
          { id: 'corporate', label: 'Corporate / invoice' },
        ],
      },
      {
        id: 'housekeeping',
        label: 'Manage housekeeping status?',
        type: 'single',
        options: YES_NO,
      },
    ],
  },
  professional: {
    orgLabel: 'Firm name',
    orgPlaceholder: 'e.g. Northstar Consulting',
    headline: 'How does your professional practice work?',
    sub: 'Clients, retainers, and projects drive the right workspace — not retail SKUs.',
    outcomes: ['Clients', 'Engagements', 'Billing', 'Team'],
    fields: [
      {
        id: 'practice_type',
        label: 'Practice type',
        type: 'single',
        required: true,
        options: [
          { id: 'consulting', label: 'Consulting' },
          { id: 'legal', label: 'Legal' },
          { id: 'accounting', label: 'Accounting / tax' },
          { id: 'agency', label: 'Agency / creative' },
          { id: 'engineering', label: 'Engineering' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'pricing_model',
        label: 'How do you bill?',
        type: 'multi',
        required: true,
        options: [
          { id: 'hourly', label: 'Hourly' },
          { id: 'project', label: 'Project / fixed' },
          { id: 'retainer', label: 'Retainer' },
          { id: 'success', label: 'Success fee' },
        ],
      },
      {
        id: 'active_clients',
        label: 'Active clients (approx.)',
        type: 'single',
        required: true,
        options: [
          { id: 'under_10', label: 'Under 10' },
          { id: '10_50', label: '10–50' },
          { id: '50_plus', label: '50+' },
        ],
      },
      {
        id: 'team_size',
        label: 'Team size',
        type: 'single',
        required: true,
        options: [
          { id: 'solo', label: 'Solo' },
          { id: '2_10', label: '2–10' },
          { id: '11_plus', label: '11+' },
        ],
      },
      {
        id: 'payment_methods',
        label: 'Client payment methods',
        type: 'multi',
        required: true,
        options: [
          { id: 'transfer', label: 'Transfer' },
          { id: 'pos', label: 'POS / card' },
          { id: 'invoice', label: 'Invoice / net terms' },
          { id: 'cash', label: 'Cash' },
        ],
      },
      {
        id: 'track_time',
        label: 'Need time tracking on jobs?',
        type: 'single',
        options: YES_NO,
      },
    ],
  },
  education: {
    orgLabel: 'School / academy name',
    orgPlaceholder: 'e.g. Horizon Academy',
    headline: 'How does your school or academy run?',
    sub: 'Fees, classes, and students need a different setup than a shop.',
    outcomes: ['Students', 'Fees', 'Classes', 'Staff'],
    fields: [
      {
        id: 'institution_type',
        label: 'Institution type',
        type: 'single',
        required: true,
        options: [
          { id: 'nursery', label: 'Nursery / early years' },
          { id: 'primary', label: 'Primary' },
          { id: 'secondary', label: 'Secondary' },
          { id: 'tutoring', label: 'Tutoring centre' },
          { id: 'training', label: 'Training institute' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'student_count',
        label: 'Students (approx.)',
        type: 'single',
        required: true,
        options: [
          { id: 'under_50', label: 'Under 50' },
          { id: '50_200', label: '50–200' },
          { id: '200_500', label: '200–500' },
          { id: '500_plus', label: '500+' },
        ],
      },
      {
        id: 'fee_cycle',
        label: 'Fee collection cycle',
        type: 'single',
        required: true,
        options: [
          { id: 'term', label: 'Per term' },
          { id: 'monthly', label: 'Monthly' },
          { id: 'per_course', label: 'Per course' },
          { id: 'annual', label: 'Annual' },
        ],
      },
      {
        id: 'payment_methods',
        label: 'Fee payment methods',
        type: 'multi',
        required: true,
        options: [
          { id: 'transfer', label: 'Transfer' },
          { id: 'pos', label: 'POS / card' },
          { id: 'cash', label: 'Cash' },
          { id: 'online', label: 'Online link' },
        ],
      },
      {
        id: 'sell_materials',
        label: 'Sell books / uniforms / materials?',
        type: 'single',
        options: YES_NO,
      },
      {
        id: 'staff_count',
        label: 'Teaching / admin staff',
        type: 'single',
        options: [
          { id: '1_5', label: '1–5' },
          { id: '6_20', label: '6–20' },
          { id: '21_plus', label: '21+' },
        ],
      },
    ],
  },
};

export function getIndustryIntake(id: string): IndustryIntakeProfile {
  return INDUSTRY_INTAKE[id] || INDUSTRY_INTAKE.professional;
}

export function validateIndustryDetails(
  industryId: string,
  details: Record<string, string | string[] | undefined> | undefined
): string | null {
  const profile = getIndustryIntake(industryId);
  const d = details || {};
  for (const field of profile.fields) {
    if (!field.required) continue;
    const v = d[field.id];
    if (field.type === 'multi') {
      if (!Array.isArray(v) || v.length === 0) return `Please answer: ${field.label}`;
    } else if (v == null || String(v).trim() === '') {
      return `Please answer: ${field.label}`;
    }
  }
  return null;
}

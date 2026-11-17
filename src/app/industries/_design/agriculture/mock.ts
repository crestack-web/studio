import { addDays, todayISO } from '../format';
import type { ShellNotification } from '../shell';

const TODAY = todayISO();
const CUR = 'NGN';
const SEASON = '2026 farming season';

/** A single flat record, matching the shape stored by the solutions workspace API. */
export type AgriRecord = {
  id: string;
  title: string;
  status: string;
  amount: number;
  notes?: string | null;
  occurred_at?: string;
  meta: Record<string, any>;
};

/** Saved workspace preferences from the live `settings` record. */
export const orgSettings: Record<string, any> = {};

export const farm = {
  name: 'Greenfield Farms Ltd',
  legalName: 'Greenfield Farms Ltd',
  location: 'Ibadan, Oyo',
  address: 'Km 12 Ibadan–Oyo Road, Ibadan, Oyo',
  phone: '+234 803 442 1180',
  email: 'office@greenfieldfarms.ng',
  website: 'greenfieldfarms.ng',
  currency: CUR,
  season: SEASON,
  ownerName: 'Mrs. Folake Adeyemi',
  ownerEmail: 'folake@greenfieldfarms.ng',
  region: 'South West Nigeria',
  established: '2011',
  certification: 'GlobalG.A.P. / NAFDAC registered',
  timezone: 'Africa/Lagos',
  totalHectares: 233,
  primaryEnterprises: 'Maize, cassava, soybeans, poultry',
};

/* ── Farms ─────────────────────────────────────────────────────────── */

export const farms: AgriRecord[] = [
  {
    id: 'farm-main',
    title: 'Greenfield Main Estate',
    status: 'active',
    amount: 0,
    occurred_at: addDays(TODAY, -420),
    notes: 'Headquarters, main packing house and 120ha of arable land.',
    meta: { location: 'Ibadan, Oyo', hectares: 120, manager: 'Alhaji Musa Bello', status: 'active' },
  },
  {
    id: 'farm-seed',
    title: 'Ekiti Seed Multiplication Farm',
    status: 'active',
    amount: 0,
    occurred_at: addDays(TODAY, -300),
    notes: 'Certified seed multiplication and nursery site.',
    meta: { location: 'Ado Ekiti, Ekiti', hectares: 45, manager: 'Mrs. Ngozi Eze', status: 'active' },
  },
  {
    id: 'farm-outgrowers',
    title: 'Osun Outgrowers Cluster',
    status: 'planned',
    amount: 0,
    occurred_at: addDays(TODAY, -40),
    meta: { location: 'Ilesa, Osun', hectares: 68, manager: 'Mr. Tunde Ojo', status: 'planned' },
  },
];

/* ── Plots ─────────────────────────────────────────────────────────── */

export const plots: AgriRecord[] = [
  {
    id: 'plot-a1',
    title: 'Plot A1',
    status: 'planted',
    amount: 0,
    occurred_at: addDays(TODAY, -62),
    meta: { farm: 'Greenfield Main Estate', area_ha: 14, soil: 'loamy', crop: 'Maize', status: 'planted' },
  },
  {
    id: 'plot-a2',
    title: 'Plot A2',
    status: 'planted',
    amount: 0,
    occurred_at: addDays(TODAY, -58),
    meta: { farm: 'Greenfield Main Estate', area_ha: 12.5, soil: 'loamy', crop: 'Maize', status: 'planted' },
  },
  {
    id: 'plot-b1',
    title: 'Plot B1',
    status: 'preparing',
    amount: 0,
    occurred_at: addDays(TODAY, -12),
    meta: { farm: 'Greenfield Main Estate', area_ha: 9, soil: 'clay loam', crop: 'Cassava', status: 'preparing' },
  },
  {
    id: 'plot-b2',
    title: 'Plot B2',
    status: 'planted',
    amount: 0,
    occurred_at: addDays(TODAY, -71),
    meta: { farm: 'Greenfield Main Estate', area_ha: 16, soil: 'loamy sand', crop: 'Soybeans', status: 'planted' },
  },
  {
    id: 'plot-c1',
    title: 'Plot C1',
    status: 'fallow',
    amount: 0,
    occurred_at: addDays(TODAY, -96),
    notes: 'Resting under mucuna cover crop.',
    meta: { farm: 'Greenfield Main Estate', area_ha: 11, soil: 'sandy loam', crop: '—', status: 'fallow' },
  },
  {
    id: 'plot-c2',
    title: 'Plot C2',
    status: 'harvested',
    amount: 0,
    occurred_at: addDays(TODAY, -18),
    meta: { farm: 'Ekiti Seed Multiplication Farm', area_ha: 8, soil: 'loamy', crop: 'Maize (seed)', status: 'harvested' },
  },
  {
    id: 'plot-d1',
    title: 'Plot D1',
    status: 'planted',
    amount: 0,
    occurred_at: addDays(TODAY, -45),
    meta: { farm: 'Ekiti Seed Multiplication Farm', area_ha: 10, soil: 'loamy', crop: 'Soybeans', status: 'planted' },
  },
  {
    id: 'plot-d2',
    title: 'Plot D2',
    status: 'preparing',
    amount: 0,
    occurred_at: addDays(TODAY, -7),
    meta: { farm: 'Osun Outgrowers Cluster', area_ha: 18, soil: 'clay', crop: 'Cassava', status: 'preparing' },
  },
];

/* ── Crops ─────────────────────────────────────────────────────────── */

export const crops: AgriRecord[] = [
  {
    id: 'crop-1',
    title: 'Maize · Plot A1',
    status: 'growing',
    amount: 0,
    occurred_at: addDays(TODAY, -62),
    meta: {
      plot: 'Plot A1',
      variety: 'SUWAN 1 (hybrid)',
      planted: addDays(TODAY, -62),
      expected_harvest: addDays(TODAY, 42),
      progress: 68,
    },
  },
  {
    id: 'crop-2',
    title: 'Maize · Plot A2',
    status: 'flowering',
    amount: 0,
    occurred_at: addDays(TODAY, -58),
    meta: {
      plot: 'Plot A2',
      variety: 'SUWAN 1 (hybrid)',
      planted: addDays(TODAY, -58),
      expected_harvest: addDays(TODAY, 38),
      progress: 74,
    },
  },
  {
    id: 'crop-3',
    title: 'Cassava · Plot B1',
    status: 'growing',
    amount: 0,
    occurred_at: addDays(TODAY, -12),
    meta: {
      plot: 'Plot B1',
      variety: 'TME 419',
      planted: addDays(TODAY, -12),
      expected_harvest: addDays(TODAY, 340),
      progress: 14,
    },
  },
  {
    id: 'crop-4',
    title: 'Soybeans · Plot B2',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, -71),
    meta: {
      plot: 'Plot B2',
      variety: 'TGX 1448-2E',
      planted: addDays(TODAY, -71),
      expected_harvest: addDays(TODAY, 3),
      progress: 96,
    },
  },
  {
    id: 'crop-5',
    title: 'Maize seed · Plot C2',
    status: 'harvested',
    amount: 0,
    occurred_at: addDays(TODAY, -96),
    meta: {
      plot: 'Plot C2',
      variety: 'TZE yellow seed',
      planted: addDays(TODAY, -96),
      expected_harvest: addDays(TODAY, -18),
      progress: 100,
    },
  },
  {
    id: 'crop-6',
    title: 'Soybeans · Plot D1',
    status: 'flowering',
    amount: 0,
    occurred_at: addDays(TODAY, -45),
    meta: {
      plot: 'Plot D1',
      variety: 'TGX 1835-10E',
      planted: addDays(TODAY, -45),
      expected_harvest: addDays(TODAY, 48),
      progress: 61,
    },
  },
  {
    id: 'crop-7',
    title: 'Maize · Plot E1',
    status: 'growing',
    amount: 0,
    occurred_at: addDays(TODAY, -28),
    meta: {
      plot: 'Plot E1',
      variety: 'SUWAN 2',
      planted: addDays(TODAY, -28),
      expected_harvest: addDays(TODAY, 66),
      progress: 42,
    },
  },
  {
    id: 'crop-8',
    title: 'Cassava · Plot D2',
    status: 'growing',
    amount: 0,
    occurred_at: addDays(TODAY, -7),
    meta: {
      plot: 'Plot D2',
      variety: 'TME 419',
      planted: addDays(TODAY, -7),
      expected_harvest: addDays(TODAY, 350),
      progress: 8,
    },
  },
];

/* ── Activities ────────────────────────────────────────────────────── */

export const activities: AgriRecord[] = [
  {
    id: 'act-1',
    title: 'Second weeding · Plot A1',
    status: 'scheduled',
    amount: 0,
    occurred_at: addDays(TODAY, 2),
    meta: { plot: 'Plot A1', type: 'weeding', assignee: 'Musa Bello', due: addDays(TODAY, 2) },
  },
  {
    id: 'act-2',
    title: 'Top-dress with urea · Plot A2',
    status: 'in_progress',
    amount: 0,
    occurred_at: addDays(TODAY, 1),
    notes: 'Apply 60kg/ha after the last rain.',
    meta: { plot: 'Plot A2', type: 'fertilising', assignee: 'Ngozi Eze', due: addDays(TODAY, 1) },
  },
  {
    id: 'act-3',
    title: 'Scout for fall armyworm · Plot B2',
    status: 'scheduled',
    amount: 0,
    occurred_at: addDays(TODAY, 3),
    meta: { plot: 'Plot B2', type: 'scouting', assignee: 'Tunde Ojo', due: addDays(TODAY, 3) },
  },
  {
    id: 'act-4',
    title: 'Irrigate seedbeds · Plot D1',
    status: 'done',
    amount: 0,
    occurred_at: addDays(TODAY, -1),
    meta: { plot: 'Plot D1', type: 'irrigation', assignee: 'Aisha Danladi', due: addDays(TODAY, -1) },
  },
  {
    id: 'act-5',
    title: 'Spray fungicide · Plot E1',
    status: 'blocked',
    amount: 0,
    occurred_at: addDays(TODAY, 1),
    notes: 'Waiting for knapsack sprayer repair.',
    meta: { plot: 'Plot E1', type: 'spraying', assignee: 'Chidi Okafor', due: addDays(TODAY, 1) },
  },
  {
    id: 'act-6',
    title: 'Lay drip lines · Plot B1',
    status: 'done',
    amount: 0,
    occurred_at: addDays(TODAY, -4),
    meta: { plot: 'Plot B1', type: 'irrigation', assignee: 'Musa Bello', due: addDays(TODAY, -4) },
  },
  {
    id: 'act-7',
    title: 'Pre-harvest inspection · Plot B2',
    status: 'scheduled',
    amount: 0,
    occurred_at: addDays(TODAY, 4),
    meta: { plot: 'Plot B2', type: 'scouting', assignee: 'Folake Adeyemi', due: addDays(TODAY, 4) },
  },
  {
    id: 'act-8',
    title: 'Ridge and plant cassava · Plot D2',
    status: 'in_progress',
    amount: 0,
    occurred_at: addDays(TODAY, 5),
    meta: { plot: 'Plot D2', type: 'planting', assignee: 'Tunde Ojo', due: addDays(TODAY, 5) },
  },
];

/* ── Harvest ───────────────────────────────────────────────────────── */

export const harvest: AgriRecord[] = [
  {
    id: 'harv-1',
    title: 'Maize · Plot A1',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, 1),
    meta: { plot: 'Plot A1', crop: 'Maize', quantity_t: 42.5, grade: 'A', date: addDays(TODAY, 1) },
  },
  {
    id: 'harv-2',
    title: 'Soybeans · Plot B2',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, 3),
    meta: { plot: 'Plot B2', crop: 'Soybeans', quantity_t: 18.2, grade: 'A', date: addDays(TODAY, 3) },
  },
  {
    id: 'harv-3',
    title: 'Maize · Plot A2',
    status: 'grading',
    amount: 0,
    occurred_at: addDays(TODAY, -1),
    meta: { plot: 'Plot A2', crop: 'Maize', quantity_t: 36.8, grade: 'B', date: addDays(TODAY, -1) },
  },
  {
    id: 'harv-4',
    title: 'Maize seed · Plot C2',
    status: 'stored',
    amount: 0,
    occurred_at: addDays(TODAY, -18),
    meta: { plot: 'Plot C2', crop: 'Maize seed', quantity_t: 12.4, grade: 'A', date: addDays(TODAY, -18) },
  },
  {
    id: 'harv-5',
    title: 'Soybeans · Plot D1',
    status: 'graded',
    amount: 0,
    occurred_at: addDays(TODAY, -9),
    meta: { plot: 'Plot D1', crop: 'Soybeans', quantity_t: 9.6, grade: 'B', date: addDays(TODAY, -9) },
  },
  {
    id: 'harv-6',
    title: 'Maize · Plot E1',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, 6),
    meta: { plot: 'Plot E1', crop: 'Maize', quantity_t: 27.3, grade: 'B', date: addDays(TODAY, 6) },
  },
  {
    id: 'harv-7',
    title: 'Cassava · Plot B1',
    status: 'stored',
    amount: 0,
    occurred_at: addDays(TODAY, -24),
    meta: { plot: 'Plot B1', crop: 'Cassava', quantity_t: 54.0, grade: 'C', date: addDays(TODAY, -24) },
  },
];

/* ── Inputs ────────────────────────────────────────────────────────── */

export const inputs: AgriRecord[] = [
  {
    id: 'inp-1',
    title: 'NPK 15-15-15 fertiliser',
    status: 'low_stock',
    amount: 0,
    meta: { supplier: 'Olam Agri Nigeria', unit: 'bags (50kg)', quantity: 38, reorder_level: 80 },
  },
  {
    id: 'inp-2',
    title: 'Urea 46%',
    status: 'in_stock',
    amount: 0,
    meta: { supplier: 'Notore Fertilizer', unit: 'bags (50kg)', quantity: 210, reorder_level: 60 },
  },
  {
    id: 'inp-3',
    title: 'Maize hybrid seed · SUWAN 1',
    status: 'in_stock',
    amount: 0,
    meta: { supplier: 'Seed Tech Nigeria', unit: 'bags (10kg)', quantity: 96, reorder_level: 40 },
  },
  {
    id: 'inp-4',
    title: 'Soybean inoculant',
    status: 'out_of_stock',
    amount: 0,
    notes: 'Supplier lead time is 10 days; order before the next planting window.',
    meta: { supplier: 'Biofert Concepts', unit: 'cartons', quantity: 0, reorder_level: 12 },
  },
  {
    id: 'inp-5',
    title: 'Emamectin benzoate 5% SC',
    status: 'in_stock',
    amount: 0,
    meta: { supplier: 'Sun Agro Chemicals', unit: 'litres', quantity: 64, reorder_level: 20 },
  },
  {
    id: 'inp-6',
    title: 'Mancozeb 80% WP',
    status: 'low_stock',
    amount: 0,
    meta: { supplier: 'Sun Agro Chemicals', unit: 'kg', quantity: 15, reorder_level: 25 },
  },
];

/* ── Inventory ─────────────────────────────────────────────────────── */

export const inventory: AgriRecord[] = [
  {
    id: 'inv-1',
    title: 'Maize grain · Grade A',
    status: 'in_stock',
    amount: 0,
    meta: { item: 'Maize grain · Grade A', unit: 'tonnes', quantity: 128, location: 'Main warehouse', reorder_level: 40 },
  },
  {
    id: 'inv-2',
    title: 'Soybeans · cleaned',
    status: 'in_stock',
    amount: 0,
    meta: { item: 'Soybeans · cleaned', unit: 'tonnes', quantity: 74, location: 'Main warehouse', reorder_level: 30 },
  },
  {
    id: 'inv-3',
    title: 'Cassava flour',
    status: 'low_stock',
    amount: 0,
    meta: { item: 'Cassava flour', unit: 'bags (25kg)', quantity: 180, location: 'Processing store', reorder_level: 250 },
  },
  {
    id: 'inv-4',
    title: 'Woven packaging bags · 50kg',
    status: 'low_stock',
    amount: 0,
    meta: { item: 'Woven packaging bags · 50kg', unit: 'pieces', quantity: 420, location: 'Packaging hall', reorder_level: 900 },
  },
  {
    id: 'inv-5',
    title: 'Pallets · wooden',
    status: 'in_stock',
    amount: 0,
    meta: { item: 'Pallets · wooden', unit: 'pieces', quantity: 260, location: 'Main warehouse', reorder_level: 80 },
  },
  {
    id: 'inv-6',
    title: 'Label rolls · 5kg maize flour',
    status: 'out_of_stock',
    amount: 0,
    meta: { item: 'Label rolls · 5kg maize flour', unit: 'rolls', quantity: 0, location: 'Packaging hall', reorder_level: 8 },
  },
  {
    id: 'inv-7',
    title: 'Poultry feed · finisher',
    status: 'in_stock',
    amount: 0,
    meta: { item: 'Poultry feed · finisher', unit: 'bags (25kg)', quantity: 310, location: 'Feed store', reorder_level: 100 },
  },
  {
    id: 'inv-8',
    title: 'Silage · maize',
    status: 'in_stock',
    amount: 0,
    meta: { item: 'Silage · maize', unit: 'tonnes', quantity: 46, location: 'Feed store', reorder_level: 20 },
  },
];

/* ── Processing ────────────────────────────────────────────────────── */

export const processing: AgriRecord[] = [
  {
    id: 'proc-1',
    title: 'Batch PR-2026-041',
    status: 'in_progress',
    amount: 0,
    occurred_at: addDays(TODAY, -2),
    meta: { batch: 'PR-2026-041', input: 'Maize grain · 12t', output: 'Maize flour · 5kg packs', stage: 'milling', yield_pct: 78 },
  },
  {
    id: 'proc-2',
    title: 'Batch PR-2026-040',
    status: 'done',
    amount: 0,
    occurred_at: addDays(TODAY, -5),
    meta: { batch: 'PR-2026-040', input: 'Soybeans · 8t', output: 'Soy flour · 2kg packs', stage: 'quality_check', yield_pct: 84 },
  },
  {
    id: 'proc-3',
    title: 'Batch PR-2026-039',
    status: 'done',
    amount: 0,
    occurred_at: addDays(TODAY, -8),
    meta: { batch: 'PR-2026-039', input: 'Cassava roots · 20t', output: 'Cassava flour · 25kg bags', stage: 'packing', yield_pct: 62 },
  },
  {
    id: 'proc-4',
    title: 'Batch PR-2026-042',
    status: 'in_progress',
    amount: 0,
    occurred_at: addDays(TODAY, -1),
    meta: { batch: 'PR-2026-042', input: 'Maize grain · 9t', output: 'Maize grits · 5kg packs', stage: 'sorting', yield_pct: 71 },
  },
  {
    id: 'proc-5',
    title: 'Batch PR-2026-038',
    status: 'on_hold',
    amount: 0,
    occurred_at: addDays(TODAY, -11),
    notes: 'Awaiting moisture meter calibration.',
    meta: { batch: 'PR-2026-038', input: 'Soybeans · 6t', output: 'Soy oil · 1L bottles', stage: 'quality_check', yield_pct: 48 },
  },
];

/* ── Packaging ─────────────────────────────────────────────────────── */

export const packaging: AgriRecord[] = [
  {
    id: 'pack-1',
    title: 'Maize flour · 5kg',
    status: 'preparing',
    amount: 0,
    occurred_at: addDays(TODAY, -1),
    meta: { batch: 'PR-2026-041', pack_size: '5kg', units: 1800, label: 'Greenfield Maize Flour', status: 'preparing' },
  },
  {
    id: 'pack-2',
    title: 'Soy flour · 2kg',
    status: 'labelled',
    amount: 0,
    occurred_at: addDays(TODAY, -4),
    meta: { batch: 'PR-2026-040', pack_size: '2kg', units: 2400, label: 'Greenfield Soy Flour', status: 'labelled' },
  },
  {
    id: 'pack-3',
    title: 'Cassava flour · 25kg',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, -7),
    meta: { batch: 'PR-2026-039', pack_size: '25kg', units: 480, label: 'Greenfield Cassava Flour', status: 'ready' },
  },
  {
    id: 'pack-4',
    title: 'Maize grits · 5kg',
    status: 'preparing',
    amount: 0,
    occurred_at: addDays(TODAY, 1),
    meta: { batch: 'PR-2026-042', pack_size: '5kg', units: 1200, label: 'Greenfield Maize Grits', status: 'preparing' },
  },
  {
    id: 'pack-5',
    title: 'Soybeans · 50kg export bag',
    status: 'dispatched',
    amount: 0,
    occurred_at: addDays(TODAY, -14),
    meta: { batch: 'PR-2026-037', pack_size: '50kg', units: 320, label: 'Greenfield Select Soybeans', status: 'dispatched' },
  },
];

/* ── Warehouse ─────────────────────────────────────────────────────── */

export const warehouse: AgriRecord[] = [
  {
    id: 'wh-1',
    title: 'Maize grain · Grade A',
    status: 'stored',
    amount: 0,
    meta: { item: 'Maize grain · Grade A', location: 'Bay 1 · Main warehouse', quantity: 128, unit: 'tonnes', bin: 'A-01' },
  },
  {
    id: 'wh-2',
    title: 'Soybeans · cleaned',
    status: 'reserved',
    amount: 0,
    meta: { item: 'Soybeans · cleaned', location: 'Bay 2 · Main warehouse', quantity: 74, unit: 'tonnes', bin: 'B-04' },
  },
  {
    id: 'wh-3',
    title: 'Maize flour · 5kg packs',
    status: 'dispatch_ready',
    amount: 0,
    meta: { item: 'Maize flour · 5kg packs', location: 'Dispatch bay', quantity: 1800, unit: 'packs', bin: 'D-02' },
  },
  {
    id: 'wh-4',
    title: 'Cassava flour · 25kg bags',
    status: 'stored',
    amount: 0,
    meta: { item: 'Cassava flour · 25kg bags', location: 'Bay 3 · Main warehouse', quantity: 480, unit: 'bags', bin: 'C-07' },
  },
  {
    id: 'wh-5',
    title: 'Poultry feed · finisher',
    status: 'stored',
    amount: 0,
    meta: { item: 'Poultry feed · finisher', location: 'Feed store', quantity: 310, unit: 'bags', bin: 'F-01' },
  },
  {
    id: 'wh-6',
    title: 'Woven packaging bags',
    status: 'stored',
    amount: 0,
    meta: { item: 'Woven packaging bags', location: 'Packaging hall', quantity: 420, unit: 'pieces', bin: 'P-03' },
  },
];

/* ── Equipment ─────────────────────────────────────────────────────── */

export const equipment: AgriRecord[] = [
  {
    id: 'eq-1',
    title: 'John Deere 5075E tractor',
    status: 'operational',
    amount: 0,
    meta: {
      name: 'John Deere 5075E tractor',
      serial: 'JD5075-2018-2291',
      status: 'operational',
      last_service: addDays(TODAY, -52),
      next_service: addDays(TODAY, 38),
      operator: 'Musa Bello',
    },
  },
  {
    id: 'eq-2',
    title: 'Combine harvester · CLAAS DOMINATOR',
    status: 'due_service',
    amount: 0,
    notes: 'Service due before the next maize harvest.',
    meta: {
      name: 'Combine harvester · CLAAS DOMINATOR',
      serial: 'CLS-DOM-2019-1140',
      status: 'due_service',
      last_service: addDays(TODAY, -118),
      next_service: addDays(TODAY, -3),
      operator: 'Chidi Okafor',
    },
  },
  {
    id: 'eq-3',
    title: 'Hammer mill · 10 tonne/hr',
    status: 'operational',
    amount: 0,
    meta: {
      name: 'Hammer mill · 10 tonne/hr',
      serial: 'HM-10T-2021-0872',
      status: 'operational',
      last_service: addDays(TODAY, -25),
      next_service: addDays(TODAY, 65),
      operator: 'Aisha Danladi',
    },
  },
  {
    id: 'eq-4',
    title: 'Knapsack sprayer · 20L',
    status: 'in_repair',
    amount: 0,
    meta: {
      name: 'Knapsack sprayer · 20L',
      serial: 'KS20-2024-5510',
      status: 'in_repair',
      last_service: addDays(TODAY, -14),
      next_service: addDays(TODAY, 5),
      operator: 'Chidi Okafor',
    },
  },
  {
    id: 'eq-5',
    title: 'Centrifugal water pump · 4 inch',
    status: 'operational',
    amount: 0,
    meta: {
      name: 'Centrifugal water pump · 4 inch',
      serial: 'WP4-2022-3306',
      status: 'operational',
      last_service: addDays(TODAY, -40),
      next_service: addDays(TODAY, 50),
      operator: 'Tunde Ojo',
    },
  },
  {
    id: 'eq-6',
    title: 'Electronic moisture meter',
    status: 'due_service',
    amount: 0,
    meta: {
      name: 'Electronic moisture meter',
      serial: 'MM-2020-7741',
      status: 'due_service',
      last_service: addDays(TODAY, -134),
      next_service: addDays(TODAY, -9),
      operator: 'Ngozi Eze',
    },
  },
];

/* ── Team ──────────────────────────────────────────────────────────── */

export const team: AgriRecord[] = [
  {
    id: 'team-1',
    title: 'Alhaji Musa Bello',
    status: 'active',
    amount: 0,
    meta: { role: 'Farm manager', phone: '+234 803 551 2088', area: 'Main estate', status: 'active' },
  },
  {
    id: 'team-2',
    title: 'Mrs. Ngozi Eze',
    status: 'active',
    amount: 0,
    meta: { role: 'Agronomist', phone: '+234 806 772 4119', area: 'Ekiti seed farm', status: 'active' },
  },
  {
    id: 'team-3',
    title: 'Mr. Tunde Ojo',
    status: 'active',
    amount: 0,
    meta: { role: 'Field supervisor', phone: '+234 809 338 6620', area: 'Osun cluster', status: 'active' },
  },
  {
    id: 'team-4',
    title: 'Aisha Danladi',
    status: 'active',
    amount: 0,
    meta: { role: 'Processing lead', phone: '+234 815 904 2271', area: 'Packing house', status: 'active' },
  },
  {
    id: 'team-5',
    title: 'Chidi Okafor',
    status: 'on_leave',
    amount: 0,
    meta: { role: 'Mechanic', phone: '+234 807 225 8894', area: 'Workshop', status: 'on_leave' },
  },
  {
    id: 'team-6',
    title: 'Blessing Adekunle',
    status: 'active',
    amount: 0,
    meta: { role: 'Store keeper', phone: '+234 811 660 3390', area: 'Main warehouse', status: 'active' },
  },
];

/* ── Sales ─────────────────────────────────────────────────────────── */

export const sales: AgriRecord[] = [
  {
    id: 'sale-1',
    title: 'Lagos Grain Distributors',
    status: 'paid',
    amount: 18_450_000,
    occurred_at: addDays(TODAY, -6),
    meta: { buyer: 'Lagos Grain Distributors', order_no: 'SO-2026-148', quantity: 120, unit: 'tonnes', channel: 'Wholesale', due: addDays(TODAY, 8) },
  },
  {
    id: 'sale-2',
    title: 'Flour Mills of Nigeria',
    status: 'pending',
    amount: 24_800_000,
    occurred_at: addDays(TODAY, -3),
    meta: { buyer: 'Flour Mills of Nigeria', order_no: 'SO-2026-151', quantity: 160, unit: 'tonnes', channel: 'Industrial', due: addDays(TODAY, 12) },
  },
  {
    id: 'sale-3',
    title: 'Shoprite Nigeria',
    status: 'delivered',
    amount: 6_320_000,
    occurred_at: addDays(TODAY, -9),
    meta: { buyer: 'Shoprite Nigeria', order_no: 'SO-2026-143', quantity: 1800, unit: 'packs', channel: 'Retail', due: addDays(TODAY, -2) },
  },
  {
    id: 'sale-4',
    title: 'Kano Commodity Exchange',
    status: 'confirmed',
    amount: 31_200_000,
    occurred_at: addDays(TODAY, -1),
    meta: { buyer: 'Kano Commodity Exchange', order_no: 'SO-2026-154', quantity: 200, unit: 'tonnes', channel: 'Wholesale', due: addDays(TODAY, 18) },
  },
  {
    id: 'sale-5',
    title: 'Ibadan Food Processors Coop',
    status: 'overdue',
    amount: 4_750_000,
    occurred_at: addDays(TODAY, -22),
    notes: 'Follow up with the cooperative treasurer.',
    meta: { buyer: 'Ibadan Food Processors Coop', order_no: 'SO-2026-131', quantity: 480, unit: 'bags', channel: 'Cooperative', due: addDays(TODAY, -5) },
  },
  {
    id: 'sale-6',
    title: 'Eko Supermarket chain',
    status: 'paid',
    amount: 9_140_000,
    occurred_at: addDays(TODAY, -14),
    meta: { buyer: 'Eko Supermarket chain', order_no: 'SO-2026-138', quantity: 2600, unit: 'packs', channel: 'Retail', due: addDays(TODAY, -6) },
  },
  {
    id: 'sale-7',
    title: 'Sahara Foods Limited',
    status: 'pending',
    amount: 14_600_000,
    occurred_at: addDays(TODAY, -2),
    meta: { buyer: 'Sahara Foods Limited', order_no: 'SO-2026-152', quantity: 95, unit: 'tonnes', channel: 'Industrial', due: addDays(TODAY, 10) },
  },
  {
    id: 'sale-8',
    title: 'Oyo State School Feeding Programme',
    status: 'confirmed',
    amount: 7_850_000,
    occurred_at: addDays(TODAY, -5),
    meta: { buyer: 'Oyo State School Feeding Programme', order_no: 'SO-2026-149', quantity: 900, unit: 'bags', channel: 'Institutional', due: addDays(TODAY, 15) },
  },
];

/* ── Exports ───────────────────────────────────────────────────────── */

export const exports: AgriRecord[] = [
  {
    id: 'exp-1',
    title: 'Bulk soybeans · 500t',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, -4),
    meta: {
      buyer: 'Nederlandse Voederfabriek BV',
      country: 'Netherlands',
      documents: 'Phytosanitary, invoice, bill of lading',
      ship_date: addDays(TODAY, 9),
      status: 'ready',
    },
  },
  {
    id: 'exp-2',
    title: 'Maize flour · 240t',
    status: 'in_progress',
    amount: 0,
    occurred_at: addDays(TODAY, -2),
    notes: 'NAFDAC certificate awaiting renewal.',
    meta: {
      buyer: 'Sahel Foods SARL',
      country: 'Senegal',
      documents: 'NAFDAC, invoice, packing list',
      ship_date: addDays(TODAY, 16),
      status: 'in_progress',
    },
  },
  {
    id: 'exp-3',
    title: 'Cassava flour · 180t',
    status: 'pending',
    amount: 0,
    occurred_at: addDays(TODAY, -7),
    meta: {
      buyer: 'West Africa Staples Ltd',
      country: 'Ghana',
      documents: 'Phytosanitary, certificate of origin',
      ship_date: addDays(TODAY, 21),
      status: 'pending',
    },
  },
  {
    id: 'exp-4',
    title: 'Soybean meal · 320t',
    status: 'delivered',
    amount: 0,
    occurred_at: addDays(TODAY, -32),
    meta: {
      buyer: 'Anmol Feeds Pvt Ltd',
      country: 'India',
      documents: 'Phytosanitary, invoice, bill of lading',
      ship_date: addDays(TODAY, -19),
      status: 'delivered',
    },
  },
  {
    id: 'exp-5',
    title: 'Maize grits · 150t',
    status: 'blocked',
    amount: 0,
    occurred_at: addDays(TODAY, -11),
    notes: 'Buyer requested revised lab results.',
    meta: {
      buyer: 'Al Wadi Trading Co',
      country: 'United Arab Emirates',
      documents: 'Lab analysis, invoice, packing list',
      ship_date: addDays(TODAY, 4),
      status: 'blocked',
    },
  },
];

/* ── Finance ───────────────────────────────────────────────────────── */

export const finance: AgriRecord[] = [
  {
    id: 'fin-1',
    title: 'Customer receipt · Lagos Grain Distributors',
    status: 'paid',
    amount: 18_450_000,
    occurred_at: addDays(TODAY, -6),
    meta: { type: 'receipt', reference: 'RC-2026-0881', amount: 18_450_000, date: addDays(TODAY, -6), status: 'paid' },
  },
  {
    id: 'fin-2',
    title: 'Fertiliser purchase · Notore',
    status: 'settled',
    amount: 6_840_000,
    occurred_at: addDays(TODAY, -10),
    meta: { type: 'expense', reference: 'EXP-2026-0442', amount: 6_840_000, date: addDays(TODAY, -10), status: 'settled' },
  },
  {
    id: 'fin-3',
    title: 'Invoice · Flour Mills of Nigeria',
    status: 'pending',
    amount: 24_800_000,
    occurred_at: addDays(TODAY, -3),
    meta: { type: 'invoice', reference: 'INV-2026-0151', amount: 24_800_000, date: addDays(TODAY, -3), status: 'pending' },
  },
  {
    id: 'fin-4',
    title: 'Payroll · field and processing staff',
    status: 'settled',
    amount: 3_250_000,
    occurred_at: addDays(TODAY, -15),
    meta: { type: 'payroll', reference: 'PAY-2026-011', amount: 3_250_000, date: addDays(TODAY, -15), status: 'settled' },
  },
  {
    id: 'fin-5',
    title: 'Combine harvester service',
    status: 'overdue',
    amount: 1_180_000,
    occurred_at: addDays(TODAY, -21),
    meta: { type: 'expense', reference: 'EXP-2026-0431', amount: 1_180_000, date: addDays(TODAY, -21), status: 'overdue' },
  },
  {
    id: 'fin-6',
    title: 'Customer receipt · Eko Supermarket',
    status: 'paid',
    amount: 9_140_000,
    occurred_at: addDays(TODAY, -14),
    meta: { type: 'receipt', reference: 'RC-2026-0873', amount: 9_140_000, date: addDays(TODAY, -14), status: 'paid' },
  },
  {
    id: 'fin-7',
    title: 'Packaging materials · Flexipack',
    status: 'recorded',
    amount: 2_460_000,
    occurred_at: addDays(TODAY, -2),
    meta: { type: 'expense', reference: 'EXP-2026-0451', amount: 2_460_000, date: addDays(TODAY, -2), status: 'recorded' },
  },
  {
    id: 'fin-8',
    title: 'Invoice · Oyo School Feeding Programme',
    status: 'pending',
    amount: 7_850_000,
    occurred_at: addDays(TODAY, -5),
    meta: { type: 'invoice', reference: 'INV-2026-0149', amount: 7_850_000, date: addDays(TODAY, -5), status: 'pending' },
  },
];

/* ── Reports ───────────────────────────────────────────────────────── */

export const reports: AgriRecord[] = [
  {
    id: 'rep-1',
    title: 'Planting progress',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, -1),
    meta: { period: 'Weekly', title: 'Planting progress', headline: '92% of planned hectares planted', owner: 'Ngozi Eze' },
  },
  {
    id: 'rep-2',
    title: 'Yield by plot',
    status: 'draft',
    amount: 0,
    occurred_at: addDays(TODAY, -3),
    meta: { period: 'Monthly', title: 'Yield by plot', headline: 'Maize averaging 3.1t/ha', owner: 'Musa Bello' },
  },
  {
    id: 'rep-3',
    title: 'Stock movement',
    status: 'sent',
    amount: 0,
    occurred_at: addDays(TODAY, -6),
    meta: { period: 'Daily', title: 'Stock movement', headline: '4 items below reorder level', owner: 'Blessing Adekunle' },
  },
  {
    id: 'rep-4',
    title: 'Sales and receivables',
    status: 'approved',
    amount: 0,
    occurred_at: addDays(TODAY, -2),
    meta: { period: 'Monthly', title: 'Sales and receivables', headline: '₦116.1M billed this season', owner: 'Folake Adeyemi' },
  },
  {
    id: 'rep-5',
    title: 'Export documentation',
    status: 'ready',
    amount: 0,
    occurred_at: addDays(TODAY, -4),
    meta: { period: 'Weekly', title: 'Export documentation', headline: '2 shipments awaiting documents', owner: 'Ngozi Eze' },
  },
];

/* ── Notifications ─────────────────────────────────────────────────── */

export const notifications: ShellNotification[] = [
  {
    id: 'not-1',
    title: '3 harvest batches ready',
    detail: 'Plot A1, Plot B2 and Plot E1 are ready for lifting.',
    time: '18m ago',
    unread: true,
  },
  {
    id: 'not-2',
    title: 'Low stock alert',
    detail: 'NPK 15-15-15 and maize flour labels need reordering.',
    time: '1h ago',
    unread: true,
  },
  {
    id: 'not-3',
    title: 'Export documents outstanding',
    detail: 'Shipment to Senegal is waiting on NAFDAC renewal.',
    time: '3h ago',
    unread: true,
  },
  {
    id: 'not-4',
    title: 'Activity due tomorrow',
    detail: 'Top-dress Plot A2 with urea · assigned to Ngozi Eze.',
    time: '5h ago',
    unread: true,
  },
  {
    id: 'not-5',
    title: 'Equipment service overdue',
    detail: 'CLAAS combine harvester is 3 days past its service date.',
    time: 'Yesterday',
    unread: false,
  },
];

/* ── Live hydration ───────────────────────────────────────────────────
 * Screens import these arrays by live binding, so mutating them in place
 * lets one fetch replace the preview snapshot without a remount.
 */

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? (value as any[]) : [];
}

function replaceArray<T>(target: T[], next: T[]) {
  target.splice(0, target.length, ...next);
}

function normaliseRecord(value: any): AgriRecord {
  const meta = value?.meta && typeof value.meta === 'object' ? value.meta : {};
  return {
    id: String(value?.id ?? ''),
    title: String(value?.title ?? meta.name ?? ''),
    status: String(value?.status ?? ''),
    amount: Number(value?.amount ?? 0) || 0,
    notes: value?.notes == null ? undefined : String(value.notes),
    occurred_at: value?.occurred_at ? String(value.occurred_at) : undefined,
    meta,
  };
}

export function hydrateAgriculture(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;

  const live: Record<string, AgriRecord[]> = {};
  for (const key of [
    'farms',
    'plots',
    'crops',
    'activities',
    'harvest',
    'inputs',
    'inventory',
    'processing',
    'packaging',
    'warehouse',
    'equipment',
    'team',
    'sales',
    'exports',
    'finance',
    'reports',
  ]) {
    live[key] = asArray(payload[key]).map(normaliseRecord);
  }

  const settingsRow =
    payload.settings && typeof payload.settings === 'object' ? (payload.settings as Record<string, any>) : null;
  const settingsMeta =
    settingsRow?.meta && typeof settingsRow.meta === 'object'
      ? (settingsRow.meta as Record<string, any>)
      : null;
  const settingsValues: Record<string, any> = {};
  if (settingsRow) {
    for (const [key, value] of Object.entries(settingsRow)) {
      if (key !== 'meta') settingsValues[key] = value;
    }
  }
  if (settingsMeta) Object.assign(settingsValues, settingsMeta);
  const hasSettings = Object.keys(settingsValues).length > 0;

  const anyLive =
    Object.values(live).reduce((total, rows) => total + rows.length, 0) + (hasSettings ? 1 : 0) > 0;
  if (!anyLive) return false;

  if (hasSettings) {
    Object.assign(orgSettings, settingsValues);
    if (settingsValues.name) farm.name = String(settingsValues.name);
    if (settingsValues.legal) farm.legalName = String(settingsValues.legal);
    if (settingsValues.location) farm.location = String(settingsValues.location);
    if (settingsValues.address) farm.address = String(settingsValues.address);
    if (settingsValues.phone) farm.phone = String(settingsValues.phone);
    if (settingsValues.email) farm.email = String(settingsValues.email);
    if (settingsValues.website) farm.website = String(settingsValues.website);
    if (settingsValues.currency) farm.currency = String(settingsValues.currency);
    if (settingsValues.season) farm.season = String(settingsValues.season);
    if (settingsValues.ownerName) farm.ownerName = String(settingsValues.ownerName);
    if (settingsValues.ownerEmail) farm.ownerEmail = String(settingsValues.ownerEmail);
  }

  const targets: Record<string, AgriRecord[]> = {
    farms,
    plots,
    crops,
    activities,
    harvest,
    inputs,
    inventory,
    processing,
    packaging,
    warehouse,
    equipment,
    team,
    sales,
    exports,
    finance,
    reports,
  };
  for (const [key, target] of Object.entries(targets)) {
    if (live[key].length) replaceArray(target, live[key]);
  }

  return true;
}

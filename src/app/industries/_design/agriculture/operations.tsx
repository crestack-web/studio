'use client';

import React from 'react';
import {
  activities,
  crops,
  equipment,
  farms,
  harvest,
  inputs,
  inventory,
  packaging,
  plots,
  processing,
  team,
  warehouse,
} from './mock';
import { ResourceScreen, type ResourceConfig } from './registry';

/* ── Screen configs ────────────────────────────────────────────────── */

const farmsConfig: ResourceConfig = {
  module: 'farms',
  singular: 'farm',
  plural: 'Farms',
  icon: 'layers',
  description: 'Every estate and outgrower cluster in the Greenfield network.',
  fields: [
    { key: 'title', label: 'Farm name', placeholder: 'e.g. Greenfield Main Estate' },
    { key: 'location', label: 'Location', placeholder: 'e.g. Ibadan, Oyo' },
    { key: 'hectares', label: 'Area (hectares)', type: 'number', placeholder: '0' },
    { key: 'manager', label: 'Farm manager', placeholder: 'e.g. Alhaji Musa Bello' },
  ],
  columns: [
    { key: 'title', label: 'Farm' },
    { key: 'location', label: 'Location' },
    { key: 'hectares', label: 'Hectares', align: 'right', suffix: ' ha' },
    { key: 'manager', label: 'Manager' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['active', 'planned', 'paused'],
  statusLabels: { active: 'Active', planned: 'Planned', paused: 'Paused' },
  primarySub: 'location',
  searchKeys: ['location', 'manager'],
};

const plotsConfig: ResourceConfig = {
  module: 'plots',
  singular: 'plot',
  plural: 'Plots',
  icon: 'layers',
  description: 'Field blocks, soil profiles and the crop assigned to each plot.',
  fields: [
    { key: 'title', label: 'Plot name', placeholder: 'e.g. Plot A1' },
    { key: 'farm', label: 'Farm', type: 'select', options: ['Greenfield Main Estate', 'Ekiti Seed Multiplication Farm', 'Osun Outgrowers Cluster'] },
    { key: 'area_ha', label: 'Area (ha)', type: 'number', placeholder: '0' },
    { key: 'soil', label: 'Soil type', type: 'select', options: ['loamy', 'clay loam', 'sandy loam', 'loamy sand', 'clay'] },
    { key: 'crop', label: 'Current crop', placeholder: 'e.g. Maize' },
  ],
  columns: [
    { key: 'title', label: 'Plot' },
    { key: 'farm', label: 'Farm' },
    { key: 'area_ha', label: 'Area', align: 'right', suffix: ' ha' },
    { key: 'soil', label: 'Soil' },
    { key: 'crop', label: 'Crop' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['planted', 'preparing', 'fallow', 'harvested'],
  statusLabels: { planted: 'Planted', preparing: 'Preparing', fallow: 'Fallow', harvested: 'Harvested' },
  primarySub: 'farm',
  searchKeys: ['farm', 'soil', 'crop'],
};

const cropsConfig: ResourceConfig = {
  module: 'crops',
  singular: 'crop cycle',
  plural: 'Crops',
  icon: 'checklist',
  description: 'Planting dates, varieties and expected harvest windows per cycle.',
  fields: [
    { key: 'title', label: 'Crop cycle', placeholder: 'e.g. Maize · Plot A1' },
    { key: 'plot', label: 'Plot', placeholder: 'e.g. Plot A1' },
    { key: 'variety', label: 'Variety', placeholder: 'e.g. SUWAN 1 (hybrid)' },
    { key: 'planted', label: 'Planted on', type: 'date' },
    { key: 'expected_harvest', label: 'Expected harvest', type: 'date' },
    { key: 'progress', label: 'Growth progress (%)', type: 'number', placeholder: '0' },
  ],
  columns: [
    { key: 'title', label: 'Crop cycle' },
    { key: 'plot', label: 'Plot' },
    { key: 'variety', label: 'Variety' },
    { key: 'planted', label: 'Planted', kind: 'date' },
    { key: 'expected_harvest', label: 'Expected harvest', kind: 'date' },
    { key: 'progress', label: 'Growth', kind: 'progress' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['growing', 'flowering', 'ready', 'harvested'],
  statusLabels: { growing: 'Growing', flowering: 'Flowering', ready: 'Ready', harvested: 'Harvested' },
  primarySub: 'plot',
  dateKey: 'planted',
  searchKeys: ['plot', 'variety'],
};

const activitiesConfig: ResourceConfig = {
  module: 'activities',
  singular: 'activity',
  plural: 'Activities',
  icon: 'calendar',
  description: 'Field work scheduled across every plot, with owners and due dates.',
  fields: [
    { key: 'title', label: 'Activity', placeholder: 'e.g. Second weeding · Plot A1' },
    { key: 'plot', label: 'Plot', placeholder: 'e.g. Plot A1' },
    { key: 'type', label: 'Activity type', type: 'select', options: ['planting', 'weeding', 'fertilising', 'irrigation', 'scouting', 'spraying', 'harvesting'] },
    { key: 'assignee', label: 'Assigned to', placeholder: 'e.g. Musa Bello' },
    { key: 'due', label: 'Due date', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Activity' },
    { key: 'type', label: 'Type' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'due', label: 'Due', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['scheduled', 'in_progress', 'done', 'blocked'],
  statusLabels: { scheduled: 'Scheduled', in_progress: 'In progress', done: 'Done', blocked: 'Blocked' },
  primarySub: 'plot',
  dateKey: 'due',
  searchKeys: ['plot', 'type', 'assignee'],
};

const harvestConfig: ResourceConfig = {
  module: 'harvest',
  singular: 'harvest batch',
  plural: 'Harvest',
  icon: 'clipboard',
  description: 'Lifting, grading and tonnage for every harvested batch.',
  fields: [
    { key: 'title', label: 'Batch name', placeholder: 'e.g. Maize · Plot A1' },
    { key: 'plot', label: 'Plot', placeholder: 'e.g. Plot A1' },
    { key: 'crop', label: 'Crop', placeholder: 'e.g. Maize' },
    { key: 'quantity_t', label: 'Quantity (tonnes)', type: 'number', placeholder: '0' },
    { key: 'grade', label: 'Grade', type: 'select', options: ['A', 'B', 'C'] },
    { key: 'date', label: 'Harvest date', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Batch' },
    { key: 'plot', label: 'Plot' },
    { key: 'crop', label: 'Crop' },
    { key: 'quantity_t', label: 'Quantity', align: 'right', suffix: ' t' },
    { key: 'grade', label: 'Grade', kind: 'badge' },
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['ready', 'grading', 'graded', 'stored'],
  statusLabels: { ready: 'Ready', grading: 'Grading', graded: 'Graded', stored: 'Stored' },
  primarySub: 'crop',
  dateKey: 'date',
  searchKeys: ['plot', 'crop', 'grade'],
};

const inputsConfig: ResourceConfig = {
  module: 'inputs',
  singular: 'input',
  plural: 'Inputs',
  icon: 'box',
  description: 'Fertiliser, seed and agrochemical replenishment with reorder levels.',
  fields: [
    { key: 'title', label: 'Input name', placeholder: 'e.g. NPK 15-15-15 fertiliser' },
    { key: 'supplier', label: 'Supplier', placeholder: 'e.g. Olam Agri Nigeria' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['bags (50kg)', 'bags (10kg)', 'cartons', 'litres', 'kg'] },
    { key: 'quantity', label: 'Quantity on hand', type: 'number', placeholder: '0' },
    { key: 'reorder_level', label: 'Reorder level', type: 'number', placeholder: '0' },
  ],
  columns: [
    { key: 'title', label: 'Input' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'quantity', label: 'On hand', align: 'right' },
    { key: 'reorder_level', label: 'Reorder at', align: 'right' },
    { key: 'unit', label: 'Unit' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['in_stock', 'low_stock', 'out_of_stock'],
  primarySub: 'supplier',
  searchKeys: ['supplier', 'unit'],
};

const inventoryConfig: ResourceConfig = {
  module: 'inventory',
  singular: 'inventory item',
  plural: 'Inventory',
  icon: 'box',
  description: 'Grain, flour, feed and packaging stock across all stores.',
  fields: [
    { key: 'title', label: 'Item', placeholder: 'e.g. Maize grain · Grade A' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['tonnes', 'bags (25kg)', 'pieces', 'packs', 'rolls', 'litres'] },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
    { key: 'location', label: 'Location', placeholder: 'e.g. Main warehouse' },
    { key: 'reorder_level', label: 'Reorder level', type: 'number', placeholder: '0' },
  ],
  columns: [
    { key: 'title', label: 'Item' },
    { key: 'location', label: 'Location' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'reorder_level', label: 'Reorder at', align: 'right' },
    { key: 'unit', label: 'Unit' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['in_stock', 'low_stock', 'out_of_stock'],
  primarySub: 'location',
  searchKeys: ['location', 'unit'],
};

const processingConfig: ResourceConfig = {
  module: 'processing',
  singular: 'processing batch',
  plural: 'Processing',
  icon: 'sparkles',
  description: 'Milling and sorting runs with inputs, outputs and recovery yields.',
  fields: [
    { key: 'title', label: 'Batch number', placeholder: 'e.g. PR-2026-041' },
    { key: 'input', label: 'Raw input', placeholder: 'e.g. Maize grain · 12t' },
    { key: 'output', label: 'Finished output', placeholder: 'e.g. Maize flour · 5kg packs' },
    { key: 'stage', label: 'Stage', type: 'select', options: ['sorting', 'shelling', 'milling', 'packing', 'quality_check'] },
    { key: 'yield_pct', label: 'Yield (%)', type: 'number', placeholder: '0' },
  ],
  columns: [
    { key: 'title', label: 'Batch' },
    { key: 'input', label: 'Input' },
    { key: 'output', label: 'Output' },
    { key: 'stage', label: 'Stage' },
    { key: 'yield_pct', label: 'Yield', kind: 'progress' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['in_progress', 'done', 'on_hold'],
  primarySub: 'input',
  searchKeys: ['input', 'output', 'stage'],
};

const packagingConfig: ResourceConfig = {
  module: 'packaging',
  singular: 'packaging run',
  plural: 'Packaging',
  icon: 'box',
  description: 'Pack sizes, unit counts and label approvals for finished goods.',
  fields: [
    { key: 'title', label: 'Run name', placeholder: 'e.g. Maize flour · 5kg' },
    { key: 'batch', label: 'Source batch', placeholder: 'e.g. PR-2026-041' },
    { key: 'pack_size', label: 'Pack size', placeholder: 'e.g. 5kg' },
    { key: 'units', label: 'Units packed', type: 'number', placeholder: '0' },
    { key: 'label', label: 'Label', placeholder: 'e.g. Greenfield Maize Flour' },
  ],
  columns: [
    { key: 'title', label: 'Run' },
    { key: 'batch', label: 'Batch' },
    { key: 'pack_size', label: 'Pack size' },
    { key: 'units', label: 'Units', align: 'right' },
    { key: 'label', label: 'Label' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['preparing', 'labelled', 'ready', 'dispatched'],
  statusLabels: { preparing: 'Preparing', labelled: 'Labelled', ready: 'Ready', dispatched: 'Dispatched' },
  primarySub: 'batch',
  searchKeys: ['batch', 'pack_size', 'label'],
};

const warehouseConfig: ResourceConfig = {
  module: 'warehouse',
  singular: 'warehouse entry',
  plural: 'Warehouse',
  icon: 'layers',
  description: 'Bin locations and quantities held in each warehouse bay.',
  fields: [
    { key: 'title', label: 'Stored item', placeholder: 'e.g. Maize grain · Grade A' },
    { key: 'location', label: 'Bay / location', placeholder: 'e.g. Bay 1 · Main warehouse' },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['tonnes', 'bags', 'packs', 'pieces'] },
    { key: 'bin', label: 'Bin', placeholder: 'e.g. A-01' },
  ],
  columns: [
    { key: 'title', label: 'Item' },
    { key: 'location', label: 'Location' },
    { key: 'bin', label: 'Bin' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'unit', label: 'Unit' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['stored', 'reserved', 'dispatch_ready'],
  statusLabels: { stored: 'Stored', reserved: 'Reserved', dispatch_ready: 'Dispatch ready' },
  primarySub: 'bin',
  searchKeys: ['location', 'bin', 'unit'],
};

const equipmentConfig: ResourceConfig = {
  module: 'equipment',
  singular: 'equipment record',
  plural: 'Equipment',
  icon: 'settings',
  description: 'Tractors, mills and implements with service history and operators.',
  fields: [
    { key: 'title', label: 'Equipment', placeholder: 'e.g. John Deere 5075E tractor' },
    { key: 'serial', label: 'Serial number', placeholder: 'e.g. JD5075-2018-2291' },
    { key: 'operator', label: 'Operator', placeholder: 'e.g. Musa Bello' },
    { key: 'last_service', label: 'Last service', type: 'date' },
    { key: 'next_service', label: 'Next service', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Equipment' },
    { key: 'serial', label: 'Serial' },
    { key: 'operator', label: 'Operator' },
    { key: 'last_service', label: 'Last service', kind: 'date' },
    { key: 'next_service', label: 'Next service', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['operational', 'due_service', 'in_repair'],
  statusLabels: { operational: 'Operational', due_service: 'Due service', in_repair: 'In repair' },
  primarySub: 'serial',
  dateKey: 'last_service',
  searchKeys: ['serial', 'operator'],
};

const teamConfig: ResourceConfig = {
  module: 'team',
  singular: 'team member',
  plural: 'Team',
  icon: 'staff',
  description: 'Farm staff, their assignments and current availability.',
  fields: [
    { key: 'title', label: 'Full name', placeholder: 'e.g. Alhaji Musa Bello' },
    { key: 'role', label: 'Role', type: 'select', options: ['Farm manager', 'Agronomist', 'Field supervisor', 'Processing lead', 'Mechanic', 'Store keeper'] },
    { key: 'phone', label: 'Phone', placeholder: '+234 …' },
    { key: 'area', label: 'Area', placeholder: 'e.g. Main estate' },
  ],
  columns: [
    { key: 'title', label: 'Member' },
    { key: 'role', label: 'Role' },
    { key: 'area', label: 'Area' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  statusOptions: ['active', 'on_leave', 'inactive'],
  primarySub: 'role',
  searchKeys: ['role', 'area', 'phone'],
};

/* ── Screens ───────────────────────────────────────────────────────── */

export function AgricultureFarms() {
  return <ResourceScreen config={farmsConfig} rows={farms} />;
}

export function AgriculturePlots() {
  return <ResourceScreen config={plotsConfig} rows={plots} />;
}

export function AgricultureCrops() {
  return <ResourceScreen config={cropsConfig} rows={crops} />;
}

export function AgricultureActivities() {
  return <ResourceScreen config={activitiesConfig} rows={activities} />;
}

export function AgricultureHarvest() {
  return <ResourceScreen config={harvestConfig} rows={harvest} />;
}

export function AgricultureInputs() {
  return <ResourceScreen config={inputsConfig} rows={inputs} />;
}

export function AgricultureInventory() {
  return <ResourceScreen config={inventoryConfig} rows={inventory} />;
}

export function AgricultureProcessing() {
  return <ResourceScreen config={processingConfig} rows={processing} />;
}

export function AgriculturePackaging() {
  return <ResourceScreen config={packagingConfig} rows={packaging} />;
}

export function AgricultureWarehouse() {
  return <ResourceScreen config={warehouseConfig} rows={warehouse} />;
}

export function AgricultureEquipment() {
  return <ResourceScreen config={equipmentConfig} rows={equipment} />;
}

export function AgricultureTeam() {
  return <ResourceScreen config={teamConfig} rows={team} />;
}

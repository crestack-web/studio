'use client';

import React from 'react';
import { exports, finance, reports, sales } from './mock';
import { ResourceScreen, type ResourceConfig } from './registry';

/* ── Screen configs ────────────────────────────────────────────────── */

const salesConfig: ResourceConfig = {
  module: 'sales',
  singular: 'sale',
  plural: 'Sales',
  icon: 'trend',
  description: 'Orders, buyers, channels and collections across every market.',
  fields: [
    { key: 'title', label: 'Buyer', placeholder: 'e.g. Lagos Grain Distributors' },
    { key: 'order_no', label: 'Order number', placeholder: 'e.g. SO-2026-148' },
    { key: 'quantity', label: 'Quantity', type: 'number', placeholder: '0' },
    { key: 'unit', label: 'Unit', type: 'select', options: ['tonnes', 'bags', 'packs', 'kg'] },
    { key: 'channel', label: 'Channel', type: 'select', options: ['Wholesale', 'Retail', 'Industrial', 'Cooperative', 'Institutional'] },
    { key: 'amount', label: 'Order value (₦)', type: 'number', placeholder: '0' },
    { key: 'due', label: 'Payment due', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Buyer' },
    { key: 'order_no', label: 'Order no.' },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'unit', label: 'Unit' },
    { key: 'channel', label: 'Channel' },
    { key: 'amount', label: 'Value', kind: 'money' },
    { key: 'due', label: 'Due', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  amountKey: 'amount',
  dateKey: 'due',
  primarySub: 'order_no',
  searchKeys: ['order_no', 'channel', 'quantity', 'unit'],
  statusOptions: ['pending', 'confirmed', 'delivered', 'paid', 'overdue'],
};

const exportsConfig: ResourceConfig = {
  module: 'exports',
  singular: 'export shipment',
  plural: 'Exports',
  icon: 'globe',
  description: 'Cross-border orders with destination, documents and shipping dates.',
  fields: [
    { key: 'title', label: 'Buyer', placeholder: 'e.g. Sahel Foods SARL' },
    { key: 'country', label: 'Destination country', placeholder: 'e.g. Senegal' },
    { key: 'documents', label: 'Documents', placeholder: 'e.g. Phytosanitary, invoice, bill of lading' },
    { key: 'ship_date', label: 'Ship date', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Buyer' },
    { key: 'country', label: 'Country' },
    { key: 'documents', label: 'Documents' },
    { key: 'ship_date', label: 'Ship date', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  dateKey: 'ship_date',
  primarySub: 'country',
  searchKeys: ['country', 'documents'],
  statusOptions: ['pending', 'in_progress', 'ready', 'delivered', 'blocked'],
};

const financeConfig: ResourceConfig = {
  module: 'finance',
  singular: 'finance entry',
  plural: 'Finance',
  icon: 'receipt',
  description: 'Receipts, invoices, expenses and payroll in the farm ledger.',
  fields: [
    { key: 'title', label: 'Description', placeholder: 'e.g. Customer receipt · Lagos Grain Distributors' },
    { key: 'type', label: 'Entry type', type: 'select', options: ['receipt', 'invoice', 'expense', 'payroll'] },
    { key: 'reference', label: 'Reference', placeholder: 'e.g. RC-2026-0881' },
    { key: 'amount', label: 'Amount (₦)', type: 'number', placeholder: '0' },
    { key: 'date', label: 'Date', type: 'date' },
  ],
  columns: [
    { key: 'title', label: 'Description' },
    { key: 'type', label: 'Type', kind: 'badge' },
    { key: 'reference', label: 'Reference' },
    { key: 'amount', label: 'Amount', kind: 'money' },
    { key: 'date', label: 'Date', kind: 'date' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  amountKey: 'amount',
  dateKey: 'date',
  primarySub: 'reference',
  searchKeys: ['type', 'reference'],
  statusOptions: ['pending', 'recorded', 'paid', 'settled', 'overdue'],
};

const reportsConfig: ResourceConfig = {
  module: 'reports',
  singular: 'report',
  plural: 'Reports',
  icon: 'chart',
  description: 'Scheduled farm intelligence shared with the management team.',
  fields: [
    { key: 'title', label: 'Report title', placeholder: 'e.g. Yield by plot' },
    { key: 'period', label: 'Period', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly'] },
    { key: 'headline', label: 'Headline', placeholder: 'e.g. Maize averaging 3.1t/ha' },
    { key: 'owner', label: 'Owner', placeholder: 'e.g. Ngozi Eze' },
  ],
  columns: [
    { key: 'title', label: 'Report' },
    { key: 'period', label: 'Period', kind: 'badge' },
    { key: 'headline', label: 'Headline' },
    { key: 'owner', label: 'Owner' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  primarySub: 'period',
  searchKeys: ['period', 'headline', 'owner'],
  statusOptions: ['draft', 'ready', 'approved', 'sent', 'archived'],
};

/* ── Screens ───────────────────────────────────────────────────────── */

export function AgricultureSales() {
  return <ResourceScreen config={salesConfig} rows={sales} />;
}

export function AgricultureExports() {
  return <ResourceScreen config={exportsConfig} rows={exports} />;
}

export function AgricultureFinance() {
  return <ResourceScreen config={financeConfig} rows={finance} />;
}

export function AgricultureReports() {
  return <ResourceScreen config={reportsConfig} rows={reports} />;
}

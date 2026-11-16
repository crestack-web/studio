'use client';

import React, { useMemo, useState } from 'react';
import { Download, Plus, Printer } from 'lucide-react';
import {
  Badge,
  Card,
  EmptyState,
  Field,
  Kpi,
  PageHeader,
  Progress,
  SearchInput,
  Sheet,
  StatusBadge,
  Tabs,
  Td,
  Th,
  TableWrap,
  useToast,
} from '../primitives';
import { BarsChart, Donut, Legend, Sparkline, TrendChart } from '../charts';
import { Icon } from '../icons';
import { compactMoney, fmtDate, money } from '../format';
import { useSolutionsLive } from '../live';
import {
  channelMix,
  expenseSummary,
  expenses,
  paymentSummary,
  payments,
  reports,
  revenueByType,
  revenueSeries,
  revenueSummary,
} from './mock';

/* PLACEHOLDER - will be replaced */
export function HospitalityRevenue() { return null; }
export function HospitalityExpenses() { return null; }
export function HospitalityPayments() { return null; }
export function HospitalityReports() { return null; }

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { getFirestoreUserId } from '@/lib/supabase-auth';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import styles from './ReportsPage.module.css';

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

type BusinessModel =
  | 'retail'
  | 'wholesale'
  | 'distributor'
  | 'supermarket'
  | 'grocery'
  | 'pharmacy'
  | 'fashion'
  | 'electronics'
  | 'restaurant'
  | 'cafe'
  | 'manufacturing'
  | 'services'
  | 'education'
  | 'jobs'
  | 'recycling'
  | 'healthcare'
  | 'other';

interface SaleRow {
  id: string;
  total: number;
  profit: number;
  cogs: number;
  paymentMethod: string;
  createdAt: Date | null;
  staffName: string;
  items: Array<{ productId?: string; name: string; quantity: number; revenue: number; cost: number }>;
}

interface ProductRow {
  id: string;
  name: string;
  stock: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  productType?: string;
}

interface Insights {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  marginPct: number;
  expenseRatio: number;
  salesCount: number;
  avgTicket: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number; profit: number }>;
  slowProducts: Array<{ name: string; stock: number; daysIdle: string }>;
  lowStock: Array<{ name: string; stock: number; reorderLevel: number }>;
  staffLeaders: Array<{ name: string; revenue: number; sales: number }>;
  dayPattern: Array<{ day: string; revenue: number; sales: number }>;
  paymentMix: Array<{ method: string; amount: number; pct: number }>;
  expenseCats: Array<{ category: string; amount: number; pct: number }>;
  inventoryValue: number;
  productsTracked: number;
  materialKg: number;
  materialSpend: number;
  materialPaid: number;
  topMaterials: Array<{ name: string; kg: number; spend: number; paid: number }>;
  topSuppliers: Array<{ name: string; kg: number; spend: number; trips: number }>;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const INVENTORY_MODELS = new Set<BusinessModel>([
  'retail',
  'wholesale',
  'distributor',
  'supermarket',
  'grocery',
  'pharmacy',
  'fashion',
  'electronics',
  'manufacturing',
]);

const FOOD_MODELS = new Set<BusinessModel>(['restaurant', 'cafe']);

function normalizeCategory(raw: string | undefined | null): BusinessModel {
  const c = (raw || 'other').toLowerCase().trim();
  const map: Record<string, BusinessModel> = {
    retail: 'retail',
    shop: 'retail',
    store: 'retail',
    wholesale: 'wholesale',
    distributor: 'distributor',
    distribution: 'distributor',
    supermarket: 'supermarket',
    grocery: 'grocery',
    pharmacy: 'pharmacy',
    fashion: 'fashion',
    clothing: 'fashion',
    electronics: 'electronics',
    restaurant: 'restaurant',
    cafe: 'cafe',
    café: 'cafe',
    manufacturing: 'manufacturing',
    services: 'services',
    service: 'services',
    education: 'education',
  };
  return map[c] || 'other';
}

function modelLabel(m: BusinessModel): string {
  const labels: Record<BusinessModel, string> = {
    retail: 'Retail & shops',
    wholesale: 'Wholesale',
    distributor: 'Distribution',
    supermarket: 'Supermarket',
    grocery: 'Grocery',
    pharmacy: 'Pharmacy',
    fashion: 'Fashion & brands',
    electronics: 'Electronics',
    restaurant: 'Restaurant',
    cafe: 'Café',
    manufacturing: 'Manufacturing',
    services: 'Services',
    education: 'Education',
    jobs: 'Jobs & projects',
    recycling: 'Material collection',
    healthcare: 'Healthcare',
    other: 'General business',
  };
  return labels[m];
}

function useCaseCopy(m: BusinessModel): { title: string; body: string } {
  if (FOOD_MODELS.has(m)) {
    return {
      title: 'Built for food operations',
      body: 'See which dishes move, where expenses concentrate, and which days drive the kitchen — without reprinting a full statement.',
    };
  }
  if (m === 'wholesale' || m === 'distributor') {
    return {
      title: 'Built for bulk & credit-heavy trade',
      body: 'Spot your strongest lines, slow stock, and who is ringing sales — so you restock and collect with clearer priorities.',
    };
  }
  if (m === 'services') {
    return {
      title: 'Built for service businesses',
      body: 'Track ticket size, payment mix, and expense pressure. Formal books stay on Statement; this page is for decisions.',
    };
  }
  if (m === 'manufacturing') {
    return {
      title: 'Built for makers',
      body: 'See product performance and inventory value so production and sales stay aligned.',
    };
  }
  if (INVENTORY_MODELS.has(m)) {
    return {
      title: 'Built for product businesses',
      body: 'Top sellers, idle stock, and low-stock risk — the operational picture Statement does not prioritise.',
    };
  }
  return {
    title: 'Decision reports, not duplicate books',
    body: 'Statement is your printable ledger. Reports surfaces what to act on: products, staff, days, and cost pressure.',
  };
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === 'object' && v !== null && 'seconds' in (v as object)) {
    const o = v as { seconds: number; nanoseconds?: number };
    return new Date(o.seconds * 1000 + ((o.nanoseconds || 0) / 1e6));
  }
  return null;
}

function periodRange(
  period: PeriodType,
  startDate: string,
  endDate: string
): { start: Date; end: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'custom':
      start = startDate
        ? new Date(startDate)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      end = endDate ? new Date(endDate) : new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now);
  }
  return { start, end };
}

export function ReportsPage() {
  const { showToast, user, navigateTo } = useApp();
  const { formatMoney } = useCurrency();

  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(user?.businessId || null);
  const [businessModel, setBusinessModel] = useState<BusinessModel>('other');
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    async function resolve() {
      try {
        let bid = user?.businessId || null;
        const userIds = getFirestoreUserId();
        let categoryRaw = (user as { category?: string; businessCategory?: string })?.category
          || (user as { businessCategory?: string })?.businessCategory
          || '';

        if (!bid && userIds) {
          const { data: userDoc } = await getSupabase()
            .from('users')
            .select('*')
            .eq('id', userIds.firestoreUid)
            .maybeSingle();
          bid = await resolveOwnerScopeBusinessId(
            user?.id || userIds.firestoreUid,
            userDoc?.businessId || userDoc?.business_id
          );
          if (!categoryRaw) {
            categoryRaw =
              userDoc?.businessCategory ||
              userDoc?.business_category ||
              userDoc?.category ||
              '';
          }
        }

        if (bid) {
          setBusinessId(bid);
          try {
            const { data: biz } = await getSupabase()
              .from('businesses')
              .select('category,business_category,business_type,metadata')
              .eq('id', bid)
              .maybeSingle();
            const meta = (biz?.metadata && typeof biz.metadata === 'object'
              ? biz.metadata
              : {}) as Record<string, unknown>;
            categoryRaw =
              categoryRaw ||
              (biz as any)?.category ||
              (biz as any)?.business_category ||
              (biz as any)?.business_type ||
              (meta.category as string) ||
              (meta.businessCategory as string) ||
              '';
          } catch {
            /* keep fallback */
          }
        }
        setBusinessModel(normalizeCategory(categoryRaw));
      } catch (e) {
        console.error('Reports resolve business', e);
      }
    }
    resolve();
  }, [user?.businessId, user?.id]);

  const loadInsights = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { start, end } = periodRange(period, startDate, endDate);
      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const [salesRaw, expensesRaw, productsRaw] = await Promise.all([
        fetchDocs(`businesses/${businessId}/sales`, {
          orderBy: { field: 'created_at', ascending: false },
        }).catch(() => []),
        fetchDocs(`businesses/${businessId}/expenses`, {
          orderBy: { field: 'created_at', ascending: false },
        }).catch(() => []),
        fetchDocs(`businesses/${businessId}/products`).catch(() => []),
      ]);

      const sales: SaleRow[] = (salesRaw || [])
        .map((s: any) => {
          const createdAt = parseDate(s.createdAt || s.created_at);
          if (createdAt && (createdAt < start || createdAt > end)) return null;
          const total = Number(
            s.totalRevenue ?? s.total ?? s.totalAmount ?? s.total_amount ?? 0
          ) || 0;
          const profit = Number(s.profit ?? 0) || 0;
          const itemsSrc = (s.products || s.items || []) as any[];
          const items = itemsSrc.map((p: any) => {
            const qty = Number(p.quantity ?? p.qty ?? 1) || 1;
            const unitPrice = Number(p.price ?? p.unitPrice ?? p.sellingPrice ?? 0) || 0;
            const unitCost = Number(p.cost ?? p.costPrice ?? p.unitCost ?? 0) || 0;
            const lineRev = Number(p.total ?? p.lineTotal ?? unitPrice * qty) || unitPrice * qty;
            const lineCost = unitCost * qty;
            return {
              productId: p.productId || p.id || p.product_id,
              name: String(p.name || p.productName || p.title || 'Item'),
              quantity: qty,
              revenue: lineRev,
              cost: lineCost,
            };
          });
          let cogs = items.reduce((a, i) => a + i.cost, 0);
          if (cogs <= 0 && total > 0) cogs = Math.max(0, total - profit);
          const staffName =
            s.soldByName ||
            s.recordedByName ||
            s.recordedBy?.displayName ||
            s.staffName ||
            s.createdByName ||
            'Owner / unassigned';
          return {
            id: s.id,
            total,
            profit: profit || total - cogs,
            cogs,
            paymentMethod: String(s.paymentMethod || s.payment_method || s.paymentType || 'cash'),
            createdAt,
            staffName: String(staffName),
            items,
          } as SaleRow;
        })
        .filter(Boolean) as SaleRow[];

      // If period filter emptied everything but we have sales, fall back to all (like Statement)
      let effectiveSales = sales;
      if (sales.length === 0 && (salesRaw || []).length > 0 && period !== 'custom') {
        effectiveSales = (salesRaw || []).map((s: any) => {
          const total = Number(s.totalRevenue ?? s.total ?? s.totalAmount ?? 0) || 0;
          const profit = Number(s.profit ?? 0) || 0;
          const itemsSrc = (s.products || s.items || []) as any[];
          const items = itemsSrc.map((p: any) => {
            const qty = Number(p.quantity ?? p.qty ?? 1) || 1;
            const unitPrice = Number(p.price ?? p.unitPrice ?? 0) || 0;
            const unitCost = Number(p.cost ?? p.costPrice ?? 0) || 0;
            return {
              productId: p.productId || p.id,
              name: String(p.name || p.productName || 'Item'),
              quantity: qty,
              revenue: Number(p.total ?? unitPrice * qty) || unitPrice * qty,
              cost: unitCost * qty,
            };
          });
          let cogs = items.reduce((a, i) => a + i.cost, 0);
          if (cogs <= 0) cogs = Math.max(0, total - profit);
          return {
            id: s.id,
            total,
            profit: profit || total - cogs,
            cogs,
            paymentMethod: String(s.paymentMethod || s.payment_method || 'cash'),
            createdAt: parseDate(s.createdAt || s.created_at),
            staffName: String(
              s.soldByName || s.recordedBy?.displayName || s.staffName || 'Owner / unassigned'
            ),
            items,
          } as SaleRow;
        });
      }

      const expenses = (expensesRaw || []).filter((e: any) => {
        const d = parseDate(e.createdAt || e.created_at || e.date || e.expenseDate);
        if (!d) return true;
        return d >= start && d <= end;
      });

      const products: ProductRow[] = (productsRaw || []).map((p: any) => ({
        id: p.id,
        name: String(p.name || 'Product'),
        stock: Number(p.stock ?? p.stockLevel ?? p.stock_level ?? p.quantity ?? 0) || 0,
        reorderLevel: Number(p.reorderLevel ?? p.reorder_level ?? 0) || 0,
        costPrice: Number(p.costPrice ?? p.cost ?? p.cost_price ?? 0) || 0,
        sellingPrice: Number(p.sellingPrice ?? p.price ?? p.selling_price ?? 0) || 0,
        productType: p.productType || p.product_type || p.type,
      }));

      const revenue = effectiveSales.reduce((a, s) => a + s.total, 0);
      const cogs = effectiveSales.reduce((a, s) => a + s.cogs, 0);
      const grossProfit = revenue - cogs;
      const expenseTotal = expenses.reduce(
        (a: number, e: any) => a + (Number(e.amount) || 0),
        0
      );
      const netProfit = grossProfit - expenseTotal;
      const salesCount = effectiveSales.length;
      const avgTicket = salesCount > 0 ? revenue / salesCount : 0;
      const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const expenseRatio = revenue > 0 ? (expenseTotal / revenue) * 100 : 0;

      const productAgg: Record<
        string,
        { name: string; quantity: number; revenue: number; profit: number }
      > = {};
      effectiveSales.forEach((s) => {
        if (s.items.length === 0) return;
        s.items.forEach((it) => {
          const key = it.productId || it.name;
          if (!productAgg[key]) {
            productAgg[key] = { name: it.name, quantity: 0, revenue: 0, profit: 0 };
          }
          productAgg[key].quantity += it.quantity;
          productAgg[key].revenue += it.revenue;
          productAgg[key].profit += it.revenue - it.cost;
        });
      });
      const topProducts = Object.values(productAgg)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      const soldIds = new Set(
        Object.keys(productAgg).map((k) => k.toLowerCase())
      );
      const soldNames = new Set(
        Object.values(productAgg).map((p) => p.name.toLowerCase())
      );
      const slowProducts = products
        .filter((p) => {
          if (p.stock <= 0) return false;
          const idHit = soldIds.has(p.id);
          const nameHit = soldNames.has(p.name.toLowerCase());
          return !idHit && !nameHit;
        })
        .sort((a, b) => b.stock * b.costPrice - a.stock * a.costPrice)
        .slice(0, 6)
        .map((p) => ({
          name: p.name,
          stock: p.stock,
          daysIdle: 'No sales in period',
        }));

      const lowStock = products
        .filter((p) => p.reorderLevel > 0 && p.stock <= p.reorderLevel)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 8)
        .map((p) => ({
          name: p.name,
          stock: p.stock,
          reorderLevel: p.reorderLevel,
        }));

      const staffMap: Record<string, { name: string; revenue: number; sales: number }> = {};
      effectiveSales.forEach((s) => {
        const key = s.staffName || 'Owner / unassigned';
        if (!staffMap[key]) staffMap[key] = { name: key, revenue: 0, sales: 0 };
        staffMap[key].revenue += s.total;
        staffMap[key].sales += 1;
      });
      const staffLeaders = Object.values(staffMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

      const dayMap: Record<number, { revenue: number; sales: number }> = {};
      for (let i = 0; i < 7; i++) dayMap[i] = { revenue: 0, sales: 0 };
      effectiveSales.forEach((s) => {
        if (!s.createdAt) return;
        const d = s.createdAt.getDay();
        dayMap[d].revenue += s.total;
        dayMap[d].sales += 1;
      });
      const dayPattern = DAY_NAMES.map((day, i) => ({
        day,
        revenue: dayMap[i].revenue,
        sales: dayMap[i].sales,
      }));

      const payMap: Record<string, number> = {};
      effectiveSales.forEach((s) => {
        const m = s.paymentMethod || 'cash';
        payMap[m] = (payMap[m] || 0) + s.total;
      });
      const paymentMix = Object.entries(payMap)
        .map(([method, amount]) => ({
          method,
          amount,
          pct: revenue > 0 ? (amount / revenue) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      const expMap: Record<string, number> = {};
      expenses.forEach((e: any) => {
        const cat = String(e.category || e.type || 'Other');
        expMap[cat] = (expMap[cat] || 0) + (Number(e.amount) || 0);
      });
      const expenseCats = Object.entries(expMap)
        .map(([category, amount]) => ({
          category,
          amount,
          pct: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);

      const inventoryValue = products.reduce(
        (a, p) => a + p.stock * (p.costPrice || p.sellingPrice * 0.6 || 0),
        0
      );

      // Material collection (recycling) — period-scoped
      let materialKg = 0;
      let materialSpend = 0;
      let materialPaid = 0;
      let topMaterials: Insights['topMaterials'] = [];
      let topSuppliers: Insights['topSuppliers'] = [];
      try {
        const matRows = await fetchDocs(`businesses/${businessId}/materialPurchases`, {
          orderBy: { field: 'created_at', ascending: false },
        });
        const inRange = (matRows || []).filter((row: any) => {
          const raw =
            row.purchaseDate ||
            row.purchase_date ||
            row.createdAt ||
            row.created_at;
          if (!raw) return true;
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) return true;
          // reuse same range as sales: period already applied upstream via rangeStart/rangeEnd if available
          return true;
        });
        // Filter by period dates when start/end known from state
        const rangeStart = startDate ? new Date(startDate) : null;
        const rangeEnd = endDate ? new Date(endDate) : null;
        if (rangeEnd) rangeEnd.setHours(23, 59, 59, 999);
        const scoped = inRange.filter((row: any) => {
          if (!rangeStart && !rangeEnd) return true;
          const raw =
            row.purchaseDate ||
            row.purchase_date ||
            row.createdAt ||
            row.created_at;
          if (!raw) return true;
          const d = new Date(raw);
          if (Number.isNaN(d.getTime())) return true;
          if (rangeStart && d < rangeStart) return false;
          if (rangeEnd && d > rangeEnd) return false;
          return true;
        });
        const matMap: Record<string, { name: string; kg: number; spend: number; paid: number }> = {};
        const supMap: Record<string, { name: string; kg: number; spend: number; trips: number }> = {};
        scoped.forEach((row: any) => {
          const kg = Number(row.weightKg ?? row.weight_kg ?? 0) || 0;
          const spend = Number(row.totalAmount ?? row.total_amount ?? 0) || 0;
          const paid = Number(row.amountPaid ?? row.amount_paid ?? 0) || 0;
          materialKg += kg;
          materialSpend += spend;
          materialPaid += paid;
          const mName = String(row.materialName ?? row.material_name ?? 'Material');
          if (!matMap[mName]) matMap[mName] = { name: mName, kg: 0, spend: 0, paid: 0 };
          matMap[mName].kg += kg;
          matMap[mName].spend += spend;
          matMap[mName].paid += paid;
          const sName = String(row.supplierName ?? row.supplier_name ?? 'Supplier');
          if (!supMap[sName]) supMap[sName] = { name: sName, kg: 0, spend: 0, trips: 0 };
          supMap[sName].kg += kg;
          supMap[sName].spend += spend;
          supMap[sName].trips += 1;
        });
        topMaterials = Object.values(matMap)
          .sort((a, b) => b.kg - a.kg)
          .slice(0, 8);
        topSuppliers = Object.values(supMap)
          .sort((a, b) => b.spend - a.spend)
          .slice(0, 8);
      } catch (e) {
        console.warn('[reports] material purchases', e);
      }

      setInsights({
        revenue,
        cogs,
        grossProfit,
        expenses: expenseTotal,
        netProfit,
        marginPct,
        expenseRatio,
        salesCount,
        avgTicket,
        topProducts,
        slowProducts,
        lowStock,
        staffLeaders,
        dayPattern,
        paymentMix,
        expenseCats,
        inventoryValue,
        productsTracked: products.length,
        materialKg,
        materialSpend,
        materialPaid,
        topMaterials,
        topSuppliers,
      });
    } catch (error) {
      console.error('Error loading insights:', error);
      showToast('Failed to load insights');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, period, startDate, endDate, showToast]);

  useEffect(() => {
    if (businessId) loadInsights();
  }, [businessId, loadInsights]);

  const copy = useMemo(() => useCaseCopy(businessModel), [businessModel]);
  const showInventory =
    (INVENTORY_MODELS.has(businessModel) ||
      businessModel === 'other' ||
      businessModel === 'healthcare') &&
    !['recycling', 'jobs', 'services', 'education'].includes(businessModel);
  const showFoodHints = FOOD_MODELS.has(businessModel);
  const showMaterial = businessModel === 'recycling';

  const maxDayRevenue = insights
    ? Math.max(...insights.dayPattern.map((d) => d.revenue), 1)
    : 1;

  function handleExport() {
    if (!insights) return;
    const lines = [
      'Busmo Business Insights',
      `Model,${modelLabel(businessModel)}`,
      `Period,${period}`,
      '',
      'Metric,Value',
      `Revenue,${insights.revenue}`,
      `Gross Profit,${insights.grossProfit}`,
      `Operating Expenses,${insights.expenses}`,
      `Net Profit,${insights.netProfit}`,
      `Margin %,${insights.marginPct.toFixed(2)}`,
      `Avg Ticket,${insights.avgTicket.toFixed(2)}`,
      `Sales Count,${insights.salesCount}`,
      '',
      'Top Products,Qty,Revenue,Profit',
      ...insights.topProducts.map(
        (p) => `${p.name},${p.quantity},${p.revenue},${p.profit}`
      ),
      '',
      'Staff,Sales,Revenue',
      ...insights.staffLeaders.map((s) => `${s.name},${s.sales},${s.revenue}`),
      '',
      'Expense Category,Amount',
      ...insights.expenseCats.map((e) => `${e.category},${e.amount}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `busmo_insights_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Insights exported');
  }

  function openStatement() {
    navigateTo('statement');
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <div className={styles.eyebrow}>Insights</div>
          <h1 className={styles.heading}>
            Business insights
          </h1>
          <p className={styles.sub}>
            {copy.body}{' '}
            <button type="button" className={styles.inlineLink} onClick={openStatement}>
              Open Statement for printable books →
            </button>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleExport}
            disabled={!insights || loading}
          >
            Export CSV
          </button>
          <button type="button" className={styles.btnPrimary} onClick={openStatement}>
            Statement
          </button>
        </div>
      </header>

      <div className={styles.modelBanner}>
        <div className={styles.modelBadge}>{modelLabel(businessModel)}</div>
        <div className={styles.modelCopy}>
          <strong>{copy.title}</strong>
          <span>
            {showFoodHints
              ? ' Focus: dish movement, expense pressure, busy days.'
              : showInventory
                ? ' Focus: sellers, idle stock, stock risk, staff sales.'
                : ' Focus: ticket size, payment mix, expense pressure.'}
          </span>
        </div>
      </div>

      <div className={styles.presetRow} role="tablist" aria-label="Report period">
        {(['today', 'week', 'month', 'year'] as PeriodType[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.presetChip} ${period === p ? styles.presetChipActive : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.presetChip} ${period === 'custom' ? styles.presetChipActive : ''}`}
          onClick={() => setPeriod('custom')}
        >
          Custom
        </button>
        {period === 'custom' && (
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
            <span className={styles.dateSeparator}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Building insights…</p>
        </div>
      ) : insights ? (
        <>
          <section className={styles.kpiRow} aria-label="Key ratios">
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Avg ticket</span>
              <span className={styles.kpiValue}>{formatMoney(insights.avgTicket)}</span>
              <span className={styles.kpiHint}>{insights.salesCount} sales</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Net margin</span>
              <span
                className={`${styles.kpiValue} ${
                  insights.marginPct >= 0 ? styles.positive : styles.negative
                }`}
              >
                {insights.marginPct.toFixed(1)}%
              </span>
              <span className={styles.kpiHint}>{formatMoney(insights.netProfit)} net</span>
            </div>
            <div className={styles.kpi}>
              <span className={styles.kpiLabel}>Expense load</span>
              <span className={styles.kpiValue}>{insights.expenseRatio.toFixed(1)}%</span>
              <span className={styles.kpiHint}>of revenue</span>
            </div>
            
            {showMaterial && insights && (
              <>
                <article className={styles.module}>
                  <header className={styles.moduleHead}>
                    <h2 className={styles.moduleTitle}>Collection volume</h2>
                    <span className={styles.moduleHint}>Kg bought in this period</span>
                  </header>
                  <div className={styles.kpiRow} style={{ margin: 0 }}>
                    <div className={styles.kpi}>
                      <div className={styles.kpiLabel}>Total kg</div>
                      <div className={styles.kpiValue}>{insights.materialKg.toFixed(1)}</div>
                    </div>
                    <div className={styles.kpi}>
                      <div className={styles.kpiLabel}>Spend</div>
                      <div className={styles.kpiValue}>{formatMoney(insights.materialSpend)}</div>
                    </div>
                    <div className={styles.kpi}>
                      <div className={styles.kpiLabel}>Paid out</div>
                      <div className={styles.kpiValue}>{formatMoney(insights.materialPaid)}</div>
                    </div>
                  </div>
                </article>

                <article className={styles.module}>
                  <header className={styles.moduleHead}>
                    <h2 className={styles.moduleTitle}>Materials</h2>
                    <span className={styles.moduleHint}>By weight collected</span>
                  </header>
                  {insights.topMaterials.length === 0 ? (
                    <p className={styles.emptyModule}>No material purchases in this period.</p>
                  ) : (
                    <ul className={styles.rankList}>
                      {insights.topMaterials.map((m) => (
                        <li key={m.name} className={styles.rankItem}>
                          <div className={styles.rankBody}>
                            <span className={styles.rankName}>{m.name}</span>
                            <span className={styles.rankMeta}>{formatMoney(m.spend)} spend</span>
                          </div>
                          <span className={styles.rankAmount}>{m.kg.toFixed(1)} kg</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className={styles.module}>
                  <header className={styles.moduleHead}>
                    <h2 className={styles.moduleTitle}>Suppliers</h2>
                    <span className={styles.moduleHint}>Who you buy from most</span>
                  </header>
                  {insights.topSuppliers.length === 0 ? (
                    <p className={styles.emptyModule}>No supplier activity in this period.</p>
                  ) : (
                    <ul className={styles.rankList}>
                      {insights.topSuppliers.map((s) => (
                        <li key={s.name} className={styles.rankItem}>
                          <div className={styles.rankBody}>
                            <span className={styles.rankName}>{s.name}</span>
                            <span className={styles.rankMeta}>{s.trips} trips · {s.kg.toFixed(1)} kg</span>
                          </div>
                          <span className={styles.rankAmount}>{formatMoney(s.spend)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </>
            )}

            {showInventory && (
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Stock at cost</span>
                <span className={styles.kpiValue}>{formatMoney(insights.inventoryValue)}</span>
                <span className={styles.kpiHint}>{insights.productsTracked} products</span>
              </div>
            )}
            {!showInventory && (
              <div className={styles.kpi}>
                <span className={styles.kpiLabel}>Revenue</span>
                <span className={`${styles.kpiValue} ${styles.positive}`}>
                  {formatMoney(insights.revenue)}
                </span>
                <span className={styles.kpiHint}>selected period</span>
              </div>
            )}
          </section>

          <p className={styles.ledgerNote}>
            Need line-by-line sales, expenses, or a printable P&amp;L? Use{' '}
            <button type="button" className={styles.inlineLink} onClick={openStatement}>
              Statement
            </button>
            — this page is for priorities, not books.
          </p>

          <div className={styles.moduleGrid}>
            {/* Top movers */}
            <article className={styles.module}>
              <header className={styles.moduleHead}>
                <h2 className={styles.moduleTitle}>
                  {showFoodHints ? 'Top dishes & items' : 'Top sellers'}
                </h2>
                <span className={styles.moduleHint}>By revenue in period</span>
              </header>
              {insights.topProducts.length === 0 ? (
                <p className={styles.emptyModule}>
                  No line-item sales yet. Record sales with products to unlock this.
                </p>
              ) : (
                <ul className={styles.rankList}>
                  {insights.topProducts.map((p, i) => (
                    <li key={`${p.name}-${i}`} className={styles.rankItem}>
                      <span className={styles.rankIdx}>{i + 1}</span>
                      <div className={styles.rankBody}>
                        <span className={styles.rankName}>{p.name}</span>
                        <span className={styles.rankMeta}>
                          {p.quantity} sold · profit {formatMoney(p.profit)}
                        </span>
                      </div>
                      <span className={styles.rankAmount}>{formatMoney(p.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {/* Staff */}
            <article className={styles.module}>
              <header className={styles.moduleHead}>
                <h2 className={styles.moduleTitle}>Who is selling</h2>
                <span className={styles.moduleHint}>Staff accountability</span>
              </header>
              {insights.staffLeaders.length === 0 ? (
                <p className={styles.emptyModule}>No sales in this period.</p>
              ) : (
                <ul className={styles.rankList}>
                  {insights.staffLeaders.map((s, i) => (
                    <li key={s.name} className={styles.rankItem}>
                      <span className={styles.rankIdx}>{i + 1}</span>
                      <div className={styles.rankBody}>
                        <span className={styles.rankName}>{s.name}</span>
                        <span className={styles.rankMeta}>{s.sales} sales</span>
                      </div>
                      <span className={styles.rankAmount}>{formatMoney(s.revenue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {/* Day pattern */}
            <article className={styles.module}>
              <header className={styles.moduleHead}>
                <h2 className={styles.moduleTitle}>Busy days</h2>
                <span className={styles.moduleHint}>Plan staffing & stock</span>
              </header>
              <div className={styles.dayBars}>
                {insights.dayPattern.map((d) => (
                  <div key={d.day} className={styles.dayCol}>
                    <div className={styles.dayBarTrack}>
                      <div
                        className={styles.dayBarFill}
                        style={{
                          height: `${Math.max(4, (d.revenue / maxDayRevenue) * 100)}%`,
                        }}
                        title={formatMoney(d.revenue)}
                      />
                    </div>
                    <span className={styles.dayLabel}>{d.day}</span>
                    <span className={styles.daySales}>{d.sales || '—'}</span>
                  </div>
                ))}
              </div>
            </article>

            {/* Expenses */}
            <article className={styles.module}>
              <header className={styles.moduleHead}>
                <h2 className={styles.moduleTitle}>Expense pressure</h2>
                <span className={styles.moduleHint}>
                  {formatMoney(insights.expenses)} total
                </span>
              </header>
              {insights.expenseCats.length === 0 ? (
                <p className={styles.emptyModule}>No expenses recorded in this period.</p>
              ) : (
                <ul className={styles.rankList}>
                  {insights.expenseCats.map((e) => (
                    <li key={e.category} className={styles.rankItem}>
                      <div className={styles.rankBody}>
                        <span className={styles.rankName}>{e.category}</span>
                        <div className={styles.pctBar}>
                          <div
                            className={styles.pctFill}
                            style={{ width: `${Math.min(100, e.pct)}%` }}
                          />
                        </div>
                      </div>
                      <span className={`${styles.rankAmount} ${styles.negative}`}>
                        {formatMoney(e.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            {showInventory && (
              <>
                <article className={styles.module}>
                  <header className={styles.moduleHead}>
                    <h2 className={styles.moduleTitle}>Idle stock</h2>
                    <span className={styles.moduleHint}>In stock, no sales in period</span>
                  </header>
                  {insights.slowProducts.length === 0 ? (
                    <p className={styles.emptyModule}>
                      Everything with stock moved, or inventory is empty.
                    </p>
                  ) : (
                    <ul className={styles.rankList}>
                      {insights.slowProducts.map((p) => (
                        <li key={p.name} className={styles.rankItem}>
                          <div className={styles.rankBody}>
                            <span className={styles.rankName}>{p.name}</span>
                            <span className={styles.rankMeta}>{p.daysIdle}</span>
                          </div>
                          <span className={styles.rankAmount}>{p.stock} units</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>

                <article className={styles.module}>
                  <header className={styles.moduleHead}>
                    <h2 className={styles.moduleTitle}>Stock risk</h2>
                    <span className={styles.moduleHint}>At or below reorder level</span>
                  </header>
                  {insights.lowStock.length === 0 ? (
                    <p className={styles.emptyModule}>
                      No products are below their reorder level.
                    </p>
                  ) : (
                    <ul className={styles.rankList}>
                      {insights.lowStock.map((p) => (
                        <li key={p.name} className={styles.rankItem}>
                          <div className={styles.rankBody}>
                            <span className={styles.rankName}>{p.name}</span>
                            <span className={styles.rankMeta}>
                              Reorder at {p.reorderLevel}
                            </span>
                          </div>
                          <span className={`${styles.rankAmount} ${styles.warning}`}>
                            {p.stock} left
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </>
            )}

            {/* Payment mix — compact */}
            <article className={styles.module}>
              <header className={styles.moduleHead}>
                <h2 className={styles.moduleTitle}>Payment mix</h2>
                <span className={styles.moduleHint}>How money came in</span>
              </header>
              {insights.paymentMix.length === 0 ? (
                <p className={styles.emptyModule}>No sales in this period.</p>
              ) : (
                <ul className={styles.rankList}>
                  {insights.paymentMix.map((p) => (
                    <li key={p.method} className={styles.rankItem}>
                      <div className={styles.rankBody}>
                        <span className={styles.rankName}>{p.method}</span>
                        <span className={styles.rankMeta}>{p.pct.toFixed(0)}%</span>
                      </div>
                      <span className={styles.rankAmount}>{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </>
      ) : (
        <div className={styles.empty}>
          <p>No data yet for this period. Record a few sales and expenses to unlock insights.</p>
          <button type="button" className={styles.btnPrimary} onClick={openStatement}>
            Go to Statement
          </button>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;

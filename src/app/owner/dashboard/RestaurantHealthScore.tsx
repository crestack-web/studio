'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { fetchDocs, toDate } from '@/lib/supabase-client-data';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import { getSupabase } from '@/lib/supabase';
import {
  ChefHat,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  UtensilsCrossed,
  RefreshCw,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';
import styles from './RestaurantHealthScore.module.css';

interface KitchenMetrics {
  todaySales: number;
  todayOrders: number;
  todayProfit: number;
  weekSales: number;
  weekOrders: number;
  avgTicket: number;
  foodCostPct: number | null;
  profitMargin: number | null;
  menuCount: number;
  ingredientCount: number;
  lowStockIngredients: { id: string; name: string; stock: number; unit: string }[];
  expiringSoon: { id: string; name: string; days: number }[];
  topDishes: { name: string; qty: number; revenue: number }[];
  unavailableMenus: number;
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = new Date();
  x.setDate(x.getDate() - n);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isNonRestaurantCategory(cat: string | undefined | null): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return (
    c.includes('recycling') ||
    c.includes('material_collection') ||
    c.includes('material collection') ||
    c === 'jobs' ||
    c.includes('jobs &') ||
    c.includes('wholesale') ||
    c.includes('distributor') ||
    c.includes('manufactur') ||
    c.includes('pharmacy') ||
    c.includes('education') ||
    c.includes('fashion') ||
    c.includes('electronic')
  );
}

function isRestaurantCategory(cat: string | undefined | null): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  if (isNonRestaurantCategory(c)) return false;
  return (
    c.includes('restaurant') ||
    c.includes('cafe') ||
    c.includes('café') ||
    c === 'catering' ||
    c.includes('food service') ||
    c.includes('eatery') ||
    c.includes('bistro')
  );
}

function emptyMetrics(): KitchenMetrics {
  return {
    todaySales: 0,
    todayOrders: 0,
    todayProfit: 0,
    weekSales: 0,
    weekOrders: 0,
    avgTicket: 0,
    foodCostPct: null,
    profitMargin: null,
    menuCount: 0,
    ingredientCount: 0,
    lowStockIngredients: [],
    expiringSoon: [],
    topDishes: [],
    unavailableMenus: 0,
  };
}

export function RestaurantHealthScore({ businessId: propBusinessId }: { businessId?: string }) {
  const { user, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const [isRestaurant, setIsRestaurant] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<KitchenMetrics | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(
    propBusinessId || user?.businessId || null
  );

  const resolveBid = useCallback(async () => {
    if (propBusinessId) return propBusinessId;
    if (user?.businessId) return user.businessId;
    if (!user?.id) {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (!session?.user?.id) return null;
      return resolveOwnerScopeBusinessId(
        session.user.id,
        session.user.user_metadata?.businessId
      );
    }
    return resolveOwnerScopeBusinessId(user.id, user.businessId);
  }, [propBusinessId, user?.businessId, user?.id]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      try {
        setLoadError(null);
        const bid = await resolveBid();
        if (!bid) {
          setIsRestaurant(false);
          setMetrics(null);
          return;
        }
        setBusinessId(bid);

        let restaurant = false;
        const categoryCandidates: string[] = [];
        try {
          const { data: biz } = await getSupabase()
            .from('businesses')
            .select('category, selectedCategory, business_type, type, metadata')
            .eq('id', bid)
            .maybeSingle();
          if (biz) {
            categoryCandidates.push(
              String((biz as any).category || ''),
              String((biz as any).selectedCategory || ''),
              String((biz as any).business_type || ''),
              String((biz as any).type || ''),
              String((biz as any).metadata?.category || ''),
              String((biz as any).metadata?.selectedCategory || '')
            );
          }
        } catch {
          /* ignore */
        }
        try {
          const uid = user?.id;
          if (uid) {
            const { data: profile } = await getSupabase()
              .from('users')
              .select('category, selectedCategory, businessCategory, metadata, role')
              .eq('id', uid)
              .maybeSingle();
            if (profile) {
              categoryCandidates.push(
                String((profile as any).category || ''),
                String((profile as any).selectedCategory || ''),
                String((profile as any).businessCategory || ''),
                String((profile as any).metadata?.category || ''),
                String((profile as any).metadata?.selectedCategory || '')
              );
            }
          }
        } catch {
          /* ignore */
        }

        const anyNonRestaurant = categoryCandidates.some((c) => isNonRestaurantCategory(c));
        if (anyNonRestaurant) {
          setIsRestaurant(false);
          setMetrics(null);
          return;
        }

        restaurant = categoryCandidates.some((c) => isRestaurantCategory(c));

        const products = await fetchDocs(`businesses/${bid}/products`);
        const hasKitchenItems = products.some((p: any) => {
          const meta =
            p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
          const pt = p.productType || meta.productType;
          return pt === 'dish' || pt === 'ingredient';
        });
        if (hasKitchenItems && !anyNonRestaurant) restaurant = true;

        try {
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('selectedCategory') || localStorage.getItem('busmo_category') || '';
            if (isNonRestaurantCategory(cached)) {
              setIsRestaurant(false);
              setMetrics(null);
              return;
            }
            if (isRestaurantCategory(cached)) restaurant = true;
            const features = localStorage.getItem('selectedFeatures') || '';
            if (/menu|ingredient|expiry/i.test(features) && !/material collection|recycling/i.test(features)) {
              restaurant = true;
            }
          }
        } catch {
          /* ignore */
        }

        const anyCategory = categoryCandidates.some((c) => c && c.trim());
        if (!restaurant) {
          setIsRestaurant(false);
          setMetrics(null);
          return;
        }
        setIsRestaurant(true);

        const todayStart = startOfDay();
        const weekStart = daysAgo(7);
        const sales = await fetchDocs(`businesses/${bid}/sales`);

        let todaySales = 0;
        let todayOrders = 0;
        let todayProfit = 0;
        let weekSales = 0;
        let weekOrders = 0;
        let weekCogs = 0;
        const dishSales: Record<string, { qty: number; revenue: number }> = {};

        for (const s of sales as any[]) {
          const created =
            toDate(s.createdAt) ||
            toDate(s.created_at) ||
            toDate(s.date) ||
            null;
          if (!created) continue;
          const total = Number(
            s.totalRevenue ?? s.total_revenue ?? s.total ?? s.totalAmount ?? 0
          );
          const profit = Number(s.profit ?? s.totalProfit ?? 0);
          const cogs = Number(
            s.totalCost ?? s.cogs ?? s.cost ?? total - profit
          );

          if (created >= todayStart) {
            todaySales += total;
            todayOrders += 1;
            todayProfit += profit;
          }
          if (created >= weekStart) {
            weekSales += total;
            weekOrders += 1;
            weekCogs += cogs > 0 ? cogs : 0;

            const items = Array.isArray(s.items)
              ? s.items
              : Array.isArray(s.products)
                ? s.products
                : [];
            for (const item of items) {
              const name = String(
                item.name || item.productName || item.title || ''
              ).trim();
              if (!name) continue;
              const qty = Number(item.quantity || item.qty || 1);
              const lineRev = Number(
                item.total || item.lineTotal || item.price * qty || 0
              );
              if (!dishSales[name]) dishSales[name] = { qty: 0, revenue: 0 };
              dishSales[name].qty += qty;
              dishSales[name].revenue += lineRev;
            }
          }
        }

        const dishes: any[] = [];
        const ingredients: any[] = [];
        for (const p of products as any[]) {
          const meta =
            p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
          const pt = p.productType || meta.productType;
          if (pt === 'ingredient') ingredients.push({ ...p, ...meta });
          else if (pt === 'dish') dishes.push({ ...p, ...meta });
        }

        const lowStockIngredients = ingredients
          .map((ing) => {
            const stock = Number(
              ing.stock ?? ing.stockLevel ?? ing.currentStock ?? 0
            );
            const min = Number(
              ing.reorderLevel ?? ing.lowStockThreshold ?? 10
            );
            return {
              id: String(ing.id),
              name: String(ing.name || 'Ingredient'),
              stock,
              unit: String(ing.ingredientUnit || ing.unit || ''),
              min,
            };
          })
          .filter((i) => i.stock <= i.min)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5)
          .map(({ id, name, stock, unit }) => ({ id, name, stock, unit }));

        const now = new Date();
        const expiringSoon = ingredients
          .map((ing) => {
            const exp = toDate(ing.expiryDate);
            if (!exp) return null;
            const days = Math.ceil(
              (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (days > 7) return null;
            return {
              id: String(ing.id),
              name: String(ing.name || 'Ingredient'),
              days,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.days - b.days)
          .slice(0, 5) as { id: string; name: string; days: number }[];

        const unavailableMenus = dishes.filter(
          (d) => d.active === false || d.status === 'inactive' || d.available === false
        ).length;

        const topDishes = Object.entries(dishSales)
          .map(([name, v]) => ({ name, qty: v.qty, revenue: v.revenue }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

        const foodCostPct =
          weekSales > 0 && weekCogs > 0 ? (weekCogs / weekSales) * 100 : null;
        const profitMargin =
          weekSales > 0
            ? ((weekSales - weekCogs) / weekSales) * 100
            : todaySales > 0 && todayProfit
              ? (todayProfit / todaySales) * 100
              : null;

        setMetrics({
          todaySales,
          todayOrders,
          todayProfit,
          weekSales,
          weekOrders,
          avgTicket: weekOrders > 0 ? weekSales / weekOrders : 0,
          foodCostPct,
          profitMargin,
          menuCount: dishes.length,
          ingredientCount: ingredients.length,
          lowStockIngredients,
          expiringSoon,
          topDishes,
          unavailableMenus,
        });
      } catch (error: any) {
        console.error('[RestaurantHealthScore]', error);
        setLoadError(error?.message || 'Failed to load kitchen metrics');
        setIsRestaurant(false);
        setMetrics(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveBid, user?.id]
  );

  useEffect(() => {
    load();
  }, [load, user?.businessId, user?.id]);

  if (!loading && isRestaurant === false) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardIcon bg="var(--amber-bg, #FEF3C7)">
            <ChefHat size={18} color="var(--amber, #D97706)" />
          </CardIcon>
          Kitchen overview
        </CardHeader>
        <div className={styles.loading}>
          <Loader2 size={20} className={styles.spin} />
          Loading kitchen metrics…
        </div>
      </Card>
    );
  }

  if (isRestaurant !== true) return null;

  const data = metrics || emptyMetrics();

  const foodCostStatus =
    data.foodCostPct == null
      ? 'neutral'
      : data.foodCostPct <= 30
        ? 'good'
        : data.foodCostPct <= 40
          ? 'warn'
          : 'bad';

  return (
    <Card>
      <CardHeader
        action={
          <button
            type="button"
            className={styles.iconBtn}
            title="Refresh"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? styles.spin : undefined} />
          </button>
        }
      >
        <CardIcon bg="var(--amber-bg, #FEF3C7)">
          <ChefHat size={18} color="var(--amber, #D97706)" />
        </CardIcon>
        Kitchen overview
      </CardHeader>

      <div className={styles.body}>
        {loadError && (
          <p className={styles.muted} style={{ color: 'var(--red, #dc2626)' }}>
            {loadError} — showing zeros. Tap refresh to retry.
          </p>
        )}
        <div className={styles.todayStrip}>
          <div>
            <span className={styles.stripLabel}>Today’s sales</span>
            <span className={styles.stripValue}>{formatMoney(data.todaySales)}</span>
          </div>
          <div>
            <span className={styles.stripLabel}>Orders</span>
            <span className={styles.stripValue}>{data.todayOrders}</span>
          </div>
          <div>
            <span className={styles.stripLabel}>Est. profit</span>
            <span
              className={styles.stripValue}
              style={{
                color:
                  data.todayProfit >= 0
                    ? 'var(--green, #16a34a)'
                    : 'var(--red, #dc2626)',
              }}
            >
              {formatMoney(data.todayProfit)}
            </span>
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>7-day sales</span>
            <span className={styles.kpiValue}>{formatMoney(data.weekSales)}</span>
            <span className={styles.kpiHint}>{data.weekOrders} orders</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Avg ticket</span>
            <span className={styles.kpiValue}>{formatMoney(data.avgTicket)}</span>
            <span className={styles.kpiHint}>per order (7d)</span>
          </div>
          <div className={`${styles.kpi} ${styles[foodCostStatus]}`}>
            <span className={styles.kpiLabel}>Food cost</span>
            <span className={styles.kpiValue}>
              {data.foodCostPct != null ? `${data.foodCostPct.toFixed(0)}%` : '—'}
            </span>
            <span className={styles.kpiHint}>
              {data.foodCostPct == null
                ? 'Need sales + costs'
                : foodCostStatus === 'good'
                  ? 'Healthy (≤30%)'
                  : foodCostStatus === 'warn'
                    ? 'Watch (30–40%)'
                    : 'High (>40%)'}
            </span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Margin (7d)</span>
            <span className={styles.kpiValue}>
              {data.profitMargin != null ? `${data.profitMargin.toFixed(0)}%` : '—'}
            </span>
            <span className={styles.kpiHint}>
              {data.profitMargin != null && data.profitMargin >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}{' '}
              after COGS
            </span>
          </div>
        </div>

        <div className={styles.summaryRow}>
          <button
            type="button"
            className={styles.summaryChip}
            onClick={() => navigateTo('menu-management' as any)}
          >
            <UtensilsCrossed size={14} />
            {data.menuCount} menu items
            {data.unavailableMenus > 0 && (
              <span className={styles.badgeWarn}>{data.unavailableMenus} off</span>
            )}
            <ArrowRight size={14} className={styles.chev} />
          </button>
          <button
            type="button"
            className={styles.summaryChip}
            onClick={() => navigateTo('ingredient-tracking' as any)}
          >
            <Package size={14} />
            {data.ingredientCount} ingredients
            {data.lowStockIngredients.length > 0 && (
              <span className={styles.badgeWarn}>{data.lowStockIngredients.length} low</span>
            )}
            <ArrowRight size={14} className={styles.chev} />
          </button>
          <button
            type="button"
            className={styles.summaryChip}
            onClick={() => navigateTo('expiry-alerts' as any)}
          >
            <Clock size={14} />
            Expiry
            {data.expiringSoon.length > 0 && (
              <span className={styles.badgeDanger}>{data.expiringSoon.length} soon</span>
            )}
            <ArrowRight size={14} className={styles.chev} />
          </button>
        </div>
      </div>
    </Card>
  );
}

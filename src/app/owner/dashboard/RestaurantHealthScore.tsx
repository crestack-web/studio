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

function isRestaurantCategory(cat: string | undefined | null): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return (
    c.includes('restaurant') ||
    c.includes('cafe') ||
    c.includes('food') ||
    c === 'catering'
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
  const [isRestaurant, setIsRestaurant] = useState<boolean | null>(null); // null = unknown
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
          // Keep section visible while auth/business still resolving
          setIsRestaurant(null);
          setMetrics(emptyMetrics());
          return;
        }
        setBusinessId(bid);

        // Category from business + user profile (signup often only sets users.category)
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
        restaurant = categoryCandidates.some((c) => isRestaurantCategory(c));

        const products = await fetchDocs(`businesses/${bid}/products`);
        const hasKitchenItems = products.some((p: any) => {
          const meta =
            p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
          const pt = p.productType || meta.productType;
          return pt === 'dish' || pt === 'ingredient';
        });
        if (hasKitchenItems) restaurant = true;

        // Soft signal: user already uses kitchen nav / local onboarding cache
        try {
          if (typeof window !== 'undefined') {
            const cached = localStorage.getItem('selectedCategory') || localStorage.getItem('busmo_category') || '';
            if (isRestaurantCategory(cached)) restaurant = true;
            const features = localStorage.getItem('selectedFeatures') || '';
            if (/menu|ingredient|expiry/i.test(features)) restaurant = true;
          }
        } catch {
          /* ignore */
        }

        // If category is missing entirely, still show kitchen overview (zeros)
        // so restaurant owners without seeded category/products are not locked out.
        const anyCategory = categoryCandidates.some((c) => c && c.trim());
        if (!restaurant && anyCategory) {
          setIsRestaurant(false);
          setMetrics(null);
          return;
        }
        if (!restaurant && !anyCategory) {
          restaurant = true; // optimistic for uncategorized businesses with kitchen tools
        }
        setIsRestaurant(restaurant);
        if (!restaurant) {
          setMetrics(null);
          return;
        }

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
        // Stay visible with zeros so the section does not vanish
        setIsRestaurant(true);
        setMetrics((prev) => prev || emptyMetrics());
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resolveBid]
  );

  useEffect(() => {
    load();
  }, [load, user?.businessId, user?.id]);

  // Only hide when we finished loading and confirmed non-restaurant
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

  // isRestaurant true or still unknown after load — keep section visible
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
        {/* Today strip */}
        <div className={styles.todayStrip}>
          <div>
            <span className={styles.stripLabel}>Today’s sales</span>
            <span className={styles.stripValue}>
              {formatMoney(data.todaySales)}
            </span>
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

        {/* KPI grid */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>7-day sales</span>
            <span className={styles.kpiValue}>
              {formatMoney(data.weekSales)}
            </span>
            <span className={styles.kpiHint}>{data.weekOrders} orders</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiLabel}>Avg ticket</span>
            <span className={styles.kpiValue}>
              {formatMoney(data.avgTicket)}
            </span>
            <span className={styles.kpiHint}>per order (7d)</span>
          </div>
          <div className={`${styles.kpi} ${styles[foodCostStatus]}`}>
            <span className={styles.kpiLabel}>Food cost</span>
            <span className={styles.kpiValue}>
              {data.foodCostPct != null
                ? `${data.foodCostPct.toFixed(0)}%`
                : '—'}
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
              {data.profitMargin != null
                ? `${data.profitMargin.toFixed(0)}%`
                : '—'}
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

        {/* Menu & stock summary */}
        <div className={styles.summaryRow}>
          <button
            type="button"
            className={styles.summaryChip}
            onClick={() => navigateTo('menu-management' as any)}
          >
            <UtensilsCrossed size={14} />
            {data.menuCount} menu items
            {data.unavailableMenus > 0 && (
              <span className={styles.badgeWarn}>
                {data.unavailableMenus} off
              </span>
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
              <span className={styles.badgeWarn}>
                {data.lowStockIngredients.length} low
              </span>
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
              <span className={styles.badgeDanger}>
                {data.expiringSoon.length} soon
              </span>
            )}
            <ArrowRight size={14} className={styles.chev} />
          </button>
        </div>

        {/* Alerts + top dishes */}
        <div className={styles.split}>
          <div className={styles.panel}>
            <h4 className={styles.panelTitle}>
              <AlertTriangle size={14} /> Needs attention
            </h4>
            {data.lowStockIngredients.length === 0 &&
            data.expiringSoon.length === 0 ? (
              <p className={styles.muted}>Kitchen stock looks fine</p>
            ) : (
              <ul className={styles.alertList}>
                {data.lowStockIngredients.map((i) => (
                  <li key={i.id}>
                    <span className={styles.alertName}>{i.name}</span>
                    <span className={styles.alertMeta}>
                      {i.stock} {i.unit} left
                    </span>
                  </li>
                ))}
                {data.expiringSoon.map((i) => (
                  <li key={`exp-${i.id}`}>
                    <span className={styles.alertName}>{i.name}</span>
                    <span
                      className={
                        i.days <= 0 ? styles.alertDanger : styles.alertMeta
                      }
                    >
                      {i.days <= 0 ? 'Expired' : `${i.days}d left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.panel}>
            <h4 className={styles.panelTitle}>
              <UtensilsCrossed size={14} /> Top dishes (7d)
            </h4>
            {data.topDishes.length === 0 ? (
              <p className={styles.muted}>
                Record sales to see bestsellers
              </p>
            ) : (
              <ol className={styles.topList}>
                {data.topDishes.map((d, idx) => (
                  <li key={d.name}>
                    <span className={styles.rank}>{idx + 1}</span>
                    <span className={styles.dishName}>{d.name}</span>
                    <span className={styles.dishMeta}>
                      ×{d.qty} · {formatMoney(d.revenue)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigateTo('sale' as any)}
          >
            Record sale
          </button>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => navigateTo('menu-management' as any)}
          >
            Manage menu
          </button>
        </div>
      </div>
    </Card>
  );
}
